import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../translations";


const sectionVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const LandingPageContent = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();

  return (
    <div className="min-h-screen bg-background font-body">

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center px-6 bg-warm-gradient overflow-hidden">

        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-peach blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-secondary blur-3xl" />
        </div>

        <motion.div
          className="relative z-10 text-center max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >

          <motion.span
            className="inline-block px-4 py-1.5 rounded-full bg-secondary text-muted-foreground text-sm font-medium mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {t(lang, "badge")}
          </motion.span>



          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 text-foreground">
            {t(lang, "heroTitle").split(" ").slice(0, -1).join(" ")}{" "}
            <span className="text-gradient-warm">{t(lang, "heroTitle").split(" ").pop()}</span>
          </h1>

          <p className="text-muted-foreground text-lg md:text-xl max-w-xl mx-auto mb-10 leading-relaxed">
            {t(lang, "heroSubtitle")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">

            {/* REGISTER BUTTON */}
            <motion.button
              onClick={() => navigate("/register")}
              className="bg-primary text-primary-foreground px-8 py-3.5 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-shadow"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              {t(lang, "register")}
            </motion.button>

            {/* LOGIN BUTTON */}
            <motion.button
              onClick={() => navigate("/login")}
              className="border-2 border-primary text-foreground px-8 py-3.5 rounded-full font-semibold text-lg hover:bg-primary/10 transition-colors"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              {t(lang, "login")}
            </motion.button>

          </div>
        </motion.div>
      </section>

      {/* CTA SECTION BUTTONS */}

      <section className="py-24 px-6">
        <motion.div
          className="max-w-3xl mx-auto text-center bg-card rounded-3xl p-12 md:p-16 shadow-lg relative overflow-hidden"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
        >

          <div className="absolute inset-0 bg-warm-gradient opacity-40" />

          <div className="relative z-10">

            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 text-foreground">
              {t(lang, "heroTitle")}{" "}
              <span className="text-gradient-warm">SkillNest</span>
            </h2>

            <p className="text-muted-foreground text-lg max-w-lg mx-auto mb-10">
              {t(lang, "heroSubtitle")}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">

              <motion.button
                onClick={() => navigate("/register")}
                className="bg-primary text-primary-foreground px-10 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-shadow"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                {t(lang, "register")}
              </motion.button>

              <motion.button
                onClick={() => navigate("/login")}
                className="border-2 border-primary text-foreground px-10 py-4 rounded-full font-semibold text-lg hover:bg-primary/10 transition-colors"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                {t(lang, "login")}
              </motion.button>

            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border text-center">
        <p className="text-muted-foreground text-sm">
          © 2026 SkillNest. Empowering homemakers, one skill at a time.
        </p>
      </footer>

    </div>
  );
};

export default LandingPageContent;