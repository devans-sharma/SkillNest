import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../translations";
import LanguagePicker from "../components/LanguagePicker";

function RegisterRolePage() {
  const navigate = useNavigate();
  const { lang } = useLanguage();

  const selectRole = (role) => {
    navigate("/register/form", { state: { role } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-6">

      {/* Language picker */}
      <div className="fixed top-6 right-6 z-50">
        <LanguagePicker />
      </div>

      <motion.div
        className="bg-white shadow-xl rounded-3xl p-12 max-w-lg w-full text-center"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
      >

        <h1 className="font-display text-4xl font-bold mb-4 text-foreground">
          {t(lang, "chooseRole")}
        </h1>

        <p className="text-muted-foreground mb-10">
          {t(lang, "customerDesc")}
        </p>

        <div className="flex flex-col gap-6">

          <button
            onClick={() => selectRole("homemaker")}
            className="bg-primary text-white py-4 rounded-xl text-lg font-semibold hover:opacity-90"
          >
            {t(lang, "iAmHomemaker")}
          </button>

          <button
            onClick={() => selectRole("customer")}
            className="border-2 border-primary py-4 rounded-xl text-lg font-semibold hover:bg-primary/10"
          >
            {t(lang, "iAmCustomer")}
          </button>

        </div>

        <button
          onClick={() => navigate("/")}
          className="mt-8 text-primary hover:underline"
        >
          {t(lang, "backToRole")}
        </button>

      </motion.div>

    </div>
  );
}

export default RegisterRolePage;