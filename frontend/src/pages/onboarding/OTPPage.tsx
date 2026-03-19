import { useRef, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { useSessionStore } from "../../store/sessionStore";
import { useTranslation } from "../../lib/i18n";
import * as api from "../../lib/api";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30;

export default function OTPPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const phone = (state as { phone?: string })?.phone ?? "";
  const { setCitizenSession } = useSessionStore();
  const { t } = useTranslation();

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resend, setResend] = useState(RESEND_COOLDOWN);
  const [resendLoading, setResendLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if no phone in state
  useEffect(() => {
    if (!phone) navigate("/login", { replace: true });
  }, [phone, navigate]);

  // Resend countdown
  useEffect(() => {
    if (resend <= 0) return;
    const id = setInterval(() => setResend((v) => v - 1), 1000);
    return () => clearInterval(id);
  }, [resend]);

  const handleChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const updated = [...digits];
    updated[i] = val.slice(-1);
    setDigits(updated);
    if (val && i < OTP_LENGTH - 1) inputRefs.current[i + 1]?.focus();
    setError("");
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
    if (e.key === "Enter") handleVerify();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    const arr = pasted
      .split("")
      .concat(Array(OTP_LENGTH).fill(""))
      .slice(0, OTP_LENGTH);
    setDigits(arr);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleVerify = async () => {
    const otp = digits.join("");
    if (otp.length < OTP_LENGTH) {
      setError("Please enter all 6 digits.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await api.verifyOTP(phone, otp);
      const user = res.user;
      const districtObj =
        typeof user.district === "object" && user.district !== null
          ? user.district
          : null;

      setCitizenSession({
        id: user.id,
        name: user.name,
        mobile: user.mobile,
        preferredLanguage: user.preferredLanguage,
        district:
          typeof user.district === "string"
            ? user.district
            : (districtObj?._id ?? (districtObj as any)?.id),
        districtName: districtObj?.name,
        address: user.address,
        createdAt: user.createdAt,
      });
      navigate("/citizen", { replace: true });
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Verification failed. Try again.",
      );
      // Clear digits on wrong OTP
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError("");
    try {
      await api.sendOTP(phone);
      setResend(RESEND_COOLDOWN);
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resend OTP.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EEF0FB] flex flex-col items-center justify-between py-10 px-6">
      {/* Logo */}
      <div className="text-center">
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
      </div>

      {/* Card */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-7"
      >
        <div className="flex justify-center mb-5">
          <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
            <ShieldCheck size={28} className="text-[#1E3A5F]" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-center text-gray-800 mb-1">
          {t("enterOtp")}
        </h2>
        <p className="text-center text-sm text-gray-400 mb-6">
          {t("sentTo")} <strong className="text-gray-700">{phone}</strong>
        </p>

        {/* OTP Inputs */}
        <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              disabled={loading}
              className="w-11 h-12 border-2 border-gray-200 rounded-xl text-center text-xl font-bold text-gray-800 bg-gray-50 focus:outline-none focus:border-[#1E3A5F] transition-colors disabled:opacity-60"
            />
          ))}
        </div>

        {error && (
          <p className="text-red-500 text-xs text-center mb-3">{error}</p>
        )}

        <button
          onClick={handleVerify}
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-[#16A34A] text-white font-bold text-base hover:bg-green-700 transition-colors btn-touch mb-4 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Verifying…
            </>
          ) : (
            t("verifyBtn")
          )}
        </button>

        {/* Resend */}
        <p className="text-center text-sm text-gray-400">
          {t("didntReceive")}{" "}
          {resend > 0 ? (
            <span>
              {t("resendIn")}{" "}
              <strong className="text-gray-700">{resend}s</strong>
            </span>
          ) : (
            <button
              onClick={handleResend}
              disabled={resendLoading}
              className="text-blue-600 font-semibold hover:underline disabled:opacity-60"
            >
              {resendLoading ? "Sending…" : t("resend")}
            </button>
          )}
        </p>
      </motion.div>

      <button
        onClick={() => navigate("/login")}
        className="text-sm text-gray-500 hover:text-gray-700 underline"
      >
        {t("changeMobile")}
      </button>
    </div>
  );
}
