import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { Producto } from "../../api/products";
import type { ProductMarketingContent } from "../../types/marketing";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { applyPromo, LAUNCH_PROMO_ACTIVE, LAUNCH_DISCOUNT } from "../../config/promo";

interface ProductHeroProps {
  product: Producto;
  marketing: ProductMarketingContent | null;
  variantes: Producto[];
  onNotifyStock: () => void;
  reviewsMedia: number;
  reviewsTotal: number;
}

export const ProductHero: React.FC<ProductHeroProps> = ({
  product,
  marketing,
  variantes,
  onNotifyStock,
  reviewsMedia,
  reviewsTotal,
}) => {
  const { addItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [quantity, setQuantity] = useState(1);
  const [selectedImg, setSelectedImg] = useState<string | null>(null);

  // Galería de imágenes válidas filtrando nulos o vacíos
  const validUrls = [
    product.imagen,
    product.imagen2,
    product.imagen3,
    product.imagen4,
  ].filter((url): url is string => typeof url === "string" && url.trim().length > 0);

  useEffect(() => {
    if (validUrls.length > 0) {
      setSelectedImg(validUrls[0]);
    }
  }, [product.id]); // Reactivar si cambia el producto

  const name = product.nombre;
  const brand = marketing?.brand || product.manufacturer || "AGE Parfums";
  const precioPVP = product.precioPVP ?? product.precio;
  const precioFinal = product.enOferta
    ? (product.precioOferta ?? applyPromo(precioPVP))
    : applyPromo(precioPVP);
  const hayDescuento = product.enOferta || LAUNCH_PROMO_ACTIVE;
  const inWishlist = isInWishlist(product.id);
  const outOfStock = product.stock === 0;

  const handleAddToCart = async () => {
    if (outOfStock) {
      onNotifyStock();
    } else {
      await addItem(product, quantity);
    }
  };

  return (
    <section className="w-full bg-perfume-sand text-perfume-green font-display pt-6 pb-12 md:py-16 border-b border-perfume-sand-dark">
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-10">
        
        {/* Breadcrumb SEO */}
        <nav className="mb-6 md:mb-10 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-perfume-green/50">
          <Link to="/" className="hover:text-perfume-green transition-colors">Inicio</Link>
          <span className="material-symbols-outlined !text-[12px]">chevron_right</span>
          <Link to="/catalog" className="hover:text-perfume-green transition-colors">Catálogo</Link>
          <span className="material-symbols-outlined !text-[12px]">chevron_right</span>
          <span className="text-perfume-green font-black">{name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
          
          {/* Columna Izquierda: Galería de Imágenes */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="relative aspect-square w-full bg-white rounded-[2rem] p-6 md:p-12 flex items-center justify-center border border-perfume-sand-dark shadow-sm group overflow-hidden">
              
              {outOfStock && (
                <div className="absolute top-4 left-4 z-10">
                  <span className="bg-rose-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    Próximamente
                  </span>
                </div>
              )}
              {!outOfStock && product.enOferta && (
                <div className="absolute top-4 left-4 z-10">
                  <span className="bg-perfume-lime text-perfume-green text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    Oferta
                  </span>
                </div>
              )}

              {selectedImg ? (
                <motion.img
                  key={selectedImg}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  src={selectedImg}
                  alt={name}
                  className="max-w-[85%] max-h-[85%] object-contain transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-perfume-green/20">
                  <span className="material-symbols-outlined text-5xl">hide_image</span>
                  <span className="text-[10px] font-black uppercase tracking-wider">Sin imagen</span>
                </div>
              )}

              {/* Botón Wishlist */}
              <button
                onClick={() => toggleWishlist(product)}
                className={`absolute top-4 right-4 p-2.5 rounded-full border transition-all duration-300 shadow-sm
                  ${inWishlist 
                    ? "bg-perfume-green border-perfume-green text-perfume-lime" 
                    : "bg-white/80 hover:bg-white text-perfume-green/60 hover:text-rose-500 border-perfume-sand-dark"
                  }`}
                aria-label="Añadir a deseos"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {inWishlist ? "favorite" : "favorite_border"}
                </span>
              </button>
            </div>

            {/* Thumbnails */}
            {validUrls.length > 1 && (
              <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
                {validUrls.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImg(url)}
                    className={`size-20 rounded-xl bg-white p-2 border-2 transition-all shrink-0 overflow-hidden shadow-sm flex items-center justify-center
                      ${selectedImg === url ? "border-perfume-green" : "border-transparent opacity-60 hover:opacity-100"}`}
                  >
                    <img src={url} alt={`vista-${i}`} className="max-w-full max-h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Columna Derecha: Información y Compra */}
          <div className="lg:col-span-6 flex flex-col">
            <span className="text-[10px] font-black tracking-[0.3em] text-perfume-green/60 uppercase mb-2">
              {brand}
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-perfume-green mb-3 leading-tight tracking-tight uppercase">
              {name}
            </h1>

            {/* Valoraciones Rápidas */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex text-perfume-green">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span
                    key={s}
                    className={`material-symbols-outlined !text-[15px] ${
                      s <= Math.round(reviewsMedia) ? "text-perfume-green fill-current" : "text-perfume-green/20"
                    }`}
                  >
                    star
                  </span>
                ))}
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-perfume-green/50">
                {reviewsTotal > 0 ? `${reviewsTotal} opiniones` : "Sin opiniones aún"}
              </span>
            </div>

            {/* EAN */}
            {product.ean && (
              <div className="text-[9px] uppercase tracking-widest text-perfume-green/40 font-bold mb-6">
                <span>EAN: </span>
                <span className="text-perfume-green/70 font-black">{product.ean}</span>
              </div>
            )}

            {/* Precios y Stock */}
            <div className="flex flex-wrap items-baseline gap-4 mb-6 pb-6 border-b border-perfume-sand-dark">
              <span className="text-3xl font-black text-perfume-green">
                {precioFinal.toFixed(2)} €
              </span>
              {hayDescuento && (
                <span className="text-sm text-perfume-green/40 line-through">
                  {precioPVP.toFixed(2)} €
                </span>
              )}
              {product.enOferta && (
                <span className="text-[9px] font-black text-perfume-green bg-perfume-lime/20 px-3 py-1 rounded-full border border-perfume-lime/30 uppercase tracking-widest">
                  Oferta
                </span>
              )}
              {!product.enOferta && LAUNCH_PROMO_ACTIVE && (
                <span className="text-[9px] font-black text-perfume-green bg-perfume-lime/20 px-3 py-1 rounded-full border border-perfume-lime/30 uppercase tracking-widest">
                  -{Math.round(LAUNCH_DISCOUNT * 100)}% Lanzamiento
                </span>
              )}
            </div>

            {/* Selector de Tamaños (Variantes) */}
            {variantes.length > 0 && (
              <div className="mb-6">
                <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-perfume-green/40 mb-3 flex items-center gap-1.5">
                  <span className="material-symbols-outlined !text-[12px]">straighten</span> Selección de Tamaño:
                </h4>
                <div className="flex flex-wrap gap-2">
                  <div className="px-4 py-2 rounded-xl bg-perfume-green text-perfume-sand text-[9px] font-black border border-perfume-green shadow-sm cursor-default uppercase">
                    {name.match(/\d+\s*ml/i)?.[0] || "Actual"}
                  </div>
                  {variantes.map((v) => (
                    <Link
                      key={v.id}
                      to={`/product/${v.slug || v.id}`}
                      className="px-4 py-2 rounded-xl border border-perfume-sand-dark text-perfume-green/50 text-[9px] font-black hover:border-perfume-green hover:text-perfume-green transition-all bg-white"
                    >
                      {v.nombre.match(/\d+\s*ml/i)?.[0] || "Ver opción"}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Selector de cantidad y Botón Añadir */}
            <div className="flex flex-wrap sm:flex-nowrap gap-4 items-center mb-6">
              
              {!outOfStock && (
                <div className="flex items-center border border-perfume-sand-dark bg-white rounded-full p-1.5 shadow-sm">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="size-8 rounded-full flex items-center justify-center hover:bg-perfume-sand text-perfume-green/70 transition-all font-black text-sm"
                  >
                    —
                  </button>
                  <span className="w-10 text-center text-xs font-black text-perfume-green">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    className="size-8 rounded-full flex items-center justify-center hover:bg-perfume-sand text-perfume-green/70 transition-all font-black text-sm"
                  >
                    +
                  </button>
                </div>
              )}

              <button
                onClick={handleAddToCart}
                className={`flex-grow h-14 rounded-full font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-md
                  ${outOfStock
                    ? "bg-rose-600 hover:bg-rose-700 text-white"
                    : "bg-perfume-green text-perfume-sand hover:bg-perfume-lime hover:text-perfume-green"
                  }`}
              >
                <span>{outOfStock ? "Avisarme cuando haya stock" : "Añadir al Carrito"}</span>
                <span className="material-symbols-outlined !text-[18px]">
                  {outOfStock ? "notifications" : "shopping_cart"}
                </span>
              </button>
            </div>

            {/* Mensajes de Confianza Rápida */}
            <div className="flex flex-col gap-3 py-4 px-5 rounded-2xl bg-white border border-perfume-sand-dark text-[10px] text-perfume-green/70">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined !text-[16px] text-perfume-green">verified</span>
                <span>Garantía de Originalidad: Fragancias 100% auténticas de distribución oficial.</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined !text-[16px] text-perfume-green">local_shipping</span>
                <span>Envío en 24-48h laborables. Gratis en pedidos superiores a 49€.</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
