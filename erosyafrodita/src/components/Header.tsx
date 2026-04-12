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
        {/* Logo + menú */}
        <div className="flex items-center gap-8">
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

        {/* Buscador + iconos */}
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center bg-surface-dark border border-white/5 rounded-full px-5 py-2.5 text-xs text-white/50 w-72 focus-within:border-primary/40 focus-within:shadow-[0_0_15px_rgba(242,185,13,0.1)] transition-all group">
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

          <div className="flex items-center gap-3">
            {/* Wishlist con contador rojo */}
            <Link
              to="/wishlist"
              className="size-14 rounded-full bg-charcoal-lighter flex items-center justify-center text-white/80 hover:bg-primary hover:text-charcoal transition-colors relative"
            >
              <span className="material-symbols-outlined text-[22px]">
                favorite
              </span>
              {wishlistCount > 0 && (
                <span className="absolute top-2 right-2 size-4 rounded-full bg-primary border-2 border-charcoal text-[8px] font-black text-background-dark flex items-center justify-center animate-bounce">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Carrito */}
            <Link
              to="/cart"
              className="size-14 rounded-full bg-charcoal-lighter flex items-center justify-center text-white/80 hover:bg-primary hover:text-charcoal transition-colors relative"
            >
              <span className="material-symbols-outlined text-[22px]">
                shopping_bag
              </span>

              {itemCount > 0 && (
                <span className="absolute top-2 right-2 size-4 rounded-full bg-primary border-2 border-charcoal text-[8px] font-black text-background-dark flex items-center justify-center scale-110">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Usuario */}
            <Link
              to={isAuthenticated
                ? (isAdmin ? "/admin/orders" : "/profile?tab=datos")
                : "/login"
              }
              className={`size-12 rounded-full flex items-center justify-center transition-all ${isAuthenticated
                  ? "bg-primary text-background-dark font-black text-sm border-2 border-primary/20 hover:scale-110 shadow-lg shadow-primary/10"
                  : "bg-charcoal-lighter text-white/80 hover:bg-primary hover:text-charcoal"
                }`}
            >
              {isAuthenticated ? (
                <span>{getInitials()}</span>
              ) : (
                <span className="material-symbols-outlined text-[20px]">
                  person
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
