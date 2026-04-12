import React from "react";
import { Link } from "react-router-dom";
import type { Producto } from "../api/products";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { motion } from "framer-motion";
import { LAUNCH_PROMO_ACTIVE, LAUNCH_DISCOUNT, applyPromo } from "../config/promo";

import { useImageGallery } from "../hooks/useImageGallery";

interface ProductCardProps {
  product: Producto;
  onHide?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onHide }) => {
  const { addItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  
  // Usamos el hook para obtener solo las imágenes que funcionan
  const { validUrls, loading: imgLoading } = useImageGallery([
    product.imagen, 
    product.imagen2, 
    product.imagen3, 
    product.imagen4
  ]);

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

  const handleHeartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product);        // solo añade / quita, no navega
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="group relative flex flex-col gap-4 rounded-2xl bg-charcoal-surface p-4 border border-white/5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
    >
      {outOfStock && (
        <div className="absolute top-4 left-4 z-20">
          <span className="bg-red-700 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg uppercase tracking-wider">
            Próximamente
          </span>
        </div>
      )}

      {!outOfStock && product.enOferta && (
        <div className="absolute top-4 left-4 z-20">
          <span className="bg-rose-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg shadow-rose-500/20 uppercase italic tracking-wider animate-pulse">
            Oferta
          </span>
        </div>
      )}


      <button
        onClick={handleHeartClick}
        className={`absolute top-4 right-4 z-10 p-2 rounded-full backdrop-blur-sm border transition-all duration-300
          ${
            inWishlist
              ? "bg-primary text-background-dark shadow-[0_0_15px_rgba(242,185,13,0.5)] border-primary"
              : "bg-charcoal/50 hover:bg-white text-gray-300 hover:text-red-500 border-white/10"
          }`}
      >
        <span className="material-symbols-outlined text-[18px]">
          {inWishlist ? "favorite" : "favorite_border"}
        </span>
      </button>

      <Link
        to={`/product/${product.id}`}
        className="w-full aspect-square bg-charcoal-lighter rounded-xl overflow-hidden relative"
      >
        <img
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
          src={image}
          alt={name}
          loading="lazy"
        />
      </Link>

      <div className="px-1 pb-2 mt-1">
        {brand && (
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">
            {brand}
          </p>
        )}
        <Link to={`/product/${product.id}`}>
          <h3 className={`text-xs font-bold leading-tight mt-1 transition-colors ${outOfStock ? "text-white/60" : "text-white group-hover:text-primary"}`}>
            {name}
          </h3>
        </Link>


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
            className={`size-9 rounded-full flex items-center justify-center transition-colors ${outOfStock ? "bg-white/5 text-gray-600 cursor-not-allowed" : "bg-white/10 hover:bg-primary text-white hover:text-charcoal"}`}
            onClick={() => !outOfStock && addItem(product)}
            disabled={outOfStock}
          >
            <span className="material-symbols-outlined !text-[18px]">{outOfStock ? 'block' : 'add_shopping_cart'}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
