import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import { ArrowLeft } from "lucide-react";
import { dummyMapData } from "../../data/dummyData";
import "leaflet/dist/leaflet.css";

export default function ComplaintMapPage() {
  const navigate = useNavigate();

  const maxCount = Math.max(...dummyMapData.map((d) => d.complaints));

  return (
    <div className="min-h-screen bg-[#EEF0FB] px-4 py-4">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="text-gray-600">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-gray-800">Complaint Map</h1>
      </div>

      {/* Legend */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {["Low", "Medium", "High"].map((label, i) => (
          <div
            key={label}
            className="flex items-center gap-1.5 text-xs text-gray-600"
          >
            <div
              className={`w-3 h-3 rounded-full ${i === 0 ? "bg-green-400" : i === 1 ? "bg-orange-400" : "bg-red-500"}`}
            />
            {label}
          </div>
        ))}
      </div>

      {/* Map */}
      <div
        className="rounded-2xl overflow-hidden shadow-sm"
        style={{ height: 380 }}
      >
        <MapContainer
          center={[30.7333, 76.7794]}
          zoom={8}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {dummyMapData.map((point) => {
            const ratio = point.complaints / maxCount;
            const radius = 8 + ratio * 22;
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
                  fillOpacity: 0.5,
                  weight: 1.5,
                }}
              >
                <Tooltip>
                  <div className="text-xs font-semibold">
                    <p>{point.city}</p>
                    <p>Complaints: {point.complaints}</p>
                    <p>Top: {point.topCategory}</p>
                  </div>
                </Tooltip>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {/* City List */}
      <div className="mt-4 space-y-2">
        {[...dummyMapData]
          .sort((a, b) => b.complaints - a.complaints)
          .slice(0, 5)
          .map((p, i) => (
            <div
              key={p.city}
              className="bg-white rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm"
            >
              <span className="text-lg font-black text-gray-300 w-6">
                #{i + 1}
              </span>
              <div className="flex-1">
                <p className="font-semibold text-gray-800 text-sm">{p.city}</p>
                <p className="text-xs text-gray-400">{p.topCategory}</p>
              </div>
              <span className="font-bold text-[#1E3A5F] text-sm">
                {p.complaints} complaints
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
