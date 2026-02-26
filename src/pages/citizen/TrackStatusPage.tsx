import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useCivicStore } from "../../store/civicStore";
import { dummyBills } from "../../data/dummyData";
import { useTranslation } from "../../lib/i18n";

const statusClasses: Record<string, string> = {
  pending: "badge-pending",
  in_progress: "badge-progress",
  resolved: "badge-resolved",
  rejected: "badge-rejected",
  under_review: "badge-progress",
  approved: "badge-resolved",
  paid: "badge-resolved",
  overdue: "badge-rejected",
};

const statusLabel: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  resolved: "Resolved",
  rejected: "Rejected",
  under_review: "Under Review",
  approved: "Approved",
  paid: "Paid",
  overdue: "Overdue",
};

export default function TrackStatusPage() {
  const [tab, setTab] = useState<"complaints" | "requests" | "payments">(
    "complaints",
  );
  const { complaints, serviceRequests } = useCivicStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Only show complaints/requests for the demo user
  const myComplaints = complaints.slice(0, 4);
  const myRequests = serviceRequests;

  return (
    <div className="min-h-screen bg-[#EEF0FB] px-4 py-4">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="text-gray-600">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-gray-800">{t("trackStatus")}</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl p-1 mb-5 shadow-sm">
        {(["complaints", "requests", "payments"] as const).map((t_) => (
          <button
            key={t_}
            onClick={() => setTab(t_)}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${tab === t_ ? "bg-[#1E3A5F] text-white shadow" : "text-gray-500"}`}
          >
            {t_ === "complaints"
              ? "Complaints"
              : t_ === "requests"
                ? "Requests"
                : "Payments"}
          </button>
        ))}
      </div>

      {tab === "complaints" && (
        <div className="space-y-3">
          {myComplaints.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="bg-white rounded-2xl p-4 shadow-sm"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-800 text-sm">
                    {c.category}
                  </p>
                  <p className="text-xs text-gray-400 font-mono">{c.refNo}</p>
                </div>
                <span
                  className={`text-[11px] px-2 py-1 rounded-full font-semibold ${statusClasses[c.status]}`}
                >
                  {statusLabel[c.status]}
                </span>
              </div>
              <p className="text-xs text-gray-500 truncate">{c.description}</p>
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>{c.area}</span>
                <span>{c.date}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {tab === "requests" && (
        <div className="space-y-3">
          {myRequests.map((sr, i) => (
            <motion.div
              key={sr.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="bg-white rounded-2xl p-4 shadow-sm"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-800 text-sm capitalize">
                    {sr.serviceType} Connection
                  </p>
                  <p className="text-xs text-gray-400 font-mono">{sr.refNo}</p>
                </div>
                <span
                  className={`text-[11px] px-2 py-1 rounded-full font-semibold ${statusClasses[sr.status]}`}
                >
                  {statusLabel[sr.status]}
                </span>
              </div>
              <p className="text-xs text-gray-500">{sr.address}</p>
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>Applied: {sr.date}</span>
                <span>Est: {sr.estimatedCompletion}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {tab === "payments" && (
        <div className="space-y-3">
          {dummyBills.map((b, i) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between"
            >
              <div>
                <p className="font-semibold text-gray-800 capitalize text-sm">
                  {b.category} Bill
                </p>
                <p className="text-xs text-gray-400">
                  {b.billingPeriod} · {b.consumerNo}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-800">
                  ₹{b.amount.toLocaleString("en-IN")}
                </p>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${statusClasses[b.status]}`}
                >
                  {statusLabel[b.status]}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
