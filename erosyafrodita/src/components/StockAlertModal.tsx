import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface StockAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string) => Promise<void>;
  productName: string;
}

const StockAlertModal: React.FC<StockAlertModalProps> = ({ isOpen, onClose, onSubmit, productName }) => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Por favor, introduce un email válido.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(email);
      onClose();
      setEmail("");
    } catch (err) {
      setError("Hubo un problema al registrar tu aviso. Inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background-dark/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-charcoal p-8 rounded-[2.5rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
            
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 size-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:bg-primary/20 hover:text-primary transition-all"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6">
                <span className="material-symbols-outlined text-3xl">notifications_active</span>
              </div>
              
              <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">Aviso de Stock</h3>
              <p className="text-white/40 text-xs font-medium uppercase tracking-widest mb-8 px-4">
                Te avisaremos en cuanto <span className="text-primary italic font-serif lowercase">{productName}</span> esté disponible de nuevo.
              </p>

              <form onSubmit={handleSubmit} className="w-full">
                <div className="mb-6">
                  <input
                    type="email"
                    placeholder="Tu correo electrónico"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/30 border border-white/5 rounded-2xl p-4 text-sm focus:border-primary/50 outline-none font-light text-white/70 placeholder:text-white/20 transition-all text-center"
                    autoFocus
                  />
                  {error && (
                    <p className="text-red-400 text-[10px] font-bold mt-2 uppercase tracking-widest">
                      {error}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-primary text-charcoal rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white hover:scale-[1.02] transition-all shadow-lg shadow-primary/10 disabled:opacity-50"
                >
                  {isSubmitting ? "Registrando..." : "Activar Ritual de Aviso"}
                </button>
              </form>
              
              <p className="mt-6 text-[8px] font-bold text-white/20 uppercase tracking-[0.2em]">
                Privacidad garantizada. Sin spam, solo esencia.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default StockAlertModal;
