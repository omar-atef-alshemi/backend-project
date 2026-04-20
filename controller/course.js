const Course = require('../models/Course');

// تأكد من مسار الملف صح حسب ترتيب الفولدرات عندك
const Teacher = require('../models/Teacher');
const mongoose = require('mongoose'); // تأكد إنك عامل import للمونجوس فوق
// ========== Create Course ========== //
const createCourse = async (req, res) => {
  try {
    console.log("--- 🆕 Start: Create Course Request ---");
    const userId = req.user._id;
    console.log("👤 Attempting User ID:", userId);

    // 1. التأكد من بروفايل المدرس وحالته
    // بنستخدم mongoose.Types.ObjectId لضمان التوافق مع أطلس
    const teacherProfile = await Teacher.findOne({ 
      userId: new mongoose.Types.ObjectId(userId) 
    });

    console.log("🔍 Teacher Profile Lookup:", teacherProfile ? "Found" : "Not Found");

    if (!teacherProfile) {
      console.error("🚫 Blocked: No Teacher profile found for this User ID");
      return res.status(403).json({ message: 'عذراً، يجب إنشاء حساب مدرس أولاً.' });
    }

    console.log("🛡️ Teacher Status:", teacherProfile.status);

    if (teacherProfile.status !== 'approved') {
      console.warn("⚠️ Blocked: Teacher status is still pending/rejected");
      return res.status(403).json({ 
        message: 'عذراً، لا يمكنك إنشاء كورس إلا بعد موافقة الإدارة على حسابك كمدرس.' 
      });
    }

    // 2. تجهيز بيانات الكورس
    console.log("📦 Processing Course Data...");
    const courseData = {
      ...req.body,
      instructorId: teacherProfile._id, // بنربطه ببروفايل المدرس مش اليوزر
      status: 'pending', // 🔒 الكورس نفسه ينزل Pending لمراجعة محتواه
      sections: [] // بنبدأ بمصفوفة سكاشن فاضية وجاهزة للـ IDs
    };

    // 3. الحفظ في قاعدة البيانات
    const course = new Course(courseData);
    await course.save();

    console.log("✅ Course Created Successfully! ID:", course._id);

    res.status(201).json({ 
      success: true,
      message: 'تم إنشاء الكورس بنجاح، وهو بانتظار مراجعة الإدارة للمحتوى.', 
      course 
    });

    console.log("--- ✅ End: Course Creation Finished ---");

  } catch (error) {
    console.error("🔥 CRITICAL ERROR in createCourse:");
    console.error(error.stack);
    res.status(500).json({ message: "حدث خطأ أثناء إنشاء الكورس: " + error.message });
  }
};


const addSection = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title } = req.body;
    const userId = req.user.id;

    console.log("--- 📂 Start: Adding New Section ---");
    console.log(`📍 Course ID: ${courseId} | User: ${userId}`);

    // 1. البحث عن الكورس
    const course = await Course.findById(courseId);
    if (!course) {
      console.error("❌ Error: Course not found");
      return res.status(404).json({ message: "الكورس غير موجود" });
    }

    // 2. حساب الترتيب تلقائياً قبل الـ Push
    const nextOrder = course.sections.length + 1;

    // 3. إضافة السكشن الجديد "مرة واحدة فقط" بكل بياناته المطلوبة
    course.sections.push({
      title: title,     // تأكد إنك باعت ar و en في البوستمان
      order: nextOrder, 
      contents: [],
      status: 'pending'
    });

    console.log(`⏳ Calculated Order: ${nextOrder}. Saving to Atlas...`);
    
    // حفظ التعديلات
    await course.save();

    // جلب بيانات السكشن الأخير اللي اتسيف فعلاً
    const newSection = course.sections[course.sections.length - 1];
    
    console.log(`✅ Section Created Successfully! ID: ${newSection._id}`);

    res.status(201).json({
      success: true,
      message: "تم إضافة السكشن بنجاح، يمكنك الآن إضافة دروس داخله.",
      sectionId: newSection._id,
      section: newSection
    });

    console.log("--- ✅ End: Section Process Finished ---");

  } catch (error) {
    console.error("🔥 CRITICAL ERROR in addSection:");
    console.error(error.stack);
    res.status(500).json({ message: "حدث خطأ أثناء إضافة السكشن: " + error.message });
  }
};



// ========== Update Course ========== //
const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user.id : req.userId;

    console.log("--- ✏️ Start: Update Course Request ---");
    console.log(`📍 Targeting Course ID: ${id} | Request by User: ${userId}`);
    console.log("📦 Data to Update:", JSON.stringify(req.body, null, 2));

    // 1. البحث عن الكورس والتأكد من وجوده
    const course = await Course.findById(id);
    if (!course) {
      console.error("❌ Error: Course not found in Database");
      return res.status(404).json({ message: 'الكورس غير موجود' });
    }

    // 2. التحقق من الهوية (هل هذا المدرس هو صاحب الكورس؟)
    // لاحظ: بنقارن بـ instructorId اللي خزنناه في الـ createCourse
    // محتاجين نجيب الـ Teacher Profile بتاع اليوزر الحالي الأول
    const teacherProfile = await Teacher.findOne({ userId });
    
    if (!teacherProfile || course.instructorId.toString() !== teacherProfile._id.toString()) {
      console.error("🚫 Access Denied: Teacher is not the owner of this course");
      return res.status(403).json({ message: 'عذراً، لا يمكنك تعديل كورس لا تملكه.' });
    }

    // 3. قاعدة الموافقة (Approved Logic)
    // لو الكورس اتقبل خلاص، المدرس ممنوع يعدل البيانات الأساسية عشان مغيرش المحتوى من ورا الإدارة
    if (course.status === 'approved') {
      console.warn("⚠️ Blocked: Attempt to edit an already approved course");
      return res.status(403).json({ 
        message: 'تمت الموافقة على هذا الكورس بالفعل، لا يمكن تعديله. تواصل مع الإدارة إذا كنت بحاجة لتغيير ضروري.' 
      });
    }

    // 4. تنفيذ التعديل
    console.log("⏳ Updating course in Atlas...");
    
    // بنمنع المدرس إنه يغير الـ status بنفسه لـ approved من خلال الـ body
    const { status, instructorId, ...safeData } = req.body; 

    const updatedCourse = await Course.findByIdAndUpdate(
      id, 
      { ...safeData, status: 'pending' }, // بنرجعه pending تاني لو عدل فيه عشان يتراجع
      { new: true, runValidators: true }
    );

    console.log("✅ Course Updated Successfully!");

    res.json({
      success: true,
      message: "تم تحديث بيانات الكورس بنجاح، وهو قيد مراجعة التعديلات.",
      course: updatedCourse
    });

    console.log("--- ✅ End: Update Process Finished ---");

  } catch (error) {
    console.error("🔥 CRITICAL ERROR in updateCourse:");
    console.error(error.stack);
    res.status(500).json({ message: "حدث خطأ أثناء التحديث: " + error.message });
  }
};
// ========== Delete Course ========== //
const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user.id : req.userId;

    console.log("--- 🗑️ Start: Full Course Deletion ---");
    console.log(`📍 Course ID to Delete: ${id} | Requested by User: ${userId}`);

    // 1. البحث عن الكورس والتأكد من الملكية
    const course = await Course.findById(id);
    if (!course) {
      console.error("❌ Error: Course not found");
      return res.status(404).json({ message: 'الكورس غير موجود بالفعل' });
    }

    // التأكد إن المدرس هو صاحب الكورس
    const teacherProfile = await Teacher.findOne({ userId });
    if (!teacherProfile || course.instructorId.toString() !== teacherProfile._id.toString()) {
      console.error("🚫 Access Denied: User is not the instructor of this course");
      return res.status(403).json({ message: 'لا تملك صلاحية حذف هذا الكورس' });
    }

    // 2. تنظيف البيانات المرتبطة (The Cleanup)
    console.log("⏳ Cleaning up related data in Atlas...");

    // مسح كل المحتويات (فيديوهات/ملفات) المرتبطة بهذا الكورس
    const deletedContents = await Content.deleteMany({ courseId: id });
    console.log(`✅ Deleted ${deletedContents.deletedCount} items from Content collection`);

    // مسح كل الامتحانات المرتبطة بهذا الكورس
    const deletedExams = await Exam.deleteMany({ courseId: id });
    console.log(`✅ Deleted ${deletedExams.deletedCount} exams from Exams collection`);

    // مسح سجلات تقدم الطلاب والاشتراكات (اختياري حسب رغبتك، بس الأفضل يتمسحوا)
    await Progress.deleteMany({ courseId: id });
    await Enrollment.deleteMany({ courseId: id });
    console.log("✅ Deleted all Progress and Enrollment records for this course");

    // 3. مسح الكورس نفسه في النهاية
    await Course.findByIdAndDelete(id);
    console.log("🗑️ Final Step: Course document deleted from Courses collection");

    res.json({ 
      success: true, 
      message: 'تم حذف الكورس وجميع محتوياته وسجلات الطلاب المرتبطة به بنجاح' 
    });

    console.log("--- ✅ End: Deletion Process Finished ---");

  } catch (error) {
    console.error("🔥 CRITICAL ERROR in deleteCourse:");
    console.error(error.stack);
    res.status(500).json({ message: "حدث خطأ أثناء عملية الحذف الشامل: " + error.message });
  }
};

// ========== Get Courses with Search & Filters ========== //
const getFilteredCourses = async (req, res) => {
  try {
    console.log("--- 🔍 Start: Fetch Filtered Courses ---");
    console.log("📥 Query Params:", req.query);

    let filter = {};
    
    // 1. منطق الحماية (الأمان)
    // الطالب بيشوف الـ approved بس، الإدمن بيشوف كل حاجة
    const isAdmin = req.user && req.user.role === 'admin'; 
    if (!isAdmin) {
      filter.status = 'approved';
      console.log("🛡️ Filter applied: Showing only APPROVED courses for regular user.");
    } else if (req.query.status) {
      filter.status = req.query.status;
      console.log(`🛠️ Admin filter applied: Showing ${req.query.status} courses.`);
    }

    // 2. الفلاتر الاختيارية
    if (req.query.teacherId) {
      filter.instructorId = req.query.teacherId; // تأكدنا من المسمى الجديد
    }
    
    if (req.query.track) {
      filter.track = req.query.track;
    }

    // 3. منطق البحث (Search Logic)
    if (req.query.search) {
      const searchRegex = { $regex: req.query.search, $options: 'i' };
      filter.$or = [
        { "title.ar": searchRegex },
        { "title.en": searchRegex },
        { "description.ar": searchRegex },
        { "description.en": searchRegex },
        { track: searchRegex },
        { category: searchRegex }
      ];
      console.log(`🔎 Search term detected: "${req.query.search}"`);
    }

    // 4. تنفيذ الطلب مع الـ Populate
    console.log("⏳ Querying Atlas with filter:", JSON.stringify(filter));
    
    const courses = await Course.find(filter)
      .populate('instructorId', 'name email') // بنجيب بيانات المدرس الأساسية
      .sort({ createdAt: -1 }); // الجديد دايمًا يظهر فوق

    console.log(`✅ Success: Found ${courses.length} courses.`);

    res.json({
      success: true,
      count: courses.length,
      courses: courses
    });

    console.log("--- ✅ End: Request Handled ---");

  } catch (error) {
    console.error("🔥 CRITICAL ERROR in getFilteredCourses:");
    console.error(error.stack);
    res.status(500).json({ message: "حدث خطأ أثناء جلب الكورسات: " + error.message });
  }
};
// ========== Get Course by ID ========== //
const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("--- 📖 Start: Get Course Details ---");
    console.log(`📍 Fetching Course ID: ${id}`);

    // 1. جلب الكورس مع عمل Populate لكل المراجع المرتبطة
    const course = await Course.findById(id)
      .populate('instructorId', 'name email bio') // بيانات المدرس
      .populate({
        path: 'sections.contents', // بيانات الدروس من جدول Content
        select: 'title type duration fileUrl status order', // بنجيب البيانات المهمة بس
        match: { status: 'approved' } // 🔒 حماية: الطالب ميشوفش إلا الدروس اللي اتقبلت
      })
      .populate({
        path: 'sections.exam', // بيانات الامتحان من جدول Exam
        select: 'examTitle passingScore status',
        match: { status: 'approved' } // 🔒 حماية: الامتحان ميظهرش إلا لو مقبول
      });

    // 2. التحقق من وجود الكورس
    if (!course) {
      console.error("❌ Error: Course not found");
      return res.status(404).json({ message: 'الكورس غير موجود' });
    }
    console.log("✅ Course found:", course.title.en);

    // 3. التحقق من حالة الكورس (Privacy Check)
    const isAdmin = req.user && req.user.role === 'admin';
    
    // لو الكورس مش مقبول، ومحاول الدخول مش إدمن ومش هو المدرس صاحب الكورس
    if (course.status !== 'approved' && !isAdmin) {
      // تشيك إضافي: هل اللي بيحاول يدخل هو المدرس صاحب الكورس؟ (عشان يشوف شغله)
      const teacherProfile = await Teacher.findOne({ userId: req.user?.id });
      const isOwner = teacherProfile && course.instructorId._id.toString() === teacherProfile._id.toString();

      if (!isOwner) {
        console.warn("🚫 Blocked: Unauthorized access to a non-approved course");
        return res.status(403).json({ message: 'هذا الكورس غير متاح حالياً للمشاهدة.' });
      }
    }

    console.log("🔓 Access Granted. Sending course data...");
    res.json({
      success: true,
      course: course
    });

    console.log("--- ✅ End: Request Handled ---");

  } catch (error) {
    console.error("🔥 CRITICAL ERROR in getCourseById:");
    console.error(error.stack);
    res.status(500).json({ message: "حدث خطأ أثناء جلب تفاصيل الكورس: " + error.message });
  }
};

// ========== Get My Courses (for teacher) ========== //
const getMyCourses = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : req.userId;

    console.log("--- 👨‍🏫 Start: Get Teacher's Own Courses ---");
    console.log(`👤 Request by User ID: ${userId}`);

    // 1. الوصول لبروفايل المدرس المرتبط باليوزر ده
    const teacherProfile = await Teacher.findOne({ userId });

    if (!teacherProfile) {
      console.error("❌ Error: No Teacher profile found for this User");
      return res.status(404).json({ 
        success: false, 
        message: 'عذراً، لم يتم العثور على حساب مدرس مرتبك بهذا المستخدم.' 
      });
    }
    console.log(`✅ Teacher Profile Found: ${teacherProfile._id}`);

    // 2. جلب الكورسات المرتبطة بهذا المدرس
    // بنجيب الكورسات وبنعمل populate لعدد المشتركين أو السكاشن لو حابب
    const courses = await Course.find({ instructorId: teacherProfile._id })
      .sort({ createdAt: -1 }) // الأحدث يظهر أولاً للمدرس
      .select('title status track category createdAt'); // بنجيب البيانات المهمة للـ Dashboard

    console.log(`📚 Found ${courses.length} courses for this teacher.`);

    // 3. الرد بالبيانات
    res.json({
      success: true,
      count: courses.length,
      courses: courses
    });

    console.log("--- ✅ End: Teacher Courses Fetched ---");

  } catch (error) {
    console.error("🔥 CRITICAL ERROR in getMyCourses:");
    console.error(error.stack);
    res.status(500).json({ message: "حدث خطأ أثناء جلب كورساتك: " + error.message });
  }
};
// ========== Get Courses by Track ========== //
const getCoursesByTrack = async (req, res) => {
  try {
    const { track } = req.params;

    console.log("--- 🛣️ Start: Get Courses By Track ---");
    console.log(`🎯 Targeted Track: ${track}`);

    // 1. البحث عن الكورسات التي تنتمي للـ Track وحالتها "مقبولة" فقط
    console.log("⏳ Querying Atlas for approved courses...");
    
    const courses = await Course.find({ 
      track: track, 
      status: 'approved' 
    })
    .populate('instructorId', 'name email profileImage') // بيانات المدرس اللي الطالب محتاجها
    .select('title description thumbnail price ratings track createdAt') // بيانات كارت الكورس فقط
    .sort({ createdAt: -1 });

    // 2. التحقق من وجود نتائج
    if (!courses || courses.length === 0) {
      console.warn(`⚠️ No approved courses found for track: ${track}`);
      return res.status(200).json({ 
        success: true, 
        count: 0, 
        courses: [],
        message: 'لا توجد كورسات متاحة حالياً في هذا المسار.' 
      });
    }

    console.log(`✅ Success: Found ${courses.length} courses in [${track}]`);

    // 3. الرد بالبيانات
    res.json({
      success: true,
      count: courses.length,
      courses: courses
    });

    console.log("--- ✅ End: Track Fetching Completed ---");

  } catch (error) {
    console.error("🔥 CRITICAL ERROR in getCoursesByTrack:");
    console.error(error.stack);
    res.status(500).json({ message: "حدث خطأ أثناء جلب كورسات المسار: " + error.message });
  }
};

// ========== Get Section========== //
const getSection = async (req, res) => {
  try {
    const { courseId, sectionId } = req.params;
    const userId = req.user ? req.user.id : req.userId;

    console.log("--- 📂 Start: Get Section Details ---");
    console.log(`📍 Course: ${courseId} | Section: ${sectionId}`);

    // 1. جلب الكورس وعمل Populate للدروس والامتحان الخاص بالسكشن
    const course = await Course.findById(courseId).populate({
      path: 'sections.contents',
      model: 'Content',
      match: { status: 'approved' } // الطالب ميشوفش غير الدروس المقبولة
    }).populate('sections.exam');

    if (!course) {
      console.error("❌ Error: Course not found");
      return res.status(404).json({ message: 'Course not found' });
    }

    // 2. تحديد السكشن المطلوب
    const section = course.sections.id(sectionId);
    if (!section) {
      console.error("❌ Error: Section not found");
      return res.status(404).json({ message: 'Section not found' });
    }

    // 3. التحقق من الصلاحيات (أدمن، مدرس الكورس، أو طالب مشترك)
    const isAdmin = req.user?.role === 'admin';
    const teacherProfile = await Teacher.findOne({ userId });
    const isTeacher = teacherProfile && course.instructorId.toString() === teacherProfile._id.toString();

    if (!isAdmin && !isTeacher) {
      // لو طالب، نتأكد إن الكورس مقبول أصلاً
      if (course.status !== 'approved') {
        return res.status(403).json({ message: 'هذا الكورس غير متاح حالياً' });
      }

      // 4. منطق "قفل السكاشن": هل خلص السكشن اللي قبله؟
      const progress = await Progress.findOne({ userId, courseId });
      const currentIndex = course.sections.findIndex(s => s._id.toString() === sectionId);

      if (currentIndex > 0) {
        const previousSectionId = course.sections[currentIndex - 1]._id;
        const isPrevCompleted = progress && progress.completedSections.includes(previousSectionId);

        if (!isPrevCompleted) {
          console.warn(`🚫 Blocked: Section ${currentIndex} is locked. Previous section not completed.`);
          return res.status(403).json({ 
            message: 'يجب إكمال السيكشن السابق واجتياز امتحانه أولاً لفتح هذا المحتوى.' 
          });
        }
      }
    }

    console.log("✅ Access Granted to Section:", section.title.en);
    res.json({
      success: true,
      section: section
    });

    console.log("--- ✅ End: Section Data Sent ---");

  } catch (error) {
    console.error("🔥 CRITICAL ERROR in getSection:");
    console.error(error.stack);
    res.status(500).json({ message: "حدث خطأ أثناء جلب بيانات السيكشن: " + error.message });
  }
};
// ========== Submit Final Exam ========== //
const Certificate = require("../models/Certificate"); // استدعاء الموديل بتاعك
const Enrollment = require("../models/Enrollment");

const submitFinalExam = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { answers } = req.body;
    const userId = req.user.id;

    console.log("--- 🎓 Start: Final Exam Submission ---");
    console.log(`👤 Student: ${userId} | 📚 Course: ${courseId}`);

    // 1. جلب الكورس والتحقق من حالته
    const course = await Course.findById(courseId);
    if (!course) {
      console.error("❌ Error: Course not found");
      return res.status(404).json({ message: 'الكورس غير موجود' });
    }

    if (course.status !== 'approved') {
      return res.status(403).json({ message: 'هذا الكورس غير متاح حالياً' });
    }

    // 2. جلب الامتحان النهائي من جدول Exams (باسم مستعار للأسئلة الصحيحة)
    console.log("⏳ Fetching Final Exam data...");
    const exam = await Exam.findOne({ courseId, type: 'final' }).select("+questions.correctAnswer");

    if (!exam || exam.questions.length === 0) {
      console.error("❌ Error: Final exam not found or empty");
      return res.status(400).json({ message: 'المدرس لم يضع الامتحان النهائي لهذا الكورس بعد' });
    }

    // 3. التأكد من إنهاء الطالب لجميع دروس الكورس (الـ Progress)
    console.log("🕵️ Verifying student completion progress...");
    const progress = await Progress.findOne({ userId, courseId });
    
    // هنجيب إجمالي عدد المحتويات (Contents) في كل السكاشن
    const totalRequiredContents = course.sections.reduce((acc, sec) => acc + (sec.contents ? sec.contents.length : 0), 0);
    const studentCompletedCount = progress ? progress.completedContents.length : 0;

    console.log(`📊 Progress: ${studentCompletedCount}/${totalRequiredContents}`);

    if (studentCompletedCount < totalRequiredContents) {
      console.warn("🚫 Blocked: Student hasn't finished all lessons");
      return res.status(403).json({ message: 'يجب إنهاء جميع دروس السكاشن أولاً قبل دخول الامتحان النهائي' });
    }

    // 4. منطق التصحيح
    console.log("📝 Grading exam...");
    let scoreCount = 0;
    let totalPoints = 0;

    exam.questions.forEach((q, idx) => {
      totalPoints += (q.points || 1);
      if (answers && answers[idx] === q.correctAnswer) {
        scoreCount += (q.points || 1);
      }
    });

    const finalPercentage = (scoreCount / totalPoints) * 100;
    const isPassed = finalPercentage >= (exam.passingScore || 50);

    console.log(`🎯 Result: Score ${finalPercentage}% | Passed: ${isPassed}`);

    // 5. في حالة النجاح: إصدار الشهادة وتحديث الـ Enrollment
    if (isPassed) {
      console.log("🎊 Student Passed! Issuing Certificate...");
      
      const serial = `CERT-${courseId.toString().slice(-4)}-${userId.toString().slice(-4)}-${Date.now().toString().slice(-5)}`;
      
      // إصدار أو تحديث الشهادة
      await Certificate.findOneAndUpdate(
        { studentId: userId, courseId },
        {
          certificateSerial: serial,
          issueDate: new Date(),
          grade: finalPercentage
        },
        { upsert: true, new: true }
      );

      // تحديث حالة الاشتراك لـ Completed
      await Enrollment.findOneAndUpdate(
        { studentId: userId, courseId },
        { status: 'completed', completionDate: new Date() }
      );
    }

    res.json({
      success: true,
      passed: isPassed,
      score: finalPercentage,
      message: isPassed ? 'ألف مبروك! لقد اجتزت الكورس بنجاح وتم إصدار شهادتك.' : 'للأسف لم تتخطى درجة النجاح، يمكنك المراجعة والمحاولة مرة أخرى.'
    });

    console.log("--- ✅ End: Final Exam Processed ---");

  } catch (error) {
    console.error("🔥 CRITICAL ERROR in submitFinalExam:");
    console.error(error.stack);
    res.status(500).json({ message: "حدث خطأ أثناء تقديم الامتحان: " + error.message });
  }
};

module.exports = {
  createCourse,
  addSection,
  updateCourse,
  deleteCourse,
  getFilteredCourses,
  getCourseById,
  getMyCourses,
  getCoursesByTrack,
  getSection,
  submitFinalExam,
 
  
};