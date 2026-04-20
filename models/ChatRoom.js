
const mongoose = require('mongoose');
const chatRoomSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // المدرس + الطلاب اللي مسجلين
  type: { type: String, enum: ["courseGroup", "private"], default: "courseGroup" }
}, { timestamps: true });

module.exports = mongoose.model("ChatRoom", chatRoomSchema);