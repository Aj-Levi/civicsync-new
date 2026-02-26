import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Search,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { useTranslation } from "../../lib/i18n";
import * as api from "../../lib/api";
import type { CitizenServiceRequest } from "../../lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Complaint {
  _id: string;
  referenceNumber: string;
  category: string;
  description: string;
  status: string;
  urgency: string;
  createdAt: string;
  resolvedAt?: string;
  department: { name: string; code: string };
  district: { name: string; state: string };
  address: { street: string; city: string; state: string; pincode: string };
  statusHistory: { status: string; note: string; timestamp: string }[];
}

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  string,
  { label: string; badge: string; icon: React.ElementType; dot: string }
> = {
  submitted: {
    label: "Submitted",
    badge: "bg-yellow-100 text-yellow-700",
    icon: Clock,
    dot: "bg-yellow-400",
  },
  acknowledged: {
    label: "Acknowledged",
    badge: "bg-blue-100 text-blue-700",
    icon: RefreshCw,
    dot: "bg-blue-400",
  },
  in_progress: {
    label: "In Progress",
    badge: "bg-indigo-100 text-indigo-700",
    icon: RefreshCw,
    dot: "bg-indigo-400",
  },
  escalated: {
    label: "Escalated",
    badge: "bg-orange-100 text-orange-700",
    icon: AlertTriangle,
    dot: "bg-orange-400",
  },
  resolved: {
    label: "Resolved",
    badge: "bg-green-100 text-green-700",
    icon: CheckCircle2,
    dot: "bg-green-500",
  },
  rejected: {
    label: "Rejected",
    badge: "bg-red-100 text-red-700",
    icon: XCircle,
    dot: "bg-red-400",
  },
  under_review: {
    label: "Under Review",
    badge: "bg-blue-100 text-blue-700",
    icon: RefreshCw,
    dot: "bg-blue-400",
  },
  approved: {
    label: "Approved",
    badge: "bg-green-100 text-green-700",
    icon: CheckCircle2,
    dot: "bg-green-500",
  },
  processing: {
    label: "Processing",
    badge: "bg-indigo-100 text-indigo-700",
    icon: RefreshCw,
    dot: "bg-indigo-400",
  },
  completed: {
    label: "Completed",
    badge: "bg-emerald-100 text-emerald-700",
    icon: CheckCircle2,
    dot: "bg-emerald-500",
  },
};

const URGENCY_COLOR: Record<string, string> = {
  low: "text-green-600",
  medium: "text-yellow-600",
  high: "text-red-600",
};

const SERVICE_ICONS: Record<string, string> = {
  electricity: "⚡",
  water: "💧",
  gas: "🔥",
  sanitation: "🚽",
  waste_management: "♻️",
};

// ── Shared sub-components ─────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    badge: "bg-gray-100 text-gray-600",
  };
  return (
    <span
      className={`text-[11px] px-2 py-1 rounded-full font-semibold ${cfg.badge}`}
    >
      {cfg.label}
    </span>
  );
}

function StatusTimeline({
  history,
}: {
  history: { status: string; note: string; timestamp: string }[];
}) {
  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <p className="text-[11px] font-semibold text-gray-400 uppercase mb-2">
        Status History
      </p>
      <div className="flex flex-col gap-2">
        {[...history].reverse().map((h, idx) => {
          const cfg = STATUS_CONFIG[h.status];
          return (
            <div key={idx} className="flex items-start gap-2.5">
              <div
                className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${cfg?.dot ?? "bg-gray-300"}`}
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700">
                    {cfg?.label ?? h.status}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(h.timestamp).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
                {h.note && (
                  <p className="text-[11px] text-gray-500 mt-0.5">{h.note}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Complaint Card ────────────────────────────────────────────────────────────
function ComplaintCard({
  c,
  index,
  expanded,
  onToggle,
}: {
  c: Complaint;
  index: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="bg-white rounded-2xl shadow-sm overflow-hidden"
    >
      <button onClick={onToggle} className="w-full text-left p-4">
        <div className="flex items-start justify-between mb-1.5">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 text-sm leading-tight">
              {c.department?.name} — {c.category}
            </p>
            <p className="text-xs text-gray-400 font-mono mt-0.5">
              {c.referenceNumber}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-2 shrink-0">
            <StatusBadge status={c.status} />
            {expanded ? (
              <ChevronUp size={14} className="text-gray-400" />
            ) : (
              <ChevronDown size={14} className="text-gray-400" />
            )}
          </div>
        </div>
        <p className="text-xs text-gray-500 line-clamp-1">{c.description}</p>
        <div className="flex justify-between mt-2 text-[11px] text-gray-400">
          <span>
            {c.address?.city}, {c.address?.state}
          </span>
          <span className="flex items-center gap-2">
            <span
              className={`font-semibold capitalize ${URGENCY_COLOR[c.urgency] ?? ""}`}
            >
              {c.urgency} urgency
            </span>
            <span>·</span>
            <span>
              {new Date(c.createdAt).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          </span>
        </div>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden px-4 pb-4"
          >
            <p className="text-xs text-gray-600 leading-relaxed mb-2">
              <strong className="text-gray-700">Description: </strong>
              {c.description}
            </p>
            {c.resolvedAt && (
              <p className="text-xs text-green-600 mb-2">
                ✓ Resolved on{" "}
                {new Date(c.resolvedAt).toLocaleDateString("en-IN")}
              </p>
            )}
            {c.statusHistory?.length > 0 && (
              <StatusTimeline history={c.statusHistory} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Service Request Card ──────────────────────────────────────────────────────
function ServiceRequestCard({
  sr,
  index,
  expanded,
  onToggle,
}: {
  sr: CitizenServiceRequest;
  index: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="bg-white rounded-2xl shadow-sm overflow-hidden"
    >
      <button onClick={onToggle} className="w-full text-left p-4">
        <div className="flex items-start justify-between mb-1.5">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 text-sm leading-tight">
              {SERVICE_ICONS[sr.serviceType] ?? ""} {sr.department?.name} —{" "}
              {sr.requestType.replace(/_/g, " ")}
            </p>
            <p className="text-xs text-gray-400 font-mono mt-0.5">
              {sr.referenceNumber}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-2 shrink-0">
            <StatusBadge status={sr.status} />
            {expanded ? (
              <ChevronUp size={14} className="text-gray-400" />
            ) : (
              <ChevronDown size={14} className="text-gray-400" />
            )}
          </div>
        </div>
        <div className="flex justify-between mt-1 text-[11px] text-gray-400">
          <span>
            {sr.address?.city}, {sr.address?.state}
          </span>
          <span>
            Applied:{" "}
            {new Date(sr.createdAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
        {sr.estimatedCompletionDate && (
          <p className="text-[11px] text-blue-500 mt-1">
            Est. completion:{" "}
            {new Date(sr.estimatedCompletionDate).toLocaleDateString("en-IN")}
          </p>
        )}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden px-4 pb-4"
          >
            {sr.completedAt && (
              <p className="text-xs text-emerald-600 mb-2">
                ✓ Completed on{" "}
                {new Date(sr.completedAt).toLocaleDateString("en-IN")}
              </p>
            )}
            {sr.statusHistory?.length > 0 && (
              <StatusTimeline history={sr.statusHistory} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function TrackStatusPage() {
  const [tab, setTab] = useState<"complaints" | "requests" | "payments">(
    "complaints",
  );
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [srs, setSrs] = useState<CitizenServiceRequest[]>([]);
  const [loadingC, setLoadingC] = useState(false);
  const [loadingSR, setLoadingSR] = useState(false);
  const [srLoaded, setSrLoaded] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Ref-number search (complaints only)
  const [searchRef, setSearchRef] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<Complaint | null>(null);
  const [searchError, setSearchError] = useState("");

  const { t } = useTranslation();
  const navigate = useNavigate();

  // Load complaints on mount
  useEffect(() => {
    const load = async () => {
      setLoadingC(true);
      try {
        const res = await api.getMyComplaints();
        setComplaints(res.complaints as Complaint[]);
      } catch {
        /* noop */
      } finally {
        setLoadingC(false);
      }
    };
    void load();
  }, []);

  // Load service requests when Requests tab is first opened
  useEffect(() => {
    if (tab !== "requests" || srLoaded) return;
    const load = async () => {
      setLoadingSR(true);
      try {
        const res = await api.getMyServiceRequests();
        setSrs(res.serviceRequests);
      } catch {
        /* noop */
      } finally {
        setLoadingSR(false);
        setSrLoaded(true);
      }
    };
    void load();
  }, [tab, srLoaded]);

  const handleSearch = async () => {
    if (!searchRef.trim()) return;
    setSearching(true);
    setSearchResult(null);
    setSearchError("");
    try {
      const res = await api.getComplaintByRef(searchRef.trim().toUpperCase());
      setSearchResult(res.complaint as Complaint);
    } catch (err) {
      setSearchError(
        err instanceof Error ? err.message : "Complaint not found.",
      );
    } finally {
      setSearching(false);
    }
  };

  const toggle = (id: string) =>
    setExpanded((prev) => (prev === id ? null : id));
  const displayComplaints = searchResult ? [searchResult] : complaints;

  return (
    <div className="min-h-screen bg-[#EEF0FB] px-4 py-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="text-gray-600">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-gray-800">{t("trackStatus")}</h1>
      </div>

      {/* Reference number search */}
      <div className="bg-white rounded-2xl shadow-sm p-3 mb-4 flex gap-2">
        <input
          value={searchRef}
          onChange={(e) => {
            setSearchRef(e.target.value);
            setSearchResult(null);
            setSearchError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search by complaint ref (e.g. COMP-20260226-00001)"
          className="flex-1 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        <button
          onClick={handleSearch}
          disabled={searching || !searchRef.trim()}
          className="bg-[#1E3A5F] text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50"
        >
          {searching ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Search size={15} />
          )}
          Search
        </button>
        {searchResult && (
          <button
            onClick={() => {
              setSearchResult(null);
              setSearchRef("");
            }}
            className="text-xs text-gray-400 hover:text-gray-600 px-2"
          >
            Clear
          </button>
        )}
      </div>
      {searchError && (
        <p className="text-red-500 text-xs text-center mb-3">{searchError}</p>
      )}

      {/* Tabs */}
      {!searchResult && (
        <div className="flex gap-1 bg-white rounded-2xl p-1 mb-5 shadow-sm">
          {(["complaints", "requests", "payments"] as const).map((t_) => (
            <button
              key={t_}
              onClick={() => {
                setTab(t_);
                setExpanded(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${tab === t_ ? "bg-[#1E3A5F] text-white shadow" : "text-gray-500"}`}
            >
              {t_ === "complaints"
                ? `Complaints${complaints.length > 0 ? ` (${complaints.length})` : ""}`
                : t_ === "requests"
                  ? `Requests${srs.length > 0 ? ` (${srs.length})` : ""}`
                  : "Payments"}
            </button>
          ))}
        </div>
      )}

      {/* Complaints tab */}
      {(tab === "complaints" || searchResult) && (
        <div className="space-y-3">
          {loadingC ? (
            <div className="flex items-center justify-center gap-2 text-gray-400 py-12">
              <Loader2 size={18} className="animate-spin" /> Loading your
              complaints…
            </div>
          ) : displayComplaints.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm">No complaints filed yet.</p>
              <button
                onClick={() => navigate("/citizen/complaint/new")}
                className="mt-3 text-xs text-[#1E3A5F] font-semibold underline"
              >
                Register your first complaint →
              </button>
            </div>
          ) : (
            displayComplaints.map((c, i) => (
              <ComplaintCard
                key={c._id}
                c={c}
                index={i}
                expanded={expanded === c._id}
                onToggle={() => toggle(c._id)}
              />
            ))
          )}
        </div>
      )}

      {/* Service Requests tab */}
      {tab === "requests" && !searchResult && (
        <div className="space-y-3">
          {loadingSR ? (
            <div className="flex items-center justify-center gap-2 text-gray-400 py-12">
              <Loader2 size={18} className="animate-spin" /> Loading your
              requests…
            </div>
          ) : srs.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm">No service requests submitted yet.</p>
              <button
                onClick={() => navigate("/citizen/service/new")}
                className="mt-3 text-xs text-[#1E3A5F] font-semibold underline"
              >
                Submit a new connection request →
              </button>
            </div>
          ) : (
            srs.map((sr, i) => (
              <ServiceRequestCard
                key={sr._id}
                sr={sr}
                index={i}
                expanded={expanded === sr._id}
                onToggle={() => toggle(sr._id)}
              />
            ))
          )}
        </div>
      )}

      {/* Payments tab */}
      {tab === "payments" && !searchResult && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm">Payment history coming soon.</p>
        </div>
      )}
    </div>
  );
}
