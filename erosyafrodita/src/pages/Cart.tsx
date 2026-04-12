import React from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useCart } from "../context/CartContext";
import { LAUNCH_PROMO_ACTIVE, LAUNCH_DISCOUNT } from "../config/promo";

const Cart: React.FC = () => {
  const { items, addItem, removeItem, clearCart, total: rawTotal } = useCart();

  // El total ya viene como PVP desde el backend
  const total: number = rawTotal;
  const itemCount: number = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="bg-background-dark font-display text-white min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 md:px-10 py-10">
        <h1 className="text-2xl sm:text-4xl font-extrabold mb-6 sm:mb-8">
          Tu Carrito{" "}
          <span className="text-primary text-lg sm:text-2xl font-medium ml-2">
            ({itemCount} artículos)
          </span>
        </h1>

        {items.length === 0 ? (
          <div className="text-gray-400">
            <p className="mb-4">Tu carrito está vacío.</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80"
            >
              Seguir comprando
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-6">
              {items.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] bg-surface-dark border border-border-dark"
                >
                  <div className="w-24 sm:w-32 aspect-square shrink-0 rounded-xl sm:rounded-2xl overflow-hidden bg-white p-2">
                    <div
                      className="w-full h-full bg-contain bg-center bg-no-repeat"
                      style={{ backgroundImage: `url('${product.imagen}')` }}
                    />
                  </div>
                  <div className="flex-1 w-full text-center sm:text-left">
                    <div className="flex justify-between mb-2">
                      <div>
                        <h3 className={`text-base sm:text-lg font-bold ${product.stock === 0 ? "text-red-500 line-through" : "text-white"}`}>
                          {product.nombre}
                        </h3>
                        {product.stock === 0 && (
                          <span className="text-[10px] text-red-400 font-semibold">Próximamente</span>
                        )}
                        <p className="text-xs sm:text-sm text-gray-400">
                          {product.manufacturer}
                        </p>
                      </div>
                      <span className="text-xl font-bold text-white">
                        {product.precioUnitario ? product.precioUnitario.toFixed(2) : (product.precioPVP ?? product.precio).toFixed(2)} €
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center bg-background-dark rounded-full p-1 border border-border-dark">
                        <button
                          className="size-8 flex items-center justify-center rounded-full hover:bg-surface-dark text-gray-400"
                          onClick={() => removeItem(product.id)}
                        >
                          <span className="material-symbols-outlined !text-[18px]">
                            remove
                          </span>
                        </button>
                        <span className="w-8 text-center font-bold text-sm">
                          {quantity}
                        </span>
                        <button
                          className="size-8 flex items-center justify-center rounded-full hover:bg-surface-dark text-gray-400"
                          onClick={() => addItem(product, false)}
                        >
                          <span className="material-symbols-outlined !text-[18px]">
                            add
                          </span>
                        </button>
                      </div>
                      <button
                        className="flex items-center gap-1 text-sm text-gray-400 hover:text-red-400"
                        onClick={() => {
                          for (let i = 0; i < quantity; i++) {
                            removeItem(product.id);
                          }
                        }}
                      >
                        <span className="material-symbols-outlined !text-[18px]">
                          delete
                        </span>
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-28 bg-surface-dark rounded-[2rem] p-8 border border-border-dark">
                <h3 className="text-2xl font-bold mb-6 text-white">Resumen</h3>
                <div className="space-y-4 mb-6 text-sm text-gray-400">
                  {LAUNCH_PROMO_ACTIVE && (
                    <div className="flex justify-between">
                      <span>Precio original</span>
                      <span className="text-white/40 line-through">
                        {(total / (1 - LAUNCH_DISCOUNT)).toFixed(2)} €
                      </span>
                    </div>
                  )}
                  {LAUNCH_PROMO_ACTIVE && (
                    <div className="flex justify-between">
                      <span className="text-primary font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">rocket_launch</span>
                        Descuento Lanzamiento -{Math.round(LAUNCH_DISCOUNT * 100)}%
                      </span>
                      <span className="text-primary font-bold">
                        -{(total / (1 - LAUNCH_DISCOUNT) * LAUNCH_DISCOUNT).toFixed(2)} €
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-white">
                      {total.toFixed(2)} €
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gastos de Envío</span>
                    <span className="text-green-500 font-bold uppercase tracking-widest text-[10px]">
                      ¡Gratis!
                    </span>
                  </div>
                </div>
                <div className="h-px bg-border-dark mb-6" />
                <div className="flex justify-between items-end mb-4">
                  <span className="text-lg font-bold text-white">Total</span>
                  <span className="text-3xl font-extrabold text-primary">
                    {total.toFixed(2)} €
                  </span>
                </div>
                <button
                  onClick={clearCart}
                  className="w-full mb-3 text-xs text-gray-400 hover:text-red-400"
                >
                  Vaciar carrito
                </button>
                <Link
                  to="/checkout"
                  className="w-full bg-primary hover:bg-white text-background-dark h-14 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  Finalizar Compra{" "}
                  <span className="material-symbols-outlined">
                    arrow_forward
                  </span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Cart;
