import { Router } from "express";
import {
  sendOTP,
  verifyOTPHandler,
  firebaseLogin,
  getMe,
  logout,
} from "../controllers/authController";
import { authGuard } from "../middleware/authGuard";

const router = Router();

// Public routes
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTPHandler);
router.post("/firebase-login", firebaseLogin);

// Protected routes
router.get("/me", authGuard, getMe);
router.post("/logout", authGuard, logout);

export default router;
