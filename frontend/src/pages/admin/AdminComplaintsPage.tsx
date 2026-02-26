import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter } from "lucide-react";
import { useCivicStore } from "../../store/civicStore";
import type { ComplaintStatus } from "../../data/dummyData";

const statusClasses: Record<string, string> = {
  pending: "badge-pending",
  in_progress: "badge-progress",
  resolved: "badge-resolved",
  rejected: "badge-rejected",
};

const ACTION_STATUSES: {
  label: string;
  value: ComplaintStatus;
  color: string;
}[] = [
  { label: "Approve", value: "in_progress", color: "bg-blue-600" },
  { label: "Resolve", value: "resolved", color: "bg-green-600" },
  { label: "Reject", value: "rejected", color: "bg-red-600" },
];

export default function AdminComplaintsPage() {
  const { complaints, updateComplaintStatus } = useCivicStore();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = complaints.filter((c) => {
    const matchSearch =
      search === "" ||
      c.refNo.toLowerCase().includes(search.toLowerCase()) ||
      c.citizen.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6 min-h-screen bg-gray-100">
      <h1 className="text-2xl font-bold text-gray-800 font-display mb-5">
        All Complaints
      </h1>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ref, citizen, category..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div className="flex items-center gap-1">
          <Filter size={15} className="text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-200 bg-white rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="text-sm text-gray-400 flex items-center">
          {filtered.length} results
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-400 font-semibold uppercase">
                {[
                  "Ref No",
                  "Citizen / Phone",
                  "Category",
                  "Area",
                  "Date",
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
              {filtered.map((c, i) => (
                <>
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                    className="border-t border-gray-50 hover:bg-blue-50/30 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">
                      {c.refNo}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800 text-xs">
                        {c.citizen}
                      </p>
                      <p className="text-gray-400 text-[11px]">{c.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {c.category}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-[150px] truncate">
                      {c.area}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {c.date}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[11px] px-2 py-1 rounded-full font-semibold ${statusClasses[c.status] ?? "badge-pending"}`}
                      >
                        {c.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {ACTION_STATUSES.map(({ label, value, color }) => (
                          <button
                            key={value}
                            onClick={(e) => {
                              e.stopPropagation();
                              updateComplaintStatus(c.id, value);
                            }}
                            className={`${color} text-white text-[10px] font-semibold px-2 py-1 rounded-lg hover:opacity-80 transition-opacity`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </motion.tr>
                  {expanded === c.id && (
                    <tr key={`${c.id}-exp`} className="bg-blue-50/40">
                      <td colSpan={7} className="px-6 py-4">
                        <p className="text-sm text-gray-700 mb-1">
                          <strong>Description:</strong> {c.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          <strong>Est. Resolution:</strong>{" "}
                          {c.estimatedResolution}
                        </p>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            No complaints match your search.
          </div>
        )}
      </div>
    </div>
  );
}
