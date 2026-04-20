const express = require("express");
const router = express.Router();
const authControllers = require("../controllers/authControllers");
const verifyJWT = require("../middleware/verifyJWT");
const passport = require("../config/passport");

// Auth
router.post("/register/student", authControllers.registerStudent);//done
router.post("/register/teacher", authControllers.registerTeacher);//done
router.post("/resend-otp", authControllers.resendOtp);
router.post("/verify-otp", authControllers.verifyOtp);//done
router.post("/login", authControllers.login);//done
router.get("/refresh", authControllers.refresh);
router.get("/me", verifyJWT, authControllers.getMe);//done
router.post("/logout", authControllers.logout);

// Password
router.patch("/change-password", verifyJWT, authControllers.changePassword);//done
router.post("/forget-password", authControllers.forgetPassword);//done
router.post("/verify-reset-code", authControllers.verifyPassResetCode);//done
router.post("/reset-password", authControllers.resetPassword);//done

// Google OAuth
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  authControllers.googleCallback
);

module.exports = router;