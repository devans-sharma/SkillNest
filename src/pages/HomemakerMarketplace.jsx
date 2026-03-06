import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Clock, CheckCircle, XCircle, AlertCircle, Package, User, Plus, X, MessageSquare, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ChatSidebar from "../components/ChatSidebar";
import IncomeDashboard from "../components/IncomeDashboard";
import LocationPickerModal from "../components/LocationPickerModal";
import SellerReviewsPanel from "../components/SellerReviewsPanel";
import LanguagePicker from "../components/LanguagePicker";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../translations";
import { API_BASE } from "../config";



function HomemakerMarketplace() {
  const navigate = useNavigate();
  const { lang } = useLanguage();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [updatingId, setUpdatingId] = useState(null);

  // Add Service state
  const [showAddService, setShowAddService] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [addingService, setAddingService] = useState(false);
  const [addMsg, setAddMsg] = useState("");

  // Chat state
  const [showChat, setShowChat] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  const STATUS_CONFIG = {
    PENDING: {
      label: t(lang, "newRequest"),
      icon: AlertCircle,
      bg: "bg-amber-50",
      text: "text-amber-600",
      border: "border-amber-200",
      dot: "bg-amber-400",
    },
    IN_PROGRESS: {
      label: t(lang, "inProgress"),
      icon: Clock,
      bg: "bg-blue-50",
      text: "text-blue-600",
      border: "border-blue-200",
      dot: "bg-blue-400",
    },
    COMPLETED: {
      label: t(lang, "completed"),
      icon: CheckCircle,
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      border: "border-emerald-200",
      dot: "bg-emerald-400",
    },
    CANCELLED: {
      label: t(lang, "cancelled"),
      icon: XCircle,
      bg: "bg-gray-50",
      text: "text-gray-500",
      border: "border-gray-200",
      dot: "bg-gray-400",
    },
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/orders/seller`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch orders");
      }

      setOrders(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchOrders();

    // Save homemaker location silently
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            await fetch(`${API_BASE}/locations/homemaker`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
              }),
            });
          } catch (e) { /* silent */ }
        },
        () => { /* silent */ },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

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

  const updateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update status");
      }

      // Refresh orders
      await fetchOrders();
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    navigate("/login");
  };

  const filteredOrders = orders.filter(
    (order) => filter === "ALL" || order.status === filter
  );

  const pendingCount = orders.filter((o) => o.status === "PENDING").length;

  const handleAddService = async (e) => {
    e.preventDefault();
    setAddingService(true);
    setAddMsg("");
    try {
      const res = await fetch(`${API_BASE}/services`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTitle,
          description: newTitle,
          price: parseFloat(newPrice),
          service_radius_km: 5,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed");
      setAddMsg("Service added!");
      setNewTitle("");
      setNewPrice("");
      setTimeout(() => { setShowAddService(false); setAddMsg(""); }, 1500);
    } catch (err) {
      setAddMsg(err.message);
    } finally {
      setAddingService(false);
    }
  };

  // Filter tab labels
  const filterLabels = {
    ALL: t(lang, "all"),
    PENDING: t(lang, "newRequest"),
    IN_PROGRESS: t(lang, "inProgress"),
    COMPLETED: t(lang, "completed"),
    CANCELLED: t(lang, "cancelled"),
  };

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
              <p className="text-[11px] text-gray-400 -mt-0.5 tracking-wide">{t(lang, "sellerDashboard")}</p>
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
              onClick={() => setShowChat(true)}
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

      {/* HERO */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-100/60 via-transparent to-rose-100/60" />
        <div className="relative max-w-7xl mx-auto px-6 pt-10 pb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-6"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {t(lang, "yourJobRequests")}
            </h2>
            <p className="text-gray-500 text-base">
              {t(lang, "manageBookings")}
            </p>
          </motion.div>

          {/* STATS BAR */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex justify-center gap-4 mb-6 flex-wrap"
          >
            <div className="bg-white rounded-2xl px-6 py-3 shadow-sm border border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <AlertCircle size={18} className="text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
                <p className="text-xs text-gray-400">{t(lang, "pending")}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl px-6 py-3 shadow-sm border border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Package size={18} className="text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
                <p className="text-xs text-gray-400">{t(lang, "totalOrders")}</p>
              </div>
            </div>

            <button
              onClick={() => setShowAddService(!showAddService)}
              className="bg-gradient-to-r from-orange-400 to-rose-400 text-white rounded-2xl px-5 py-3 shadow-sm flex items-center gap-2 hover:shadow-lg transition-all text-sm font-medium"
            >
              {showAddService ? <X size={18} /> : <Plus size={18} />}
              {showAddService ? t(lang, "cancel") : t(lang, "addService")}
            </button>
          </motion.div>

          {/* INCOME DASHBOARD */}
          <div className="max-w-2xl mx-auto mb-6">
            <IncomeDashboard />
          </div>

          {/* MY REVIEWS */}
          <div className="max-w-2xl mx-auto mb-6">
            <SellerReviewsPanel sellerId={user.id} />
          </div>

          {/* ADD SERVICE FORM */}
          <AnimatePresence>
            {showAddService && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <form onSubmit={handleAddService} className="max-w-md mx-auto bg-white rounded-2xl border border-orange-100 shadow-sm p-5 mb-4 flex flex-col gap-3">
                  <p className="text-sm font-semibold text-gray-800">{t(lang, "addNewService")}</p>
                  <input
                    type="text"
                    placeholder={t(lang, "serviceName")}
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                    className="p-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">₹</span>
                    <input
                      type="number"
                      min="1"
                      placeholder={t(lang, "price")}
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      required
                      className="flex-1 p-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
                    />
                  </div>
                  {addMsg && <p className={`text-xs font-medium ${addMsg.includes('added') ? 'text-emerald-600' : 'text-red-500'}`}>{addMsg}</p>}
                  <button
                    type="submit"
                    disabled={addingService}
                    className="bg-gradient-to-r from-orange-400 to-rose-400 text-white py-2.5 rounded-xl text-sm font-medium shadow hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {addingService ? t(lang, "adding") : t(lang, "addService")}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* FILTER TABS */}
          <div className="flex justify-center gap-2 flex-wrap">
            {["ALL", "PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all
                  ${filter === status
                    ? "bg-gradient-to-r from-orange-400 to-rose-400 text-white shadow-lg shadow-orange-200"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-orange-300"
                  }`}
              >
                {filterLabels[status] || status}
                {status === "PENDING" && pendingCount > 0 && (
                  <span className="ml-1.5 bg-white/30 text-white px-1.5 py-0.5 rounded-full text-xs">
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>


      {/* CONTENT */}
      <div className="max-w-4xl mx-auto px-6 pb-20 mt-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-12 h-12 rounded-full border-4 border-orange-200 border-t-orange-500 animate-spin mb-4" />
            <p className="text-gray-400 text-sm animate-pulse">{t(lang, "yourJobRequests")}...</p>
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
                onClick={() => { setError(""); fetchOrders(); }}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-400 to-rose-400 text-white text-sm font-medium shadow"
              >
                {t(lang, "tryAgain")}
              </button>
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="max-w-md mx-auto py-16">
            <div className="bg-white rounded-3xl border border-orange-100 shadow-lg p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-50 flex items-center justify-center">
                <span className="text-2xl">📭</span>
              </div>
              <p className="text-gray-700 font-medium mb-2">
                {t(lang, "noOrdersYet")}
              </p>
              <p className="text-gray-400 text-sm">
                {filter === "ALL"
                  ? t(lang, "ordersAppearHere")
                  : t(lang, "tryAgain")}
              </p>
            </div>
          </div>
        ) : (
          <motion.div
            className="flex flex-col gap-4"
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
          >
            <AnimatePresence>
              {filteredOrders.map((order) => {
                const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
                const StatusIcon = config.icon;
                const isUpdating = updatingId === order.id;

                return (
                  <motion.div
                    key={order.id}
                    variants={{
                      hidden: { opacity: 0, y: 15 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    exit={{ opacity: 0, x: -20 }}
                    className={`bg-white rounded-2xl border ${config.border} shadow-sm hover:shadow-lg transition-all p-5`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                      {/* LEFT — Order details */}
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                          <StatusIcon size={20} className={config.text} />
                        </div>

                        <div>
                          <h3 className="font-semibold text-gray-900 text-base">
                            {order.service_title}
                          </h3>

                          <div className="flex items-center gap-2 mt-1">
                            <User size={13} className="text-gray-400" />
                            <span className="text-sm text-gray-600">{order.buyer_name}</span>
                          </div>

                          <div className="flex items-center gap-3 mt-2">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                              {config.label}
                            </span>

                            <span className="text-xs text-gray-400">
                              {new Date(order.created_at).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>


                      {/* RIGHT — Action buttons */}
                      <div className="flex gap-2 sm:flex-shrink-0">
                        {order.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => updateStatus(order.id, "IN_PROGRESS")}
                              disabled={isUpdating}
                              className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-rose-400 text-white text-sm font-medium shadow-sm hover:shadow-lg transition-all disabled:opacity-50"
                            >
                              {isUpdating ? "..." : t(lang, "accept")}
                            </button>
                            <button
                              onClick={() => updateStatus(order.id, "CANCELLED")}
                              disabled={isUpdating}
                              className="px-4 py-2 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium hover:bg-gray-50 transition-all disabled:opacity-50"
                            >
                              {t(lang, "decline")}
                            </button>
                          </>
                        )}

                        {order.status === "IN_PROGRESS" && (
                          <button
                            onClick={() => updateStatus(order.id, "COMPLETED")}
                            disabled={isUpdating}
                            className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-medium shadow-sm hover:shadow-lg transition-all disabled:opacity-50"
                          >
                            {isUpdating ? "..." : t(lang, "markComplete")}
                          </button>
                        )}

                        {(order.status === "COMPLETED" || order.status === "CANCELLED") && (
                          <span className={`text-xs font-medium ${config.text}`}>
                            {config.label}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* CHAT SIDEBAR */}
      <AnimatePresence>
        {showChat && (
          <ChatSidebar
            maker={null}
            onClose={() => setShowChat(false)}
          />
        )}
      </AnimatePresence>

      {/* LOCATION PICKER MODAL */}
      <LocationPickerModal
        isOpen={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onSaved={() => setShowLocationPicker(false)}
      />

    </div>
  );
}

export default HomemakerMarketplace;