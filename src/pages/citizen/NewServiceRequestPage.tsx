import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Upload } from "lucide-react";
import { useCivicStore } from "../../store/civicStore";
import { useTranslation } from "../../lib/i18n";

const services = [
  {
    type: "electricity" as const,
    label: "Electricity Connection",
    icon: "⚡",
    desc: "New domestic/commercial electricity connection",
  },
  {
    type: "water" as const,
    label: "Water Connection",
    icon: "💧",
    desc: "New residential water supply connection",
  },
  {
    type: "gas" as const,
    label: "Gas Connection",
    icon: "🔥",
    desc: "PNG/LPG gas pipeline connection",
  },
];

export default function NewServiceRequestPage() {
  const [step, setStep] = useState(1);
  const [serviceType, setServiceType] = useState<
    "electricity" | "water" | "gas" | ""
  >("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [idProof, setIdProof] = useState("");
  const [addrProof, setAddrProof] = useState("");
  const { addServiceRequest } = useCivicStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSubmit = () => {
    if (!serviceType) return;
    const refNo = addServiceRequest({
      serviceType,
      applicantName: name || "Citizen User",
      phone: "+919876545678",
      address: address || "Sector 15, Chandigarh",
    });
    navigate("/citizen/track", { state: { newRefNo: refNo } });
  };

  const stepTitles = [
    t("selectService"),
    t("personalDetails"),
    t("uploadDocuments"),
    t("reviewSubmit"),
  ];

  return (
    <div className="min-h-screen bg-[#EEF0FB] px-4 py-4">
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={() => (step > 1 ? setStep((s) => s - 1) : navigate(-1))}
          className="text-gray-600"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-gray-800">
          {t("newConnectionRequest")}
        </h1>
      </div>

      {/* Step Indicators */}
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? "bg-[#1E3A5F]" : "bg-gray-200"}`}
          />
        ))}
      </div>
      <p className="text-xs text-gray-400 mb-5">
        Step {step} of 4: {stepTitles[step - 1]}
      </p>

      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-3"
        >
          {services.map(({ type, label, icon, desc }) => (
            <button
              key={type}
              onClick={() => setServiceType(type)}
              className={`w-full bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border-2 transition-all ${serviceType === type ? "border-[#1E3A5F] bg-blue-50" : "border-transparent hover:border-gray-200"}`}
            >
              <span className="text-3xl">{icon}</span>
              <div className="text-left">
                <p className="font-bold text-gray-800">{label}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            </button>
          ))}
          <button
            disabled={!serviceType}
            onClick={() => setStep(2)}
            className="w-full py-3.5 rounded-xl bg-[#1E3A5F] text-white font-bold disabled:opacity-50 btn-touch mt-2"
          >
            {t("next")}
          </button>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          {[
            [t("fullName"), name, setName, "Your full name"],
            [t("address"), address, setAddress, "123, Sector XX, City"],
          ].map(([label, val, setter, ph]) => (
            <div key={String(label)}>
              <label className="text-sm font-medium text-gray-600 block mb-1.5">
                {String(label)}
              </label>
              <input
                value={String(val)}
                onChange={(e) =>
                  (setter as (v: string) => void)(e.target.value)
                }
                placeholder={String(ph)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          ))}
          <button
            disabled={!name.trim() || !address.trim()}
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
          className="space-y-4"
        >
          {[
            [t("idProof"), idProof, setIdProof],
            [t("addressProof"), addrProof, setAddrProof],
          ].map(([label, val, setter]) => (
            <div key={String(label)}>
              <label className="text-sm font-medium text-gray-600 block mb-1.5">
                {String(label)}
              </label>
              <label className="flex items-center gap-3 bg-white border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-blue-300">
                <Upload size={20} className="text-gray-400" />
                <span className="text-sm text-gray-500">
                  {String(val) || "Tap to upload"}
                </span>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) =>
                    (setter as (v: string) => void)(
                      e.target.files?.[0]?.name ?? "",
                    )
                  }
                />
              </label>
            </div>
          ))}
          <button
            onClick={() => setStep(4)}
            className="w-full py-3.5 rounded-xl bg-[#1E3A5F] text-white font-bold btn-touch"
          >
            {t("next")}
          </button>
        </motion.div>
      )}

      {step === 4 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-5 space-y-3 text-sm">
            {[
              [
                "Service Type",
                services.find((s) => s.type === serviceType)?.label,
              ],
              [t("fullName"), name],
              [t("address"), address],
              [t("idProof"), idProof || "Not uploaded"],
              [t("addressProof"), addrProof || "Not uploaded"],
            ].map(([label, val]) => (
              <div
                key={String(label)}
                className="flex justify-between border-b border-gray-50 pb-2 last:border-0"
              >
                <span className="text-gray-500">{String(label)}</span>
                <span className="font-semibold text-gray-800 text-right max-w-[55%]">
                  {String(val ?? "—")}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={handleSubmit}
            className="w-full py-3.5 rounded-xl bg-[#16A34A] text-white font-bold btn-touch"
          >
            {t("submit")} Application
          </button>
        </motion.div>
      )}
    </div>
  );
}
