const express = require('express');
const router = express.Router();

const { authenticate, authorizeAdmin, authorizeTeacher } = require('../middleware/adminMiddleware');

const courseController = require('../controllers/course'); 
const contentController = require('../controllers/content'); 

// ================== Course Routes ================== //

// روتات عامة للطالب والمدرس (البحث والجلب)
router.get('/filter', authenticate, courseController.getFilteredCourses);
router.get('/my-courses', authenticate, courseController.getMyCourses);
router.get('/track/:track', authenticate, courseController.getCoursesByTrack);
router.get('/:id', authenticate, courseController.getCourseById);

// تعديل: غيرنا sectionIndex لـ sectionId عشان نستخدم الـ ID الثابت من أطلس
router.get('/:courseId/section/:sectionId', authenticate, courseController.getSection);

// روتات التحكم في الكورس (للمدرسين فقط)
router.post('/', authenticate, authorizeTeacher, courseController.createCourse);
router.put('/:id', authenticate, authorizeTeacher, courseController.updateCourse);
router.delete('/:id', authenticate, authorizeTeacher, courseController.deleteCourse);

// روت الامتحان النهائي (للطلبة)
router.post('/:courseId/final-exam/submit', authenticate, courseController.submitFinalExam);


// ================== Content Routes ================== //

// إدارة الدروس (إضافة وحذف)
router.post('/:courseId/sections/:sectionId/lessons', authenticate, authorizeTeacher, contentController.addContent);
router.delete('/courses/:courseId/sections/:sectionId/lessons/:lessonId', authenticate, authorizeTeacher, contentController.deleteLesson);

// جلب وتصفية الدروس
router.get('/courses/:courseId/sections/:sectionId/lessons/filter', authenticate, contentController.getFilteredLessons);



// --- إدارة امتحانات السكاشن ---

// 1. المدرس يرفع امتحان (لاحظ غيرت المسار لـ /add-exam عشان ميتضربش مع الـ submit)
router.post('/courses/:courseId/sections/:sectionId/exam/add', authenticate, authorizeTeacher, contentController.addSectionExam);

// 2. الطالب يحل الامتحان (التصحيح)



router.post('/:courseId/sections', authenticate, authorizeTeacher, courseController. addSection);

module.exports = router;