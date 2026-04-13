import React from "react";
import { useAlert } from "../context/AlertContext";
import { motion, AnimatePresence } from "framer-motion";

const AlertModal: React.FC = () => {
    const { alertState, hideAlert } = useAlert();

    const getIcon = () => {
        switch (alertState.type) {
            case "success": return "verified";
            case "error": return "error_meditate";
            case "warning": return "warning";
            case "info":
            default: return "info";
        }
    };

    const getColorClass = () => {
        switch (alertState.type) {
            case "success": return "from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/20";
            case "error": return "from-rose-500/20 to-rose-500/5 text-rose-400 border-rose-500/20";
            case "warning": return "from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/20";
            case "info":
            default: return "from-primary/20 to-primary/5 text-primary border-primary/20";
        }
    };

    return (
        <AnimatePresence>
            {alertState.isOpen && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={hideAlert}
                        className="absolute inset-0 bg-charcoal/80 backdrop-blur-md"
                    />
                    
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative bg-charcoal-surface w-full max-w-[90%] sm:max-w-sm rounded-[2rem] sm:rounded-[2.5rem] border border-white/10 p-6 sm:p-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden"
                    >
                        {/* Glow effect */}
                        <div className={`absolute -top-24 left-1/2 -translate-x-1/2 size-40 sm:size-48 rounded-full blur-[60px] sm:blur-[80px] opacity-30 bg-gradient-to-b ${getColorClass().split(' ').slice(0,1)}`} />
                        
                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className={`size-16 sm:size-20 rounded-full bg-gradient-to-tr flex items-center justify-center mb-4 sm:mb-6 border shadow-inner ${getColorClass()}`}>
                                <span className="material-symbols-outlined text-[30px] sm:text-[40px] font-light">{getIcon()}</span>
                            </div>
                            
                            <h2 className="text-xl sm:text-2xl font-black text-white mb-2 tracking-tighter uppercase px-2">
                                {alertState.title}
                            </h2>
                            <p className="text-white/50 text-[11px] sm:text-[13px] mb-6 sm:mb-8 leading-relaxed font-light px-2">
                                {alertState.message}
                            </p>
                            
                            {alertState.onConfirm ? (
                                <div className="flex flex-col gap-3 w-full">
                                    <div className="flex gap-3 w-full">
                                        <button 
                                            onClick={hideAlert}
                                            className="flex-1 h-12 sm:h-14 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white font-black text-[9px] sm:text-[10px] uppercase tracking-widest rounded-xl sm:rounded-2xl border border-white/5 transition-all active:scale-95"
                                        >
                                            Cancelar
                                        </button>
                                        <button 
                                            onClick={() => {
                                                alertState.onConfirm?.();
                                                hideAlert();
                                            }}
                                            className="flex-1 h-12 sm:h-14 bg-primary hover:bg-white text-charcoal font-black text-[9px] sm:text-[10px] uppercase tracking-widest rounded-xl sm:rounded-2xl transition-all active:scale-95 shadow-xl shadow-primary/20"
                                        >
                                            {alertState.confirmText || "Confirmar"}
                                        </button>
                                    </div>
                                    {alertState.onSecondary && (
                                        <button 
                                            onClick={() => {
                                                alertState.onSecondary?.();
                                                hideAlert();
                                            }}
                                            className="w-full h-12 sm:h-14 bg-violet-600 hover:bg-white text-white hover:text-charcoal font-black text-[9px] sm:text-[10px] uppercase tracking-widest rounded-xl sm:rounded-2xl transition-all active:scale-95 shadow-xl shadow-violet-600/20 mt-1"
                                        >
                                            {alertState.secondaryText || "Secundario"}
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <button 
                                    onClick={hideAlert}
                                    className="w-full h-12 sm:h-14 bg-primary hover:bg-white text-charcoal font-black text-[9px] sm:text-[10px] uppercase tracking-widest rounded-xl sm:rounded-2xl transition-all hover:shadow-2xl shadow-xl shadow-primary/20 active:scale-95"
                                >
                                    Continuar
                                </button>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AlertModal;
