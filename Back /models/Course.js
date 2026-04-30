const mongoose = require("mongoose");

const sectionSchema = new mongoose.Schema({
  title: {
    ar: { type: String, required: true },
    en: { type: String, required: true }
  },
  order: { type: Number, required: true },
  
  // 🔥 الربط بالامتحان (Reference)
  exam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam" },

  // 🔥 مصفوفة المحتويات (فيديوهات، ملفات) مرتبطة بموديل Content
  contents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Content" }],

  totalDuration: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, { _id: true });

const courseSchema = new mongoose.Schema({
  title: {
    ar: { type: String, required: true },
    en: { type: String, required: true }
  },
  finalExam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' }, // حقل مستقل للفاينل,
  instructorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  description: { ar: String, en: String },
  thumbnail: String,
  category: { type: String, required: true },
  price: { type: Number, required: true },
  sections: [sectionSchema],
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  isPublished: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Course", courseSchema);