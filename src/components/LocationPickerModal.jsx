import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import { X, MapPin, Navigation, Search } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { API_BASE } from "../config";

/* Fix default marker icon (Leaflet + bundler issue) */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* ── Click handler on map ─────────────────────────── */
function ClickHandler({ onSelect }) {
    useMapEvents({
        click(e) {
            onSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
        },
    });
    return null;
}

/* ── Fly to position when it changes ──────────────── */
function FlyTo({ position }) {
    const map = useMap();
    useEffect(() => {
        if (position) map.flyTo([position.lat, position.lng], 15, { duration: 1 });
    }, [position]);
    return null;
}



/* ── Main Modal ───────────────────────────────────── */
function LocationPickerModal({ isOpen, onClose, onSaved }) {
    const [position, setPosition] = useState(null);
    const [address, setAddress] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [searching, setSearching] = useState(false);
    const [saving, setSaving] = useState(false);
    const [detectingGPS, setDetectingGPS] = useState(false);
    const [savedMsg, setSavedMsg] = useState("");
    const token = localStorage.getItem("token");

    // Default center (India)
    const defaultCenter = [20.5937, 78.9629];
    const defaultZoom = 5;

    // Try to get GPS on open
    useEffect(() => {
        if (isOpen && !position) {
            detectGPS();
        }
    }, [isOpen]);

    const detectGPS = () => {
        if (!navigator.geolocation) return;
        setDetectingGPS(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                reverseGeocode(pos.coords.latitude, pos.coords.longitude);
                setDetectingGPS(false);
            },
            () => setDetectingGPS(false),
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const reverseGeocode = async (lat, lng) => {
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
                { headers: { "Accept-Language": "en" } }
            );
            const data = await res.json();
            if (data.display_name) setAddress(data.display_name);
        } catch (e) { /* silent */ }
    };

    const handleMapClick = (pos) => {
        setPosition(pos);
        reverseGeocode(pos.lat, pos.lng);
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setSearching(true);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
                { headers: { "Accept-Language": "en" } }
            );
            const data = await res.json();
            if (data.length > 0) {
                const p = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
                setPosition(p);
                setAddress(data[0].display_name || "");
            }
        } catch (e) { /* silent */ }
        finally { setSearching(false); }
    };

    const handleSave = async () => {
        if (!position) return;
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE}/locations/user`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    latitude: position.lat,
                    longitude: position.lng,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setSavedMsg("Location saved!");
                if (onSaved) onSaved(position);
                setTimeout(() => {
                    setSavedMsg("");
                    onClose();
                }, 1200);
            } else {
                setSavedMsg("Failed to save. Try again.");
            }
        } catch (e) {
            setSavedMsg("Network error. Try again.");
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in">

                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-rose-500 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <MapPin size={20} className="text-white" />
                        <div>
                            <h3 className="text-white font-bold text-lg">Set Your Location</h3>
                            <p className="text-orange-100 text-xs">Click on the map or search for a place</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition p-1">
                        <X size={20} />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="px-6 pt-4 flex gap-2">
                    <div className="flex-1 relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search for a city, area, or address..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        disabled={searching}
                        className="px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition disabled:opacity-50"
                    >
                        {searching ? "..." : "Search"}
                    </button>
                    <button
                        onClick={detectGPS}
                        disabled={detectingGPS}
                        className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition flex items-center gap-1.5 disabled:opacity-50"
                        title="Use GPS"
                    >
                        <Navigation size={14} />
                        {detectingGPS ? "..." : "GPS"}
                    </button>
                </div>

                {/* Map */}
                <div className="px-6 pt-3">
                    <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: 320 }}>
                        <MapContainer
                            center={position ? [position.lat, position.lng] : defaultCenter}
                            zoom={position ? 15 : defaultZoom}
                            style={{ height: "100%", width: "100%" }}
                            scrollWheelZoom={true}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <ClickHandler onSelect={handleMapClick} />
                            {position && (
                                <>
                                    <Marker position={[position.lat, position.lng]} />
                                    <FlyTo position={position} />
                                </>
                            )}
                        </MapContainer>
                    </div>
                </div>

                {/* Address + Save */}
                <div className="px-6 py-4 space-y-3">
                    {address && (
                        <div className="flex items-start gap-2 bg-gray-50 rounded-xl px-4 py-3">
                            <MapPin size={14} className="text-orange-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-600 leading-relaxed">{address}</p>
                        </div>
                    )}

                    {position && (
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                            <span>Lat: {position.lat.toFixed(6)}</span>
                            <span>Lng: {position.lng.toFixed(6)}</span>
                        </div>
                    )}

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleSave}
                            disabled={!position || saving}
                            className="flex-1 bg-gradient-to-r from-orange-500 to-rose-500 text-white py-3 rounded-xl font-semibold text-sm hover:shadow-lg transition disabled:opacity-50"
                        >
                            {saving ? "Saving..." : "Save Location"}
                        </button>
                        <button
                            onClick={onClose}
                            className="px-6 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                    </div>

                    {savedMsg && (
                        <p className={`text-center text-sm font-medium ${savedMsg.includes("saved") ? "text-emerald-600" : "text-red-500"}`}>
                            {savedMsg}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default LocationPickerModal;
