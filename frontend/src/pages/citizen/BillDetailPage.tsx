import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Zap, Droplets, Flame, Trash2 } from "lucide-react";
import { dummyBills } from "../../data/dummyData";
import { useTranslation } from "../../lib/i18n";

const catIcon = {
  electricity: Zap,
  water: Droplets,
  gas: Flame,
  waste: Trash2,
};
const banks = [
  "Punjab National Bank",
  "State Bank of India",
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
];

export default function BillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [method, setMethod] = useState<"upi" | "card" | "netbanking">("upi");
  const [upiId, setUpiId] = useState("");
  const [cardNo, setCardNo] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [bank, setBank] = useState(banks[0]);

  const bill = dummyBills.find((b) => b.id === id) ?? dummyBills[0];
  const Icon = catIcon[bill.category];

  const handlePay = () =>
    navigate("/citizen/bills/success", { state: { bill, method } });

  return (
    <div className="min-h-screen bg-[#EEF0FB] px-4 py-4">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="text-gray-600">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-gray-800">
          {t("billBreakdown")}
        </h1>
      </div>

      {/* Bill Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-5 shadow-sm mb-4"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center">
            <Icon size={24} className="text-yellow-600" />
          </div>
          <div>
            <p className="font-bold text-gray-800 capitalize">
              {t(bill.category)} Bill
            </p>
            <p className="text-xs text-gray-400">
              {bill.billingPeriod} · {bill.consumerNo}
            </p>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          {[
            [t("previousBalance"), `₹${bill.previousBalance}`],
            [t("currentCharges"), `₹${bill.currentCharges}`],
            [t("taxes"), `₹${bill.taxes}`],
          ].map(([label, val]) => (
            <div key={label} className="flex justify-between text-gray-600">
              <span>{label}</span>
              <span>{val}</span>
            </div>
          ))}
          <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-base text-gray-800">
            <span>{t("totalAmount")}</span>
            <span className="text-[#1E3A5F]">
              ₹{bill.amount.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Payment Method */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-5 shadow-sm mb-4"
      >
        <h2 className="font-bold text-gray-800 mb-3">{t("choosePayment")}</h2>
        <div className="flex gap-2 mb-4">
          {(["upi", "card", "netbanking"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                method === m
                  ? "border-[#1E3A5F] text-[#1E3A5F] bg-blue-50"
                  : "border-gray-200 text-gray-500"
              }`}
            >
              {m === "upi" ? t("upi") : m === "card" ? "Card" : "Net Banking"}
            </button>
          ))}
        </div>

        {method === "upi" && (
          <div>
            <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-center mb-3">
              {/* QR Code simulation */}
              <div className="text-center">
                <div className="w-32 h-32 mx-auto rounded-lg bg-white border border-gray-200 p-1 grid grid-cols-5 gap-0.5">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-sm ${Math.random() > 0.5 ? "bg-gray-800" : "bg-white"}`}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">civicsync@upi</p>
              </div>
            </div>
            <p className="text-center text-xs text-gray-400 mb-3">{t("or")}</p>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              {t("upiId")}
            </label>
            <input
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="phone@upi"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
        )}

        {method === "card" && (
          <div className="space-y-3">
            {[
              [t("cardNumber"), cardNo, setCardNo, "1234 5678 9012 3456"],
              [t("cardHolderName"), cardName, setCardName, "Full Name"],
            ].map(([label, val, setter, ph]) => (
              <div key={String(label)}>
                <label className="text-xs font-medium text-gray-600 block mb-1">
                  {String(label)}
                </label>
                <input
                  value={String(val)}
                  onChange={(e) =>
                    (setter as (v: string) => void)(e.target.value)
                  }
                  placeholder={String(ph)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            ))}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-medium text-gray-600 block mb-1">
                  {t("expiryDate")}
                </label>
                <input
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  placeholder="MM/YY"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium text-gray-600 block mb-1">
                  {t("cvv")}
                </label>
                <input
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  placeholder="•••"
                  maxLength={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>
          </div>
        )}

        {method === "netbanking" && (
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-2">
              {t("selectBank")}
            </label>
            <div className="space-y-2">
              {banks.map((b) => (
                <button
                  key={b}
                  onClick={() => setBank(b)}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${bank === b ? "border-[#1E3A5F] text-[#1E3A5F] bg-blue-50" : "border-gray-200 text-gray-700"}`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      <button
        onClick={handlePay}
        className="w-full py-4 rounded-2xl bg-[#16A34A] text-white font-bold text-base shadow-md hover:bg-green-700 transition-colors btn-touch mb-4"
      >
        {t("payBtn")} ₹{bill.amount.toLocaleString("en-IN")}
      </button>
    </div>
  );
}
