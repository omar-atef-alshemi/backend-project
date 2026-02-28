const mongoose = require("mongoose");

const contentSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true
    },

    type: {
      type: String,
      enum: ["video", "file", "assignment"],
      required: true
    },

    title: {
      type: String,
      required: true
    },

    fileUrl: String,

    order: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Content", contentSchema);
