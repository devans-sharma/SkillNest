import { Star, MessageCircle, Briefcase, IndianRupee } from "lucide-react";
import { t } from "../translations";
import { API_BASE } from "../config";



// Generate a consistent color from a name
function getAvatarColor(name) {
  const colors = [
    "from-orange-400 to-rose-400",
    "from-violet-400 to-purple-400",
    "from-emerald-400 to-teal-400",
    "from-blue-400 to-indigo-400",
    "from-pink-400 to-fuchsia-400",
    "from-amber-400 to-orange-400",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function HomemakerCard({ seller, highlightSkill, onChat, lang = "en" }) {
  const services = seller.services || [];
  const avgPrice = parseFloat(seller.avg_price) || 0;
  const avgRating = parseFloat(seller.avg_rating) || 0;
  const reviewCount = parseInt(seller.review_count) || 0;
  const distanceKm = seller.distance_km != null ? parseFloat(seller.distance_km) : null;
  const avatarGradient = getAvatarColor(seller.name);

  const isNew = new Date() - new Date(seller.created_at) < 7 * 24 * 60 * 60 * 1000;

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-orange-100/50 transition-all duration-300 overflow-hidden">

      {/* HEADER */}
      <div className="px-5 pt-5 pb-3 flex items-start gap-3.5">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform flex-shrink-0`}>
          <span className="text-white font-bold text-lg">{getInitials(seller.name)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 text-base truncate">{seller.name}</h3>
            {isNew && (
              <span className="px-2 py-0.5 bg-gradient-to-r from-emerald-400 to-teal-400 text-white text-[10px] font-bold rounded-full">{t(lang, "newSeller")}</span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-1">
            {avgRating > 0 && (
              <div className="flex items-center gap-1">
                <Star size={13} fill="#f59e0b" className="text-amber-400" />
                <span className="text-sm font-semibold text-gray-800">{avgRating.toFixed(1)}</span>
                <span className="text-[10px] text-gray-400">({reviewCount})</span>
              </div>
            )}
            {avgPrice > 0 && (
              <div className="flex items-center gap-0.5 text-emerald-500">
                <IndianRupee size={12} />
                <span className="text-sm font-medium">{avgPrice}</span>
                <span className="text-[10px] text-gray-400">/{t(lang, "avg")}</span>
              </div>
            )}
            {distanceKm !== null && (
              <span className="text-xs text-blue-500 font-medium bg-blue-50 px-2 py-0.5 rounded-full">
                📍 {distanceKm < 1 ? `${(distanceKm * 1000).toFixed(0)}m` : `${distanceKm.toFixed(1)} km`}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* SERVICES */}
      {services.length > 0 && (
        <div className="px-5 pb-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Briefcase size={13} className="text-gray-400" />
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{t(lang, "services")}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {services.map((svc) => {
              const isHighlighted = highlightSkill && svc.title.toLowerCase().includes(highlightSkill.toLowerCase());
              return (
                <span key={svc.id} className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${isHighlighted ? "bg-gradient-to-r from-orange-100 to-rose-100 text-orange-700 ring-1 ring-orange-300" : "bg-gray-50 text-gray-600 group-hover:bg-orange-50 group-hover:text-orange-600"}`}>
                  {svc.title}
                  {svc.price && <span className="ml-1 text-[10px] opacity-70">₹{svc.price}</span>}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {services.length === 0 && (
        <div className="px-5 pb-3">
          <p className="text-xs text-gray-400 italic">{t(lang, "noServicesYet")}</p>
        </div>
      )}

      {/* CHAT BUTTON */}
      <div className="px-5 pb-5 pt-2">
        <button
          onClick={() => onChat({ name: seller.name, id: seller.id, services })}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-orange-400 to-rose-400 text-white text-sm font-semibold shadow-sm hover:shadow-lg hover:shadow-orange-200 transition-all"
        >
          <MessageCircle size={16} />
          {t(lang, "chat")}
        </button>
      </div>

    </div>
  );
}

export default HomemakerCard;