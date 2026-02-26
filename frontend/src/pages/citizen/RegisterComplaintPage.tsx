import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Camera, MapPin } from "lucide-react";
import { useCivicStore } from "../../store/civicStore";
import { useTranslation } from "../../lib/i18n";
import { useSessionStore } from "../../store/sessionStore";

const categories = [
  "Water Leakage",
  "Power Outage",
  "Road Damage",
  "Garbage Collection",
  "Streetlight",
  "Other",
];
const catIcons = ["💧", "⚡", "🛣️", "🗑️", "💡", "📝"];

export default function RegisterComplaintPage() {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [photoName, setPhotoName] = useState("");
  const [location, setLocation] = useState("Sector 15, Chandigarh, Punjab");
  const { addComplaint } = useCivicStore();
  const { user } = useSessionStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSubmit = () => {
    const refNo = addComplaint({
      category,
      description,
      area: location,
    });
    navigate("/citizen/complaint/confirm", {
      state: { refNo, category, location },
    });
  };

  return (
    <div className="min-h-screen bg-[#EEF0FB] px-4 py-4">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => (step > 1 ? setStep((s) => s - 1) : navigate(-1))}
          className="text-gray-600"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-gray-800">
          {t("registerNewComplaint")}
        </h1>
      </div>

      {/* Progress Stepper */}
      <div className="flex items-center gap-1 mb-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center flex-1">
            <div
              className={`h-2 flex-1 rounded-full transition-colors ${s <= step ? "bg-[#1E3A5F]" : "bg-gray-200"}`}
            />
          </div>
        ))}
      </div>

      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h2 className="text-sm font-semibold text-gray-500 mb-3">
            {t("selectCategory")}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((cat, i) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`bg-white rounded-2xl p-4 text-left border-2 transition-all shadow-sm ${
                  category === cat
                    ? "border-[#1E3A5F] bg-blue-50"
                    : "border-transparent hover:border-gray-200"
                }`}
              >
                <div className="text-2xl mb-2">{catIcons[i]}</div>
                <p className="text-sm font-semibold text-gray-800 leading-tight">
                  {cat}
                </p>
              </button>
            ))}
          </div>
          <button
            disabled={!category}
            onClick={() => setStep(2)}
            className="w-full mt-5 py-3.5 rounded-xl bg-[#1E3A5F] text-white font-bold disabled:opacity-50 btn-touch"
          >
            {t("next")}
          </button>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="bg-white rounded-2xl px-3 py-1.5 mb-1 inline-flex items-center gap-2 text-sm">
            <span className="text-gray-500">Category:</span>
            <span className="font-semibold text-[#1E3A5F]">{category}</span>
          </div>
          <div className="h-3" />
          <h2 className="text-sm font-semibold text-gray-500 mb-2">
            {t("describeIssue")}
          </h2>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Please describe the issue in detail..."
            rows={5}
            className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none mb-4"
          />

          <h2 className="text-sm font-semibold text-gray-500 mb-2">
            {t("uploadPhoto")}
          </h2>
          <label className="flex flex-col items-center gap-2 bg-white border-2 border-dashed border-gray-200 rounded-2xl p-6 cursor-pointer hover:border-blue-300 transition-colors mb-5">
            <Camera size={28} className="text-gray-400" />
            <span className="text-sm text-gray-400">
              {photoName || "Tap to upload photo"}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setPhotoName(e.target.files?.[0]?.name ?? "")}
            />
          </label>

          <button
            disabled={description.length < 10}
            onClick={() => setStep(3)}
            className="w-full py-3.5 rounded-xl bg-[#1E3A5F] text-white font-bold disabled:opacity-50 btn-touch"
          >
            {t("next")}
          </button>
        </motion.div>
      )}

      {step === 3 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h2 className="text-sm font-semibold text-gray-500 mb-2">
            {t("confirmLocation")}
          </h2>
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
            <div className="flex items-start gap-3">
              <MapPin
                size={20}
                className="text-orange-500 mt-0.5 flex-shrink-0"
              />
              <div className="flex-1">
                <p className="text-xs text-gray-400 mb-1">
                  {t("yourLocation")}
                </p>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full text-sm font-medium text-gray-800 focus:outline-none border-b border-gray-100 pb-1"
                />
              </div>
            </div>
          </div>

          {/* Review Summary */}
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-5 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Category</span>
              <span className="font-semibold text-gray-800">{category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Filed by</span>
              <span className="font-semibold text-gray-800">
                {user?.name ?? "Citizen"}
              </span>
            </div>
            {photoName && (
              <div className="flex justify-between">
                <span className="text-gray-500">Photo</span>
                <span className="font-semibold text-green-600">✓ Attached</span>
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            className="w-full py-3.5 rounded-xl bg-[#16A34A] text-white font-bold btn-touch"
          >
            {t("submit")}
          </button>
        </motion.div>
      )}
    </div>
  );
}
