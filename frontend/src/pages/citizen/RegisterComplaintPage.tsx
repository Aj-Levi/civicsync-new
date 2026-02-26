import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { useTranslation } from "../../lib/i18n";
import { useSessionStore } from "../../store/sessionStore";
import * as api from "../../lib/api";

// ── Department config — `code` must match backend seed codes ──────────────────
type Urgency = "low" | "medium" | "high";

interface Department {
  key: string;
  code: string; // ← exact code stored in DB (ELEC, WATER, GAS, SANITATION, WASTE)
  name: string;
  icon: string;
  color: string;
  description: string;
  categories: string[];
}

const DEPARTMENTS: Department[] = [
  {
    key: "electricity",
    code: "ELEC",
    name: "Electricity",
    icon: "⚡",
    color: "bg-yellow-50 border-yellow-300",
    description: "Power outages, streetlights, meter issues",
    categories: [
      "Power Outage",
      "Streetlight Fault",
      "Meter Issue",
      "Voltage Fluctuation",
      "Other",
    ],
  },
  {
    key: "water",
    code: "WATER",
    name: "Water Supply",
    icon: "💧",
    color: "bg-blue-50 border-blue-300",
    description: "Leakage, contamination, low pressure",
    categories: [
      "Water Leakage",
      "Water Contamination",
      "Low Pressure",
      "No Water Supply",
      "Other",
    ],
  },
  {
    key: "gas",
    code: "GAS",
    name: "Gas Supply",
    icon: "🔥",
    color: "bg-orange-50 border-orange-300",
    description: "Gas leaks, pressure issues, pipeline faults",
    categories: ["Gas Leak", "Low Gas Pressure", "Pipeline Damage", "Other"],
  },
  {
    key: "sanitation",
    code: "SANITATION",
    name: "Sanitation",
    icon: "🚿",
    color: "bg-green-50 border-green-300",
    description: "Sewage overflow, blocked drains",
    categories: [
      "Sewage Overflow",
      "Blocked Drain",
      "Public Toilet Issue",
      "Other",
    ],
  },
  {
    key: "waste",
    code: "WASTE",
    name: "Waste Management",
    icon: "♻️",
    color: "bg-emerald-50 border-emerald-300",
    description: "Garbage collection, illegal dumping",
    categories: [
      "Garbage Not Collected",
      "Illegal Dumping",
      "Road Cleaning",
      "Other",
    ],
  },
];

const URGENCY_OPTIONS: { value: Urgency; label: string; color: string }[] = [
  {
    value: "low",
    label: "Low",
    color: "bg-green-100 text-green-700 border-green-300",
  },
  {
    value: "medium",
    label: "Medium",
    color: "bg-yellow-100 text-yellow-700 border-yellow-300",
  },
  {
    value: "high",
    label: "High",
    color: "bg-red-100 text-red-700 border-red-300",
  },
];

// ── State → District → Pincode data ───────────────────────────────────────────
// NOTE: Only Karnal & Panipat are seeded in the DB; other districts will show
// a "not found" API error until seeded.
const LOCATION_DATA: Record<string, Record<string, string[]>> = {
  Haryana: {
    Karnal: ["132001", "132022", "132023", "132024"],
    Panipat: ["132103", "132104", "132105", "132107"],
    Ambala: ["133001", "133004", "134003", "134007"],
    Kurukshetra: ["136118", "136119", "136130"],
    Sonipat: ["131001", "131002", "131021"],
    Rohtak: ["124001", "124022", "124027"],
    Hisar: ["125001", "125004", "125005"],
    Gurugram: ["122001", "122002", "122003", "122004"],
    Faridabad: ["121001", "121002", "121003", "121004"],
    Yamunanagar: ["135001", "135003", "135021"],
  },
  Punjab: {
    Amritsar: ["143001", "143002", "143006", "143108"],
    Ludhiana: ["141001", "141002", "141003", "141008"],
    Jalandhar: ["144001", "144002", "144003", "144021"],
    Patiala: ["147001", "147002", "147003", "147004"],
    Mohali: ["160055", "160059", "160062", "160071"],
  },
  Delhi: {
    "Central Delhi": ["110001", "110002", "110003", "110005"],
    "South Delhi": ["110017", "110019", "110025", "110048"],
    "North Delhi": ["110007", "110009", "110033", "110052"],
    "East Delhi": ["110031", "110032", "110096"],
    "West Delhi": ["110018", "110026", "110027", "110041"],
  },
  "Uttar Pradesh": {
    Noida: ["201301", "201305", "201307", "201317"],
    Ghaziabad: ["201001", "201002", "201003", "201005"],
    Agra: ["282001", "282002", "282003", "282004"],
    Lucknow: ["226001", "226002", "226010", "226012"],
    Varanasi: ["221001", "221002", "221003", "221004"],
  },
};

const STATES = Object.keys(LOCATION_DATA).sort();

// ── Validation helpers ────────────────────────────────────────────────────────
const step2Valid = (
  category: string,
  description: string,
  photoFile: File | null,
) => category !== "" && description.length >= 10 && photoFile !== null;

const step3Valid = (
  streetAddress: string,
  state: string,
  district: string,
  pincode: string,
) =>
  streetAddress.trim().length > 0 &&
  state !== "" &&
  district !== "" &&
  pincode !== "";

// ── Page ──────────────────────────────────────────────────────────────────────
export default function RegisterComplaintPage() {
  const [step, setStep] = useState(1);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);

  // Step 2 fields
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoName, setPhotoName] = useState("");
  const [urgency, setUrgency] = useState<Urgency>("medium");

  // Step 3 location fields
  const [streetAddress, setStreetAddress] = useState("");
  const [state, setState_] = useState("");
  const [district, setDistrict] = useState("");
  const [pincode, setPincode] = useState("");

  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Per-step validation touch state (show errors only after Next is clicked)
  const [touched2, setTouched2] = useState(false);
  const [touched3, setTouched3] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useSessionStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Derived location data
  const districts = state ? Object.keys(LOCATION_DATA[state] ?? {}).sort() : [];
  const pincodes =
    state && district ? (LOCATION_DATA[state]?.[district] ?? []) : [];

  const handleStateChange = (s: string) => {
    setState_(s);
    setDistrict("");
    setPincode("");
  };

  const handleDistrictChange = (d: string) => {
    setDistrict(d);
    setPincode("");
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setPhotoFile(file);
    setPhotoName(file?.name ?? "");
  };

  const goToStep2 = () => {
    setTouched2(true);
    if (step2Valid(category, description, photoFile)) setStep(3);
  };

  const goBack = () => (step > 1 ? setStep((s) => s - 1) : navigate(-1));

  const handleSubmit = async () => {
    setTouched3(true);
    if (!step3Valid(streetAddress, state, district, pincode)) return;
    if (!selectedDept) return;

    setLoading(true);
    setSubmitError("");
    try {
      const res = await api.submitComplaint({
        departmentCode: selectedDept.code, // ← uses exact DB code (ELEC, WATER …)
        category,
        description,
        urgency,
        streetAddress,
        city: district,
        state,
        pincode,
        districtName: district,
        photo: photoFile,
      });

      navigate("/citizen/complaint/confirm", {
        state: {
          refNo: res.complaint.referenceNumber,
          category: `${selectedDept.icon} ${selectedDept.name} – ${category}`,
          location: `${district}, ${state} ${pincode}`,
          department: res.complaint.department,
          urgency: res.complaint.urgency,
        },
      });
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to submit complaint.",
      );
    } finally {
      setLoading(false);
    }
  };

  const stepLabel = ["Select Department", "Issue Details", "Location & Submit"];

  // ── Reusable field error message ─────────────────────────────────────────────
  const FieldError = ({ msg }: { msg: string }) => (
    <p className="text-red-500 text-xs mt-1">{msg}</p>
  );

  return (
    <div className="min-h-screen bg-[#EEF0FB] px-4 py-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={goBack} className="text-gray-600">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-gray-800">
          {t("registerNewComplaint")}
        </h1>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1.5 mb-1">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              s <= step ? "bg-[#1E3A5F]" : "bg-gray-200"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-gray-400 mb-5">
        Step {step} of 3 — {stepLabel[step - 1]}
      </p>

      <AnimatePresence mode="wait">
        {/* ── Step 1: Department ───────────────────────────────────────────── */}
        {step === 1 && (
          <motion.div
            key="s1"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-sm font-semibold text-gray-500 mb-3">
              Which department does this issue belong to?
            </h2>
            <div className="flex flex-col gap-3">
              {DEPARTMENTS.map((dept) => (
                <button
                  key={dept.key}
                  onClick={() => setSelectedDept(dept)}
                  className={`w-full flex items-center gap-4 bg-white rounded-2xl p-4 border-2 text-left shadow-sm transition-all ${
                    selectedDept?.key === dept.key
                      ? dept.color + " shadow-md"
                      : "border-transparent hover:border-gray-200"
                  }`}
                >
                  <span className="text-3xl w-10 text-center">{dept.icon}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 text-sm">
                      {dept.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-snug">
                      {dept.description}
                    </p>
                  </div>
                  {selectedDept?.key === dept.key && (
                    <CheckCircle2
                      size={20}
                      className="text-[#1E3A5F] shrink-0"
                    />
                  )}
                </button>
              ))}
            </div>
            <button
              disabled={!selectedDept}
              onClick={() => {
                setCategory("");
                setStep(2);
              }}
              className="w-full mt-5 py-3.5 rounded-xl bg-[#1E3A5F] text-white font-bold disabled:opacity-40 btn-touch"
            >
              {t("next")}
            </button>
          </motion.div>
        )}

        {/* ── Step 2: Issue Details ─────────────────────────────────────────── */}
        {step === 2 && selectedDept && (
          <motion.div
            key="s2"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2 }}
          >
            {/* Dept badge */}
            <div className="inline-flex items-center gap-2 bg-white rounded-full px-3 py-1.5 text-xs font-semibold text-[#1E3A5F] shadow-sm mb-5">
              <span>{selectedDept.icon}</span>
              <span>{selectedDept.name}</span>
            </div>

            {/* Category — required */}
            <h2 className="text-sm font-semibold text-gray-500 mb-2">
              Issue Category <span className="text-red-400">*</span>
            </h2>
            <div className="flex flex-wrap gap-2 mb-1">
              {selectedDept.categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    category === cat
                      ? "bg-[#1E3A5F] text-white border-[#1E3A5F]"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            {touched2 && !category && (
              <FieldError msg="Please select a category." />
            )}
            <div className="mb-4" />

            {/* Description — required ≥ 10 chars */}
            <h2 className="text-sm font-semibold text-gray-500 mb-2">
              {t("describeIssue")} <span className="text-red-400">*</span>
              <span className="text-xs text-gray-400 font-normal ml-1">
                (min 10 characters)
              </span>
            </h2>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please describe the issue in detail…"
              rows={4}
              className={`w-full bg-white border rounded-2xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none mb-1 ${
                touched2 && description.length < 10
                  ? "border-red-300"
                  : "border-gray-200"
              }`}
            />
            <div className="flex justify-between mb-4">
              {touched2 && description.length < 10 ? (
                <FieldError msg="Description must be at least 10 characters." />
              ) : (
                <span />
              )}
              <span className="text-xs text-gray-400">
                {description.length}/10+
              </span>
            </div>

            {/* Photo — required */}
            <h2 className="text-sm font-semibold text-gray-500 mb-2">
              {t("uploadPhoto")} <span className="text-red-400">*</span>
            </h2>
            <label
              className={`flex flex-col items-center gap-2 border-2 border-dashed rounded-2xl p-5 cursor-pointer transition-colors mb-1 ${
                photoName
                  ? "bg-green-50 border-green-300"
                  : touched2 && !photoFile
                    ? "bg-red-50 border-red-300"
                    : "bg-white border-gray-200 hover:border-blue-300"
              }`}
            >
              <Camera
                size={26}
                className={photoName ? "text-green-500" : "text-gray-400"}
              />
              <span className="text-sm text-center text-gray-400">
                {photoName ? (
                  <span className="text-green-600 font-semibold">
                    ✓ {photoName}
                  </span>
                ) : (
                  "Tap to upload a photo"
                )}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </label>
            {touched2 && !photoFile && (
              <FieldError msg="A photo of the issue is required." />
            )}
            <div className="mb-4" />

            {/* Urgency */}
            <h2 className="text-sm font-semibold text-gray-500 mb-2">
              Urgency Level
            </h2>
            <div className="flex gap-2 mb-5">
              {URGENCY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setUrgency(opt.value)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                    urgency === opt.value
                      ? opt.color
                      : "bg-white text-gray-400 border-gray-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <button
              onClick={goToStep2}
              className="w-full py-3.5 rounded-xl bg-[#1E3A5F] text-white font-bold btn-touch"
            >
              {t("next")}
            </button>
          </motion.div>
        )}

        {/* ── Step 3: Location + Review + Submit ───────────────────────────── */}
        {step === 3 && (
          <motion.div
            key="s3"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-sm font-semibold text-gray-500 mb-3">
              Location Details <span className="text-red-400">*</span>
            </h2>

            <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 space-y-3">
              {/* State dropdown */}
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">
                  State <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <select
                    value={state}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className={`w-full appearance-none bg-gray-50 border rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 pr-8 ${
                      touched3 && !state ? "border-red-300" : "border-gray-200"
                    }`}
                  >
                    <option value="">Select state…</option>
                    {STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
                {touched3 && !state && (
                  <FieldError msg="Please select a state." />
                )}
              </div>

              {/* District dropdown — enabled only after state is selected */}
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">
                  District <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <select
                    value={district}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    disabled={!state}
                    className={`w-full appearance-none bg-gray-50 border rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 pr-8 disabled:opacity-50 ${
                      touched3 && !district
                        ? "border-red-300"
                        : "border-gray-200"
                    }`}
                  >
                    <option value="">
                      {state ? "Select district…" : "Select state first"}
                    </option>
                    {districts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
                {touched3 && !district && (
                  <FieldError msg="Please select a district." />
                )}
              </div>

              {/* Pincode dropdown — enabled only after district is selected */}
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">
                  Pincode <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <select
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    disabled={!district}
                    className={`w-full appearance-none bg-gray-50 border rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 pr-8 disabled:opacity-50 ${
                      touched3 && !pincode
                        ? "border-red-300"
                        : "border-gray-200"
                    }`}
                  >
                    <option value="">
                      {district ? "Select pincode…" : "Select district first"}
                    </option>
                    {pincodes.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
                {touched3 && !pincode && (
                  <FieldError msg="Please select a pincode." />
                )}
              </div>

              {/* Street address — required */}
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">
                  Street / Area <span className="text-red-400">*</span>
                </label>
                <input
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="e.g. Sector 12, Model Town"
                  className={`w-full text-sm text-gray-800 bg-gray-50 border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                    touched3 && !streetAddress.trim()
                      ? "border-red-300"
                      : "border-gray-200"
                  }`}
                />
                {touched3 && !streetAddress.trim() && (
                  <FieldError msg="Please enter your street / area." />
                )}
              </div>
            </div>

            {/* Review summary */}
            <h2 className="text-sm font-semibold text-gray-500 mb-2">
              Review Summary
            </h2>
            <div className="bg-white rounded-2xl p-4 shadow-sm mb-5 space-y-2.5 text-sm">
              {(
                [
                  ["Department", `${selectedDept?.icon} ${selectedDept?.name}`],
                  ["Category", category],
                  [
                    "Urgency",
                    urgency.charAt(0).toUpperCase() + urgency.slice(1),
                  ],
                  ["District", district || "—"],
                  ["State", state || "—"],
                  ["Filed by", user?.name ?? "Citizen"],
                  ["Photo", photoName ? "✓ Attached" : "—"],
                ] as [string, string][]
              ).map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-400">{label}</span>
                  <span
                    className={`font-semibold text-right max-w-[55%] ${label === "Photo" && photoName ? "text-green-600" : "text-gray-800"}`}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-red-600 text-sm mb-3">
                {submitError}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#16A34A] text-white font-bold btn-touch disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Submitting…
                </>
              ) : (
                t("submit")
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
