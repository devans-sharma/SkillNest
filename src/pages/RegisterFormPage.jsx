import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../translations";
import LanguagePicker from "../components/LanguagePicker";
import { API_BASE } from "../config";



const ROLE_MAP = {
  homemaker: "SELLER",
  customer: "USER",
};

const skillsList = [
  "Cooking",
  "Tailoring",
  "Embroidery",
  "Baking",
  "Tutoring",
  "Handicrafts",
  "Cleaning",
  "Childcare",
];

// Map English skill names to translation keys
const skillKeyMap = {
  Cooking: "cooking",
  Tailoring: "tailoring",
  Embroidery: "embroidery",
  Baking: "baking",
  Tutoring: "tutoring",
  Handicrafts: "crafts",
  Cleaning: "cleaning",
  Childcare: "childcare",
};

function RegisterFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = location.state?.role || "customer";
  const { lang } = useLanguage();

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [gender, setGender] = useState("");
  const [password, setPassword] = useState("");
  const [skills, setSkills] = useState([]);
  const [skillPrices, setSkillPrices] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSkillToggle = (skill) => {
    if (skills.includes(skill)) {
      setSkills(skills.filter((s) => s !== skill));
      const newPrices = { ...skillPrices };
      delete newPrices[skill];
      setSkillPrices(newPrices);
    } else {
      setSkills([...skills, skill]);
    }
  };

  const handlePriceChange = (skill, price) => {
    setSkillPrices({ ...skillPrices, [skill]: price });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate prices for sellers
    if (role === "homemaker" && skills.length > 0) {
      const missingPrices = skills.filter(
        (s) => !skillPrices[s] || parseFloat(skillPrices[s]) <= 0
      );
      if (missingPrices.length > 0) {
        setError(`Please enter a price for: ${missingPrices.join(", ")}`);
        return;
      }
    }

    setLoading(true);

    try {
      const backendRole = ROLE_MAP[role] || "USER";

      // Build skills array with prices
      const skillsPayload =
        role === "homemaker"
          ? skills.map((s) => ({
            title: s,
            price: parseFloat(skillPrices[s]) || 0,
          }))
          : [];

      let res;
      try {
        res = await fetch(`${API_BASE}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            phone: mobile,
            password,
            role: backendRole,
            gender,
            skills: skillsPayload,
          }),
        });
      } catch (networkErr) {
        throw new Error("Unable to connect to the server. Please make sure the backend is running.");
      }

      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        throw new Error("Unexpected server response. Please try again.");
      }

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Registration failed. Please try again.");
      }

      navigate("/login");
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-orange-50 via-white to-rose-50 relative overflow-hidden">

      {/* Language picker */}
      <div className="fixed top-6 right-6 z-50">
        <LanguagePicker />
      </div>

      {/* Background */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-orange-200 rounded-full blur-3xl opacity-20" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-rose-200 rounded-full blur-3xl opacity-20" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white shadow-2xl rounded-3xl p-10 w-full max-w-xl border border-gray-100 relative z-10"
      >

        <h2 className="font-display text-3xl font-bold mb-2 text-center text-gray-900">
          {t(lang, "createAccount")}
        </h2>
        <p className="text-center text-gray-500 mb-8 text-sm">
          {t(lang, "registerAs")} <span className="font-medium text-orange-500">{role === "homemaker" ? t(lang, "iAmHomemaker") : t(lang, "iAmCustomer")}</span>
        </p>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="text"
            placeholder={t(lang, "fullName")}
            className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300 transition text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            type="tel"
            placeholder={t(lang, "mobileNumber")}
            className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300 transition text-sm"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            required
          />

          <select
            className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300 transition text-sm"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            required
          >
            <option value="">{t(lang, "selectGender")}</option>
            <option value="female">{t(lang, "female")}</option>
            <option value="male">{t(lang, "male")}</option>
            <option value="other">{t(lang, "other")}</option>
          </select>

          <input
            type="password"
            placeholder={t(lang, "password")}
            className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300 transition text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {/* SKILLS + PRICES for Homemaker */}
          {role === "homemaker" && (
            <div className="bg-gradient-to-br from-orange-50 to-rose-50 p-5 rounded-2xl border border-orange-100">

              <label className="block mb-3 font-semibold text-gray-800 text-sm">
                {t(lang, "selectSkills")}
              </label>

              <div className="grid grid-cols-2 gap-2">
                {skillsList.map((skill) => {
                  const selected = skills.includes(skill);
                  return (
                    <button
                      type="button"
                      key={skill}
                      onClick={() => handleSkillToggle(skill)}
                      className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-all
                        ${selected
                          ? "bg-gradient-to-r from-orange-400 to-rose-400 text-white border-orange-400 shadow-md"
                          : "bg-white border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600"
                        }`}
                    >
                      {selected ? "✓ " : ""}{t(lang, skillKeyMap[skill] || skill.toLowerCase())}
                    </button>
                  );
                })}
              </div>

              {/* PRICE INPUTS for selected skills */}
              {skills.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t(lang, "pricePerService")}</p>
                  {skills.map((skill) => (
                    <div key={skill} className="flex items-center gap-3 bg-white rounded-xl px-3 py-2 border border-gray-100">
                      <span className="text-sm font-medium text-gray-700 flex-1">{t(lang, skillKeyMap[skill] || skill.toLowerCase())}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-400">₹</span>
                        <input
                          type="number"
                          min="1"
                          placeholder="0"
                          value={skillPrices[skill] || ""}
                          onChange={(e) => handlePriceChange(skill, e.target.value)}
                          className="w-20 p-1.5 rounded-lg border border-gray-200 text-sm text-right focus:outline-none focus:ring-2 focus:ring-orange-200"
                          required
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-400 to-rose-400 text-white py-3 rounded-xl font-semibold text-base shadow-lg shadow-orange-200 hover:shadow-xl hover:scale-[1.01] transition disabled:opacity-50"
          >
            {loading ? t(lang, "creatingAccount") : t(lang, "createAccountBtn")}
          </button>
        </form>

        <button
          onClick={() => navigate("/register")}
          className="mt-5 text-orange-500 text-sm hover:underline w-full text-center"
        >
          {t(lang, "backToRole")}
        </button>
      </motion.div>
    </div>
  );
}

export default RegisterFormPage;