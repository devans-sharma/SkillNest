import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    IndianRupee, TrendingUp, TrendingDown, Package, CheckCircle, Clock, XCircle,
    Calendar, BarChart3, ArrowUpRight, ArrowDownRight, ChevronRight
} from "lucide-react";
import { API_BASE } from "../config";

/* ── Donut Ring (SVG) ────────────────────────────────────────── */
function DonutChart({ completed, pending, inProgress, cancelled }) {
    const total = completed + pending + inProgress + cancelled || 1;
    const r = 70, cx = 90, cy = 90, stroke = 14;
    const circumference = 2 * Math.PI * r;

    const slices = [
        { count: completed, color: "#10b981" },
        { count: inProgress, color: "#3b82f6" },
        { count: pending, color: "#f59e0b" },
        { count: cancelled, color: "#d1d5db" },
    ];

    let offset = 0;

    return (
        <svg width="180" height="180" viewBox="0 0 180 180">
            {/* Background circle */}
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
            {slices.map((s, i) => {
                const len = (s.count / total) * circumference;
                const el = (
                    <circle
                        key={i}
                        cx={cx} cy={cy} r={r}
                        fill="none"
                        stroke={s.color}
                        strokeWidth={stroke}
                        strokeDasharray={`${len} ${circumference - len}`}
                        strokeDashoffset={-offset}
                        strokeLinecap="round"
                        transform={`rotate(-90 ${cx} ${cy})`}
                        className="transition-all duration-700"
                    />
                );
                offset += len;
                return el;
            })}
        </svg>
    );
}

/* ── Mini bar for daily chart ────────────────────────────────── */
function DailyBar({ value, max, label, dayName, isToday }) {
    const h = max > 0 ? Math.max((value / max) * 100, 4) : 4;
    return (
        <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
            <div className="w-full flex flex-col items-center justify-end h-24">
                <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ duration: 0.5 }}
                    className={`w-full max-w-[14px] rounded-t-md ${isToday
                        ? "bg-gradient-to-t from-orange-500 to-rose-400"
                        : value > 0
                            ? "bg-gradient-to-t from-emerald-400 to-teal-300"
                            : "bg-gray-200"
                        }`}
                />
            </div>
            <span className={`text-[9px] leading-none ${isToday ? "text-orange-600 font-bold" : "text-gray-400"}`}>
                {dayName}
            </span>
        </div>
    );
}

/* ── Monthly bar ─────────────────────────────────────────────── */
function MonthlyColumn({ earnings, max, label, total, completed }) {
    const h = max > 0 ? Math.max((earnings / max) * 100, 6) : 6;
    return (
        <div className="flex flex-col items-center gap-1.5 flex-1">
            <div className="w-full flex flex-col items-center justify-end h-28">
                <span className="text-[10px] text-gray-500 mb-1">
                    {earnings > 0 ? `₹${Number(earnings).toLocaleString("en-IN")}` : ""}
                </span>
                <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ duration: 0.6 }}
                    className="w-full max-w-[32px] rounded-t-xl bg-gradient-to-t from-emerald-500 to-teal-300 shadow-sm"
                />
            </div>
            <span className="text-xs text-gray-500 font-medium">{label}</span>
            <span className="text-[10px] text-gray-400">{completed}/{total}</span>
        </div>
    );
}

/* ── Tab buttons ──────────────────────────────────────────────── */
const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "daily", label: "Daily", icon: Calendar },
    { id: "monthly", label: "Monthly", icon: TrendingUp },
    { id: "services", label: "Services", icon: Package },
];

/* ── Main Component ──────────────────────────────────────────── */
function IncomeDashboard() {
    const [earnings, setEarnings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");
    const token = localStorage.getItem("token");

    useEffect(() => {
        const fetchEarnings = async () => {
            try {
                const res = await fetch(`${API_BASE}/orders/earnings`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (data.success) setEarnings(data.data);
            } catch (e) { /* silent */ }
            finally { setLoading(false); }
        };
        fetchEarnings();
    }, []);

    if (loading) {
        return (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-lg p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded-lg w-48" />
                    <div className="flex gap-4">
                        <div className="w-44 h-44 rounded-full bg-gray-100" />
                        <div className="flex-1 space-y-3">
                            <div className="h-16 bg-gray-100 rounded-xl" />
                            <div className="h-16 bg-gray-100 rounded-xl" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!earnings) return null;

    const total = parseFloat(earnings.total_earnings) || 0;
    const thisMonth = parseFloat(earnings.this_month) || 0;
    const lastMonth = parseFloat(earnings.last_month) || 0;
    const thisWeek = parseFloat(earnings.this_week) || 0;
    const today = parseFloat(earnings.today) || 0;
    const completed = parseInt(earnings.completed_count) || 0;
    const pending = parseInt(earnings.pending_count) || 0;
    const inProgress = parseInt(earnings.in_progress_count) || 0;
    const cancelled = parseInt(earnings.cancelled_count) || 0;
    const totalOrders = parseInt(earnings.total_orders) || 0;
    const daily = earnings.daily || [];
    const monthly = earnings.monthly || [];
    const topServices = earnings.top_services || [];
    const recentOrders = earnings.recent_orders || [];

    const monthChange = lastMonth > 0 ? (((thisMonth - lastMonth) / lastMonth) * 100).toFixed(0) : thisMonth > 0 ? 100 : 0;
    const completionRate = totalOrders > 0 ? ((completed / totalOrders) * 100).toFixed(0) : 0;

    const dailyMax = Math.max(...daily.map(d => parseFloat(d.earnings) || 0), 1);
    // Show last 14 days for readability
    const last14 = daily.slice(-14);

    const monthlyMax = Math.max(...monthly.map(m => parseFloat(m.earnings) || 0), 1);

    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-lg overflow-hidden">

            {/* ── Header ────────────────────────────────── */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-6 py-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                        <IndianRupee size={20} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-lg">Income Dashboard</h3>
                        <p className="text-emerald-100 text-xs">Track your earnings & performance</p>
                    </div>
                </div>
            </div>

            {/* ── Tab Nav ───────────────────────────────── */}
            <div className="flex border-b border-gray-100 px-4">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${activeTab === tab.id
                            ? "border-emerald-500 text-emerald-600"
                            : "border-transparent text-gray-400 hover:text-gray-600"
                            }`}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Tab Content ──────────────────────────── */}
            <div className="p-6">
                <AnimatePresence mode="wait">

                    {/* ─── OVERVIEW TAB ──────────────────────── */}
                    {activeTab === "overview" && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="space-y-6"
                        >
                            {/* Top Row: Donut + Stats */}
                            <div className="flex flex-col sm:flex-row items-center gap-6">

                                {/* Donut chart */}
                                <div className="relative flex-shrink-0">
                                    <DonutChart completed={completed} pending={pending} inProgress={inProgress} cancelled={cancelled} />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-[11px] text-gray-400 uppercase tracking-wider">Total</span>
                                        <span className="text-2xl font-bold text-gray-900">₹{total.toLocaleString("en-IN")}</span>
                                        <span className="text-[10px] text-gray-400">{totalOrders} orders</span>
                                    </div>
                                </div>

                                {/* Stat cards */}
                                <div className="grid grid-cols-2 gap-3 flex-1 w-full">
                                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-100">
                                        <p className="text-[11px] text-emerald-600 font-semibold uppercase tracking-wider mb-1">This Month</p>
                                        <p className="text-xl font-bold text-gray-900">₹{thisMonth.toLocaleString("en-IN")}</p>
                                        <div className="flex items-center gap-1 mt-1">
                                            {parseInt(monthChange) >= 0 ? (
                                                <ArrowUpRight size={12} className="text-emerald-500" />
                                            ) : (
                                                <ArrowDownRight size={12} className="text-red-500" />
                                            )}
                                            <span className={`text-xs font-medium ${parseInt(monthChange) >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                                                {monthChange}% vs last month
                                            </span>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
                                        <p className="text-[11px] text-blue-600 font-semibold uppercase tracking-wider mb-1">Last Month</p>
                                        <p className="text-xl font-bold text-gray-900">₹{lastMonth.toLocaleString("en-IN")}</p>
                                        <p className="text-xs text-gray-400 mt-1">Previous period</p>
                                    </div>

                                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-4 border border-orange-100">
                                        <p className="text-[11px] text-orange-600 font-semibold uppercase tracking-wider mb-1">This Week</p>
                                        <p className="text-xl font-bold text-gray-900">₹{thisWeek.toLocaleString("en-IN")}</p>
                                        <p className="text-xs text-gray-400 mt-1">Last 7 days</p>
                                    </div>

                                    <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 rounded-2xl p-4 border border-purple-100">
                                        <p className="text-[11px] text-purple-600 font-semibold uppercase tracking-wider mb-1">Today</p>
                                        <p className="text-xl font-bold text-gray-900">₹{today.toLocaleString("en-IN")}</p>
                                        <p className="text-xs text-gray-400 mt-1">{new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Order Status Legend */}
                            <div className="flex flex-wrap gap-4 justify-center">
                                {[
                                    { label: "Completed", count: completed, color: "bg-emerald-500" },
                                    { label: "In Progress", count: inProgress, color: "bg-blue-500" },
                                    { label: "Pending", count: pending, color: "bg-amber-500" },
                                    { label: "Cancelled", count: cancelled, color: "bg-gray-300" },
                                ].map((s) => (
                                    <div key={s.label} className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${s.color}`} />
                                        <span className="text-xs text-gray-600">{s.label}</span>
                                        <span className="text-xs font-bold text-gray-900">{s.count}</span>
                                    </div>
                                ))}
                                <div className="flex items-center gap-1 ml-4 px-3 py-1 bg-emerald-50 rounded-full">
                                    <CheckCircle size={12} className="text-emerald-500" />
                                    <span className="text-xs font-semibold text-emerald-700">{completionRate}% completion</span>
                                </div>
                            </div>

                            {/* Recent Orders */}
                            {recentOrders.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Recent Completed</h4>
                                    <div className="space-y-2">
                                        {recentOrders.slice(0, 5).map((o, i) => (
                                            <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                                                        <CheckCircle size={14} className="text-emerald-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-800">{o.title}</p>
                                                        <p className="text-[10px] text-gray-400">{o.buyer_name} • {new Date(o.created_at).toLocaleDateString("en-IN")}</p>
                                                    </div>
                                                </div>
                                                <span className="text-sm font-bold text-emerald-600">₹{parseFloat(o.price).toLocaleString("en-IN")}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ─── DAILY TAB ─────────────────────────── */}
                    {activeTab === "daily" && (
                        <motion.div
                            key="daily"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="space-y-5"
                        >
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-gray-700">Last 14 Days</h4>
                                <span className="text-xs text-gray-400">Earnings per day</span>
                            </div>

                            {/* Bar Chart */}
                            <div className="flex items-end gap-1 px-2">
                                {last14.map((d, i) => (
                                    <DailyBar
                                        key={i}
                                        value={parseFloat(d.earnings) || 0}
                                        max={dailyMax}
                                        label={d.label}
                                        dayName={d.day_name}
                                        isToday={i === last14.length - 1}
                                    />
                                ))}
                            </div>

                            {/* Daily Detail Table */}
                            <div className="max-h-48 overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-white">
                                        <tr className="text-left text-xs text-gray-400 uppercase tracking-wider">
                                            <th className="pb-2 font-medium">Date</th>
                                            <th className="pb-2 font-medium text-right">Earnings</th>
                                            <th className="pb-2 font-medium text-right">Orders</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[...daily].reverse().map((d, i) => {
                                            const e = parseFloat(d.earnings) || 0;
                                            return (
                                                <tr key={i} className={`border-t border-gray-50 ${i === 0 ? "bg-orange-50/50" : ""}`}>
                                                    <td className="py-2 text-gray-700">{d.label}</td>
                                                    <td className={`py-2 text-right font-semibold ${e > 0 ? "text-emerald-600" : "text-gray-300"}`}>
                                                        {e > 0 ? `₹${e.toLocaleString("en-IN")}` : "—"}
                                                    </td>
                                                    <td className="py-2 text-right text-gray-500">{d.completed || 0}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}

                    {/* ─── MONTHLY TAB ───────────────────────── */}
                    {activeTab === "monthly" && (
                        <motion.div
                            key="monthly"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="space-y-5"
                        >
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-gray-700">Monthly Breakdown</h4>
                                <span className="text-xs text-gray-400">Last 6 months</span>
                            </div>

                            {monthly.length > 0 ? (
                                <>
                                    {/* Column Chart */}
                                    <div className="flex items-end gap-2 px-4">
                                        {monthly.map((m, i) => (
                                            <MonthlyColumn
                                                key={i}
                                                earnings={parseFloat(m.earnings) || 0}
                                                max={monthlyMax}
                                                label={m.short_label}
                                                total={parseInt(m.total) || 0}
                                                completed={parseInt(m.completed) || 0}
                                            />
                                        ))}
                                    </div>

                                    {/* Month Comparison */}
                                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-100">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm font-semibold text-gray-800">This Month vs Last Month</span>
                                            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${parseInt(monthChange) >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                                                }`}>
                                                {parseInt(monthChange) >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                                {monthChange}%
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-500 mb-0.5">This Month</p>
                                                <p className="text-xl font-bold text-emerald-700">₹{thisMonth.toLocaleString("en-IN")}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-0.5">Last Month</p>
                                                <p className="text-xl font-bold text-gray-600">₹{lastMonth.toLocaleString("en-IN")}</p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-8 text-gray-400 text-sm">
                                    No monthly data yet. Complete orders to see your monthly breakdown.
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ─── SERVICES TAB ──────────────────────── */}
                    {activeTab === "services" && (
                        <motion.div
                            key="services"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="space-y-4"
                        >
                            <h4 className="text-sm font-semibold text-gray-700">Top Services by Revenue</h4>

                            {topServices.length > 0 ? (
                                <div className="space-y-2">
                                    {topServices.map((svc, i) => {
                                        const rev = parseFloat(svc.revenue) || 0;
                                        const maxRev = Math.max(...topServices.map(s => parseFloat(s.revenue) || 0), 1);
                                        const barW = (rev / maxRev) * 100;
                                        return (
                                            <div key={i} className="relative bg-gray-50 rounded-xl overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${barW}%` }}
                                                    transition={{ duration: 0.6, delay: i * 0.1 }}
                                                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-100 to-teal-50 rounded-xl"
                                                />
                                                <div className="relative flex items-center justify-between px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-400 to-rose-400 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                                            {i + 1}
                                                        </span>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-800">{svc.title}</p>
                                                            <p className="text-[10px] text-gray-400">{svc.orders_completed} completed · {svc.total_orders} total</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-sm font-bold text-emerald-600">₹{rev.toLocaleString("en-IN")}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400 text-sm">
                                    No service data yet. Complete orders to see your top services.
                                </div>
                            )}
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
}

export default IncomeDashboard;
