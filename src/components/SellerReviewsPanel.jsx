import { useState, useEffect } from "react";
import { Star, MessageSquare, User } from "lucide-react";
import { motion } from "framer-motion";
import { API_BASE } from "../config";

function SellerReviewsPanel({ sellerId }) {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!sellerId) return;
        const fetchReviews = async () => {
            try {
                const res = await fetch(`${API_BASE}/reviews/seller/${sellerId}`);
                const data = await res.json();
                if (data.success) setReviews(data.data);
            } catch (e) { /* silent */ }
            finally { setLoading(false); }
        };
        fetchReviews();
    }, [sellerId]);

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-32 mb-4" />
                <div className="space-y-3">
                    <div className="h-16 bg-gray-100 rounded-xl" />
                    <div className="h-16 bg-gray-100 rounded-xl" />
                </div>
            </div>
        );
    }

    const avgRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : 0;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shadow">
                        <Star size={16} className="text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 text-sm">Customer Reviews</h3>
                        <p className="text-[11px] text-gray-400">{reviews.length} reviews</p>
                    </div>
                </div>
                {reviews.length > 0 && (
                    <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl shadow-sm">
                        <Star size={14} fill="#f59e0b" className="text-amber-400" />
                        <span className="text-sm font-bold text-gray-900">{avgRating}</span>
                        <span className="text-[10px] text-gray-400">/5</span>
                    </div>
                )}
            </div>

            {/* Reviews List */}
            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                {reviews.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-3">
                            <MessageSquare size={20} className="text-amber-400" />
                        </div>
                        <p className="text-gray-500 text-sm font-medium">No reviews yet</p>
                        <p className="text-gray-400 text-xs mt-1">Reviews from customers will appear here</p>
                    </div>
                ) : (
                    reviews.map((review, i) => (
                        <motion.div
                            key={review.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-gray-50 rounded-xl p-4 border border-gray-100"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-rose-400 flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">
                                            {review.reviewer_name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">{review.reviewer_name}</p>
                                        <p className="text-[10px] text-gray-400">
                                            {review.service_title} • {new Date(review.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            size={12}
                                            className={star <= review.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}
                                        />
                                    ))}
                                </div>
                            </div>
                            {review.comment && (
                                <p className="text-sm text-gray-600 leading-relaxed pl-10">"{review.comment}"</p>
                            )}
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}

export default SellerReviewsPanel;
