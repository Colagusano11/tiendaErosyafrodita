import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "../i18n";
import logoEros from "../assets/logo-eros.png";

const Header: React.FC = () => {
  const { items } = useCart();
  const { wishlist } = useWishlist();
  const { isAuthenticated, isAdmin, name, apellidos, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchTerm.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const getInitials = () => {
    if (!name && !apellidos) {
      // Fallback a las dos primeras letras del email si no hay nombre/apellidos (sesión antigua)
      return user ? user.substring(0, 2).toUpperCase() : "??";
    }
    const first = name ? name.charAt(0) : "";
    const last = apellidos ? apellidos.charAt(0) : "";
    return (first + last).toUpperCase();
  };

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const wishlistCount = wishlist.length;

  return (
    <header className="sticky top-0 z-50 w-full bg-charcoal border-b border-white/10">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between px-5 lg:px-10 py-3">
        {/* Logo */}
        <div className="flex items-center">
          <Link
            to="/"
            className="flex items-center gap-3 text-white group"
          >
            <img
              src={logoEros}
              alt="Eros & Afrodita logo"
              className="size-10 rounded-full object-cover shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-500"
            />
            <div className="flex flex-col -gap-1">
              <span className="font-black text-lg tracking-tighter leading-none uppercase">
                Eros<span className="text-primary italic font-serif">&</span>Afrodita
              </span>
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-primary/60">LA ESENCIA DIVINA</span>
            </div>
          </Link>
        </div>

        {/* Navegación Central (Desktop) */}
        <nav className="hidden xl:flex items-center gap-10">
          <Link to="/catalog?genero=HOMBRE" className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50 hover:text-primary transition-colors">Hombre</Link>
          <Link to="/catalog?genero=MUJER" className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50 hover:text-primary transition-colors">Mujer</Link>
          <Link to="/catalog?orden=fechaDesc" className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50 hover:text-primary transition-colors">Novedades</Link>
          <Link to="/catalog?maxPrecio=50" className="text-[11px] font-black uppercase tracking-[0.2em] text-primary hover:text-white transition-colors italic">Ofertas</Link>
        </nav>

        {/* Buscador + iconos */}
        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center bg-surface-dark border border-white/5 rounded-full px-5 py-2.5 text-xs text-white/50 w-64 focus-within:border-primary/40 focus-within:shadow-[0_0_15px_rgba(242,185,13,0.1)] transition-all group">
            <button
              onClick={() => searchTerm.trim() && navigate(`/catalog?search=${encodeURIComponent(searchTerm.trim())}`)}
              className="material-symbols-outlined text-[18px] mr-3 text-primary/60 group-focus-within:text-primary hover:scale-110 transition-transform"
            >
              search
            </button>
            <input
              className="bg-transparent outline-none border-none text-xs flex-1 placeholder-white/30 font-medium"
              placeholder={t('header.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearch}
            />
          </div>

          <div className="flex items-center gap-6">
            {/* Favoritos */}
            <Link
              to="/wishlist"
              className="flex flex-col items-center gap-1 group"
            >
              <div className="size-10 rounded-full bg-charcoal-lighter flex items-center justify-center text-white/80 group-hover:bg-primary group-hover:text-charcoal transition-all relative">
                <span className="material-symbols-outlined text-[20px]">
                  favorite
                </span>
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 size-4 rounded-full bg-primary border-2 border-charcoal text-[8px] font-black text-background-dark flex items-center justify-center animate-bounce">
                    {wishlistCount}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/40 group-hover:text-primary transition-colors">Favoritos</span>
            </Link>

            {/* Bolsa */}
            <Link
              to="/cart"
              className="flex flex-col items-center gap-1 group"
            >
              <div className="size-10 rounded-full bg-charcoal-lighter flex items-center justify-center text-white/80 group-hover:bg-primary group-hover:text-charcoal transition-all relative">
                <span className="material-symbols-outlined text-[20px]">
                  shopping_bag
                </span>
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 size-4 rounded-full bg-primary border-2 border-charcoal text-[8px] font-black text-background-dark flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/40 group-hover:text-primary transition-colors">Bolsa</span>
            </Link>

            {/* Cuenta */}
            <Link
              to={isAuthenticated
                ? (isAdmin ? "/admin/orders" : "/profile?tab=datos")
                : "/login"
              }
              className="flex flex-col items-center gap-1 group"
            >
              <div className={`size-10 rounded-full flex items-center justify-center transition-all ${isAuthenticated
                  ? "bg-primary text-background-dark font-black text-xs border-2 border-primary/20 group-hover:scale-110 shadow-lg shadow-primary/10"
                  : "bg-charcoal-lighter text-white/80 group-hover:bg-primary group-hover:text-charcoal"
                }`}
              >
                {isAuthenticated ? (
                  <span>{getInitials()}</span>
                ) : (
                  <span className="material-symbols-outlined text-[20px]">
                    person
                  </span>
                )}
              </div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/40 group-hover:text-primary transition-colors">Cuenta</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
