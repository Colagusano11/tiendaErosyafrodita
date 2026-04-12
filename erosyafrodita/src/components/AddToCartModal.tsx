import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { motion, AnimatePresence } from "framer-motion";

const AddToCartModal: React.FC = () => {
    const { isModalOpen, lastAddedProduct, closeModal } = useCart();

    return (
        <AnimatePresence>
            {isModalOpen && lastAddedProduct && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeModal}
                        className="absolute inset-0 bg-charcoal/80 backdrop-blur-md"
                    />
                    
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative bg-charcoal-surface w-full max-w-sm rounded-[2.5rem] border border-white/10 p-8 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.8)] overflow-hidden"
                    >
                        {/* Glow effect */}
                        <div className="absolute -top-24 left-1/2 -translate-x-1/2 size-48 bg-emerald-500/20 rounded-full blur-[80px] opacity-30" />
                        
                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="size-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6 border border-emerald-500/20 shadow-inner">
                                <span className="material-symbols-outlined text-emerald-400 text-[40px] font-light">shopping_basket</span>
                            </div>
                            
                            <h2 className="text-2xl font-black text-white mb-2 tracking-tighter uppercase">¡Añadido con éxito!</h2>
                            <p className="text-white/50 text-[13px] mb-8 leading-relaxed font-light">Este tesoro ha sido incluido en tu bolsa de compra.</p>
                            
                            <div className="w-full bg-white/5 rounded-3xl p-4 flex items-center gap-4 mb-8 border border-white/5">
                                <div className="size-16 rounded-2xl overflow-hidden bg-white p-2 shrink-0 shadow-xl">
                                    <img 
                                        src={lastAddedProduct.imagen ?? ""} 
                                        alt={lastAddedProduct.nombre} 
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <div className="text-left overflow-hidden">
                                    <h3 className="text-white font-bold text-xs truncate uppercase tracking-widest">{lastAddedProduct.nombre}</h3>
                                    <p className="text-primary font-black text-sm mt-0.5">{lastAddedProduct.precioPVP ?? lastAddedProduct.precio} €</p>
                                </div>
                            </div>
                            
                            <div className="flex flex-col w-full gap-3">
                                <Link 
                                    to="/cart" 
                                    onClick={closeModal}
                                    className="w-full h-14 bg-primary hover:bg-white text-charcoal font-black text-[10px] uppercase tracking-widest rounded-2xl flex items-center justify-center transition-all shadow-xl shadow-primary/20 active:scale-95"
                                >
                                    Finalizar Compra
                                </Link>
                                <button 
                                    onClick={closeModal}
                                    className="w-full h-12 text-white/40 hover:text-white font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95"
                                >
                                    Seguir Explorando
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AddToCartModal;
