import { useState } from "react";
import { motion } from "framer-motion";
import { useCivicStore } from "../../store/civicStore";
import type { SRStatus } from "../../data/dummyData";

const statusClasses: Record<string, string> = {
  pending: "badge-pending",
  under_review: "badge-progress",
  approved: "badge-resolved",
  rejected: "badge-rejected",
};

const ACTION_STATUSES: { label: string; value: SRStatus; color: string }[] = [
  { label: "Review", value: "under_review", color: "bg-blue-600" },
  { label: "Approve", value: "approved", color: "bg-green-600" },
  { label: "Reject", value: "rejected", color: "bg-red-600" },
];

export default function AdminServiceRequestsPage() {
  const { serviceRequests, updateSRStatus } = useCivicStore();
  const [search, setSearch] = useState("");

  const filtered = serviceRequests.filter(
    (sr) =>
      search === "" ||
      sr.refNo.toLowerCase().includes(search.toLowerCase()) ||
      sr.applicantName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-6 min-h-screen bg-gray-100">
      <h1 className="text-2xl font-bold text-gray-800 font-display mb-5">
        Service Requests
      </h1>

      <div className="mb-5">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by ref no or applicant..."
          className="w-full max-w-sm border border-gray-200 bg-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-400 font-semibold uppercase">
                {[
                  "Ref No",
                  "Applicant",
                  "Service Type",
                  "Address",
                  "Applied",
                  "Est. Completion",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th key={h} className="text-left px-4 py-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((sr, i) => (
                <motion.tr
                  key={sr.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.06 }}
                  className="border-t border-gray-50 hover:bg-blue-50/20 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">
                    {sr.refNo}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">
                      {sr.applicantName}
                    </p>
                    <p className="text-gray-400 text-xs">{sr.phone}</p>
                  </td>
                  <td className="px-4 py-3 capitalize font-medium text-gray-700">
                    {sr.serviceType} Connection
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-[160px] truncate">
                    {sr.address}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{sr.date}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {sr.estimatedCompletion}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[11px] px-2 py-1 rounded-full font-semibold ${statusClasses[sr.status] ?? "badge-pending"}`}
                    >
                      {sr.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {ACTION_STATUSES.map(({ label, value, color }) => (
                        <button
                          key={value}
                          onClick={() => updateSRStatus(sr.id, value)}
                          className={`${color} text-white text-[10px] font-semibold px-2 py-1 rounded-lg hover:opacity-80 transition-opacity`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            No service requests found.
          </div>
        )}
      </div>
    </div>
  );
}
