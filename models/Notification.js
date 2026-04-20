const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true }, // لو recipient null يبقى للجميع
  title: { ar: String, en: String },
  message: { ar: String, en: String },
  type: { type: String, enum: ["exam", "course", "system", "suggestion"], default: "system" },

  // Action link لو حابب تفتح صفحة معينة
  actionUrl: String,

  // مرجع للكورس / المحتوى / امتحان
  referenceId: mongoose.Schema.Types.ObjectId,

  isRead: { type: Boolean, default: false },
  readAt: Date,
  isDeleted: { type: Boolean, default: false },

  // إضافي: إذا ده suggestion يوصل للادمن
  isForAdmin: { type: Boolean, default: false }
}, { timestamps: true });

notificationSchema.index({ recipient: 1, isRead: 1 });

module.exports = mongoose.model("Notification", notificationSchema);