import { motion } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../translations";

import collageStiching from "../assets/collage-stitching.jpg";
import collageCooking from "../assets/collage-cooking.jpg";
import collageCrafts from "../assets/collage-crafts.jpg";
import collageEmbroidery from "../assets/collage-embroidery.jpg";
import collageBaking from "../assets/collage-baking.jpg";
import collageTeaching from "../assets/collage-teaching.jpg";
import collageProud from "../assets/collage-proud.jpg";
import collageJewelry from "../assets/collage-jewelry.jpg";

const images = [
  { src: collageStiching, alt: "Woman stitching clothes" },
  { src: collageCooking, alt: "Woman cooking food" },
  { src: collageCrafts, alt: "Handmade crafts" },
  { src: collageEmbroidery, alt: "Embroidery work" },
  { src: collageBaking, alt: "Home baking" },
  { src: collageTeaching, alt: "Teaching children" },
  { src: collageProud, alt: "Proud homemaker" },
  { src: collageJewelry, alt: "Handmade jewelry" },
];

const IntroScreen = ({ onEnter }) => {
  const { lang } = useLanguage();
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background p-4 md:p-8"
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    >
      <div className="grid grid-cols-3 grid-rows-3 gap-3 md:gap-4 w-full max-w-4xl aspect-square max-h-[90vh]">
        {/* First 4 images */}
        {images.slice(0, 4).map((img, i) => (
          <motion.div
            key={i}
            className="relative overflow-hidden rounded-2xl shadow-lg cursor-pointer group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            whileHover={{ scale: 1.04, y: -4 }}
            style={{
              animation: `float ${4 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          >
            <img
              src={img.src}
              alt={img.alt}
              className="w-full h-full object-cover transition-all duration-500 group-hover:brightness-110 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-foreground/5 group-hover:bg-transparent transition-all duration-300" />
          </motion.div>
        ))}

        {/* Center tile - branding */}
        <motion.div
          className="relative overflow-hidden rounded-2xl shadow-xl flex flex-col items-center justify-center bg-warm-gradient p-4 md:p-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
        >
          <h1 className="font-display text-3xl md:text-5xl font-bold text-gradient-warm mb-2 md:mb-3">
            SkillNest
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm text-center mb-2 md:mb-3 leading-relaxed max-w-[200px]">
            {t(lang, "heroSubtitle").substring(0, 60)}...
          </p>

          <motion.button
            onClick={onEnter}
            className="bg-primary text-primary-foreground px-5 py-2.5 md:px-7 md:py-3 rounded-full font-body font-semibold text-sm md:text-base shadow-lg hover:shadow-xl transition-shadow"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            {t(lang, "enterSkillNest")}
          </motion.button>
        </motion.div>

        {/* Last 4 images */}
        {images.slice(4).map((img, i) => (
          <motion.div
            key={i + 4}
            className="relative overflow-hidden rounded-2xl shadow-lg cursor-pointer group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (i + 5) * 0.1, duration: 0.5 }}
            whileHover={{ scale: 1.04, y: -4 }}
            style={{
              animation: `float ${4 + (i + 4) * 0.5}s ease-in-out infinite`,
              animationDelay: `${(i + 4) * 0.3}s`,
            }}
          >
            <img
              src={img.src}
              alt={img.alt}
              className="w-full h-full object-cover transition-all duration-500 group-hover:brightness-110 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-foreground/5 group-hover:bg-transparent transition-all duration-300" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default IntroScreen;
