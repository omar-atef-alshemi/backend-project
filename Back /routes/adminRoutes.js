const express = require("express");
const router = express.Router();

const { authenticate, authorizeAdmin } = require("../middleware/adminMiddleware");

const {
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
  approveExam,
  approveSectionExam,
  getPendingExams,
  getPendingSections,
  approveSectionContent

   
} = require("../controllers/adminController");

// كل الـ routes محتاجة admin مسجل دخول
router.use(authenticate, authorizeAdmin);

// ── Teachers ──────────────────────────────
router.post("/create-teacher",            createTeacher);
router.patch("/teachers/:id",             updateTeacher);
router.patch("/teachers/:id/activate",    activateTeacher);
router.patch("/teachers/:id/deactivate",  deactivateTeacher);
router.delete("/teachers/:id",            deleteTeacher);

// ── Students ──────────────────────────────
router.patch("/students/:id",             updateStudent);
router.delete("/students/:id",            deleteStudent);

// ── Courses ───────────────────────────────
router.get("/courses/pending",            getPendingCourses);
router.patch("/courses/:id",              updateCourse);
router.patch("/courses/:id/approve",      approveCourse);
router.patch("/courses/:id/reject",       rejectCourse);
router.delete("/courses/:id",             deleteCourse);
router.patch('/courses/:courseId/sections/:sectionId/approve', authenticate, authorizeAdmin, approveSection);
// روت الموافقة على امتحان سيكشن معين
// router.patch('/courses/:courseId/sections/:sectionId/exam/approve', approveExam);
// روت الموافقة على الامتحان
router.patch('/courses/:courseId/sections/:sectionId/exams/:examId/approve', authenticate, authorizeAdmin, approveSectionExam);

// ── Enrollments ───────────────────────────
router.post("/enrollments",               createEnrollment);
router.delete("/enrollments/:id",         deleteEnrollment);

// ── Dashboard & Lists ─────────────────────
router.get("/dashboard",                  getDashboard);//done
router.get("/students",                   getAllStudents);
router.get("/teachers",                   getAllTeachers);
router.get("/courses",                    getAllCourses);
router.get("/enrollments",                getAllEnrollments);


// روت للأدمن يشوف كل الامتحانات اللي مستنية موافقة
router.get('/pending-exams', authenticate, authorizeAdmin, getPendingExams);
// router.get("/pending/courses",  getPendingCourses);  // موجود عندك بس نتأكد من الكود
router.get("/pending/sections", getPendingSections);
// تأكد من كلمة contents بالجمع عشان تطابق بوستمان
router.patch('/courses/:courseId/sections/:sectionId/contents/:contentId/approve', authenticate, authorizeAdmin, approveSectionContent);
module.exports = router;