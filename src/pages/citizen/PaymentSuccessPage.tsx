import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, Download, MessageSquare, Home } from "lucide-react";
import { useTranslation } from "../../lib/i18n";
import type { Bill } from "../../data/dummyData";

export default function PaymentSuccessPage() {
  const { state } = useLocation();
  const bill = (state as { bill?: Bill })?.bill;
  const { t } = useTranslation();
  const navigate = useNavigate();
  const txnId = `TXN${Date.now().toString().slice(-10)}`;

  return (
    <div className="min-h-screen bg-[#EEF0FB] flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}
        className="mb-6"
      >
        <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle size={52} className="text-green-500" />
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center mb-8"
      >
        <h1 className="text-2xl font-bold text-gray-800 font-display mb-1">
          {t("paymentSuccess")}
        </h1>
        <p className="text-gray-500">
          Your payment has been processed successfully.
        </p>
      </motion.div>

      {/* Receipt */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-5 mb-6"
      >
        {[
          [t("transactionId"), txnId],
          ["Service", bill ? `${bill.category} Bill` : "Utility Bill"],
          ["Amount", bill ? `₹${bill.amount.toLocaleString("en-IN")}` : "—"],
          [
            "Date",
            new Date().toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }),
          ],
          ["Status", "✅ Paid"],
        ].map(([label, val]) => (
          <div
            key={label}
            className="flex justify-between py-2 border-b border-gray-50 text-sm last:border-0"
          >
            <span className="text-gray-500">{label}</span>
            <span className="font-semibold text-gray-800">{val}</span>
          </div>
        ))}
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-sm space-y-3"
      >
        <button className="w-full py-3 rounded-xl border-2 border-[#1E3A5F] text-[#1E3A5F] font-semibold flex items-center gap-2 justify-center hover:bg-blue-50 transition-colors">
          <Download size={18} /> {t("downloadReceipt")}
        </button>
        <button className="w-full py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold flex items-center gap-2 justify-center hover:bg-gray-50 transition-colors">
          <MessageSquare size={18} /> {t("sendSms")}
        </button>
        <button
          onClick={() => navigate("/citizen")}
          className="w-full py-3 rounded-xl bg-[#1E3A5F] text-white font-semibold flex items-center gap-2 justify-center hover:bg-[#163050] transition-colors"
        >
          <Home size={18} /> {t("goHome")}
        </button>
      </motion.div>
    </div>
  );
}
