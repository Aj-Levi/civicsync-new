import { useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import { dummyMapData } from "../../data/dummyData";
import { useCivicStore } from "../../store/civicStore";
import "leaflet/dist/leaflet.css";

export default function AdminMapPage() {
  const { complaints } = useCivicStore();
  const [filter, setFilter] = useState("all");

  const categories = [
    "all",
    "Water Leakage",
    "Power Outage",
    "Road Damage",
    "Garbage Collection",
    "Streetlight",
  ];

  // Adjust complaint counts based on filter
  const adjustedData = dummyMapData.map((point) => ({
    ...point,
    complaints:
      filter === "all"
        ? point.complaints
        : complaints.filter(
            (c) =>
              c.category === filter &&
              c.area
                .toLowerCase()
                .includes(point.city.toLowerCase().split(",")[0].toLowerCase()),
          ).length + Math.floor(Math.random() * 5),
  }));

  const maxCount = Math.max(...adjustedData.map((d) => d.complaints), 1);

  return (
    <div className="p-6 min-h-screen bg-gray-100">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-gray-800 font-display">
          Complaint Map View
        </h1>
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${filter === cat ? "bg-[#1E3A5F] text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}
            >
              {cat === "all" ? "All Categories" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Map */}
      <div
        className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4"
        style={{ height: 480 }}
      >
        <MapContainer
          center={[30.7333, 76.7794]}
          zoom={8}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {adjustedData.map((point) => {
            const ratio = point.complaints / maxCount;
            const radius = 10 + ratio * 28;
            const color =
              ratio > 0.7 ? "#DC2626" : ratio > 0.4 ? "#EA580C" : "#16A34A";
            return (
              <CircleMarker
                key={point.city}
                center={[point.lat, point.lng]}
                radius={radius}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: 0.45,
                  weight: 2,
                }}
              >
                <Tooltip>
                  <div className="text-xs font-semibold">
                    <p className="font-bold">{point.city}</p>
                    <p>Complaints: {point.complaints}</p>
                    <p>Top Issue: {point.topCategory}</p>
                  </div>
                </Tooltip>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {/* Summary table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-50">
          <h2 className="font-bold text-gray-700 text-sm">City-wise Summary</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-400 font-semibold uppercase">
                {["Rank", "City", "Complaints", "Top Category", "Severity"].map(
                  (h) => (
                    <th key={h} className="text-left px-4 py-2">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {[...adjustedData]
                .sort((a, b) => b.complaints - a.complaints)
                .map((p, i) => {
                  const ratio = p.complaints / maxCount;
                  const severity =
                    ratio > 0.7 ? "High" : ratio > 0.4 ? "Medium" : "Low";
                  const severityClass =
                    severity === "High"
                      ? "badge-rejected"
                      : severity === "Medium"
                        ? "badge-pending"
                        : "badge-resolved";
                  return (
                    <tr
                      key={p.city}
                      className="border-t border-gray-50 hover:bg-gray-50/50"
                    >
                      <td className="px-4 py-3 font-bold text-gray-300">
                        #{i + 1}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {p.city}
                      </td>
                      <td className="px-4 py-3 font-bold text-[#1E3A5F]">
                        {p.complaints}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {p.topCategory}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[11px] px-2 py-1 rounded-full font-semibold ${severityClass}`}
                        >
                          {severity}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
