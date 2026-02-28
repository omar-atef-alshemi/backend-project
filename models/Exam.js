const mongoose = require("mongoose");

const examSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true
    },

    title: {
      type: String,
      required: true
    },

    duration: {
      type: Number, // بالدقائق
      required: true
    },

    questions: [
      {
        questionText: {
          type: String,
          required: true
        },

        options: [
          {
            type: String,
            required: true
          }
        ],

        correctAnswerIndex: {
          type: Number,
          required: true
        },

        grade: {
          type: Number,
          default: 1
        }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Exam", examSchema);
// ⚠ مهم جدًا:
// لما تبعت الامتحان للطالب متبعتش correctAnswerIndex.
