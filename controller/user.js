const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true
    },

    password: {
      type: String,
      required: true,
      select: false
    },

    role: {
      type: String,
      enum: ["admin", "teacher", "student"],
      required: true
    },

    isActive: {
      type: Boolean,
      default: true
    },

    // Forget Password
    passwordResetToken: String,
    passwordResetExpire: Date
  },
  { timestamps: true }
);

// تشفير الباسورد قبل الحفظ
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// حذف الباسورد من أي JSON بيرجع
userSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.password;
    return ret;
  }
});

module.exports = mongoose.model("User", userSchema);
