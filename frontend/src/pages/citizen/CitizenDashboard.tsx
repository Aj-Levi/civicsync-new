import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Zap,
  Droplets,
  Flame,
  Trash2,
  FileText,
  CreditCard,
  PlusCircle,
  Search,
  MapPin,
} from "lucide-react";
import { useTranslation } from "../../lib/i18n";
import { dummyRecentActivity } from "../../data/dummyData";
import { getMyBills, type CitizenBill } from "../../lib/api";

type BillCategory = "electricity" | "water" | "gas" | "waste";

const billConfig: Record<
  BillCategory,
  { icon: React.ComponentType<{ size?: number; className?: string }>; color: string }
> = {
  electricity: { icon: Zap, color: "text-yellow-400" },
  water: { icon: Droplets, color: "text-blue-300" },
  gas: { icon: Flame, color: "text-orange-400" },
  waste: { icon: Trash2, color: "text-green-400" },
};

const services = [
  {
    key: "registerComplaint",
    icon: FileText,
    color: "text-red-500",
    border: "border-red-200",
    bg: "bg-red-50",
    to: "/citizen/complaint/new",
  },
  {
    key: "payBills",
    icon: CreditCard,
    color: "text-blue-600",
    border: "border-blue-200",
    bg: "bg-blue-50",
    to: "/citizen/bills",
  },
  {
    key: "newServiceRequest",
    icon: PlusCircle,
    color: "text-purple-600",
    border: "border-purple-200",
    bg: "bg-purple-50",
    to: "/citizen/service/new",
  },
  {
    key: "trackStatus",
    icon: Search,
    color: "text-green-600",
    border: "border-green-200",
    bg: "bg-green-50",
    to: "/citizen/track",
  },
];

const activityIcon = {
  electricity: Zap,
  water: Droplets,
  gas: Flame,
  complaint: FileText,
  service: PlusCircle,
};

interface DashboardBill {
  id: string;
  category: BillCategory;
  amount: number;
}

const mapDepartmentToCategory = (bill: CitizenBill): BillCategory => {
  const code = bill.department?.code?.toUpperCase() ?? "";
  if (code === "ELEC") return "electricity";
  if (code === "WATER") return "water";
  if (code === "GAS") return "gas";
  return "waste";
};

export default function CitizenDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [bills, setBills] = useState<DashboardBill[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await getMyBills();
        const mapped = res.bills
          .filter((bill) => bill.status !== "paid")
          .slice(0, 4)
          .map((bill) => ({
            id: bill._id,
            category: mapDepartmentToCategory(bill),
            amount: bill.amount,
          }));
        setBills(mapped);
      } catch {
        setBills([]);
      }
    })();
  }, []);

  const visibleBills = useMemo(() => bills, [bills]);

  return (
    <div className="pb-4">
      <div className="bg-[#1E3A5F] px-4 pb-5 pt-2">
        <div className="grid grid-cols-4 gap-2 mt-1">
          {visibleBills.map((bill) => {
            const { icon: Icon, color } = billConfig[bill.category];
            return (
              <motion.button
                key={bill.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/citizen/bills/${bill.id}`)}
                className="bg-white/10 hover:bg-white/20 rounded-2xl p-3 flex flex-col items-center gap-1.5 transition-colors"
              >
                <Icon size={22} className={color} />
                <span className="text-[10px] text-blue-100 capitalize">
                  {t(bill.category)}
                </span>
                <span className="text-sm font-bold text-white">
                  Rs {bill.amount.toLocaleString("en-IN")}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-5">
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-3">{t("civicServices")}</h2>
          <div className="grid grid-cols-2 gap-3">
            {services.map(({ key, icon: Icon, color, border, bg, to }, i) => (
              <motion.button
                key={key}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate(to)}
                className={`bg-white border-2 ${border} rounded-2xl p-4 flex flex-col items-center gap-2 shadow-sm hover:shadow-md transition-shadow`}
              >
                <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center`}>
                  <Icon size={26} className={color} />
                </div>
                <span className={`text-sm font-bold ${color} text-center leading-tight`}>
                  {t(key)}
                </span>
              </motion.button>
            ))}
          </div>
        </section>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/citizen/map")}
          className="w-full bg-[#EA580C] text-white rounded-2xl py-3.5 flex items-center justify-center gap-2.5 font-bold text-base shadow-md shadow-orange-200 hover:bg-orange-700 transition-colors"
        >
          <MapPin size={20} />
          {t("viewComplaintMap")}
        </motion.button>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-3">{t("recentActivity")}</h2>
          <div className="space-y-2">
            {dummyRecentActivity.map((item, i) => {
              const Icon =
                activityIcon[item.icon as keyof typeof activityIcon] ?? FileText;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm"
                >
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                    <Icon size={18} className="text-yellow-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.sub}</p>
                  </div>
                  <span className="text-sm font-bold text-gray-700 flex-shrink-0">
                    {item.amount}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
