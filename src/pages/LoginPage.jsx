import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../translations";
import { API_BASE } from "../config";
import LanguagePicker from "../components/LanguagePicker";



function LoginPage() {

  const navigate = useNavigate();
  const { lang } = useLanguage();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Login failed");
      }

      // Store token and user info
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));
      localStorage.setItem("userRole", data.data.user.role);

      // Save location silently in background
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              await fetch(`${API_BASE}/locations/user`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${data.data.token}`,
                },
                body: JSON.stringify({
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                }),
              });
            } catch (e) { /* silent */ }
          },
          () => { /* permission denied — silent */ },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      }

      // Navigate based on server-returned role
      if (data.data.user.role === "SELLER") {
        navigate("/homemaker/marketplace");
      } else if (data.data.user.role === "USER") {
        navigate("/user/marketplace");
      } else {
        navigate("/user/marketplace");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-gradient px-6">

      {/* Language picker */}
      <div className="fixed top-6 right-6 z-50">
        <LanguagePicker />
      </div>

      <div className="bg-white shadow-xl rounded-3xl p-10 w-full max-w-md">

        <h2 className="text-3xl font-bold text-center mb-2">
          {t(lang, "welcomeBack")}
        </h2>
        <p className="text-center text-gray-500 mb-6 text-sm">
          {t(lang, "loginSubtitle")}
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">

          <input
            type="tel"
            placeholder={t(lang, "mobileNumber")}
            className="w-full p-3 rounded-xl border border-border"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder={t(lang, "password")}
            className="w-full p-3 rounded-xl border border-border"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-xl font-semibold disabled:opacity-50"
          >
            {loading ? t(lang, "loggingIn") : t(lang, "loginBtn")}
          </button>

        </form>

        <button
          onClick={() => navigate("/register")}
          className="mt-6 text-primary text-sm hover:underline w-full"
        >
          {t(lang, "noAccount")} {t(lang, "registerHere")}
        </button>

      </div>

    </div>
  );
}

export default LoginPage;