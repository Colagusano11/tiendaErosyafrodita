import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import logo from "../assets/logo-eros.png";
import { LAUNCH_PROMO_ACTIVE, LAUNCH_DISCOUNT } from "../config/promo";

const STORAGE_KEY = "launchModalDismissed";

const LaunchModal: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Si la promo de lanzamiento está desactivada, no mostrar el modal
    if (!LAUNCH_PROMO_ACTIVE) return;
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      const timer = setTimeout(() => setVisible(true), 900);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="launch-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}
        >
          <motion.div
            key="launch-modal"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-lg bg-[#0f0f0f] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black"
          >
            {/* Botón cerrar */}
            <button
              onClick={dismiss}
              className="absolute top-5 right-5 z-10 size-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>

            {/* Franja superior dorada */}
            <div className="h-1.5 w-full bg-gradient-to-r from-primary via-yellow-300 to-primary" />

            {/* Contenido */}
            <div className="flex flex-col items-center text-center px-10 pt-10 pb-10 gap-5">

              {/* Logo */}
              <img src={logo} alt="Eros & Afrodita" className="h-14 object-contain" />

              {/* Badge lanzamiento */}
              <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5">
                <span className="material-symbols-outlined text-primary text-sm">rocket_launch</span>
                <span className="text-primary text-[10px] font-black uppercase tracking-[0.25em]">
                  Gran Inauguración
                </span>
              </div>

              {/* Titular */}
              <div className="flex flex-col gap-1">
                <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white leading-none">
                  Bienvenido/a a<br />
                  <span className="text-primary">Eros & Afrodita</span>
                </h2>
                <p className="text-slate-400 text-sm font-medium mt-2 leading-relaxed">
                  Tu destino de perfumería y cosmética premium. Celebra nuestro lanzamiento con una oferta exclusiva.
                </p>
              </div>

              {/* Caja de oferta */}
              <div className="w-full bg-primary/5 border border-primary/20 rounded-2xl p-5 flex flex-col items-center gap-3">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  Oferta de lanzamiento
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-black italic text-primary leading-none">
                    {Math.round(LAUNCH_DISCOUNT * 100)}%
                  </span>
                  <span className="text-white font-black uppercase text-lg leading-tight">de descuento<br />en toda la tienda</span>
                </div>

                {/* Aviso automático */}
                <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-5 py-3 w-full justify-center">
                  <span className="material-symbols-outlined text-emerald-400 text-sm">auto_awesome</span>
                  <span className="text-emerald-400 font-black text-[10px] uppercase tracking-[0.2em]">
                    Descuento aplicado automáticamente
                  </span>
                </div>

                <p className="text-slate-600 text-[9px] font-bold uppercase tracking-widest text-center">
                  Sin códigos · Todos los productos · Tiempo limitado
                </p>
              </div>

              {/* CTAs */}
              <div className="flex flex-col gap-3 w-full">
                <Link
                  to="/login"
                  onClick={dismiss}
                  className="w-full h-13 py-3.5 bg-primary hover:bg-yellow-400 text-charcoal font-black text-[11px] uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-primary/25"
                >
                  <span className="material-symbols-outlined text-lg">person_add</span>
                  Regístrate y aprovecha la oferta
                </Link>
                <button
                  onClick={dismiss}
                  className="w-full py-2.5 text-slate-500 hover:text-slate-300 text-[10px] font-bold uppercase tracking-widest transition-colors"
                >
                  Solo estoy mirando por ahora
                </button>
              </div>

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LaunchModal;
