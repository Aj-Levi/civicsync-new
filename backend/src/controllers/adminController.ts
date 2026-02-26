/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from "express";
import { Complaint } from "../models/Complaint";
import { ServiceRequest } from "../models/ServiceRequest";
import type { ComplaintStatus, ComplaintPriority } from "../models/Complaint";
import type { ServiceRequestStatus } from "../models/ServiceRequest";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const PAGE_SIZE = 20;

function getPage(req: Request) {
  return Math.max(1, parseInt((req.query.page as string) ?? "1", 10));
}

// ─── GET /api/admin/complaints ────────────────────────────────────────────────
export const getAdminComplaints = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { status, urgency, priority, search } = req.query as Record<
      string,
      string
    >;
    const { districtId, departmentId } = req.user!;
    const page = getPage(req);

    // Build filter — admin sees only complaints in their district AND department
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};
    if (districtId) filter.district = districtId;
    if (departmentId) filter.department = departmentId;
    if (status && status !== "all") filter.status = status;
    if (urgency && urgency !== "all") filter.urgency = urgency;
    if (priority && priority !== "all") filter.priority = priority;
    if (search) {
      filter.$or = [
        { referenceNumber: new RegExp(search, "i") },
        { category: new RegExp(search, "i") },
        { description: new RegExp(search, "i") },
      ];
    }

    const [complaints, total] = await Promise.all([
      Complaint.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .populate("userId", "name mobile")
        .populate("department", "name code")
        .populate("district", "name state")
        .lean(),
      Complaint.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      complaints,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total,
        pages: Math.ceil(total / PAGE_SIZE),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/admin/stats ─────────────────────────────────────────────────────
export const getAdminStats = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { districtId, departmentId } = req.user!;

    // Base filter scoped to admin's own district + department
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const baseFilter: Record<string, any> = {};
    if (districtId) baseFilter.district = districtId;
    if (departmentId) baseFilter.department = departmentId;

    const [
      totalComplaints,
      submitted,
      inProgress,
      resolved,
      rejected,
      totalSR,
    ] = await Promise.all([
      Complaint.countDocuments(baseFilter),
      Complaint.countDocuments({ ...baseFilter, status: "submitted" }),
      Complaint.countDocuments({
        ...baseFilter,
        status: { $in: ["acknowledged", "in_progress"] },
      }),
      Complaint.countDocuments({ ...baseFilter, status: "resolved" }),
      Complaint.countDocuments({ ...baseFilter, status: "rejected" }),
      ServiceRequest.countDocuments(baseFilter),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalComplaints,
        submitted,
        inProgress,
        resolved,
        rejected,
        totalSR,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/admin/complaints/:id/status ───────────────────────────────────
export const updateComplaintStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, note } = req.body as {
      status?: ComplaintStatus;
      note?: string;
    };

    const validStatuses: ComplaintStatus[] = [
      "submitted",
      "acknowledged",
      "in_progress",
      "escalated",
      "resolved",
      "rejected",
    ];

    if (!status || !validStatuses.includes(status)) {
      res
        .status(400)
        .json({ success: false, message: "Invalid status value." });
      return;
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      res.status(404).json({ success: false, message: "Complaint not found." });
      return;
    }

    complaint.status = status;
    if (status === "resolved") complaint.resolvedAt = new Date();

    complaint.statusHistory.push({
      status,
      updatedBy: req.user!.id as unknown as import("mongoose").Types.ObjectId,
      updatedByModel: "Admin",
      note: note ?? "",
      timestamp: new Date(),
    });

    await complaint.save();

    res.status(200).json({
      success: true,
      message: `Complaint status updated to '${status}'.`,
      complaint: { id: complaint._id, status: complaint.status },
    });
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/admin/complaints/:id/priority ─────────────────────────────────
export const escalateComplaintPriority = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { priority } = req.body as { priority?: ComplaintPriority };

    const validPriorities: ComplaintPriority[] = [
      "low",
      "medium",
      "high",
      "critical",
    ];
    if (!priority || !validPriorities.includes(priority)) {
      res
        .status(400)
        .json({ success: false, message: "Invalid priority value." });
      return;
    }

    const complaint = await Complaint.findByIdAndUpdate(
      id,
      { priority },
      { new: true, runValidators: true },
    ).lean();

    if (!complaint) {
      res.status(404).json({ success: false, message: "Complaint not found." });
      return;
    }

    res
      .status(200)
      .json({ success: true, message: "Priority updated.", complaint });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/admin/service-requests ─────────────────────────────────────────
export const getAdminServiceRequests = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { status, search } = req.query as Record<string, string>;
    const districtId = req.user!.districtId;
    const page = getPage(req);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};
    if (districtId) filter.district = districtId;
    if (status && status !== "all") filter.status = status;
    if (search) {
      filter.$or = [
        { referenceNumber: new RegExp(search, "i") },
        { applicantName: new RegExp(search, "i") },
        { serviceType: new RegExp(search, "i") },
      ];
    }

    const [serviceRequests, total] = await Promise.all([
      ServiceRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .populate("userId", "name mobile")
        .populate("department", "name code")
        .lean(),
      ServiceRequest.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      serviceRequests,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total,
        pages: Math.ceil(total / PAGE_SIZE),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/admin/service-requests/:id/status ────────────────────────────
export const updateServiceRequestStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, note, estimatedCompletionDate } = req.body as {
      status?: ServiceRequestStatus;
      note?: string;
      estimatedCompletionDate?: string;
    };

    const validStatuses: ServiceRequestStatus[] = [
      "submitted",
      "under_review",
      "approved",
      "rejected",
      "processing",
      "completed",
    ];

    if (!status || !validStatuses.includes(status)) {
      res
        .status(400)
        .json({ success: false, message: "Invalid status value." });
      return;
    }

    const sr = await ServiceRequest.findById(id);
    if (!sr) {
      res
        .status(404)
        .json({ success: false, message: "Service request not found." });
      return;
    }

    sr.status = status;
    if (status === "completed") sr.completedAt = new Date();
    if (estimatedCompletionDate)
      sr.estimatedCompletionDate = new Date(estimatedCompletionDate);

    sr.statusHistory.push({
      status,
      updatedBy: req.user!.id as unknown as import("mongoose").Types.ObjectId,
      note: note ?? "",
      timestamp: new Date(),
    });

    await sr.save();

    res.status(200).json({
      success: true,
      message: `Service request status updated to '${status}'.`,
      serviceRequest: { id: sr._id, status: sr.status },
    });
  } catch (err) {
    next(err);
  }
};
