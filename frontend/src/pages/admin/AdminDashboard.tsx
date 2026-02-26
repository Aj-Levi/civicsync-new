import { useCivicStore } from "../../store/civicStore";
import { useNotificationStore } from "../../store/notificationStore";
import { motion } from "framer-motion";
import { FileText, Clock, CheckCircle, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const { complaints, serviceRequests } = useCivicStore();
  const { unreadCount } = useNotificationStore();
  const navigate = useNavigate();

  const stats = [
    {
      label: "Total Complaints",
      val: complaints.length,
      icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Pending",
      val: complaints.filter((c) => c.status === "pending").length,
      icon: Clock,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
    },
    {
      label: "Resolved",
      val: complaints.filter((c) => c.status === "resolved").length,
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Service Requests",
      val: serviceRequests.length,
      icon: Settings,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  const statusClasses: Record<string, string> = {
    pending: "badge-pending",
    in_progress: "badge-progress",
    resolved: "badge-resolved",
    rejected: "badge-rejected",
  };
  const statusLabel: Record<string, string> = {
    pending: "Pending",
    in_progress: "In Progress",
    resolved: "Resolved",
    rejected: "Rejected",
  };

  const recent5 = complaints.slice(0, 5);

  // Simple category bar chart data
  const categories = [
    "Water Leakage",
    "Power Outage",
    "Road Damage",
    "Garbage Collection",
    "Streetlight",
  ];
  const catCounts = categories.map(
    (cat) => complaints.filter((c) => c.category === cat).length,
  );
  const maxCat = Math.max(...catCounts, 1);

  return (
    <div className="p-6 min-h-screen bg-gray-100">
      <h1 className="text-2xl font-bold text-gray-800 font-display mb-6">
        Admin Dashboard
      </h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map(({ label, val, icon: Icon, color, bg }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-white rounded-2xl p-5 shadow-sm"
          >
            <div
              className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center mb-3`}
            >
              <Icon size={22} className={color} />
            </div>
            <p className="text-3xl font-black text-gray-800">{val}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Category Chart */}
        <div className="col-span-1 bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-gray-700 mb-4 text-sm">
            Complaints by Category
          </h2>
          <div className="space-y-3">
            {categories.map((cat, i) => (
              <div key={cat}>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span className="truncate max-w-[80%]">{cat}</span>
                  <span className="font-semibold text-gray-700">
                    {catCounts[i]}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(catCounts[i] / maxCat) * 100}%` }}
                    transition={{ duration: 0.6, delay: i * 0.1 }}
                    className="h-full bg-[#1E3A5F] rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status Donut */}
        <div className="col-span-1 bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-gray-700 mb-4 text-sm">
            Status Overview
          </h2>
          <div className="space-y-3">
            {[
              {
                label: "Pending",
                count: complaints.filter((c) => c.status === "pending").length,
                color: "bg-yellow-400",
              },
              {
                label: "In Progress",
                count: complaints.filter((c) => c.status === "in_progress")
                  .length,
                color: "bg-blue-400",
              },
              {
                label: "Resolved",
                count: complaints.filter((c) => c.status === "resolved").length,
                color: "bg-green-400",
              },
              {
                label: "Rejected",
                count: complaints.filter((c) => c.status === "rejected").length,
                color: "bg-red-400",
              },
            ].map(({ label, count, color }) => (
              <div key={label} className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${color} flex-shrink-0`}
                />
                <span className="text-xs text-gray-600 flex-1">{label}</span>
                <span className="text-sm font-bold text-gray-800">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="col-span-1 bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-gray-700 mb-4 text-sm">
            Quick Actions
          </h2>
          <div className="space-y-2">
            {[
              {
                label: "View All Complaints",
                to: "/admin/complaints",
                bg: "bg-blue-600",
              },
              {
                label: "Service Requests",
                to: "/admin/requests",
                bg: "bg-purple-600",
              },
              {
                label: "Push Notification",
                to: "/admin/notifications",
                bg: "bg-orange-500",
              },
              {
                label: `Unread Alerts (${unreadCount})`,
                to: "/admin/notifications",
                bg: "bg-red-500",
              },
            ].map(({ label, to, bg }) => (
              <button
                key={label}
                onClick={() => navigate(to)}
                className={`w-full ${bg} text-white text-xs font-semibold py-2 px-3 rounded-xl hover:opacity-90 transition-opacity text-left`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Complaints Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-50">
          <h2 className="font-bold text-gray-700">Recent Complaints</h2>
          <button
            onClick={() => navigate("/admin/complaints")}
            className="text-xs text-blue-600 font-semibold hover:underline"
          >
            View All →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-400 font-semibold uppercase">
                {[
                  "Ref No",
                  "Citizen",
                  "Category",
                  "Area",
                  "Status",
                  "Date",
                ].map((h) => (
                  <th key={h} className="text-left px-5 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent5.map((c, i) => (
                <tr
                  key={c.id}
                  className={`border-t border-gray-50 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? "" : "bg-gray-50/50"}`}
                >
                  <td className="px-5 py-3 font-mono text-xs text-gray-600">
                    {c.refNo}
                  </td>
                  <td className="px-5 py-3 font-medium text-gray-800">
                    {c.citizen}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{c.category}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{c.area}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-[11px] px-2 py-1 rounded-full font-semibold ${statusClasses[c.status] ?? "badge-pending"}`}
                    >
                      {statusLabel[c.status] ?? c.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{c.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
