import React, { useState } from "react";
import type { Producto } from "../../api/products";
import type { ProductMarketingContent } from "../../types/marketing";
import { useCart } from "../../context/CartContext";
import { applyPromo, LAUNCH_PROMO_ACTIVE, LAUNCH_DISCOUNT } from "../../config/promo";

interface ProductPurchaseCardProps {
  product: Producto;
  marketing: ProductMarketingContent | null;
  onNotifyStock: () => void;
}

export const ProductPurchaseCard: React.FC<ProductPurchaseCardProps> = ({
  product,
  marketing,
  onNotifyStock,
}) => {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [addLabel, setAddLabel] = useState("Añadir al Carrito");

  const outOfStock = product.stock === 0;
  const name = product.nombre;
  const size = name.match(/\d+\s*ml/i)?.[0] || "100 ml";
  const brand = marketing?.brand || product.manufacturer || "Lacoste";
  
  const precioPVP = product.precioPVP ?? product.precio;
  const precioFinal = product.enOferta
    ? (product.precioOferta ?? applyPromo(precioPVP))
    : applyPromo(precioPVP);
  
  const hayDescuento = product.enOferta || LAUNCH_PROMO_ACTIVE;
  const descuentoPct = product.enOferta 
    ? Math.round(((precioPVP - precioFinal) / precioPVP) * 100)
    : Math.round(LAUNCH_DISCOUNT * 100);

  const incQty = () => {
    setQty((q) => Math.min(q + 1, product.stock || 10));
  };

  const decQty = () => {
    setQty((q) => Math.max(q - 1, 1));
  };

  const handleAddToCart = async () => {
    if (outOfStock) {
      onNotifyStock();
    } else {
      setAddLabel("Agregado ✓");
      await addItem(product, qty);
      setTimeout(() => {
        setAddLabel("Añadir al Carrito");
      }, 2000);
    }
  };

  return (
    <section id="comprar" className="w-full bg-perfume-sand text-perfume-green font-display py-16 md:py-24 border-b border-perfume-sand-dark">
      <div className="w-full max-w-[950px] mx-auto px-4">
        
        {/* Contenedor de Compra Adaptado a la Estética Premium */}
        <div className="bg-white border border-perfume-sand-dark rounded-[2.5rem] p-8 md:p-14 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-14 items-center shadow-md">
          
          {/* Miniatura del producto (Izquierda) */}
          <div className="md:col-span-5 bg-perfume-sand-dark p-6 rounded-3xl aspect-square flex items-center justify-center border border-perfume-sand-dark/60 shadow-inner">
            <img
              src={product.imagen || "/uploads/lacoste1.jpg"}
              alt={name}
              className="max-w-[85%] max-h-[85%] object-contain"
            />
          </div>

          {/* Información y Compra (Derecha) */}
          <div className="md:col-span-7 flex flex-col items-start text-left">
            {/* Status */}
            <div className="text-[10px] font-black text-perfume-green/60 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
              <span className="size-2 rounded-full bg-perfume-lime animate-pulse"></span>
              <span>Envío Gratis · Stock Disponible</span>
            </div>

            {/* Nombre y Tamaño */}
            <h3 className="text-xl md:text-2xl font-black text-perfume-green mb-3 uppercase tracking-tight">
              {brand} {name.split(" ").slice(1).join(" ")} · {size}
            </h3>
            
            {/* Descripción */}
            <p className="text-xs text-perfume-green/70 font-light leading-relaxed mb-6">
              {product.descripcion || "Eau de Toilette vaporisateur natural spray. Fragancia 100% original y sellada, lista para enviar hoy mismo."}
            </p>

            {/* Precios y Descuento */}
            <div className="flex items-baseline gap-4 mb-8">
              <span className="text-3xl font-black text-perfume-green">
                {precioFinal.toFixed(2)} €
              </span>
              {hayDescuento && (
                <>
                  <span className="text-base text-perfume-green/40 line-through">
                    {precioPVP.toFixed(2)} €
                  </span>
                  <span className="text-[10px] font-black text-perfume-green bg-perfume-lime/25 px-3 py-1 rounded-full border border-perfume-lime/30 uppercase tracking-widest">
                    -{descuentoPct}%
                  </span>
                </>
              )}
            </div>

            {/* Selector de Cantidad e Interactive CTA */}
            <div className="flex flex-wrap sm:flex-nowrap gap-4 items-center w-full">
              
              {!outOfStock && (
                <div className="flex items-center border border-perfume-sand-dark bg-perfume-sand rounded-2xl p-1 shadow-sm shrink-0">
                  <button
                    onClick={decQty}
                    className="size-11 rounded-xl flex items-center justify-center hover:bg-white text-perfume-green/70 transition-all font-black text-sm"
                  >
                    –
                  </button>
                  <span className="w-10 text-center text-xs font-black text-perfume-green">{qty}</span>
                  <button
                    onClick={incQty}
                    className="size-11 rounded-xl flex items-center justify-center hover:bg-white text-perfume-green/70 transition-all font-black text-sm"
                  >
                    +
                  </button>
                </div>
              )}

              <button
                onClick={handleAddToCart}
                className={`flex-grow h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-md
                  ${outOfStock
                    ? "bg-rose-600 hover:bg-rose-700 text-white"
                    : "bg-perfume-green text-perfume-sand hover:bg-perfume-lime hover:text-perfume-green"
                  }`}
              >
                <span>{outOfStock ? "Avisarme cuando haya stock" : addLabel}</span>
                <span className="material-symbols-outlined !text-[18px]">
                  {outOfStock ? "notifications" : "shopping_cart"}
                </span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
