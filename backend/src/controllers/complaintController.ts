/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from "express";
import path from "path";
import { Department } from "../models/Department";
import { District } from "../models/District";
import { Complaint } from "../models/Complaint";
import { generateRefNumber } from "../utils/generateRefNumber";

// ─── POST /api/complaints ─────────────────────────────────────────────────────
export const submitComplaint = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.id;

    const {
      departmentCode,
      category,
      description,
      urgency = "medium",
      streetAddress = "",
      city = "Karnal",
      state = "Haryana",
      pincode = "000000",
      districtName = "Karnal",
    } = req.body as {
      departmentCode?: string;
      category?: string;
      description?: string;
      urgency?: string;
      streetAddress?: string;
      city?: string;
      state?: string;
      pincode?: string;
      districtName?: string;
    };

    // ── Validate required fields ───────────────────────────────────────────────
    if (!departmentCode || !category || !description) {
      res.status(400).json({
        success: false,
        message: "departmentCode, category, and description are required.",
      });
      return;
    }

    if (description.length < 10) {
      res.status(400).json({
        success: false,
        message: "Description must be at least 10 characters.",
      });
      return;
    }

    // ── Resolve Department ─────────────────────────────────────────────────────
    const department = await Department.findOne({
      code: departmentCode.toUpperCase(),
    });
    if (!department) {
      res.status(404).json({
        success: false,
        message: `Department '${departmentCode}' not found.`,
      });
      return;
    }

    // ── Resolve District ───────────────────────────────────────────────────────
    const district = await District.findOne({
      name: new RegExp(`^${districtName}$`, "i"),
    });
    if (!district) {
      res.status(404).json({
        success: false,
        message: `District '${districtName}' not found.`,
      });
      return;
    }

    // ── Photo URL ──────────────────────────────────────────────────────────────
    // If a file was uploaded via multer, serve it from /uploads; otherwise use placeholder.
    let photoUrl = "/uploads/placeholder.png";
    const file = (req as Request & { file?: Express.Multer.File }).file;
    if (file) {
      photoUrl = `/uploads/complaints/${file.filename}`;
    }

    // ── Reference Number ───────────────────────────────────────────────────────
    const referenceNumber = await generateRefNumber("COMP");

    // ── Build GeoJSON location from district coordinates ───────────────────────
    const coords = district.coordinates ?? {
      longitude: 76.9905,
      latitude: 29.6857,
    };

    // ── Create Complaint ───────────────────────────────────────────────────────
    const complaint = await Complaint.create({
      userId,
      department: department._id,
      district: district._id,
      referenceNumber,
      category,
      description,
      address: {
        houseNo: "-",
        street: streetAddress || "-",
        city,
        state,
        pincode,
      },
      location: {
        type: "Point",
        coordinates: [coords.longitude, coords.latitude],
      },
      photoUrl,
      urgency,
      priority: urgency,
      status: "submitted",
      statusHistory: [
        {
          status: "submitted",
          updatedByModel: "User",
          note: "Complaint registered by citizen.",
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Complaint registered successfully.",
      complaint: {
        id: complaint._id,
        referenceNumber: complaint.referenceNumber,
        status: complaint.status,
        department: department.name,
        category: complaint.category,
        urgency: complaint.urgency,
        city,
        createdAt: complaint.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/complaints/my ───────────────────────────────────────────────────
export const getMyComplaints = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const complaints = await Complaint.find({ userId: req.user!.id })
      .sort({ createdAt: -1 })
      .populate("department", "name code icon")
      .populate("district", "name state")
      .lean();

    res.status(200).json({ success: true, complaints });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/complaints/:refNumber ──────────────────────────────────────────
export const getComplaintByRef = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { refNumber } = req.params;
    const complaint = await Complaint.findOne({ referenceNumber: refNumber })
      .populate("department", "name code")
      .populate("district", "name state")
      .lean();

    if (!complaint) {
      res.status(404).json({ success: false, message: "Complaint not found." });
      return;
    }

    // Citizens can only view their own complaints
    if (
      req.user!.role === "citizen" &&
      complaint.userId.toString() !== req.user!.id
    ) {
      res.status(403).json({ success: false, message: "Access denied." });
      return;
    }

    res.status(200).json({ success: true, complaint });
  } catch (err) {
    next(err);
  }
};
