/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from "express";
import { User } from "../models";
import { generateOTP, hashOTP, verifyOTP } from "../utils/generateOTP";
import {
  signToken,
  setTokenCookie,
  clearTokenCookie,
} from "../utils/generateToken";

const CITIZEN_TTL = process.env.JWT_CITIZEN_TTL ?? "24h";
const MAX_OTP_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/send-otp
// ─────────────────────────────────────────────────────────────────────────────
export const sendOTP = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { mobile } = req.body as { mobile?: string };

    if (!mobile || !/^\+?[0-9]{10,13}$/.test(mobile)) {
      res
        .status(400)
        .json({ success: false, message: "Valid mobile number is required." });
      return;
    }

    // Find existing user or create a stub (name & address filled on first login)
    let user = await User.findOne({ mobile });
    if (!user) {
      // New citizen — profile (district, address) filled in after first login
      user = new User({ mobile, name: "Citizen" });
    }

    // Guard: account blocked?
    if (user.isBlocked && user.blockedUntil && user.blockedUntil > new Date()) {
      const remaining = Math.ceil(
        (user.blockedUntil.getTime() - Date.now()) / 60000,
      );
      res.status(429).json({
        success: false,
        message: `Account locked due to too many failed attempts. Try again in ${remaining} minute(s).`,
      });
      return;
    }

    // Generate & hash OTP
    const plain = generateOTP();
    const hashed = await hashOTP(plain);

    user.otp = hashed;
    user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    user.otpAttempts = 0;
    user.isBlocked = false;
    user.blockedUntil = undefined;

    await user.save();

    // ⚠️ DEV ONLY — log OTP to console instead of sending SMS
    console.log(`\n🔐 [DEV] OTP for ${mobile} → ${plain}\n`);

    res
      .status(200)
      .json({ success: true, message: "OTP generated. Check server console." });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/verify-otp
// ─────────────────────────────────────────────────────────────────────────────
export const verifyOTPHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { mobile, otp } = req.body as { mobile?: string; otp?: string };

    if (!mobile || !otp) {
      res
        .status(400)
        .json({ success: false, message: "Mobile and OTP are required." });
      return;
    }

    // Fetch with hidden OTP fields
    const user = await User.findOne({ mobile }).select(
      "+otp +otpExpiry +otpAttempts +isBlocked",
    );

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found. Please request an OTP first.",
      });
      return;
    }

    // Blocked?
    if (user.isBlocked && user.blockedUntil && user.blockedUntil > new Date()) {
      const remaining = Math.ceil(
        (user.blockedUntil.getTime() - Date.now()) / 60000,
      );
      res.status(429).json({
        success: false,
        message: `Account locked. Try again in ${remaining} minute(s).`,
      });
      return;
    }

    // OTP present & not expired?
    if (!user.otp || !user.otpExpiry || user.otpExpiry < new Date()) {
      res.status(410).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
      return;
    }

    // Verify hash
    const isMatch = await verifyOTP(otp, user.otp);

    if (!isMatch) {
      user.otpAttempts += 1;

      if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
        user.isBlocked = true;
        user.blockedUntil = new Date(Date.now() + BLOCK_DURATION_MS);
        await user.save();
        res.status(429).json({
          success: false,
          message: "Too many failed attempts. Account locked for 15 minutes.",
        });
        return;
      }

      await user.save();
      res.status(401).json({
        success: false,
        message: `Incorrect OTP. ${MAX_OTP_ATTEMPTS - user.otpAttempts} attempt(s) remaining.`,
      });
      return;
    }

    // ✅ OTP valid — clear OTP fields & issue JWT
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.otpAttempts = 0;
    user.isBlocked = false;
    user.blockedUntil = undefined;
    await user.save();

    const token = signToken(
      {
        id: user.id as string,
        role: "citizen",
        districtId: user.district?.toString() ?? "",
      },
      CITIZEN_TTL,
    );

    setTokenCookie(res, token, CITIZEN_TTL);

    res.status(200).json({
      success: true,
      message: "Login successful.",
      user: {
        id: user.id,
        name: user.name,
        mobile: user.mobile,
        district: user.district,
        preferredLanguage: user.preferredLanguage,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me  [authGuard]
// ─────────────────────────────────────────────────────────────────────────────
export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = await User.findById(req.user!.id).populate(
      "district",
      "name state",
    );

    if (!user) {
      res.status(404).json({ success: false, message: "User not found." });
      return;
    }

    res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/logout  [authGuard]
// ─────────────────────────────────────────────────────────────────────────────
export const logout = (_req: Request, res: Response): void => {
  clearTokenCookie(res);
  res.status(200).json({ success: true, message: "Logged out successfully." });
};
