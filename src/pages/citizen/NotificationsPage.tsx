import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Bell, Megaphone, AlertTriangle, Clock } from "lucide-react";
import { useNotificationStore } from "../../store/notificationStore";
import { useTranslation } from "../../lib/i18n";
import type { NotifType } from "../../data/dummyData";

const notifConfig: Record<
  NotifType,
  {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    bg: string;
    text: string;
  }
> = {
  announcement: { icon: Megaphone, bg: "bg-blue-50", text: "text-blue-600" },
  outage: { icon: AlertTriangle, bg: "bg-red-50", text: "text-red-600" },
  reminder: { icon: Clock, bg: "bg-orange-50", text: "text-orange-600" },
  emergency: { icon: Bell, bg: "bg-red-100", text: "text-red-700" },
};

export default function NotificationsPage() {
  const { notifications, markAllRead, markRead } = useNotificationStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#EEF0FB] px-4 py-4">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-600">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-xl font-bold text-gray-800">
            {t("notifications")}
          </h1>
        </div>
        <button
          onClick={markAllRead}
          className="text-xs text-blue-600 font-semibold hover:underline"
        >
          {t("markAllRead")}
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Bell size={40} className="mx-auto mb-3 opacity-30" />
          <p>{t("noNotifications")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n, i) => {
            const { icon: Icon, bg, text } = notifConfig[n.type];
            return (
              <motion.button
                key={n.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => markRead(n.id)}
                className={`w-full bg-white rounded-2xl p-4 shadow-sm text-left flex gap-3 ${!n.read ? "ring-2 ring-blue-100" : ""}`}
              >
                <div
                  className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0 mt-0.5`}
                >
                  <Icon size={18} className={text} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-sm font-semibold ${n.read ? "text-gray-700" : "text-gray-900"}`}
                    >
                      {n.title}
                    </p>
                    {!n.read && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed mt-0.5">
                    {n.body}
                  </p>
                  <p className="text-[10px] text-gray-300 mt-1.5">{n.date}</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
