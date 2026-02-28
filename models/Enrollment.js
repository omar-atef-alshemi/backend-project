// (شيلنا instructorId + منعنا التكرار)
const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true
    },

    completedContents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Content"
      }
    ],

    examResults: [
      {
        examId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Exam"
        },

        score: Number,

        submittedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],

    progressPercentage: {
      type: Number,
      default: 0
    },

    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active"
    }
  },
  { timestamps: true }
);

// منع تسجيل نفس الطالب في نفس الكورس مرتين
enrollmentSchema.index(
  { studentId: 1, courseId: 1 },
  { unique: true }
);

module.exports = mongoose.model("Enrollment", enrollmentSchema);

