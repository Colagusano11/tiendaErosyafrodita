import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import { getProductos, type Producto } from "../api/products";
import { useCart } from "../context/CartContext";
import { useTranslation } from "../i18n";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import SEO from "../components/SEO";
import homeBg from "../assets/home-background.png";
import homeHeader from "../assets/home-header.png";

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ─── Countdown Hook ───────────────────────────────────────────────────────────
function useCountdown(hours = 23) {
  const target = useRef(Date.now() + hours * 3600 * 1000);
  const [time, setTime] = useState({ h: "00", m: "00", s: "00" });
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, target.current - Date.now());
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTime({
        h: String(h).padStart(2, "0"),
        m: String(m).padStart(2, "0"),
        s: String(s).padStart(2, "0"),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

// ─── Fade-in on scroll ────────────────────────────────────────────────────────
const FadeUp: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({
  children, delay = 0, className = ""
}) => (
  <motion.div
    initial={{ opacity: 0, y: 32 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay }}
    className={className}
  >
    {children}
  </motion.div>
);

// ─── CATEGORIES CONFIG ────────────────────────────────────────────────────────
const CATEGORIES = [
  { label: "Perfumes",      icon: "flare",           color: "from-amber-900/60 to-amber-600/20",   border: "hover:border-amber-400/60",   text: "hover:text-amber-300",   tag: "amber" },
  { label: "Cosmética",     icon: "spa",              color: "from-emerald-900/60 to-emerald-600/20", border: "hover:border-emerald-400/60", text: "hover:text-emerald-300", tag: "emerald" },
  { label: "Maquillaje",    icon: "brush",            color: "from-rose-900/60 to-rose-600/20",     border: "hover:border-rose-400/60",   text: "hover:text-rose-300",   tag: "rose" },
  { label: "Cabello",       icon: "content_cut",      color: "from-yellow-900/60 to-yellow-600/20", border: "hover:border-yellow-400/60", text: "hover:text-yellow-300", tag: "yellow" },
  { label: "Parafarmacia",  icon: "medical_services", color: "from-green-900/60 to-green-600/20",   border: "hover:border-green-400/60",  text: "hover:text-green-300",  tag: "green" },
  { label: "Línea de Baño", icon: "bathtub",           color: "from-sky-900/60 to-sky-600/20",       border: "hover:border-sky-400/60",    text: "hover:text-sky-300",    tag: "sky" },
  { label: "Complementos",  icon: "eyeglasses",       color: "from-cyan-900/60 to-cyan-600/20",     border: "hover:border-cyan-400/60",   text: "hover:text-cyan-300",   tag: "cyan" },
  { label: "Otros",         icon: "apps",             color: "from-violet-900/60 to-violet-600/20", border: "hover:border-violet-400/60", text: "hover:text-violet-300", tag: "violet" },
];

const BRANDS = [
  "ADOLFO DOMINGUEZ", "KILIAN", "4711", "ROCHAS", "LOLITA LEMPICKA",
  "HERMÈS", "CLINIQUE", "SLAVA ZAÏTSEV", "LOEWE", "CHANEL",
  "DIOR", "GUCCI", "PRADA", "ARMANI", "VERSACE", "YSL", "GIVENCHY",
];

const REVIEWS = [
  { name: "María G.", stars: 5, text: "El perfume llegó en 24h perfectamente embalado. Una fragancia espectacular, exactamente lo que buscaba.", product: "Lancôme La Vie Est Belle" },
  { name: "Carlos R.", stars: 5, text: "Precio imbatible y envío rapidísimo. Ya es mi tienda de referencia para perfumes y cosmética.", product: "Dior Sauvage" },
  { name: "Lucía M.", stars: 5, text: "Calidad garantizada, producto 100% original. El packaging es precioso, ideal para regalo.", product: "Chanel Nº5" },
];

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const HomePage: React.FC = () => {
  const [featuredProduct, setFeaturedProduct] = useState<Producto | null>(null);
  const [novedadesPool, setNovedadesPool] = useState<Producto[]>([]);
  const [novedadesCount, setNovedadesCount] = useState(10);
  const [recommendedPool, setRecommendedPool] = useState<Producto[]>([]);
  const [recommendedCount, setRecommendedCount] = useState(10);
  const [topSellers, setTopSellers] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSent, setNewsletterSent] = useState(false);
  const [activeReview, setActiveReview] = useState(0);
  const navigate = useNavigate();
  const countdown = useCountdown(23);

  const handleSearch = () => {
    if (searchQuery.trim()) navigate(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  // Auto-rotate reviews
  useEffect(() => {
    const id = setInterval(() => setActiveReview(r => (r + 1) % REVIEWS.length), 4500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { getProductos, getConfiguracion } = await import("../api/products");
        const [data, config] = await Promise.all([getProductos(0, 200), getConfiguracion()]);
        const content: Producto[] = data.content || [];
        const withImage = content.filter(p => !!p.imagen && p.stock > 0);

        const novedadesBrands = config.novedadesBrands
          ? config.novedadesBrands.split(",").map((s: string) => s.trim().toUpperCase()).filter(Boolean)
          : [];
        const recomendadosBrands = config.recomendadosBrands
          ? config.recomendadosBrands.split(",").map((s: string) => s.trim().toUpperCase()).filter(Boolean)
          : [];

        const isNovedadBrand = (p: Producto) =>
          !!p.manufacturer && novedadesBrands.some((b: string) => p.manufacturer!.toUpperCase().includes(b));
        const isRecomendadoBrand = (p: Producto) =>
          !!p.manufacturer && recomendadosBrands.some((b: string) => p.manufacturer!.toUpperCase().includes(b));

        const novedadesBranded = shuffleArray(withImage.filter(isNovedadBrand));
        const novedadesExtra = shuffleArray(withImage.filter(p => !isNovedadBrand(p)));
        setNovedadesPool([...novedadesBranded, ...novedadesExtra]);

        const conDescuento = withImage.filter(p => p.precioPVP > p.precio);
        const highAppeal = conDescuento.filter(isNovedadBrand);
        const ofertaPool = highAppeal.length > 0 ? highAppeal : conDescuento;
        const ofertaCandidate = ofertaPool.sort((a, b) => (b.precioPVP - b.precio) - (a.precioPVP - a.precio))[0] ?? null;
        setFeaturedProduct(ofertaCandidate);

        const novedadesIds = new Set(novedadesBranded.map(p => p.id));
        const recomendadosBase = withImage.filter(p => p.id !== ofertaCandidate?.id && !novedadesIds.has(p.id));
        const recomendadosBranded = shuffleArray(recomendadosBase.filter(isRecomendadoBrand));
        const recomendadosExtra = shuffleArray(recomendadosBase.filter(p => !isRecomendadoBrand(p)));
        setRecommendedPool([...recomendadosBranded, ...recomendadosExtra]);

        // Top sellers: productos con mayor diferencia de precio (más vendidos = más descuento aplicado)
        const tops = [...withImage]
          .filter(p => p.precioPVP > 0)
          .sort((a, b) => b.precioPVP - a.precioPVP)
          .slice(0, 6);
        setTopSellers(tops);

      } catch (e: any) {
        setError(e.message ?? "Error al cargar productos");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const { addItem } = useCart();
  const { t } = useTranslation();

  return (
    <div className="text-white font-display flex flex-col min-h-screen relative bg-[#080808]">
      {/* Background */}
      <div
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{
          backgroundImage: `url(${homeBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(6px) brightness(0.18) saturate(0.5)",
          transform: "scale(1.05)",
        }}
      />

      <SEO
        title="Eros & Afrodita | Perfumes y Cosmética Premium"
        description="Más de 10.000 referencias en perfumería y cosmética. Envío en 24h, devolución gratis 30 días. Fragancias originales al mejor precio."
        keywords="perfumes de lujo, cosmética premium, Eros y Afrodita, belleza divina, fragancias exclusivas"
      />
      <script type="application/ld+json">
        {JSON.stringify([
          { "@context": "https://schema.org", "@type": "WebSite", "name": "Eros & Afrodita", "url": "https://erosyafrodita.com", "potentialAction": { "@type": "SearchAction", "target": "https://erosyafrodita.com/#/catalog?search={search_term_string}", "query-input": "required name=search_term_string" } },
          { "@context": "https://schema.org", "@type": "Organization", "name": "Eros & Afrodita", "url": "https://erosyafrodita.com", "logo": "https://erosyafrodita.com/logo-eros.png", "sameAs": ["https://www.instagram.com/erosyafrodita", "https://www.facebook.com/erosyafrodita"] }
        ])}
      </script>

      <Header />
      <main className="flex-grow">

        {/* ══════════════════════════════════════════════════
            1. HERO CINEMATOGRÁFICO
        ══════════════════════════════════════════════════ */}
        <section className="relative w-full overflow-hidden">
          <div className="relative max-w-[1600px] mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full overflow-hidden"
              style={{ borderRadius: "0 0 2rem 2rem" }}
            >
              <img
                src={homeHeader}
                alt="Eros & Afrodita — Colección"
                className="w-full h-auto min-h-[260px] sm:min-h-[380px] lg:min-h-[520px] object-cover"
                style={{ objectPosition: typeof window !== "undefined" && window.innerWidth < 640 ? "right center" : "center center" }}
              />
              {/* Gradiente editorial sobre la imagen */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/20 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#080808]/60 via-transparent to-transparent" />

              {/* Copy hero — visible en todos los tamaños */}
              <div className="absolute inset-0 flex flex-col justify-end pb-10 sm:pb-14 lg:pb-16 px-6 sm:px-10 lg:px-20">
                <motion.span
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.5em] text-primary mb-2 sm:mb-3"
                >
                  Perfumería & Cosmética Premium
                </motion.span>
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                  className="text-3xl sm:text-5xl lg:text-7xl font-black leading-none uppercase tracking-tighter text-white drop-shadow-2xl max-w-2xl"
                >
                  Eros{" "}
                  <span className="text-primary font-serif italic not-italic">&amp;</span>{" "}
                  Afrodita
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.85, duration: 0.7 }}
                  className="mt-2 sm:mt-3 text-xs sm:text-sm text-white/50 max-w-sm font-light tracking-wide"
                >
                  Más de 10.000 referencias. Envío en 24h. Siempre original.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.05, duration: 0.6 }}
                  className="mt-5 sm:mt-7 flex flex-wrap gap-3"
                >
                  <Link
                    to="/catalog"
                    className="h-11 sm:h-12 px-7 sm:px-10 rounded-full bg-primary text-[#080808] text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] hover:bg-white transition-all shadow-xl shadow-primary/30 flex items-center"
                  >
                    Explorar catálogo
                  </Link>
                  <Link
                    to="/catalog?status=OFERTA"
                    className="h-11 sm:h-12 px-7 sm:px-10 rounded-full border border-white/20 text-white text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] hover:bg-white/8 hover:border-white/40 transition-all backdrop-blur-sm flex items-center"
                  >
                    Ofertas del día
                  </Link>
                </motion.div>
              </div>
            </motion.div>

            {/* BUSCADOR PREMIUM */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.55 }}
              className="relative z-20 px-4 sm:px-10 lg:px-20 -mt-6 sm:-mt-8"
            >
              <div className="max-w-3xl mx-auto">
                <div className="bg-white/[0.06] backdrop-blur-2xl border border-white/15 p-1.5 sm:p-2 rounded-full shadow-2xl shadow-black/60 flex items-center group focus-within:border-primary/50 transition-all duration-500">
                  <div className="size-10 sm:size-13 rounded-full bg-white/5 flex items-center justify-center text-white/40 group-focus-within:text-primary group-focus-within:bg-primary/10 transition-all shrink-0">
                    <span className="material-symbols-outlined text-xl sm:text-2xl">search</span>
                  </div>
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder="Busca marca, aroma o nombre..."
                    className="flex-1 bg-transparent border-none outline-none px-3 sm:px-5 text-white text-sm sm:text-base font-light placeholder:text-white/35"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSearch()}
                  />
                  <button
                    onClick={handleSearch}
                    className="h-10 sm:h-12 px-6 sm:px-8 rounded-full bg-primary text-[#080808] text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white transition-all"
                  >
                    Buscar
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
                  <span className="text-primary/50 italic">Tendencias:</span>
                  {["Rochas", "Kilian", "Hermès", "Dior", "Chanel"].map(b => (
                    <Link key={b} to={`/catalog?search=${b}`} className="hover:text-primary transition-colors">{b}</Link>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            2. TRUST BAR — Confianza multinacional
        ══════════════════════════════════════════════════ */}
        <FadeUp className="px-4 lg:px-20 mt-12 sm:mt-16">
          <div className="max-w-[1440px] mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                { icon: "local_shipping", title: "Envío en 24-48h", sub: "Pedidos antes de las 14h" },
                { icon: "verified", title: "100% Originales", sub: "Garantía de autenticidad" },
                { icon: "assignment_return", title: "30 días para devolver", sub: "Devolución gratuita" },
                { icon: "lock", title: "Pago 100% Seguro", sub: "SSL · Bizum · Tarjeta" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="flex items-center gap-3 sm:gap-4 bg-white/[0.03] border border-white/8 rounded-2xl px-4 py-4 hover:border-primary/30 hover:bg-white/[0.05] transition-all"
                >
                  <div className="shrink-0 size-10 sm:size-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-xl sm:text-2xl">{item.icon}</span>
                  </div>
                  <div>
                    <p className="text-[11px] sm:text-xs font-black text-white uppercase tracking-wider">{item.title}</p>
                    <p className="text-[10px] text-white/35 mt-0.5">{item.sub}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </FadeUp>

        {/* ══════════════════════════════════════════════════
            3. CATEGORÍAS VISUALES — Cards premium
        ══════════════════════════════════════════════════ */}
        <section className="px-4 lg:px-20 mt-14 sm:mt-20">
          <div className="max-w-[1440px] mx-auto">
            <FadeUp>
              <div className="flex items-baseline justify-between mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white">
                  Explora por categoría
                </h2>
                <Link to="/catalog" className="text-[9px] font-black uppercase tracking-widest text-primary hover:text-white transition-colors flex items-center gap-1">
                  Ver todo <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>
            </FadeUp>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3">
              {CATEGORIES.map((cat, i) => (
                <motion.div
                  key={cat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.06 }}
                >
                  <Link
                    to={`/catalog?categoria=${cat.label === "Línea de Baño" ? "Linea de Baño" : cat.label}`}
                    className={`group flex flex-col items-center justify-center gap-2.5 p-4 sm:p-5 rounded-2xl bg-gradient-to-br ${cat.color} border border-white/8 ${cat.border} transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-black/40 cursor-pointer aspect-square sm:aspect-auto sm:h-28`}
                  >
                    <span className={`material-symbols-outlined text-2xl sm:text-3xl text-white/50 group-hover:text-white group-hover:scale-110 transition-all duration-300`}>
                      {cat.icon}
                    </span>
                    <span className={`text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-white/50 group-hover:text-white transition-colors text-center leading-tight`}>
                      {cat.label}
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            4. NOVEDADES
        ══════════════════════════════════════════════════ */}
        <section className="px-4 lg:px-20 mt-16 sm:mt-24">
          <div className="max-w-[1440px] mx-auto">
            <FadeUp className="flex items-baseline justify-between mb-6 sm:mb-8">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-primary mb-1">Recién llegados</p>
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">Novedades</h2>
              </div>
              <Link to="/catalog?status=NOVEDADES" className="text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-primary transition-colors flex items-center gap-1">
                Ver todas <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </FadeUp>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-5">
              {loading && Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/5 aspect-[3/4] animate-pulse" />
              ))}
              {error && !loading && <p className="text-red-400 col-span-full">{error}</p>}
              {!loading && !error && novedadesPool.slice(0, novedadesCount).map(product => (
                <ProductCard key={product.id} product={product} onHide={() => setNovedadesCount(c => c + 1)} />
              ))}
            </div>
            {novedadesPool.length > novedadesCount && (
              <div className="mt-10 flex justify-center">
                <button
                  onClick={() => setNovedadesCount(c => c + 10)}
                  className="group h-11 px-8 rounded-full border border-white/10 text-white/40 text-[10px] font-black uppercase tracking-widest hover:border-primary/40 hover:text-primary transition-all flex items-center gap-2"
                >
                  Cargar más <span className="material-symbols-outlined text-sm group-hover:translate-y-0.5 transition-transform">expand_more</span>
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            5. BANNER EDITORIAL DE MARCA
        ══════════════════════════════════════════════════ */}
        <FadeUp className="px-4 lg:px-20 mt-20 sm:mt-28">
          <div className="max-w-[1440px] mx-auto">
            <div
              className="relative overflow-hidden rounded-3xl border border-white/8"
              style={{
                background: "linear-gradient(135deg, #0e0b05 0%, #1a1300 40%, #0d0a04 100%)",
              }}
            >
              {/* Glow decorativo */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #f2b90d 0%, transparent 70%)" }} />
              </div>
              <div className="relative z-10 flex flex-col items-center text-center py-16 sm:py-24 px-6 sm:px-16">
                <motion.span
                  initial={{ opacity: 0, letterSpacing: "0.6em" }}
                  whileInView={{ opacity: 1, letterSpacing: "0.8em" }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className="text-[8px] sm:text-[9px] font-black uppercase text-primary/70 mb-5"
                >
                  La experiencia Eros &amp; Afrodita
                </motion.span>
                <motion.h2
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tighter max-w-3xl"
                >
                  Cada fragancia{" "}
                  <span className="text-primary font-serif italic">cuenta</span>{" "}tu historia.
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="mt-5 sm:mt-6 text-sm sm:text-base text-white/35 max-w-xl font-light leading-relaxed"
                >
                  Más de 10.000 referencias de las mejores marcas del mundo.
                  Productos 100% originales, al mejor precio garantizado.
                  Entregados en tu puerta en menos de 48 horas.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                  className="mt-8 sm:mt-10 flex flex-wrap gap-4 justify-center"
                >
                  <Link
                    to="/catalog"
                    className="h-12 px-10 rounded-full bg-primary text-[#080808] text-[10px] font-black uppercase tracking-[0.25em] hover:bg-white transition-all shadow-2xl shadow-primary/25 flex items-center"
                  >
                    Descubrir ahora
                  </Link>
                  <Link
                    to="/about"
                    className="h-12 px-10 rounded-full border border-white/15 text-white/60 text-[10px] font-black uppercase tracking-[0.25em] hover:text-white hover:border-white/30 transition-all flex items-center"
                  >
                    Nuestra historia
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>
        </FadeUp>

        {/* ══════════════════════════════════════════════════
            6. OFERTA DESTACADA + COUNTDOWN
        ══════════════════════════════════════════════════ */}
        {featuredProduct && (
          <section className="px-4 lg:px-20 mt-16 sm:mt-24">
            <div className="max-w-[1200px] mx-auto">
              <FadeUp className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.4em] text-red-400 mb-1">Tiempo limitado</p>
                  <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">Oferta del día</h2>
                </div>
                {/* Countdown */}
                <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
                  {[{ v: countdown.h, l: "h" }, { v: countdown.m, l: "m" }, { v: countdown.s, l: "s" }].map((seg, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && <span className="text-white/20 font-black text-sm">:</span>}
                      <div className="flex flex-col items-center">
                        <div className="bg-red-900/40 border border-red-500/20 rounded-lg w-10 sm:w-12 h-10 sm:h-12 flex items-center justify-center">
                          <AnimatePresence mode="popLayout">
                            <motion.span
                              key={seg.v}
                              initial={{ y: -10, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              exit={{ y: 10, opacity: 0 }}
                              transition={{ duration: 0.25 }}
                              className="text-sm sm:text-base font-black text-red-300 tabular-nums"
                            >
                              {seg.v}
                            </motion.span>
                          </AnimatePresence>
                        </div>
                        <span className="text-[8px] text-white/25 uppercase tracking-wider mt-1">{seg.l}</span>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </FadeUp>

              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-3xl overflow-hidden border border-white/8 flex flex-col lg:flex-row shadow-2xl"
                style={{ background: "linear-gradient(135deg, #0f0f0f 0%, #161616 100%)" }}
              >
                {/* Imagen */}
                <div className="w-full lg:w-[420px] h-64 sm:h-80 lg:h-[420px] bg-white flex items-center justify-center relative overflow-hidden group/img p-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                  <img
                    src={featuredProduct.imagen || ""}
                    alt={featuredProduct.nombre}
                    className="max-w-full max-h-full object-contain drop-shadow-2xl transition-transform duration-700 group-hover/img:scale-108"
                  />
                  {/* Badge descuento */}
                  <div className="absolute top-4 left-4 bg-red-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg">
                    -35% HOY
                  </div>
                </div>
                {/* Info */}
                <div className="flex-1 p-7 sm:p-10 lg:p-14 flex flex-col justify-center">
                  <span className="text-[9px] sm:text-[10px] font-black tracking-[0.4em] uppercase text-primary mb-3">Oferta exclusiva · Solo hoy</span>
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-3 text-white leading-tight">
                    {featuredProduct.nombre}
                  </h3>
                  {featuredProduct.manufacturer && (
                    <p className="text-xs text-white/30 font-black uppercase tracking-widest mb-4">{featuredProduct.manufacturer}</p>
                  )}
                  <p className="text-xs sm:text-sm text-white/40 mb-7 max-w-md font-light leading-relaxed">
                    Una oportunidad única para añadir esta fragancia exclusiva a tu colección.
                    Stock muy limitado. Precio especial solo durante hoy.
                  </p>
                  {/* Precios */}
                  <div className="flex items-baseline gap-4 mb-7">
                    <span className="text-3xl sm:text-4xl font-black text-emerald-400">
                      {(featuredProduct.precioPVP || featuredProduct.precio || 0).toFixed(2)} €
                    </span>
                    <span className="text-lg text-white/20 line-through">
                      {((featuredProduct.precioPVP || featuredProduct.precio || 0) * 1.35).toFixed(2)} €
                    </span>
                    <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">
                      Ahorras {(((featuredProduct.precioPVP || featuredProduct.precio || 0) * 0.35)).toFixed(2)} €
                    </span>
                  </div>
                  {/* Stock bar */}
                  <div className="mb-7">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Stock disponible</span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-red-400">¡Quedan pocas unidades!</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: "28%" }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => addItem(featuredProduct)}
                      className="flex-1 sm:flex-none h-12 px-10 rounded-full bg-primary text-[#080808] text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-xl shadow-primary/20"
                    >
                      Añadir al carrito
                    </button>
                    <Link
                      to={`/product/${featuredProduct.id}`}
                      className="flex-1 sm:flex-none h-12 px-8 rounded-full border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all flex items-center justify-center"
                    >
                      Ver detalles
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════
            7. TOP VENDIDOS
        ══════════════════════════════════════════════════ */}
        {topSellers.length > 0 && (
          <section className="px-4 lg:px-20 mt-16 sm:mt-24">
            <div className="max-w-[1440px] mx-auto">
              <FadeUp className="flex items-baseline justify-between mb-6 sm:mb-8">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.4em] text-primary mb-1">Los favoritos</p>
                  <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">Más vendidos</h2>
                </div>
                <Link to="/catalog" className="text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-primary transition-colors flex items-center gap-1">
                  Ver todos <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </FadeUp>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-5">
                {topSellers.map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.07 }}
                    className="relative"
                  >
                    {/* Número ranking */}
                    <div className="absolute -top-3 -left-1 z-10 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-lg">
                      <span className="text-[10px] font-black text-[#080808]">#{i + 1}</span>
                    </div>
                    <ProductCard product={product} onHide={() => {}} />
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════
            8. MARCAS — Carrusel premium
        ══════════════════════════════════════════════════ */}
        <section className="mt-16 sm:mt-24 py-10 sm:py-14 border-y border-white/5 overflow-hidden relative">
          <div className="absolute inset-y-0 left-0 w-24 sm:w-40 bg-gradient-to-r from-[#080808] to-transparent z-10" />
          <div className="absolute inset-y-0 right-0 w-24 sm:w-40 bg-gradient-to-l from-[#080808] to-transparent z-10" />
          <p className="text-center text-[8px] font-black uppercase tracking-[0.6em] text-white/15 mb-6">Marcas disponibles</p>
          <motion.div
            className="flex w-max items-center gap-14 sm:gap-20"
            animate={{ x: [0, -1800] }}
            transition={{ x: { repeat: Infinity, repeatType: "loop", duration: 28, ease: "linear" } }}
          >
            {[...BRANDS, ...BRANDS].map((brand, i) => (
              <Link
                key={i}
                to={`/catalog?manufacturer=${encodeURIComponent(brand)}`}
                className="text-[9px] sm:text-[10px] font-black tracking-[0.4em] text-white/12 uppercase hover:text-primary transition-all whitespace-nowrap hover:scale-110"
              >
                {brand}
              </Link>
            ))}
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════════
            9. PRUEBA SOCIAL — Reseñas
        ══════════════════════════════════════════════════ */}
        <FadeUp className="px-4 lg:px-20 mt-16 sm:mt-24">
          <div className="max-w-[1440px] mx-auto">
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-center">
              {/* Stats */}
              <div className="flex-shrink-0 flex flex-row lg:flex-col gap-6 lg:gap-8">
                {[
                  { value: "10.000+", label: "Referencias" },
                  { value: "4.9 ★", label: "Valoración media" },
                  { value: "48h", label: "Entrega máx." },
                ].map((stat, i) => (
                  <div key={i} className="text-center lg:text-left">
                    <p className="text-2xl sm:text-3xl font-black text-primary">{stat.value}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Carrusel de reseñas */}
              <div className="flex-1 relative overflow-hidden min-h-[160px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeReview}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="bg-white/[0.03] border border-white/8 rounded-3xl p-6 sm:p-8"
                  >
                    <div className="flex gap-0.5 mb-4">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <span key={s} className="text-primary text-base">★</span>
                      ))}
                    </div>
                    <p className="text-sm sm:text-base text-white/70 font-light leading-relaxed italic mb-5">
                      &ldquo;{REVIEWS[activeReview].text}&rdquo;
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-black text-white">{REVIEWS[activeReview].name}</p>
                        <p className="text-[9px] text-white/30 uppercase tracking-widest mt-0.5">
                          Compró: {REVIEWS[activeReview].product}
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        {REVIEWS.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveReview(idx)}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${
                              idx === activeReview ? "bg-primary w-4" : "bg-white/20"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </FadeUp>

        {/* ══════════════════════════════════════════════════
            10. NEWSLETTER — Captura de leads
        ══════════════════════════════════════════════════ */}
        <FadeUp className="px-4 lg:px-20 mt-16 sm:mt-24">
          <div className="max-w-[1440px] mx-auto">
            <div
              className="relative overflow-hidden rounded-3xl border border-white/8 py-12 sm:py-16 px-6 sm:px-12"
              style={{ background: "linear-gradient(135deg, #0a0800 0%, #120f00 50%, #0a0800 100%)" }}
            >
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #f2b90d 0%, transparent 70%)" }} />
              </div>
              <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
                <div className="text-center lg:text-left flex-1">
                  <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.5em] text-primary/70 block mb-3">Newsletter exclusivo</span>
                  <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                    Sé el primero en conocer
                    <span className="text-primary italic font-serif"> nuestras ofertas.</span>
                  </h2>
                  <p className="mt-3 text-sm text-white/35 font-light max-w-sm">
                    Suscríbete y recibe un <strong className="text-primary font-black">-10% en tu primer pedido</strong>.
                    Sin spam. Solo lo mejor.
                  </p>
                </div>
                <div className="flex-1 w-full lg:w-auto">
                  {!newsletterSent ? (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="email"
                        placeholder="tu@email.com"
                        value={newsletterEmail}
                        onChange={e => setNewsletterEmail(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && newsletterEmail.includes("@")) setNewsletterSent(true); }}
                        className="flex-1 h-12 px-5 rounded-full bg-white/[0.06] border border-white/15 text-white text-sm placeholder:text-white/30 outline-none focus:border-primary/50 transition-all"
                      />
                      <button
                        onClick={() => { if (newsletterEmail.includes("@")) setNewsletterSent(true); }}
                        className="h-12 px-8 rounded-full bg-primary text-[#080808] text-[10px] font-black uppercase tracking-[0.25em] hover:bg-white transition-all whitespace-nowrap shadow-xl shadow-primary/20"
                      >
                        Quiero mi -10%
                      </button>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="h-12 flex items-center justify-center gap-3 text-emerald-400"
                    >
                      <span className="material-symbols-outlined">check_circle</span>
                      <span className="text-sm font-black uppercase tracking-wide">¡Bienvenido/a a la familia Eros &amp; Afrodita!</span>
                    </motion.div>
                  )}
                  <p className="mt-3 text-[9px] text-white/20 text-center">
                    Al suscribirte aceptas nuestra política de privacidad. Puedes darte de baja cuando quieras.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </FadeUp>

        {/* ══════════════════════════════════════════════════
            11. RECOMENDADOS
        ══════════════════════════════════════════════════ */}
        <section className="px-4 lg:px-20 mt-16 sm:mt-24 pb-24">
          <div className="max-w-[1440px] mx-auto">
            <FadeUp className="flex items-baseline justify-between mb-6 sm:mb-8">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-primary mb-1">Seleccionados para ti</p>
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">Recomendados</h2>
              </div>
              <Link to="/catalog" className="text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-primary transition-colors flex items-center gap-1">
                Ver catálogo <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </FadeUp>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-5">
              {!loading && !error && recommendedPool.slice(0, recommendedCount).map(product => (
                <ProductCard key={product.id} product={product} onHide={() => setRecommendedCount(c => c + 1)} />
              ))}
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
