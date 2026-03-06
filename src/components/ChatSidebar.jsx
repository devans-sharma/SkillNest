import { ArrowLeft, Send, MessageSquare, CreditCard, X, CheckCircle, Smartphone, Banknote, IndianRupee } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../translations";
import { API_BASE } from "../config";



const PAYMENT_METHODS = [
  { id: "UPI", label: "UPI", icon: Smartphone, color: "from-purple-500 to-indigo-500", desc: "Google Pay, PhonePe, Paytm" },
  { id: "CARD", label: "Card", icon: CreditCard, color: "from-blue-500 to-cyan-500", desc: "Debit / Credit Card" },
  { id: "CASH", label: "Cash", icon: Banknote, color: "from-emerald-500 to-teal-500", desc: "Pay on delivery" },
];

function ChatSidebar({ maker, onClose }) {
  const { lang } = useLanguage();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [view, setView] = useState(maker ? "chat" : "list");
  const [chatPartner, setChatPartner] = useState(maker);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);

  // Payment state
  const [showPayment, setShowPayment] = useState(false);
  const [payStep, setPayStep] = useState("service"); // "service" | "method" | "confirm" | "success"
  const [selectedService, setSelectedService] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = localStorage.getItem("userRole");

  // Fetch conversations list
  const fetchConversations = async () => {
    try {
      const res = await fetch(`${API_BASE}/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setConversations(data.data);
    } catch (e) { /* silently fail */ }
  };

  // Fetch messages for a conversation
  const fetchMessages = async (convId) => {
    try {
      const res = await fetch(`${API_BASE}/chat/messages/${convId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setMessages(data.data);
        fetch(`${API_BASE}/chat/messages/${convId}/read`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (e) { /* silently fail */ }
  };

  useEffect(() => {
    if (maker) {
      // Start or find conversation with this maker
      const startConversation = async () => {
        try {
          const res = await fetch(`${API_BASE}/chat/conversation`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ seller_id: maker.id }),
          });
          const data = await res.json();
          if (data.success) {
            setConversationId(data.data.id);
            fetchMessages(data.data.id);
          }
        } catch (e) { /* silently fail */ }
      };
      startConversation();
    } else {
      fetchConversations();
    }
  }, [maker]);

  // Fetch partner's services if not already available (needed for Pay button)
  useEffect(() => {
    const fetchServices = async () => {
      if (!chatPartner?.id || (chatPartner.services && chatPartner.services.length > 0)) return;
      try {
        const res = await fetch(`${API_BASE}/services/sellers`);
        const data = await res.json();
        if (data.success) {
          const seller = data.data.find(s => s.id === chatPartner.id);
          if (seller && seller.services) {
            setChatPartner(prev => ({ ...prev, services: seller.services }));
          }
        }
      } catch (e) { /* silent */ }
    };
    fetchServices();
  }, [chatPartner?.id]);

  // Poll for new messages
  useEffect(() => {
    if (conversationId && view === "chat") {
      pollRef.current = setInterval(() => fetchMessages(conversationId), 3000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [conversationId, view]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || !conversationId) return;
    setSending(true);
    try {
      await fetch(`${API_BASE}/chat/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          message_text: message.trim(),
          message_type: "TEXT",
        }),
      });
      setMessage("");
      fetchMessages(conversationId);
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const openConversation = async (conv) => {
    const isMe = conv.buyer_id === user.id;
    const partnerId = isMe ? conv.seller_id : conv.buyer_id;
    setChatPartner({
      name: isMe ? conv.seller_name : conv.buyer_name,
      id: partnerId,
      services: [],
    });
    setConversationId(conv.id);
    setView("chat");
    fetchMessages(conv.id);
    // Fetch partner's services for the Pay button
    try {
      const res = await fetch(`${API_BASE}/services/sellers`);
      const data = await res.json();
      if (data.success) {
        const seller = data.data.find(s => s.id === partnerId);
        if (seller && seller.services) {
          setChatPartner(prev => ({ ...prev, services: seller.services }));
        }
      }
    } catch (e) { /* silent */ }
  };

  // Payment flow
  const openPayment = () => {
    setShowPayment(true);
    setPayStep("service");
    setSelectedService(null);
    setSelectedMethod(null);
    setPayError("");
  };

  const handlePayment = async () => {
    if (!selectedService || !selectedMethod) return;
    setPaying(true);
    setPayError("");
    try {
      // 1. Create order
      const orderRes = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          service_id: selectedService.id,
          seller_id: chatPartner.id,
        }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success) throw new Error(orderData.message || "Order failed");

      // 2. Create payment
      const payRes = await fetch(`${API_BASE}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          order_id: orderData.data.id,
          amount: parseFloat(selectedService.price),
          payment_method: selectedMethod,
          transaction_id: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        }),
      });
      const payData = await payRes.json();
      if (!payRes.ok || !payData.success) throw new Error(payData.message || "Payment failed");

      // 3. Mark payment as completed
      await fetch(`${API_BASE}/payments/${payData.data.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "COMPLETED" }),
      });

      setPayStep("success");

      // Send a message about the payment
      if (conversationId) {
        await fetch(`${API_BASE}/chat/message`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            conversation_id: conversationId,
            message_text: `💳 Payment of ₹${selectedService.price} made for "${selectedService.title}" via ${selectedMethod}`,
            message_type: "TEXT",
          }),
        });
        fetchMessages(conversationId);
      }
    } catch (e) {
      setPayError(e.message);
    } finally {
      setPaying(false);
    }
  };

  // Get partner services (from maker prop or fetch)
  const partnerServices = chatPartner?.services || maker?.services || [];

  // Removed early null-return: let the list view render its own empty/loading state

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Sidebar */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white shadow-2xl z-50 flex flex-col"
      >

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-rose-50 flex-shrink-0">
          <button
            onClick={() => {
              if (view === "chat" && !maker) {
                setView("list");
                setChatPartner(null);
                setConversationId(null);
                fetchConversations();
              } else {
                onClose();
              }
            }}
            className="p-2 rounded-xl hover:bg-white/70 transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>

          {view === "chat" && chatPartner ? (
            <>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-rose-400 flex items-center justify-center shadow">
                <span className="text-white font-bold text-sm">
                  {chatPartner.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
                </span>
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-gray-900 text-sm">{chatPartner.name}</h2>
                <p className="text-xs text-gray-400">{t(lang, "skillNestChat")}</p>
              </div>
              {/* Pay button — only for buyers */}
              {userRole !== "SELLER" && partnerServices.length > 0 && (
                <button
                  onClick={openPayment}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-semibold shadow hover:shadow-lg transition-all"
                >
                  <CreditCard size={14} />
                  Pay
                </button>
              )}
            </>
          ) : (
            <div>
              <h2 className="font-semibold text-gray-900 text-sm">{t(lang, "messages")}</h2>
              <p className="text-xs text-gray-400">{conversations.length} {t(lang, "conversations")}</p>
            </div>
          )}
        </div>


        {/* CONVERSATION LIST VIEW */}
        {view === "list" && (
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mb-4">
                  <MessageSquare size={24} className="text-orange-400" />
                </div>
                <p className="text-gray-600 font-medium text-sm mb-1">{t(lang, "noConversations")}</p>
                <p className="text-gray-400 text-xs">{t(lang, "startChatting")}</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isMe = conv.buyer_id === user.id;
                const partnerName = isMe ? conv.seller_name : conv.buyer_name;
                const unread = parseInt(conv.unread_count) || 0;

                return (
                  <button
                    key={conv.id}
                    onClick={() => openConversation(conv)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-orange-50/50 border-b border-gray-50 transition-all text-left"
                  >
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-400 to-rose-400 flex items-center justify-center shadow flex-shrink-0">
                      <span className="text-white font-bold text-xs">
                        {partnerName?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">{partnerName}</h3>
                        {conv.last_message_at && (
                          <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">
                            {new Date(conv.last_message_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                      </div>
                      {conv.service_title && (
                        <p className="text-[10px] text-orange-500 font-medium">{conv.service_title}</p>
                      )}
                      <p className="text-xs text-gray-400 truncate">{conv.last_message || t(lang, "noMessagesYet")}</p>
                    </div>
                    {unread > 0 && (
                      <span className="bg-gradient-to-r from-orange-400 to-rose-400 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
                        {unread}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}


        {/* CHAT VIEW */}
        {view === "chat" && (
          <>
            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50/50 space-y-2">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center mb-3">
                    <span className="text-xl">💬</span>
                  </div>
                  <p className="text-gray-500 text-sm font-medium">{t(lang, "startConversation")}</p>
                  <p className="text-gray-400 text-xs mt-1">{t(lang, "sayHello")} {chatPartner?.name}</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender_id === user.id;
                  const isPaymentMsg = msg.message_text && msg.message_text.startsWith("💳");
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm ${isPaymentMsg
                        ? "bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-emerald-800 rounded-br-md"
                        : isMe
                          ? "bg-gradient-to-r from-orange-400 to-rose-400 text-white rounded-br-md"
                          : "bg-white border border-gray-100 text-gray-800 rounded-bl-md shadow-sm"
                        }`}>
                        <p>{msg.message_text}</p>
                        <p className={`text-[10px] mt-1 ${isPaymentMsg ? "text-emerald-400" : isMe ? "text-white/60" : "text-gray-400"}`}>
                          {new Date(msg.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-100 bg-white flex-shrink-0">
              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  type="text"
                  placeholder={t(lang, "typeMessage")}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300 transition-all placeholder:text-gray-400"
                />
                <button
                  type="submit"
                  disabled={sending || !message.trim()}
                  className="w-11 h-11 flex items-center justify-center rounded-xl bg-gradient-to-r from-orange-400 to-rose-400 text-white shadow-sm hover:shadow-lg transition-all disabled:opacity-50"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </>
        )}

      </motion.div>

      {/* ═══════════ PAYMENT MODAL ═══════════ */}
      <AnimatePresence>
        {showPayment && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
              onClick={() => setShowPayment(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 flex items-center justify-center z-[61] p-4"
            >
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

                {/* Payment Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard size={20} className="text-white" />
                    <div>
                      <h3 className="text-white font-bold">Payment</h3>
                      <p className="text-emerald-100 text-xs">
                        {payStep === "service" ? "Select a service" :
                          payStep === "method" ? "Choose payment method" :
                            payStep === "confirm" ? "Confirm payment" : "Done!"}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setShowPayment(false)} className="text-white/70 hover:text-white p-1">
                    <X size={18} />
                  </button>
                </div>

                {/* Step indicator */}
                {payStep !== "success" && (
                  <div className="px-6 pt-4 flex gap-2">
                    {["service", "method", "confirm"].map((step, i) => (
                      <div key={step} className={`flex-1 h-1.5 rounded-full transition-all ${["service", "method", "confirm"].indexOf(payStep) >= i ? "bg-emerald-500" : "bg-gray-200"}`} />
                    ))}
                  </div>
                )}

                <div className="p-6">

                  {/* Step 1: Select Service */}
                  {payStep === "service" && (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600 mb-2">Choose the service from <span className="font-semibold">{chatPartner?.name}</span>:</p>
                      {partnerServices.length > 0 ? partnerServices.map((svc) => (
                        <button
                          key={svc.id}
                          onClick={() => { setSelectedService(svc); setPayStep("method"); }}
                          className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all text-left group"
                        >
                          <div>
                            <p className="text-sm font-semibold text-gray-800 group-hover:text-emerald-700">{svc.title}</p>
                            {svc.description && <p className="text-xs text-gray-400 mt-0.5">{svc.description}</p>}
                          </div>
                          <div className="flex items-center gap-0.5 text-emerald-600 font-bold">
                            <IndianRupee size={14} />
                            <span>{svc.price}</span>
                          </div>
                        </button>
                      )) : (
                        <p className="text-center text-gray-400 text-sm py-4">No services available</p>
                      )}
                    </div>
                  )}

                  {/* Step 2: Payment Method */}
                  {payStep === "method" && (
                    <div className="space-y-3">
                      <button onClick={() => setPayStep("service")} className="text-xs text-gray-400 hover:text-gray-600 mb-1">← Back to services</button>
                      <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">{selectedService?.title}</span>
                        <span className="text-sm font-bold text-emerald-600">₹{selectedService?.price}</span>
                      </div>
                      <p className="text-sm text-gray-600">Choose payment method:</p>
                      {PAYMENT_METHODS.map((pm) => (
                        <button
                          key={pm.id}
                          onClick={() => { setSelectedMethod(pm.id); setPayStep("confirm"); }}
                          className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all text-left group"
                        >
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${pm.color} flex items-center justify-center shadow`}>
                            <pm.icon size={18} className="text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{pm.label}</p>
                            <p className="text-xs text-gray-400">{pm.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Step 3: Confirm */}
                  {payStep === "confirm" && (
                    <div className="space-y-4">
                      <button onClick={() => setPayStep("method")} className="text-xs text-gray-400 hover:text-gray-600 mb-1">← Back</button>
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-5 space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Service</span>
                          <span className="font-semibold text-gray-800">{selectedService?.title}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Seller</span>
                          <span className="font-semibold text-gray-800">{chatPartner?.name}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Method</span>
                          <span className="font-semibold text-gray-800">{selectedMethod}</span>
                        </div>
                        <div className="border-t border-gray-200 pt-3 flex justify-between">
                          <span className="text-gray-700 font-semibold">Total</span>
                          <span className="text-xl font-bold text-emerald-600">₹{selectedService?.price}</span>
                        </div>
                      </div>

                      {payError && (
                        <p className="text-red-500 text-sm text-center">{payError}</p>
                      )}

                      <button
                        onClick={handlePayment}
                        disabled={paying}
                        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                      >
                        {paying ? "Processing..." : `Pay ₹${selectedService?.price}`}
                      </button>
                    </div>
                  )}

                  {/* Step 4: Success */}
                  {payStep === "success" && (
                    <div className="text-center space-y-4 py-4">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", damping: 10 }}
                        className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center mx-auto shadow-lg"
                      >
                        <CheckCircle size={36} className="text-white" />
                      </motion.div>
                      <h4 className="text-lg font-bold text-gray-900">Payment Successful!</h4>
                      <p className="text-sm text-gray-500">
                        ₹{selectedService?.price} paid to <span className="font-medium">{chatPartner?.name}</span> for "{selectedService?.title}"
                      </p>
                      <button
                        onClick={() => setShowPayment(false)}
                        className="px-8 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition"
                      >
                        Done
                      </button>
                    </div>
                  )}

                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default ChatSidebar;