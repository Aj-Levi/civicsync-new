import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { authGuard } from "../middleware/authGuard";
import { roleGuard } from "../middleware/roleGuard";
import {
  submitComplaint,
  getMyComplaints,
  getComplaintByRef,
} from "../controllers/complaintController";

// ── Multer disk storage ────────────────────────────────────────────────────────
const UPLOAD_DIR = path.join(process.cwd(), "uploads", "complaints");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed."));
  },
});

// ── Routes ─────────────────────────────────────────────────────────────────────
const router = Router();

// All complaint routes require authentication
router.use(authGuard);

// Submit a new complaint (citizens only) — multipart/form-data with optional `photo`
router.post("/", roleGuard("citizen"), upload.single("photo"), submitComplaint);

// Get all complaints filed by the current citizen
router.get("/my", roleGuard("citizen"), getMyComplaints);

// Get a specific complaint by reference number (citizen: own only; admin: any)
router.get("/:refNumber", getComplaintByRef);

export default router;
