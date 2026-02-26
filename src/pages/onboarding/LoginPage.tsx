import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Smartphone, Lock, Eye, EyeOff } from "lucide-react";
import { useSessionStore } from "../../store/sessionStore";
import { useTranslation } from "../../lib/i18n";

export default function LoginPage() {
  const [role, setRole] = useState<"citizen" | "admin">("citizen");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const { loginAdmin, loginGuest } = useSessionStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleCitizenSubmit = () => {
    if (phone.replace(/\D/g, "").length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setError("");
    navigate("/otp", { state: { phone } });
  };

  const handleAdminSubmit = () => {
    setError("");
    const ok = loginAdmin(username, password);
    if (ok) {
      navigate("/admin", { replace: true });
    } else {
      setError("Invalid username or password. Try admin / admin123");
    }
  };

  return (
    <div className="min-h-screen bg-[#EEF0FB] flex flex-col items-center justify-between py-10 px-6">
      {/* Logo */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center"
      >
        <div className="w-20 h-20 rounded-full bg-white shadow-lg border-4 border-blue-100 flex items-center justify-center mx-auto mb-3">
          <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
            <circle cx="24" cy="24" r="18" stroke="#1E3A5F" strokeWidth="2.5" />
            <path
              d="M16 20c0-4.4 3.6-8 8-8s8 3.6 8 8"
              stroke="#16A34A"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="24" cy="20" r="3" fill="#EA580C" />
            <path
              d="M12 36c0-6.6 5.4-12 12-12s12 5.4 12 12"
              stroke="#1E3A5F"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-black text-[#1E3A5F] font-display">
          CivicSync
        </h1>
        <p className="text-sm text-gray-500">Smart Interactive Kiosk</p>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-7"
      >
        {/* Role icon */}
        <div className="flex justify-center mb-5">
          <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
            {role === "citizen" ? (
              <Smartphone size={26} className="text-[#1E3A5F]" />
            ) : (
              <Lock size={26} className="text-[#1E3A5F]" />
            )}
          </div>
        </div>

        <h2 className="text-xl font-bold text-center text-gray-800 mb-5">
          {role === "citizen" ? t("enterMobile") : t("adminLogin")}
        </h2>

        {/* Role Toggle */}
        <div className="flex rounded-xl overflow-hidden bg-gray-100 p-1 mb-6 gap-1">
          {(["citizen", "admin"] as const).map((r) => (
            <button
              key={r}
              onClick={() => {
                setRole(r);
                setError("");
              }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                role === r
                  ? "bg-[#1E3A5F] text-white shadow"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {r === "citizen" ? t("user") : t("admin")}
            </button>
          ))}
        </div>

        {/* Citizen: phone field */}
        {role === "citizen" && (
          <>
            <label className="text-sm font-medium text-gray-600 mb-1.5 block">
              {t("mobileNumber")}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="98765 XXXXX"
              maxLength={15}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300 mb-4"
            />
            {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
            <button
              onClick={handleCitizenSubmit}
              className="w-full py-3.5 rounded-xl bg-[#1E3A5F] text-white font-bold text-base hover:bg-[#163050] transition-colors btn-touch"
            >
              {t("sendOtp")}
            </button>
            <button
              onClick={() => {
                loginGuest();
                navigate("/guest");
              }}
              className="w-full mt-3 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Continue as Guest
            </button>
          </>
        )}

        {/* Admin: username + password */}
        {role === "admin" && (
          <>
            <label className="text-sm font-medium text-gray-600 mb-1.5 block">
              {t("username")}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300 mb-4"
            />
            <label className="text-sm font-medium text-gray-600 mb-1.5 block">
              {t("password")}
            </label>
            <div className="relative mb-4">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
            <button
              onClick={handleAdminSubmit}
              className="w-full py-3.5 rounded-xl bg-[#1E3A5F] text-white font-bold text-base hover:bg-[#163050] transition-colors btn-touch"
            >
              {t("loginBtn")}
            </button>
            <p className="text-center text-xs text-gray-400 mt-3">
              Demo: admin / admin123
            </p>
          </>
        )}
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-gray-400 text-xs"
      >
        <p>{t("govtInitiative")}</p>
        <p className="mt-0.5">{t("govtHindi")}</p>
      </motion.div>
    </div>
  );
}
