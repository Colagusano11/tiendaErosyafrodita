import React from "react";
import { Link } from "react-router-dom";
import type { Producto } from "../api/products";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { motion } from "framer-motion";
import { LAUNCH_PROMO_ACTIVE, LAUNCH_DISCOUNT, applyPromo } from "../config/promo";

import { useAuth } from "../context/AuthContext";
import { useAlert } from "../context/AlertContext";
import { suscribirAvisoStock } from "../api/stock";
import { useImageGallery } from "../hooks/useImageGallery";

interface ProductCardProps {
  product: Producto;
  onHide?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onHide }) => {
  const { addItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { isAuthenticated, user: userEmail } = useAuth();
  const { showAlert } = useAlert();
  
  // Usamos el hook para obtener solo las imágenes que funcionan
  const { validUrls, loading: imgLoading } = useImageGallery([
    product.imagen, 
    product.imagen2, 
    product.imagen3, 
    product.imagen4
  ]);

  const handleHeartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  const image = validUrls[0]; // La primera que funcione

  React.useEffect(() => {
    if (!imgLoading && !image) onHide?.();
  }, [imgLoading, image]);

  const name = product.nombre;
  const brand = product.manufacturer ?? "";
  const price = product.precioPVP ?? product.precio;

  const rating = 4.5;
  const reviewsCount = 8;

  const inWishlist = isInWishlist(product.id);
  const outOfStock = product.stock === 0;

  // Si la imagen no carga, no mostrar la tarjeta en la web
  if (!image) return null;

  const handleNotify = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    let email = userEmail;
    
    if (!isAuthenticated || !email) {
      // Si no está logueado, le pedimos un email
      const inputEmail = window.prompt("Introduce tu email para avisarte cuando vuelva a haber stock:");
      if (!inputEmail) return;
      
      // Validación básica de email
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputEmail)) {
        showAlert("Email inválido", "Por favor, introduce un correo electrónico correcto.", "error");
        return;
      }
      email = inputEmail;
    }

    try {
      await suscribirAvisoStock({ email, productoId: product.id });
      showAlert(
        "Aviso Creado",
        `Te enviaremos un correo en cuanto tengamos stock de ${product.nombre}.`,
        "success"
      );
    } catch (err) {
      showAlert("Error", "No pudimos crear el aviso. Inténtalo más tarde.", "error");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="group relative flex flex-col gap-2 sm:gap-4 rounded-xl sm:rounded-2xl bg-charcoal-surface p-2 sm:p-4 border border-white/5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer"
    >
      {/* Invisible link overlay for the whole card */}
      <Link 
        to={`/product/${product.id}`} 
        className="absolute inset-0 z-[1]" 
        aria-label={`Ver detalles de ${name}`}
      />

      {outOfStock && (
        <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-20 pointer-events-none">
          <span className="bg-red-700 text-white text-[8px] sm:text-[10px] font-black px-2 sm:px-3 py-1 rounded-full shadow-lg uppercase tracking-wider">
            Próximamente
          </span>
        </div>
      )}

      {!outOfStock && product.enOferta && (
        <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-20 pointer-events-none">
          <span className="bg-rose-500 text-white text-[8px] sm:text-[10px] font-black px-2 sm:px-3 py-1 rounded-full shadow-lg shadow-rose-500/20 uppercase italic tracking-wider animate-pulse">
            Oferta
          </span>
        </div>
      )}


      <button
        onClick={handleHeartClick}
        className={`absolute top-2 right-2 sm:top-4 sm:right-4 z-10 p-1.5 sm:p-2 rounded-full backdrop-blur-sm border transition-all duration-300
          ${
            inWishlist
              ? "bg-primary text-background-dark shadow-[0_0_15px_rgba(242,185,13,0.5)] border-primary"
              : "bg-charcoal/50 hover:bg-white text-gray-300 hover:text-red-500 border-white/10"
          }`}
      >
        <span className="material-symbols-outlined text-[16px] sm:text-[18px]">
          {inWishlist ? "favorite" : "favorite_border"}
        </span>
      </button>

      <div className="w-full aspect-square bg-white rounded-xl sm:rounded-2xl overflow-hidden relative border border-white/5 flex items-center justify-center p-4 sm:p-6">
        <img
          className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-700 drop-shadow-sm"
          src={image}
          alt={name}
          loading="lazy"
        />
      </div>

      <div className="px-1 pb-2 mt-1 relative z-0">
        {brand && (
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">
            {brand}
          </p>
        )}
        <h3 className={`text-[11px] sm:text-xs font-bold leading-tight mt-1 transition-colors ${outOfStock ? "text-white/60" : "text-white group-hover:text-primary"} line-clamp-2 min-h-[2.2rem]`}>
          {name}
        </h3>


        <div className="flex items-center justify-between mt-3">
          <div className="flex flex-col">
            {(product.enOferta || LAUNCH_PROMO_ACTIVE) && (
              <span className="text-[8px] text-gray-500 line-through font-black italic">
                {(product.precioPVP || product.precio).toFixed(2)} €
              </span>
            )}
            <span className={`text-sm font-bold text-emerald-400`}>
              {applyPromo(
                product.enOferta
                  ? (product.precioOferta || (product.precioPVP || 0) * (1 - LAUNCH_DISCOUNT))
                  : (product.precioPVP || product.precio)
              ).toFixed(2)} €
            </span>
          </div>
          <button
            className={`size-8 sm:size-9 rounded-full flex items-center justify-center transition-all duration-300 relative z-10 ${
              outOfStock 
                ? "bg-primary/20 text-primary hover:bg-primary hover:text-charcoal border border-primary/20" 
                : "bg-white/10 hover:bg-primary text-white hover:text-charcoal border border-white/5"
            }`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              outOfStock ? handleNotify(e) : addItem(product);
            }}
          >
            <span className="material-symbols-outlined !text-[16px] sm:text-[18px]">
              {outOfStock ? 'notifications' : 'add_shopping_cart'}
            </span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
