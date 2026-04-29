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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);


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

  // Cerrar búsqueda si se hace clic fuera
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (isSearchOpen && !target.closest('.search-container')) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSearchOpen]);


  return (
    <header className="sticky top-0 z-50 w-full bg-charcoal border-b border-white/10 backdrop-blur-md bg-charcoal/95">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between px-4 lg:px-10 py-3">
        {/* Navigation / Burger (Mobile) */}
        <div className="flex xl:hidden">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="size-10 rounded-full bg-black border border-white/10 flex items-center justify-center text-white"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>

        {/* Logo */}
        <div className="flex items-center">
          <Link
            to="/"
            className="flex items-center gap-2 sm:gap-3 text-white group"
          >
            <img
              src={logoEros}
              alt="Eros & Afrodita logo"
              className="size-8 sm:size-10 rounded-full object-cover shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-500"
            />
            <div className="flex flex-col -gap-0.5 ml-1 sm:ml-0">
              <span className="text-[10px] xs:text-xs sm:text-lg font-black tracking-tighter leading-none uppercase">
                Eros<span className="text-primary italic font-serif">&</span>Afrodita
              </span>
              <span className="text-[5px] sm:text-[8px] font-black uppercase tracking-[0.05em] sm:tracking-[0.3em] text-primary/60">LA ESENCIA DIVINA</span>
            </div>
          </Link>
        </div>

        {/* Navegación Central (Desktop) - Centrada */}
        <nav className="hidden xl:flex flex-1 items-center justify-center gap-10">
          <Link to="/catalog?genero=HOMBRE" className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50 hover:text-primary transition-colors">Hombre</Link>
          <Link to="/catalog?genero=MUJER" className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50 hover:text-primary transition-colors">Mujer</Link>
          <Link to="/catalog?status=NOVEDADES" className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50 hover:text-primary transition-colors">Novedades</Link>
          <Link to="/catalog?status=OFERTAS" className="text-[11px] font-black uppercase tracking-[0.2em] text-primary hover:text-white transition-colors italic">Ofertas</Link>
        </nav>

        {/* Icons */}
        <div className="flex items-center gap-2 sm:gap-6">
          {/* Buscador Expandible */}
          <div className="relative flex items-center search-container">
            <div className={`flex items-center bg-black/40 border border-white/10 rounded-full transition-all duration-500 overflow-hidden ${isSearchOpen ? 'w-[180px] sm:w-[260px] px-4 opacity-100' : 'w-0 opacity-0 border-none'}`}>
              <input
                type="text"
                placeholder="Buscar esencia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearch}
                className="bg-transparent text-white text-xs outline-none w-full py-2 placeholder:text-white/20"
              />
            </div>
            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`size-9 sm:size-10 rounded-full flex items-center justify-center transition-all ${isSearchOpen ? 'text-primary' : 'bg-charcoal-lighter text-white/80 hover:bg-primary hover:text-charcoal'}`}
            >
              <span className="material-symbols-outlined text-[18px] sm:text-[20px]">
                {isSearchOpen ? 'close' : 'search'}
              </span>
            </button>
          </div>

          {/* Favoritos */}
          <Link
            to="/wishlist"
            className="flex flex-col items-center gap-1 group"
          >
            <div className="size-9 sm:size-10 rounded-full bg-charcoal-lighter flex items-center justify-center text-white/80 group-hover:bg-primary group-hover:text-charcoal transition-all relative">
              <span className="material-symbols-outlined text-[18px] sm:text-[20px]">
                favorite
              </span>
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 size-4 rounded-full bg-primary border-2 border-charcoal text-[8px] font-black text-background-dark flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </div>
            <span className="hidden sm:block text-[9px] font-bold uppercase tracking-widest text-white/40 group-hover:text-primary transition-colors">Favoritos</span>
          </Link>

          {/* Bolsa */}
          <Link
            to="/cart"
            className="flex flex-col items-center gap-1 group"
          >
            <div className="size-9 sm:size-10 rounded-full bg-charcoal-lighter flex items-center justify-center text-white/80 group-hover:bg-primary group-hover:text-charcoal transition-all relative">
              <span className="material-symbols-outlined text-[18px] sm:text-[20px]">
                shopping_bag
              </span>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 size-4 rounded-full bg-primary border-2 border-charcoal text-[8px] font-black text-background-dark flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </div>
            <span className="hidden sm:block text-[9px] font-bold uppercase tracking-widest text-white/40 group-hover:text-primary transition-colors">Bolsa</span>
          </Link>

          {/* Cuenta */}
          <Link
            to={isAuthenticated
              ? (isAdmin ? "/admin/orders" : "/profile?tab=datos")
              : "/login"
            }
            className="flex flex-col items-center gap-1 group"
          >
            <div className={`size-9 sm:size-10 rounded-full flex items-center justify-center transition-all ${isAuthenticated
                ? "bg-primary text-background-dark font-black text-[10px] sm:text-xs border-2 border-primary/20 group-hover:scale-110 shadow-lg shadow-primary/10"
                : "bg-charcoal-lighter text-white/80 group-hover:bg-primary group-hover:text-charcoal"
              }`}
            >
              {isAuthenticated ? (
                <span>{getInitials()}</span>
              ) : (
                <span className="material-symbols-outlined text-[18px] sm:text-[20px]">
                  person
                </span>
              )}
            </div>
            <span className="hidden sm:block text-[9px] font-bold uppercase tracking-widest text-white/40 group-hover:text-primary transition-colors">Perfil</span>
          </Link>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden animate-fade-in">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-background-dark/80 backdrop-blur-sm" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Menu Content */}
          <div className="absolute left-0 top-0 h-full w-[300px] bg-charcoal p-8 shadow-[30px_0_60px_rgba(0,0,0,0.8)] animate-slide-right border-r border-white/5 flex flex-col">
            <div className="flex justify-between items-center mb-12">
              <div className="flex flex-col">
                <span className="text-[10px] font-black tracking-[0.4em] text-primary uppercase italic leading-none">Menú</span>
                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest mt-1">Explora el Olimpo</span>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="size-10 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:bg-primary/20 hover:text-primary transition-all"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <nav className="flex flex-col gap-1">
              <Link to="/catalog?genero=HOMBRE" onClick={() => setIsMobileMenuOpen(false)} className="group flex items-center justify-between py-4 border-b border-white/5">
                <span className="text-lg font-black uppercase tracking-widest text-white group-hover:text-primary transition-colors">Hombre</span>
                <span className="material-symbols-outlined text-white/10 group-hover:text-primary transition-colors text-sm">arrow_forward_ios</span>
              </Link>
              <Link to="/catalog?genero=MUJER" onClick={() => setIsMobileMenuOpen(false)} className="group flex items-center justify-between py-4 border-b border-white/5">
                <span className="text-lg font-black uppercase tracking-widest text-white group-hover:text-primary transition-colors">Mujer</span>
                <span className="material-symbols-outlined text-white/10 group-hover:text-primary transition-colors text-sm">arrow_forward_ios</span>
              </Link>
              <Link to="/catalog?status=NOVEDADES" onClick={() => setIsMobileMenuOpen(false)} className="group flex items-center justify-between py-4 border-b border-white/5">
                <span className="text-lg font-black uppercase tracking-widest text-white group-hover:text-primary transition-colors">Novedades</span>
                <span className="material-symbols-outlined text-white/10 group-hover:text-primary transition-colors text-sm">new_releases</span>
              </Link>
              <Link to="/catalog?status=OFERTAS" onClick={() => setIsMobileMenuOpen(false)} className="group flex items-center justify-between py-4 border-b border-white/5">
                <span className="text-lg font-black uppercase tracking-widest text-primary italic group-hover:text-white transition-colors">Ofertas</span>
                <span className="material-symbols-outlined text-primary group-hover:text-white transition-colors text-sm">local_offer</span>
              </Link>
              
              <div className="mt-8 space-y-4">
                <Link to="/wishlist" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 text-white/60 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest">
                  <span className="material-symbols-outlined text-primary">favorite</span> Mis Favoritos
                </Link>
                <Link to="/cart" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 text-white/60 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest">
                  <span className="material-symbols-outlined text-primary">shopping_bag</span> Mi Bolsa
                </Link>
                <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 text-white/60 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest">
                  <span className="material-symbols-outlined text-primary">person</span> Mi Cuenta
                </Link>
              </div>
            </nav>

            <div className="mt-auto pt-10">
               <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2 text-center">Atención al Cliente</p>
                  <a href="https://wa.me/34600000000" className="flex items-center justify-center gap-2 text-primary font-black text-xs uppercase tracking-widest">
                    <span className="material-symbols-outlined text-sm">chat</span> WhatsApp Concierge
                  </a>
               </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
