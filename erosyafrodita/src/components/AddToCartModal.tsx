import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

const AddToCartModal: React.FC = () => {
    const { isModalOpen, lastAddedProduct, closeModal } = useCart();

    if (!isModalOpen || !lastAddedProduct) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-charcoal-surface w-full max-w-md rounded-[2.5rem] border border-white/10 p-8 shadow-2xl shadow-primary/10 overflow-hidden relative group">
                {/* Decoración de fondo */}
                <div className="absolute -top-24 -right-24 size-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex flex-col items-center text-center">
                    <div className="size-20 bg-primary/20 rounded-full flex items-center justify-center mb-6 border border-primary/30">
                        <span className="material-symbols-outlined text-primary text-4xl">check_circle</span>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-white mb-2">¡Añadido con éxito!</h2>
                    <p className="text-gray-400 text-sm mb-8">El producto ha sido añadido a tu bolsa de compra.</p>
                    
                    <div className="w-full bg-white/5 rounded-2xl p-4 flex items-center gap-4 mb-8 border border-white/5">
                        <div className="size-16 rounded-xl overflow-hidden bg-charcoal-lighter shrink-0">
                            <img 
                                src={lastAddedProduct.imagen ?? ""} 
                                alt={lastAddedProduct.nombre} 
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="text-left">
                            <h3 className="text-white font-bold text-sm line-clamp-1">{lastAddedProduct.nombre}</h3>
                            <p className="text-primary font-bold text-sm">{lastAddedProduct.precioPVP ?? lastAddedProduct.precio} €</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-col w-full gap-3">
                        <Link 
                            to="/cart" 
                            onClick={closeModal}
                            className="w-full h-12 bg-primary hover:bg-white text-charcoal font-bold rounded-full flex items-center justify-center transition-all hover:scale-[1.02] active:scale-95"
                        >
                            Ver Carrito
                        </Link>
                        <Link 
                            to="/"
                            onClick={closeModal}
                            className="w-full h-12 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-full border border-white/10 transition-all flex items-center justify-center active:scale-95"
                        >
                            Seguir Comprando
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddToCartModal;
