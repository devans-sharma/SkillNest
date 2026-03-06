import { useState } from "react";
import { Star, X } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../translations";
import { API_BASE } from "../config";



function ReviewModal({ order, onClose, onSubmitted }) {
    const { lang } = useLanguage();
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const token = localStorage.getItem("token");

    const ratingLabels = ["", t(lang, "poor"), t(lang, "fair"), t(lang, "good"), t(lang, "veryGood"), t(lang, "excellent")];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            setError("Please select a rating");
            return;
        }
        setSubmitting(true);
        setError("");
        try {
            const res = await fetch(`${API_BASE}/reviews`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    order_id: order.id,
                    rating,
                    comment: comment.trim(),
                }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || "Failed to submit review");
            if (onSubmitted) onSubmitted();
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                onClick={onClose}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-md"
            >
                <div className="bg-white rounded-3xl shadow-2xl p-6 border border-gray-100">

                    <div className="flex justify-between items-center mb-5">
                        <h3 className="font-display text-lg font-bold text-gray-900">{t(lang, "leaveReviewTitle")}</h3>
                        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
                            <X size={18} className="text-gray-400" />
                        </button>
                    </div>

                    <p className="text-sm text-gray-500 mb-4">
                        {t(lang, "howWasExperience")} <span className="font-semibold text-gray-800">{order.service_title}</span>?
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* Star Rating */}
                        <div className="flex justify-center gap-1.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    type="button"
                                    key={star}
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHover(star)}
                                    onMouseLeave={() => setHover(0)}
                                    className="p-1 transition-transform hover:scale-110"
                                >
                                    <Star
                                        size={32}
                                        className={`transition-colors ${star <= (hover || rating)
                                            ? "fill-amber-400 text-amber-400"
                                            : "text-gray-200"
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>

                        {rating > 0 && (
                            <p className="text-center text-sm text-amber-600 font-medium">
                                {ratingLabels[rating]}
                            </p>
                        )}

                        {/* Comment */}
                        <textarea
                            placeholder={t(lang, "writeReview")}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={3}
                            className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 resize-none placeholder:text-gray-400"
                        />

                        {error && <p className="text-red-500 text-xs text-center">{error}</p>}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-400 to-rose-400 text-white font-medium shadow hover:shadow-lg transition-all disabled:opacity-50"
                        >
                            {submitting ? t(lang, "submitting") : t(lang, "submitReview")}
                        </button>
                    </form>

                </div>
            </motion.div>
        </>
    );
}

export default ReviewModal;
