import React from "react";
import { useAlert } from "../context/AlertContext";

const AlertModal: React.FC = () => {
    const { alertState, hideAlert } = useAlert();

    if (!alertState.isOpen) return null;

    const getIcon = () => {
        switch (alertState.type) {
            case "success":
                return "check_circle";
            case "error":
                return "error";
            case "warning":
                return "warning";
            case "info":
            default:
                return "info";
        }
    };

    const getIconColor = () => {
        switch (alertState.type) {
            case "success":
                return "text-emerald-400";
            case "error":
                return "text-red-400";
            case "warning":
                return "text-amber-400";
            case "info":
            default:
                return "text-primary";
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-charcoal-surface w-full max-w-sm rounded-[2rem] border border-white/10 p-8 shadow-2xl shadow-black/80 overflow-hidden relative">
                
                <div className="flex flex-col items-center text-center">
                    <div className={`size-16 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10 ${getIconColor()}`}>
                        <span className="material-symbols-outlined text-4xl">{getIcon()}</span>
                    </div>
                    
                    <h2 className="text-xl font-bold text-white mb-2">{alertState.title}</h2>
                    <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                        {alertState.message}
                    </p>
                    
                    {alertState.onConfirm ? (
                        <div className="flex flex-col sm:flex-row gap-3 w-full">
                            <button 
                                onClick={hideAlert}
                                className="flex-1 h-12 bg-white/5 hover:bg-white/10 text-white font-bold rounded-full flex items-center justify-center transition-all active:scale-95 border border-white/10"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={() => {
                                    alertState.onConfirm?.();
                                    hideAlert();
                                }}
                                className="flex-1 h-12 bg-primary hover:bg-white text-charcoal font-bold rounded-full flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-primary/20"
                            >
                                {alertState.confirmText || "Confirmar"}
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={hideAlert}
                            className="w-full h-12 bg-primary hover:bg-white text-charcoal font-bold rounded-full flex items-center justify-center transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-primary/20"
                        >
                            Entendido
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AlertModal;
