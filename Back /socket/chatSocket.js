const Message = require("../models/Message");
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const Notification = require("../models/Notification");
const jwt = require('jsonwebtoken');

module.exports = (io) => {
  console.log("🚀 Socket logic is initialized...");

  // Middleware للتحقق من التوكن قبل الاتصال
  io.use((socket, next) => {
    console.log("------------------------------------------");
    console.log("🔍 Incoming Connection Attempt...");
    
    try {
      const cookieHeader = socket.handshake.headers.cookie;
      console.log("🍪 Raw Cookie Header:", cookieHeader || "NO COOKIES FOUND");

      let token = "";
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce((acc, curr) => {
          const [key, value] = curr.trim().split('=');
          acc[key] = value;
          return acc;
        }, {});
        token = cookies.jwt;
      }

      if (!token) {
        console.log("❌ Rejected: No JWT token in cookies");
        return next(new Error("Authentication error: No token"));
      }

      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          console.log("❌ Rejected: JWT Verification Failed", err.message);
          return next(new Error("Authentication error: Invalid token"));
        }
        
        console.log("✅ Decoded Token Data:", decoded.userInfo);
        socket.user = decoded.userInfo;
        next();
      });
    } catch (error) {
      console.log("💥 Crash in Middleware:", error.message);
      next(new Error("Internal Server Error"));
    }
  });

  io.on('connection', (socket) => {
    console.log(`📡 New Socket Established! ID: ${socket.id} | User: ${socket.user.id}`);
socket.join(socket.user.id);


if (socket.user.role === 'admin') {
        socket.join('admin_room');
        console.log(`🛡️ Admin ${socket.user.id} is now monitoring all chats.`);
    }

    
    // 1. الدخول لغرفة الكورس
    socket.on('join_course', async ({ courseId }) => {
      console.log(`📥 Join Request: User ${socket.user.id} wanting course ${courseId}`);
      try {
        const [isStudent, isTeacher] = await Promise.all([
          Enrollment.findOne({ studentId: socket.user.id, courseId }),
          Course.findOne({ _id: courseId, teacherId: socket.user.id })
        ]);

        if (isStudent || isTeacher) {
          console.log("🔓 Access Granted to room:", courseId);
          socket.join(courseId);
          socket.emit('access_granted', { msg: "Connected to Course Room", courseId });
        } else {
          console.log("🔒 Access Denied: Not enrolled or not the teacher");
          socket.emit('access_denied', { msg: "Forbidden: You are not enrolled in this course" });
        }
      } catch (err) {
        console.log("❌ DB Error in join_course:", err.message);
      }
    });

    // 2. إرسال واستقبال الرسائل (ده الجزء اللي كان ناقصك)
socket.on('send_message', async ({ chatRoomId, text }) => {
  try {
    // 1. حفظ الرسالة في الداتابيز
    const newMessage = await Message.create({
      chatRoomId,
      senderId: socket.user.id,
      text
    });

    // 2. إرسال الرسالة لأعضاء الكورس (Real-time Chat)
    io.to(chatRoomId).emit('receive_message', newMessage);

    // 3. جلب بيانات الكورس لإدارة الإشعارات
    const course = await Course.findById(chatRoomId);
    
    if (course) {
      // --- إشعار المدرس ---
      if (course.teacherId.toString() !== socket.user.id) {
        const teacherNotif = await Notification.create({
          userId: course.teacherId,
          content: `رسالة جديدة في كورس ${course.title}: ${text.substring(0, 20)}...`,
          type: 'CHAT_MESSAGE',
          relatedId: chatRoomId
        });

        // إرسال الإشعار للمدرس "فوراً" لو فاتح
        io.to(course.teacherId.toString()).emit('new_notification', teacherNotif);
      }

      // --- إشعار الأدمن (المراقبة العامة) ---
      // أي أدمن فاتح الـ Dashboard وداخل في أوضة 'admin_room' هيشوف الرسالة دي
      io.to('admin_room').emit('admin_monitor_message', {
        courseTitle: course.title,
        senderName: socket.user.name || "Student", // تأكد إن الاسم موجود في التوكن
        text: text,
        timestamp: newMessage.createdAt
      });
    }

  } catch (err) {
    console.log("❌ Socket Message Error:", err.message);
    socket.emit('error_status', { msg: "حدث خطأ أثناء إرسال الرسالة" });
  }
});

    socket.on('disconnect', (reason) => {
      console.log(`🔌 User Disconnected. Reason: ${reason}`);
    });
  });
};