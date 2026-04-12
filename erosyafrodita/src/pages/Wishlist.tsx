import React from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import { useWishlist } from "../context/WishlistContext";

const Wishlist: React.FC = () => {
  const { wishlist } = useWishlist();

  return (
    <div className="bg-background-dark text-white min-h-screen flex flex-col font-display selection:bg-primary/30">
      <Header />

      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 md:px-10 py-12 md:py-20">
        {/* Cabecera de la sección */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6 border-b border-white/5 pb-10">
          <div>
            <nav className="mb-4 flex items-center gap-2 text-sm text-primary/60 font-medium">
              <Link to="/" className="hover:text-primary transition-colors">Inicio</Link>
              <span className="material-symbols-outlined !text-sm">chevron_right</span>
              <span className="text-primary font-semibold tracking-wide uppercase text-xs">Mis Deseos</span>
            </nav>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white">
              Mis <span className="text-primary italic">Deseos</span>
            </h1>
            <p className="mt-4 text-gray-400 max-w-lg text-lg font-light leading-relaxed">
              Conserva tus fragancias favoritas y hazte con ellas cuando el momento sea perfecto. Tu selección exclusiva de Erosyafrodita.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-surface-dark px-6 py-3 rounded-full border border-white/5 shadow-inner">
            <span className="text-sm font-bold tracking-widest uppercase"> {wishlist.length} {" "}
              {wishlist.length === 1 ? "artículo" : "artículos"}  {wishlist.length === 1 ? "guardado" : "guardados"}
            </span>
          </div>
        </div>

        {/* Contenido principal */}
        {wishlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="size-24 rounded-full bg-surface-dark border border-white/5 flex items-center justify-center mb-8 shadow-2xl">
              <span className="material-symbols-outlined text-[48px] text-gray-600">favorite_border</span>
            </div>
            <h2 className="text-3xl font-bold mb-4">Tu lista está vacía</h2>
            <p className="text-gray-400 mb-10 max-w-sm font-light">
              Parece que aún no has encontrado ese aroma especial. Explora nuestro catálogo y deja que tu fragancia te encuentre.
            </p>
            <Link
              to="/catalog"
              className="px-10 py-4 bg-primary text-background-dark rounded-full font-black text-sm tracking-widest uppercase hover:bg-yellow-400 hover:shadow-[0_0_30px_rgba(242,185,13,0.3)] transition-all transform active:scale-95"
            >
              Explorar Catálogo
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12 mb-20 animate-in fade-in duration-1000">
            {wishlist.map((product) => (
              <div key={product.id} className="relative group/item">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}

        {/* Recomendación inferior */}
        <div className="mt-10 p-10 rounded-[3rem] bg-gradient-to-r from-surface-dark to-charcoal border border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-32 -mt-32"></div>
          <div className="relative z-10">
            <h3 className="text-2xl font-bold mb-2">¿Buscas algo específico?</h3>
            <p className="text-gray-400 text-sm md:text-base font-light">
              Nuestros expertos en perfumería pueden ayudarte a encontrar tu aroma ideal.
            </p>
          </div>
          <Link
            to="/contact"
            className="relative z-10 px-8 py-3 rounded-full border border-primary text-primary text-xs font-bold tracking-widest uppercase hover:bg-primary hover:text-charcoal transition-all shadow-lg"
          >
            Hablar con un experto
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Wishlist;
