
const mongoose = require('mongoose');
const messageSchema = new mongoose.Schema({
  chatRoomId: { type: mongoose.Schema.Types.ObjectId, ref: "ChatRoom", required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true },
  attachments: [{ type: String }], // روابط ملفات / صور / فيديو
  isReadBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }] // مين قرأ الرسالة
}, { timestamps: true });

module.exports = mongoose.model("Message", messageSchema);