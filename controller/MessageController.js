const Message = require("../models/Message");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");

exports.getChatSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let filter = {};

    // 1. منطق الفلترة حسب الرتبة
    if (userRole === 'admin') {
      // الأدمن: الفلتر فاضي { } عشان يشوف "كل" الكورسات
      filter = {}; 
    } 
    else if (userRole === 'teacher') {
      // المدرس: يشوف بس الكورسات اللي هو مسجل فيها كمدرس
      const teacherCourses = await Course.find({ teacherId: userId }).select('_id');
      const courseIds = teacherCourses.map(c => c._id);
      filter = { chatRoomId: { $in: courseIds } };
    } 
    else if (userRole === 'student') {
      // الطالب: يشوف بس الكورسات اللي هو مشترك (Enrolled) فيها فعلاً
      const studentEnrollments = await Enrollment.find({ studentId: userId }).select('courseId');
      const courseIds = studentEnrollments.map(e => e.courseId);
      filter = { chatRoomId: { $in: courseIds } };
    }

    // 2. الـ Aggregation (نفس الـ Logic الاحترافي)
    const summary = await Message.aggregate([
      { $match: filter }, // تطبيق الفلتر اللي حددناه فوق
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$chatRoomId",
          lastMessage: { $first: "$text" },
          lastSenderId: { $first: "$senderId" },
          lastMessageTime: { $first: "$createdAt" },
          unreadCount: { $sum: 0 } // ممكن تطورها لاحقاً لحساب الرسايل الجديدة
        }
      },
      {
        $lookup: {
          from: "courses",
          localField: "_id",
          foreignField: "_id",
          as: "courseInfo"
        }
      },
      { $unwind: "$courseInfo" },
      {
        $lookup: {
          from: "users", // عشان نجيب اسم آخر واحد بعت رسالة
          localField: "lastSenderId",
          foreignField: "_id",
          as: "senderInfo"
        }
      },
      { $unwind: { path: "$senderInfo", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          chatRoomId: "$_id",
          courseTitle: "$courseInfo.title",
          lastMessage: 1,
          lastMessageTime: 1,
          senderName: "$senderInfo.name",
          _id: 0
        }
      },
      { $sort: { lastMessageTime: -1 } }
    ]);

    res.status(200).json(summary);
  } catch (error) {
    console.error("💥 Summary Error:", error);
    res.status(500).json({ message: "Error fetching summary", error: error.message });
  }
};

// ضيف الدالة دي تحت دالة الـ getChatSummary في ملف Message Controller.js
exports.getChatHistory = async (req, res) => {
  try {
    const { courseId } = req.params;

    // جلب كل الرسايل الخاصة بالكورس ده وترتيبها من الأقدم للأحدث
    const messages = await Message.find({ chatRoomId: courseId })
      .sort({ createdAt: 1 })
      .populate('senderId', 'name role'); // عشان يرجعلك اسم اللي بعت الرسالة ورتبته

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: "Error fetching history", error: error.message });
  }
};