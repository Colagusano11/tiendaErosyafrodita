import React from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import { useWishlist } from "../context/WishlistContext";
import { motion } from "framer-motion";

const Wishlist: React.FC = () => {
  const { wishlist } = useWishlist();

  return (
    <div className="bg-background-dark text-white min-h-screen flex flex-col font-display selection:bg-primary/30">
      <Header />

      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 lg:px-10 py-8 md:py-20">
        {/* Cabecera de la sección */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-6 border-b border-white/5 pb-8 md:pb-10">
          <div className="animate-in fade-in slide-in-from-left duration-1000">
            <nav className="mb-4 flex items-center gap-2 text-[10px] sm:text-xs text-primary/60 font-medium">
              <Link to="/" className="hover:text-primary transition-colors uppercase tracking-widest">Inicio</Link>
              <span className="material-symbols-outlined !text-[14px]">chevron_right</span>
              <span className="text-primary font-bold tracking-widest uppercase">Mis Deseos</span>
            </nav>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-white uppercase">
              Mis <span className="text-primary italic">Deseos</span>
            </h1>
            <p className="mt-4 text-gray-400 max-w-lg text-sm sm:text-base md:text-lg font-light leading-relaxed">
              Conserva tus fragancias favoritas y hazte con ellas cuando el momento sea perfecto. Tu selección exclusiva de Erosyafrodita.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-surface-dark px-5 py-2.5 rounded-full border border-white/5 shadow-inner">
            <span className="text-[10px] sm:text-xs font-black tracking-[0.2em] uppercase text-primary"> 
              {wishlist.length} {wishlist.length === 1 ? "artículo" : "artículos"}
            </span>
          </div>
        </div>

        {/* Contenido principal */}
        {wishlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="size-20 sm:size-24 rounded-full bg-surface-dark border border-white/5 flex items-center justify-center mb-8 shadow-2xl relative">
              <div className="absolute inset-0 bg-primary/5 blur-2xl rounded-full"></div>
              <span className="material-symbols-outlined text-[40px] sm:text-[48px] text-white/20 relative z-10">favorite_border</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black mb-4 uppercase tracking-tighter">Tu lista está vacía</h2>
            <p className="text-gray-400 mb-10 max-w-sm font-light text-sm sm:text-base">
              Parece que aún no has encontrado ese aroma especial. Explora nuestro catálogo y deja que tu fragancia te encuentre.
            </p>
            <Link
              to="/catalog"
              className="px-10 py-5 bg-primary text-background-dark rounded-2xl font-black text-xs tracking-widest uppercase hover:bg-yellow-400 hover:shadow-[0_0_30px_rgba(242,185,13,0.3)] transition-all transform active:scale-95"
            >
              Explorar Catálogo
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-10 sm:gap-y-12 mb-20 animate-in fade-in duration-1000">
            {wishlist.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Recomendación inferior */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-10 p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[3rem] bg-gradient-to-r from-surface-dark to-charcoal border border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl overflow-hidden relative group"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-32 -mt-32"></div>
          <div className="relative z-10 text-center md:text-left">
            <h3 className="text-xl sm:text-2xl font-black mb-2 uppercase tracking-tight">¿Buscas algo específico?</h3>
            <p className="text-gray-400 text-xs sm:text-sm font-light max-w-md">
              Nuestros expertos en perfumería pueden ayudarte a encontrar tu aroma ideal entre las esencias más exclusivas del Olimpo.
            </p>
          </div>
          <Link
            to="/contact"
            className="relative z-10 px-10 py-4 rounded-2xl border border-primary/30 text-primary text-[10px] font-black tracking-widest uppercase hover:bg-primary hover:text-charcoal transition-all shadow-lg whitespace-nowrap"
          >
            Hablar con un experto
          </Link>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default Wishlist;
