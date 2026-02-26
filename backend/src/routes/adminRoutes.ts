import { Router } from "express";
import { authGuard } from "../middleware/authGuard";
import { roleGuard } from "../middleware/roleGuard";
import {
  getAdminComplaints,
  getAdminStats,
  updateComplaintStatus,
  escalateComplaintPriority,
  getAdminServiceRequests,
  updateServiceRequestStatus,
} from "../controllers/adminController";

const router = Router();

// All admin routes require authentication + admin role
router.use(authGuard, roleGuard("admin", "superadmin"));

// ── Dashboard stats ────────────────────────────────────────────────────────────
router.get("/stats", getAdminStats);

// ── Complaints ─────────────────────────────────────────────────────────────────
router.get("/complaints", getAdminComplaints);
router.patch("/complaints/:id/status", updateComplaintStatus);
router.patch("/complaints/:id/priority", escalateComplaintPriority);

// ── Service requests ───────────────────────────────────────────────────────────
router.get("/service-requests", getAdminServiceRequests);
router.patch("/service-requests/:id/status", updateServiceRequestStatus);

export default router;
