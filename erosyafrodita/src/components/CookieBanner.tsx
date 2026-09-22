import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { getConsent, setConsent, useCookieBannerLikelyVisible } from "../lib/consent";
import { loadAnalyticsIfConsented } from "../lib/analyticsLoader";

const CookieBanner: React.FC = () => {
  const isVisible = useCookieBannerLikelyVisible();

  useEffect(() => {
    if (getConsent() === "accepted") {
      loadAnalyticsIfConsented();
    }
  }, []);

  const handleAccept = () => {
    setConsent("accepted");
    loadAnalyticsIfConsented();
  };

  const handleReject = () => {
    setConsent("rejected");
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-1.5rem)] sm:w-[90%] max-w-[500px]"
        >
          <div className="bg-charcoal border border-white/10 p-3.5 sm:p-8 rounded-2xl sm:rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col gap-3 sm:gap-6">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="hidden sm:flex size-12 rounded-2xl bg-primary/10 items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-2xl">cookie</span>
              </div>
              <div className="space-y-1 sm:space-y-2">
                <h4 className="text-white font-black uppercase tracking-widest text-[10px] sm:text-xs">Uso de cookies</h4>
                <p className="text-white/60 text-[10px] sm:text-[11px] leading-relaxed font-medium">
                  Utilizamos cookies propias necesarias para la tienda y, si lo aceptas, cookies de analítica y publicidad
                  para medir visitas y mostrarte anuncios relevantes. Consulta nuestra{" "}
                  <Link to="/legal/privacidad" className="text-primary hover:underline">Política de Privacidad</Link>.
                </p>
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={handleReject}
                className="flex-1 h-9 sm:h-12 border border-white/10 text-white/60 rounded-full font-black text-[9px] sm:text-[10px] uppercase tracking-widest hover:border-white/20 hover:text-white transition-all"
              >
                Rechazar
              </button>
              <button
                onClick={handleAccept}
                className="flex-1 h-9 sm:h-12 bg-primary text-charcoal rounded-full font-black text-[9px] sm:text-[10px] uppercase tracking-widest hover:bg-white hover:scale-[1.02] transition-all shadow-lg shadow-primary/10"
              >
                Aceptar
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieBanner;
