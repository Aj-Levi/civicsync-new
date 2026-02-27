import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  LogOut,
} from "lucide-react";
import { useSessionStore } from "../../store/sessionStore";
import { useTranslation } from "../../lib/i18n";

export default function ProfilePage() {
  const { user, logout } = useSessionStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#EEF0FB] px-4 py-4">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate(-1)} className="text-gray-600">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-gray-800">{t("myProfile")}</h1>
      </div>

      {/* Avatar */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center mb-6"
      >
        <div className="w-20 h-20 rounded-full bg-[#1E3A5F] flex items-center justify-center mx-auto mb-3 shadow-lg">
          <User size={36} className="text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">
          {user?.name ?? "Citizen"}
        </h2>
        <p className="text-sm text-gray-500">{user?.mobile ?? ""}</p>
      </motion.div>

      {/* Account Details */}
      <motion.div
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4"
      >
        <div className="px-4 py-3 border-b border-gray-50">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
            {t("accountDetails")}
          </p>
        </div>
        {[
          { icon: User, label: "Full Name", val: user?.name },
          { icon: Phone, label: "Mobile", val: user?.mobile },
          { icon: Mail, label: "Email", val: user?.email },
          { icon: MapPin, label: "District", val: user?.district },
          { icon: Calendar, label: "Registered", val: "01 Mar 2024" },
        ].map(({ icon: Icon, label, val }) => (
          <div
            key={label}
            className="flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0"
          >
            <Icon size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[11px] text-gray-400">{label}</p>
              <p className="text-sm font-medium text-gray-800">{val ?? "—"}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Session Info */}
      <motion.div
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="bg-white rounded-2xl shadow-sm p-4 mb-5"
      >
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
          {t("sessionInfo")}
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Session started</span>
            <span className="font-medium text-gray-800">
              {new Date().toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Session timeout</span>
            <span className="font-medium text-gray-800">
              60 seconds of inactivity
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Role</span>
            <span className="font-medium text-green-600 capitalize">
              Citizen
            </span>
          </div>
        </div>
      </motion.div>

      <button
        onClick={handleLogout}
        className="w-full py-3.5 rounded-xl bg-red-50 text-red-600 font-bold text-base flex items-center gap-2 justify-center border-2 border-red-100 hover:bg-red-100 transition-colors btn-touch"
      >
        <LogOut size={18} /> {t("logout")}
      </button>
    </div>
  );
}
