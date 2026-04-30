const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Teacher = require("../models/Teacher");
const Student = require("../models/Student")
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const Review = require('../models/Review'); // 👈 السطر ده اللي ناقص ومسبب الـ 500 Error
const Exam = require('../models/Exam')
const Content = require('../models/Content')

// ═══════════════════════════════════════════
//                  TEACHERS
// ═══════════════════════════════════════════

// POST /admin/create-teacher
const createTeacher = async (req, res) => {
  try {
   const { firstName, lastName, email, password } = req.body;

   if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "firstName, lastName, email, and password are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const teacher = await User.create({
   firstName, // عدلنا دي
      lastName,
      password: hashedPassword,
      role: "teacher",
      isActive: false,
    });

    const { password: _, ...teacherData } = teacher.toObject();

    res.status(201).json({
      message: "Teacher created successfully, pending admin approval",
      teacher: teacherData,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// PATCH /admin/teachers/:id
const updateTeacher = async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body; // استلام الحقول الصح

    const teacher = await User.findOne({ _id: req.params.id, role: "teacher" });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    if (email && email !== teacher.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(409).json({ message: "Email already in use" });
      }
      teacher.email = email;
    }

    if (firstName) teacher.firstName = firstName;
    if (lastName) teacher.lastName = lastName;

    await teacher.save();

    const { password: _, ...teacherData } = teacher.toObject();

    res.status(200).json({ message: "Teacher updated successfully", teacher: teacherData });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const activateTeacher = async (req, res) => {
  try {
    const TeacherModel = require("../models/Teacher"); // استدعاء الموديل

    // 1. بندور على اليوزر في جدول الـ Users
    const userDoc = await User.findOne({ _id: req.params.id, role: "teacher" });
    // 2. بندور على البروفايل في جدول الـ Teachers
    const teacherDoc = await TeacherModel.findOne({ userId: req.params.id });

    if (!userDoc || !teacherDoc) {
      return res.status(404).json({ message: "Teacher or profile not found" });
    }

    // 3. بنشيك على الاتنين مع بعض
    if (userDoc.isActive && teacherDoc.status === "approved") {
      return res.status(400).json({ message: "Teacher is already fully active" });
    }

    // 4. التفعيل في جدول الـ Users
    userDoc.isActive = true;
    await userDoc.save();

    // 5. التفعيل في جدول الـ Teachers (دي اللي كانت pending في الصورة)
    teacherDoc.status = "approved";
    await teacherDoc.save();

    res.status(200).json({ message: "Teacher activated successfully in both models" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// PATCH /admin/teachers/:id/deactivate
const deactivateTeacher = async (req, res) => {
  try {
    const TeacherModel = require("../models/Teacher"); // استدعاء الموديل

    // 1. تعطيل اليوزر في جدول الـ Users
    const userDoc = await User.findOneAndUpdate(
      { _id: req.params.id, role: "teacher" },
      { isActive: false },
      { new: true }
    );

    if (!userDoc) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // 2. تغيير الحالة في جدول الـ Teachers لـ pending
    // دي الخطوة اللي كانت ناقصة عندك
    await TeacherModel.findOneAndUpdate(
      { userId: req.params.id },
      { status: "pending" } 
    );

    res.status(200).json({ message: "Teacher deactivated and status reset to pending" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// DELETE /admin/teachers/:id
const deleteTeacher = async (req, res) => {
  try {
    const teacher = await User.findOne({ _id: req.params.id, role: "teacher" });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // حذف كورساته وكل الـ enrollments المرتبطة بيهم
    const courses = await Course.find({ instructorId: req.params.id });
    const courseIds = courses.map((c) => c._id);

    await Enrollment.deleteMany({ courseId: { $in: courseIds } });
    await Course.deleteMany({ instructorId: req.params.id });
    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Teacher and all related data deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ═══════════════════════════════════════════
//                  STUDENTS
// ═══════════════════════════════════════════

// PATCH /admin/students/:id
const updateStudent = async (req, res) => {
  try {
   const { firstName, lastName, email } = req.body; // استلام الحقول الصح

    const student = await User.findOne({ _id: req.params.id, role: "student" });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (email && email !== student.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(409).json({ message: "Email already in use" });
      }
      student.email = email;
    }

   if (firstName) student.firstName = firstName;
    if (lastName) student.lastName = lastName;

    await student.save();

    const { password: _, ...studentData } = student.toObject();

    res.status(200).json({ message: "Student updated successfully", student: studentData });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// DELETE /admin/students/:id
const deleteStudent = async (req, res) => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: "student" });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // حذف الـ enrollments بتاعته
    await Enrollment.deleteMany({ studentId: req.params.id });
    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Student and related enrollments deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ═══════════════════════════════════════════
//                  COURSES
// ═══════════════════════════════════════════

// PATCH /admin/courses/:id
const updateCourse = async (req, res) => {
  try {
    const { title, description, thumbnail } = req.body;

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (title) course.title = title;
    if (description) course.description = description;
    if (thumbnail) course.thumbnail = thumbnail;

    await course.save();

    res.status(200).json({ message: "Course updated successfully", course });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// PATCH /admin/courses/:id/approve
// الموافقة على كورس جديد
const approveCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id, 
      { 
        status: 'approved', 
        isApproved: true,   // ده الحقل اللي كان طالع false في الصورة
        isPublished: true   // عشان الكورس يظهر للطلاب فوراً
      }, 
      { new: true } // عشان يرجعلك الكورس بعد التعديل في الـ Response
    );
    
    if (!course) return res.status(404).json({ message: "الكورس مش موجود" });

    res.status(200).json({ 
      message: "تم الموافقة على الكورس وبقي متاح للطلاب دلوقتي", 
      course 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /admin/courses/:id/reject
const rejectCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.status === "rejected") {
      return res.status(400).json({ message: "Course is already rejected" });
    }

    course.status = "rejected";
    await course.save();

    res.status(200).json({ message: "Course rejected successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// DELETE /admin/courses/:id
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // حذف الـ enrollments المرتبطة بالكورس
    await Enrollment.deleteMany({ courseId: req.params.id });
    await Course.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Course and related enrollments deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /admin/courses/pending
const getPendingCourses = async (req, res) => {
  try {
    const courses = await Course.find({ status: "pending" }).populate("instructorId", "name email");
    res.status(200).json({ count: courses.length, courses });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ═══════════════════════════════════════════
//                ENROLLMENTS
// ═══════════════════════════════════════════

// POST /admin/enrollments
const createEnrollment = async (req, res) => {
  try {
    const { studentId, courseId } = req.body;

    if (!studentId || !courseId) {
      return res.status(400).json({ message: "studentId and courseId are required" });
    }

    const student = await User.findOne({ _id: studentId, role: "student" });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const course = await Course.findOne({ _id: courseId, status: "approved" });
    if (!course) {
      return res.status(404).json({ message: "Course not found or not approved" });
    }

    const alreadyEnrolled = await Enrollment.findOne({ studentId, courseId });
    if (alreadyEnrolled) {
      return res.status(409).json({ message: "Student already enrolled in this course" });
    }

    const enrollment = await Enrollment.create({ studentId, courseId });

    res.status(201).json({ message: "Enrollment created successfully", enrollment });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// DELETE /admin/enrollments/:id
const deleteEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id);
    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    await Enrollment.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Enrollment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ═══════════════════════════════════════════
//              DASHBOARD & LISTS
// ═══════════════════════════════════════════

// GET /admin/dashboard
const getDashboard = async (req, res) => {
  try {
    const [totalStudents, totalTeachers, totalCourses, enrollments] =
      await Promise.all([
        Student.countDocuments(), // كده الـ Student هينور فوق
      Teacher.countDocuments(), // كده الـ Teacher هينور فوق
        User.countDocuments({ role: "student" }),
        User.countDocuments({ role: "teacher" }),
        Course.countDocuments({ status: "approved" }),
        Enrollment.find().select("completedContents courseId"),
      ]);

    let averageProgress = 0;
    if (enrollments.length > 0) {
      const courses = await Course.find().select("contents");
      const courseMap = {};
      courses.forEach((c) => {
        courseMap[c._id.toString()] = c.contents?.length || 0;
      });

      const totalProgress = enrollments.reduce((sum, enrollment) => {
        const totalContents = courseMap[enrollment.courseId?.toString()] || 0;
        if (totalContents === 0) return sum;
        const progress = (enrollment.completedContents?.length / totalContents) * 100;
        return sum + progress;
      }, 0);

      averageProgress = Math.round(totalProgress / enrollments.length);
    }

    res.status(200).json({ totalStudents, totalTeachers, totalCourses, averageProgress });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /admin/students
const getAllStudents = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = { role: "student" };

    if (search) {
      filter.$or = [
       { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const students = await User.find(filter).select("-password");
    res.status(200).json({ count: students.length, students });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /admin/teachers
const getAllTeachers = async (req, res) => {
  try {
    const { search, isActive } = req.query;
    const filter = { role: "teacher" };

    if (search) {
      filter.$or = [
       { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    const teachers = await User.find(filter).select("-password");
    res.status(200).json({ count: teachers.length, teachers });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /admin/courses
const getAllCourses = async (req, res) => {
  try {
    const { search, status } = req.query;
    const filter = {};

    if (search) filter.title = { $regex: search, $options: "i" };
    if (status) filter.status = status;

    const courses = await Course.find(filter).populate("instructorId", "name email");
    res.status(200).json({ count: courses.length, courses });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /admin/enrollments
const getAllEnrollments = async (req, res) => {
  try {
    const { studentId, courseId } = req.query;
    const filter = {};

    if (studentId) filter.studentId = studentId;
    if (courseId) filter.courseId = courseId;

    const enrollments = await Enrollment.find(filter)
      .populate("studentId", "name email")
      .populate("courseId", "title");

    res.status(200).json({ count: enrollments.length, enrollments });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const approveSection = async (req, res) => {
  try {
    const { courseId, sectionId } = req.params;
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ message: "الكورس غير موجود" });
    }

    // بنوصل للسيكشن
    const section = course.sections.id(sectionId);
    
    if (!section) {
      return res.status(404).json({ message: "السيكشن غير موجود داخل هذا الكورس" });
    }

    // 🛡️ تغيير حالة السيكشن نفسه
    section.status = 'approved';

    // 🛡️ تشيك الأمان: التأكد إن مصفوفة الدروس موجودة وليست null أو undefined قبل اللوب
    if (section.lessons && Array.isArray(section.lessons)) {
        section.lessons.forEach(lesson => {
            lesson.status = 'approved';
        });
    }

    // 🛡️ لو عندك مصفوفة تانية اسمها contents زي ما ظهر في الصورة، أمنها برضه
    if (section.contents && Array.isArray(section.contents)) {
        section.contents.forEach(content => {
            content.status = 'approved';
        });
    }

    await course.save();
    res.status(200).json({ success: true, message: "✅ تمت الموافقة على السيكشن وكل محتوياته بنجاح" });

  } catch (error) {
    console.error("Approve Section Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// const approveExam = async (req, res) => {
//   try {
//     const { courseId, sectionId } = req.params;
//     const course = await Course.findById(courseId);

//     const section = course.sections[sectionId];
//     if (!section || !section.exam) {
//       return res.status(404).json({ message: "الامتحان غير موجود" });
//     }

//     // تغيير الحالة لمقبول
//     section.exam.status = 'approved';

//     await course.save();
//     res.status(200).json({ message: "تمت الموافقة على الامتحان، سيظهر للطلاب الآن" });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
// ========== approve section exam (For Admin) ========== //
// في ملف adminController.js
const approveSectionExam = async (req, res) => {
  try {
    const { courseId, sectionId, examId } = req.params;

    // 1. تحديث الامتحان في الكوليكشن الأصلي (ده اللي بيخليه Approved في جدول الـ Exams)
    const updatedExam = await Exam.findByIdAndUpdate(
      examId,
      { status: 'approved' },
      { new: true }
    );

    if (!updatedExam) {
      return res.status(404).json({ success: false, message: "الامتحان غير موجود في جدول الامتحانات" });
    }

    // 2. تحديث الكورس (تغيير حالة السيكشن فقط)
    // ملمسناش حقل الـ exam عشان ميعملش Cast Error
    const course = await Course.findOneAndUpdate(
      { 
        _id: courseId, 
        "sections._id": sectionId 
      },
      { 
        $set: { 
          "sections.$.status": 'approved' // بنوافق على السيكشن عشان يفتح للطالب
        } 
      },
      { new: true }
    );

    if (!course) {
      return res.status(404).json({ success: false, message: "الكورس أو السيكشن غير موجود" });
    }

    res.status(200).json({ 
      success: true, 
      message: "✅ تم الاعتماد بنجاح. السيكشن والامتحان أصبحوا جاهزين الآن.",
      data: {
        examStatus: updatedExam.status,
        sectionStatus: 'approved'
      }
    });

  } catch (error) {
    console.error("Error in approveSectionExam:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// دالة للأدمن يوافق بها على التقييم ليظهر في الصفحة الرئيسية
const toggleReviewStatus = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const review = await Review.findById(reviewId);

        if (!review) {
            return res.status(404).json({ message: "التقييم غير موجود" });
        }

        // عكس القيمة (لو true تبقى false ولو false تبقى true)
        review.isFeatured = !review.isFeatured;
        await review.save();

        res.status(200).json({ 
            message: review.isFeatured ? "تم إظهار التقييم في الصفحة الرئيسية" : "تم إخفاء التقييم",
            review 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const getPendingExams = async (req, res) => {
  try {
    // بنجيب كل الامتحانات اللي الـ status بتاعتها pending
    const pendingExams = await Exam.find({ status: 'pending' })
      .populate('courseId', 'title') // عشان نعرف الامتحان ده تبع أنهي كورس
      .sort({ createdAt: -1 }); // الأحدث يظهر الأول

    res.status(200).json({
      success: true,
      count: pendingExams.length,
      data: pendingExams
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
const getPendingSections = async (req, res) => {
  try {
    // بنجيب الكورسات اللي فيها على الأقل سكشن واحد بندنج
    const coursesWithPendingSections = await Course.find({
      "sections.status": "pending"
    }).select("title sections");

    // تصفية السكاشن فقط عشان نرجع للأدمن السكاشن اللي محتاجة مراجعة بس
    let pendingSections = [];
    coursesWithPendingSections.forEach(course => {
      const filtered = course.sections.filter(sec => sec.status === "pending");
      filtered.forEach(s => pendingSections.push({ courseTitle: course.title, section: s }));
    });

    res.status(200).json({ success: true, count: pendingSections.length, data: pendingSections });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const approveSectionContent = async (req, res) => {
  try {
    const { courseId, sectionId, contentId } = req.params;

    // 1. تحديث المحتوى في الكوليكشن الأصلي (Contents Collection)
    // ده اللي هيخلي الـ "pending" تتحول لـ "approved" في جدول الـ contents
    const updatedContent = await Content.findByIdAndUpdate(
      contentId,
      { status: 'approved' },
      { new: true }
    );

    if (!updatedContent) {
      return res.status(404).json({ success: false, message: "المحتوى الأصلي غير موجود" });
    }

    // 2. تحديث الكورس (بنغير حالة السيكشن عشان الطالب يقدر يفتحه)
    // لاحظ: بنسيب الـ ID بتاع الـ content زي ما هو ومبنلمسهوش عشان ميعملش Cast Error
    const course = await Course.findOneAndUpdate(
      { 
        _id: courseId, 
        "sections._id": sectionId 
      },
      { 
        $set: { 
          "sections.$.status": 'approved' 
        } 
      },
      { new: true }
    );

    if (!course) {
      return res.status(404).json({ success: false, message: "الكورس أو السيكشن غير موجود" });
    }

    res.status(200).json({ 
      success: true, 
      message: "✅ تم اعتماد المحتوى وتفعيل السيكشن بنجاح",
      data: {
        contentStatus: updatedContent.status,
        sectionStatus: 'approved'
      }
    });

  } catch (error) {
    console.error("Error in approveSectionContent:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
module.exports = {
  // Teachers
  createTeacher,
  updateTeacher,
  activateTeacher,
  deactivateTeacher,
  deleteTeacher,
  // Students
  updateStudent,
  deleteStudent,
  // Courses
  updateCourse,
  approveCourse,
  rejectCourse,
  deleteCourse,
  getPendingCourses,
  // Enrollments
  createEnrollment,
  deleteEnrollment,
  // Dashboard & Lists
  getDashboard,
  getAllStudents,
  getAllTeachers,
  getAllCourses,
  getAllEnrollments,
   approveSection,

   approveSectionExam,
   toggleReviewStatus,
   getPendingExams,
   getPendingSections,
   approveSectionContent
};