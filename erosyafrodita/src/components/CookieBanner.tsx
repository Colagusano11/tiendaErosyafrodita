import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

const CookieBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      // Pequeño delay para que no aparezca de golpe al cargar
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-[500px]"
        >
          <div className="bg-background-dark/80 backdrop-blur-2xl border border-white/10 p-6 md:p-8 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col gap-6">
            <div className="flex items-start gap-4">
              <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-2xl">cookie</span>
              </div>
              <div className="space-y-2">
                <h4 className="text-white font-black uppercase tracking-widest text-xs">Experiencia Divina</h4>
                <p className="text-white/50 text-[11px] leading-relaxed font-light">
                  Utilizamos cookies para personalizar tu viaje olfativo y mejorar la experiencia en el Olimpo. 
                  Al continuar, aceptas nuestra <Link to="/legal/privacidad" className="text-primary hover:underline">Política de Privacidad</Link>.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAccept}
                className="flex-1 h-12 bg-primary text-charcoal rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-white hover:scale-[1.02] transition-all shadow-lg shadow-primary/10"
              >
                Aceptar Alquimia
              </button>
              <button
                onClick={() => setIsVisible(false)}
                className="px-6 h-12 border border-white/10 text-white/40 rounded-full font-black text-[10px] uppercase tracking-widest hover:border-white/20 hover:text-white/60 transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieBanner;
