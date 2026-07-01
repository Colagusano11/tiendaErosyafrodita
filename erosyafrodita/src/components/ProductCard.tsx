import React from "react";
import { Link } from "react-router-dom";
import type { Producto } from "../api/products";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { motion, AnimatePresence } from "framer-motion";
import { LAUNCH_PROMO_ACTIVE, LAUNCH_DISCOUNT, applyPromo } from "../config/promo";
import { useAuth } from "../context/AuthContext";
import { useAlert } from "../context/AlertContext";
import { suscribirAvisoStock } from "../api/stock";
import { useImageGallery } from "../hooks/useImageGallery";
import StockAlertModal from "./StockAlertModal";

interface ProductCardProps {
  product: Producto;
  onHide?: () => void;
  rank?: number;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onHide, rank }) => {
  const { addItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { isAuthenticated, user: userEmail } = useAuth();
  const { showAlert } = useAlert();
  const [isStockModalOpen, setIsStockModalOpen] = React.useState(false);
  const [addedFeedback, setAddedFeedback] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  const { validUrls, loading: imgLoading } = useImageGallery([
    product.imagen,
    product.imagen2,
    product.imagen3,
    product.imagen4,
  ]);

  const image = validUrls[0];

  React.useEffect(() => {
    if (!imgLoading && !image) onHide?.();
  }, [imgLoading, image]);

  const name = product.nombre;
  const brand = product.manufacturer ?? "";
  const inWishlist = isInWishlist(product.id);
  const outOfStock = product.stock === 0;

  const displayPrice = applyPromo(
    product.enOferta
      ? product.precioOferta || (product.precioPVP || 0) * (1 - LAUNCH_DISCOUNT)
      : product.precioPVP || product.precio
  );
  const originalPrice = product.precioPVP || product.precio;
  const hasDiscount = product.enOferta || LAUNCH_PROMO_ACTIVE;
  const discountPct = hasDiscount
    ? Math.round((1 - displayPrice / originalPrice) * 100)
    : 0;

  if (!image) return null;

  const handleHeartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) {
      setIsStockModalOpen(true);
      return;
    }
    addItem(product);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1800);
  };

  const onStockAlertSubmit = async (email: string) => {
    try {
      await suscribirAvisoStock({ email, productoId: product.id });
      showAlert(
        "Aviso Creado",
        `Te enviaremos un correo en cuanto tengamos stock de ${product.nombre}.`,
        "success"
      );
    } catch (err) {
      showAlert("Error", "No pudimos crear el aviso. Inténtalo más tarde.", "error");
      throw err;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative flex flex-col rounded-2xl bg-charcoal-surface border border-white/5 hover:border-primary/25 transition-all duration-300 overflow-hidden cursor-pointer shadow-md hover:shadow-2xl hover:shadow-primary/10"
    >
      {/* Full-card link */}
      <Link
        to={`/product/${product.slug || product.id}`}
        className="absolute inset-0 z-[1]"
        aria-label={`Ver detalles de ${name}`}
      />

      {/* ── Rank badge ── */}
      {rank && rank <= 3 && (
        <div className="absolute top-3 left-3 z-20 pointer-events-none">
          <span
            className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest shadow-lg ${
              rank === 1
                ? "bg-amber-400 text-black shadow-amber-400/40"
                : rank === 2
                ? "bg-slate-300 text-black"
                : "bg-amber-700 text-white"
            }`}
          >
            #{rank}
          </span>
        </div>
      )}

      {/* ── Status badges ── */}
      {outOfStock && (
        <div className="absolute top-3 left-3 z-20 pointer-events-none">
          <span className="bg-red-700/90 backdrop-blur-sm text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow">
            Sin stock
          </span>
        </div>
      )}
      {!outOfStock && hasDiscount && discountPct > 0 && (
        <div className="absolute top-3 left-3 z-20 pointer-events-none">
          <span className="bg-rose-500 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow shadow-rose-500/30">
            -{discountPct}%
          </span>
        </div>
      )}
      {!outOfStock && (product as any).esNovedad && !hasDiscount && (
        <div className="absolute top-3 left-3 z-20 pointer-events-none">
          <span className="bg-primary text-charcoal text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
            Nuevo
          </span>
        </div>
      )}

      {/* ── Wishlist heart ── */}
      <button
        onClick={handleHeartClick}
        aria-label={inWishlist ? "Quitar de favoritos" : "Añadir a favoritos"}
        className={`absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-sm border transition-all duration-300 ${
          inWishlist
            ? "bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/30"
            : "bg-charcoal/60 text-gray-300 hover:bg-white hover:text-rose-500 border-white/10"
        }`}
      >
        <span className="material-symbols-outlined text-[16px]">
          {inWishlist ? "favorite" : "favorite_border"}
        </span>
      </button>

      {/* ── Product image ── */}
      <div className="relative w-full aspect-square bg-white overflow-hidden">
        <img
          className="w-full h-full object-contain p-5 transition-transform duration-700"
          style={{ transform: isHovered ? "scale(1.07)" : "scale(1)" }}
          src={image}
          alt={name}
          loading="lazy"
          width={300}
          height={300}
        />

        {/* Quick-add overlay — desktop only */}
        <AnimatePresence>
          {isHovered && !outOfStock && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.18 }}
              className="hidden sm:flex absolute bottom-0 inset-x-0 z-10 pb-3 justify-center"
            >
              <button
                onClick={handleAddToCart}
                className="relative z-10 flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-charcoal text-xs font-bold shadow-lg shadow-primary/40 hover:bg-amber-400 active:scale-95 transition-all duration-150"
              >
                <span className="material-symbols-outlined !text-[15px]">add_shopping_cart</span>
                Añadir al carrito
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Info area ── */}
      <div className="flex flex-col gap-1.5 p-3 pt-2.5">
        {brand && (
          <p className="text-[9px] font-bold text-primary/70 uppercase tracking-widest">
            {brand}
          </p>
        )}
        <h3
          className={`text-[11px] sm:text-xs font-semibold leading-snug line-clamp-2 min-h-[2.4rem] transition-colors ${
            outOfStock ? "text-white/50" : "text-white group-hover:text-primary"
          }`}
        >
          {name}
        </h3>

        {/* Price + cart button row */}
        <div className="flex items-center justify-between mt-1">
          <div className="flex flex-col leading-none">
            {hasDiscount && (
              <span className="text-[9px] text-gray-500 line-through">
                {originalPrice.toFixed(2)} €
              </span>
            )}
            <span className="text-sm font-bold text-emerald-400">
              {displayPrice.toFixed(2)} €
            </span>
          </div>

          {/* Animated cart / check / notify button */}
          <AnimatePresence mode="wait">
            {addedFeedback ? (
              <motion.div
                key="ok"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="size-9 rounded-full flex items-center justify-center bg-emerald-500 text-white shadow shadow-emerald-500/30"
              >
                <span className="material-symbols-outlined !text-[16px]">check</span>
              </motion.div>
            ) : (
              <motion.button
                key="add"
                whileTap={{ scale: 0.85 }}
                onClick={handleAddToCart}
                aria-label={outOfStock ? "Avisarme cuando haya stock" : "Añadir al carrito"}
                className={`relative z-10 size-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                  outOfStock
                    ? "bg-primary/15 text-primary hover:bg-primary hover:text-charcoal border border-primary/30"
                    : "bg-white/8 hover:bg-primary text-gray-300 hover:text-charcoal border border-white/8"
                }`}
              >
                <span className="material-symbols-outlined !text-[16px]">
                  {outOfStock ? "notifications" : "add_shopping_cart"}
                </span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      <StockAlertModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        onSubmit={onStockAlertSubmit}
        productName={product.nombre}
      />
    </motion.div>
  );
};

export default ProductCard;
