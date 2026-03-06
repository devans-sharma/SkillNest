import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, LogOut, MessageSquare, ShoppingBag, Star, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import HomemakerCard from "../components/HomemakerCard";
import ChatSidebar from "../components/ChatSidebar";
import ReviewModal from "../components/ReviewModal";
import LocationPickerModal from "../components/LocationPickerModal";
import LanguagePicker from "../components/LanguagePicker";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../translations";
import useGeolocation from "../hooks/useGeolocation";
import { API_BASE } from "../config";



const skillCategories = [
  { key: "all", icon: "✨" },
  { key: "cooking", icon: "🍳", filterLabel: "Cooking" },
  { key: "tailoring", icon: "🧵", filterLabel: "Tailoring" },
  { key: "tutoring", icon: "📚", filterLabel: "Tutoring" },
  { key: "crafts", icon: "🎨", filterLabel: "Crafts" },
  { key: "baking", icon: "🧁", filterLabel: "Baking" },
  { key: "cleaning", icon: "🧹", filterLabel: "Cleaning" },
  { key: "childcare", icon: "👶", filterLabel: "Childcare" },
  { key: "embroidery", icon: "🪡", filterLabel: "Embroidery" },
];

function UserMarketplace() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { lat, lng } = useGeolocation();
  const [selectedSkill, setSelectedSkill] = useState("all");
  const [chatUser, setChatUser] = useState(null);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showOrders, setShowOrders] = useState(false);
  const [orders, setOrders] = useState([]);
  const [reviewOrder, setReviewOrder] = useState(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [manualLat, setManualLat] = useState(null);
  const [manualLng, setManualLng] = useState(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  // Poll for unread messages
  useEffect(() => {
    const fetchUnread = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/chat/unread`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setUnreadCount(data.data.count);
      } catch (e) { /* silent */ }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 5000);
    return () => clearInterval(interval);
  }, []);

  // Save user location to DB when available
  useEffect(() => {
    if (lat && lng && token) {
      fetch(`${API_BASE}/locations/user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ latitude: lat, longitude: lng }),
      }).catch(() => { /* silent */ });
    }
  }, [lat, lng]);

  useEffect(() => {
    const fetchSellers = async () => {
      try {
        setLoading(true);
        const useLat = manualLat || lat;
        const useLng = manualLng || lng;
        const params = useLat && useLng ? `?lat=${useLat}&lng=${useLng}` : '';
        const res = await fetch(`${API_BASE}/services/sellers${params}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to fetch sellers");
        }

        setSellers(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSellers();
  }, [lat, lng, manualLat, manualLng]);

  // Get the English filter label for the selected skill key
  const getFilterLabel = (key) => {
    const cat = skillCategories.find((c) => c.key === key);
    return cat?.filterLabel || "";
  };

  // Filter sellers by skill category and search query
  const filtered = sellers.filter((seller) => {
    const services = seller.services || [];
    const filterLabel = getFilterLabel(selectedSkill);
    const matchesSkill =
      selectedSkill === "all" ||
      services.some((s) =>
        s.title.toLowerCase().includes(filterLabel.toLowerCase())
      );

    const matchesSearch =
      !searchQuery ||
      seller.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      services.some((s) =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase())
      );

    return matchesSkill && matchesSearch;
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    navigate("/login");
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_BASE}/orders/buyer`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setOrders(data.data);
    } catch (e) { /* silent */ }
  };

  useEffect(() => { fetchOrders(); }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-rose-50">

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-orange-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-rose-400 flex items-center justify-center shadow-lg shadow-orange-200">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <div>
              <h1 className="font-display text-xl font-bold bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
                SkillNest
              </h1>
              <p className="text-[11px] text-gray-400 -mt-0.5 tracking-wide">{t(lang, "marketplace")}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <LanguagePicker compact />
            <button
              onClick={() => setShowLocationPicker(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-gray-600 hover:text-orange-500 hover:bg-orange-50 transition-all"
            >
              <MapPin size={16} />
              <span className="hidden sm:inline">Location</span>
            </button>
            {user.name && (
              <span className="text-sm text-gray-600 hidden sm:block">
                {t(lang, "welcome")}, <span className="font-semibold text-gray-800">{user.name}</span>
              </span>
            )}
            <button
              onClick={() => setShowOrders(!showOrders)}
              className="relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-gray-600 hover:text-orange-500 hover:bg-orange-50 transition-all"
            >
              <ShoppingBag size={18} />
              <span className="hidden sm:inline">{t(lang, "myOrders")}</span>
            </button>
            <button
              onClick={() => { setChatUser(null); setShowChat(true); }}
              className="relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-gray-600 hover:text-orange-500 hover:bg-orange-50 transition-all"
            >
              <MessageSquare size={18} />
              <span className="hidden sm:inline">{t(lang, "messages")}</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-400 to-rose-400 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">{t(lang, "logout")}</span>
            </button>
          </div>

        </div>
      </nav>


      {/* HERO SECTION */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-100/60 via-transparent to-rose-100/60" />
        <div className="relative max-w-7xl mx-auto px-6 pt-10 pb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {t(lang, "discoverTitle")}
            </h2>
            <p className="text-gray-500 text-base max-w-lg mx-auto">
              {t(lang, "discoverSubtitle")}
            </p>
          </motion.div>

          {/* SEARCH BAR */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="max-w-xl mx-auto mb-8"
          >
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t(lang, "searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-orange-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300 transition-all text-sm placeholder:text-gray-400"
              />
            </div>
          </motion.div>

          {/* CATEGORY PILLS */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="flex flex-wrap justify-center gap-2"
          >
            {skillCategories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedSkill(cat.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                ${selectedSkill === cat.key
                    ? "bg-gradient-to-r from-orange-400 to-rose-400 text-white shadow-lg shadow-orange-200 scale-105"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-orange-300 hover:text-orange-600 hover:shadow-sm"
                  }`}
              >
                <span>{cat.icon}</span>
                {t(lang, cat.key)}
              </button>
            ))}
          </motion.div>
        </div>
      </div>


      {/* RESULTS COUNT */}
      {!loading && !error && (
        <div className="max-w-7xl mx-auto px-6 mb-4">
          <p className="text-sm text-gray-400">
            {filtered.length} {t(lang, "homemakersFound")}
            {selectedSkill !== "all" && <span> — <span className="text-orange-500 font-medium">"{t(lang, selectedSkill)}"</span></span>}
          </p>
        </div>
      )}


      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-12 h-12 rounded-full border-4 border-orange-200 border-t-orange-500 animate-spin mb-4" />
            <p className="text-gray-400 text-sm animate-pulse">{t(lang, "discoverTitle")}...</p>
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto py-16">
            <div className="bg-white rounded-3xl border border-red-100 shadow-lg p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <p className="text-red-500 font-medium mb-2">{t(lang, "somethingWrong")}</p>
              <p className="text-gray-400 text-sm mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-400 to-rose-400 text-white text-sm font-medium shadow hover:shadow-lg transition-all"
              >
                {t(lang, "tryAgain")}
              </button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="max-w-md mx-auto py-16">
            <div className="bg-white rounded-3xl border border-orange-100 shadow-lg p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-50 flex items-center justify-center">
                <span className="text-2xl">🔍</span>
              </div>
              <p className="text-gray-700 font-medium mb-2">{t(lang, "homemakersFound")}: 0</p>
              <p className="text-gray-400 text-sm mb-6">
                {t(lang, "noServicesYet")}
              </p>
              {selectedSkill !== "all" && (
                <button
                  onClick={() => setSelectedSkill("all")}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-400 to-rose-400 text-white text-sm font-medium shadow hover:shadow-lg transition-all"
                >
                  {t(lang, "all")}
                </button>
              )}
            </div>
          </div>
        ) : (
          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.06 } },
            }}
          >
            <AnimatePresence>
              {filtered.map((seller) => (
                <motion.div
                  key={seller.id}
                  variants={{
                    hidden: { opacity: 0, y: 20, scale: 0.96 },
                    visible: { opacity: 1, y: 0, scale: 1 },
                  }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <HomemakerCard
                    seller={seller}
                    highlightSkill={selectedSkill !== "all" ? getFilterLabel(selectedSkill) : null}
                    onChat={setChatUser}
                    lang={lang}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>


      {/* CHAT SIDEBAR */}
      <AnimatePresence>
        {(chatUser || showChat) && (
          <ChatSidebar
            maker={chatUser}
            onClose={() => { setChatUser(null); setShowChat(false); }}
          />
        )}
      </AnimatePresence>

      {/* MY ORDERS PANEL */}
      <AnimatePresence>
        {showOrders && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
              onClick={() => setShowOrders(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white shadow-2xl z-50 flex flex-col"
            >
              <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-rose-50 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">{t(lang, "myOrders")}</h2>
                <button onClick={() => setShowOrders(false)} className="p-2 rounded-xl hover:bg-white/70 text-gray-500">&times;</button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {orders.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-orange-50 flex items-center justify-center">
                      <ShoppingBag size={22} className="text-orange-400" />
                    </div>
                    <p className="text-gray-500 text-sm">{t(lang, "noOrdersPanel")}</p>
                    <p className="text-gray-400 text-xs mt-1">{t(lang, "bookServiceToStart")}</p>
                  </div>
                ) : (
                  orders.map((order) => {
                    const statusColors = {
                      PENDING: "bg-amber-50 text-amber-600",
                      IN_PROGRESS: "bg-blue-50 text-blue-600",
                      COMPLETED: "bg-emerald-50 text-emerald-600",
                      CANCELLED: "bg-gray-50 text-gray-500",
                    };
                    return (
                      <div key={order.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-gray-900 text-sm">{order.service_title}</h4>
                            <p className="text-xs text-gray-500 mt-0.5">by {order.seller_name}</p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium ${statusColors[order.status] || ''}`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2">
                          {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                        {order.status === "COMPLETED" && (
                          <button
                            onClick={() => { setShowOrders(false); setReviewOrder(order); }}
                            className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs font-medium shadow-sm hover:shadow-md transition-all"
                          >
                            <Star size={12} />
                            {t(lang, "leaveReview")}
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* REVIEW MODAL */}
      <AnimatePresence>
        {reviewOrder && (
          <ReviewModal
            order={reviewOrder}
            onClose={() => setReviewOrder(null)}
            onSubmitted={fetchOrders}
          />
        )}
      </AnimatePresence>

      {/* LOCATION PICKER MODAL */}
      <LocationPickerModal
        isOpen={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onSaved={(pos) => {
          setManualLat(pos.lat);
          setManualLng(pos.lng);
        }}
      />

    </div>
  );
}

export default UserMarketplace;
