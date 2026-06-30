import React, { useEffect, useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import { getProductos, type Producto } from "../api/products";
import { useCart } from "../context/CartContext";
import { useTranslation } from "../i18n";
import { motion, AnimatePresence } from "framer-motion";
import SEO from "../components/SEO";
import homeBg from "../assets/home-background.png";
import homeHeader from "../assets/home-header.png";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function useCountdown(targetDate: Date) {
  const calc = useCallback(() => {
    const diff = targetDate.getTime() - Date.now();
    if (diff <= 0) return { h: 0, m: 0, s: 0 };
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    const s = Math.floor((diff % 60_000) / 1_000);
    return { h, m, s };
  }, [targetDate]);

  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1_000);
    return () => clearInterval(id);
  }, [calc]);
  return time;
}

// Oferta termina a medianoche
const OFFER_END = (() => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
})();

// ─── Datos estáticos ──────────────────────────────────────────────────────────
const TRUST_BADGES = [
  { icon: "local_shipping",   title: "Envío en 24/48h",        sub: "Pedidos antes de las 14h" },
  { icon: "replay",           title: "30 días devolución",      sub: "Sin preguntas, sin coste" },
  { icon: "verified",         title: "100% Autenticidad",       sub: "Originales garantizados" },
  { icon: "lock",             title: "Pago 100% Seguro",        sub: "SSL · Visa · PayPal · Bizum" },
  { icon: "headset_mic",      title: "Atención Premium",        sub: "Lun–Vie 9h–19h" },
];

const CATEGORIES = [
  { label: "Perfumes",        slug: "Perfumes",       icon: "flare",            color: "from-amber-900/60 to-black",    accent: "text-amber-400"  },
  { label: "Cosmética",       slug: "Cosmética",      icon: "spa",              color: "from-emerald-900/60 to-black",  accent: "text-emerald-400" },
  { label: "Maquillaje",      slug: "Maquillaje",     icon: "brush",            color: "from-rose-900/60 to-black",     accent: "text-rose-400"   },
  { label: "Cabello",         slug: "Cabello",        icon: "content_cut",      color: "from-yellow-900/60 to-black",   accent: "text-yellow-400"  },
  { label: "Parafarmacia",    slug: "Parafarmacia",   icon: "medical_services", color: "from-green-900/60 to-black",    accent: "text-green-400"  },
  { label: "Línea de Baño",   slug: "Linea de Baño",  icon: "bathtub",          color: "from-sky-900/60 to-black",      accent: "text-sky-400"    },
  { label: "Complementos",    slug: "Complementos",   icon: "diamond",          color: "from-purple-900/60 to-black",   accent: "text-purple-400" },
  { label: "Otros",           slug: "Otros",          icon: "apps",             color: "from-slate-800/60 to-black",    accent: "text-slate-400"  },
];

const BRANDS = [
  "ADOLFO DOMINGUEZ","KILIAN","4711","ROCHAS","LOLITA LEMPICKA",
  "HERMÈS","CLINIQUE","SLAVA ZAÏTSEV","LOEWE","CHANEL",
  "DIOR","GUCCI","PRADA","ARMANI","GIVENCHY","YSL","BURBERRY","VALENTINO",
];

const REVIEWS = [
  { name: "Sofía M.",   city: "Madrid",    stars: 5, text: "El perfume llegó en 24h perfectamente embalado. Huele exactamente igual que en la tienda física. Repetiré sin duda." },
  { name: "Carlos R.",  city: "Barcelona", stars: 5, text: "Increíble relación calidad-precio. Llevo 3 pedidos y siempre impecable. El packaging es muy cuidado." },
  { name: "Laura G.",   city: "Valencia",  stars: 5, text: "Me asesoraron por WhatsApp y acerté con el regalo. Mi madre quedó encantada. Totalmente recomendable." },
  { name: "Andrés P.",  city: "Sevilla",   stars: 5, text: "La mejor tienda online de perfumería. Precios imbatibles y envío rapidísimo. Sin comparación." },
];

// ─── Animaciones ──────────────────────────────────────────────────────────────
const fadeUp = {
  hidden:  { opacity: 0, y: 28 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16,1,0.3,1], delay: i * 0.08 } }),
};

const stagger = { visible: { transition: { staggerChildren: 0.07 } } };

// ─── Stars ────────────────────────────────────────────────────────────────────
const Stars: React.FC<{ n: number }> = ({ n }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <span key={i} className={`material-symbols-outlined text-[14px] ${ i < n ? "star-filled" : "star-empty" }`} style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
    ))}
  </div>
);

// ─── CountdownBox ─────────────────────────────────────────────────────────────
const CountdownBox: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div className="countdown-box">
    <span className="text-lg sm:text-2xl font-black text-primary tabular-nums leading-none">
      {String(value).padStart(2, "0")}
    </span>
    <span className="text-[8px] font-black uppercase tracking-widest text-white/30 mt-0.5">{label}</span>
  </div>
);

// ─── Component principal ──────────────────────────────────────────────────────
const HomePage: React.FC = () => {
  const [featuredProduct,  setFeaturedProduct]  = useState<Producto | null>(null);
  const [novedadesPool,    setNovedadesPool]    = useState<Producto[]>([]);
  const [novedadesCount,   setNovedadesCount]   = useState(10);
  const [topVentasPool,    setTopVentasPool]    = useState<Producto[]>([]);
  const [recommendedPool,  setRecommendedPool]  = useState<Producto[]>([]);
  const [recommendedCount, setRecommendedCount] = useState(10);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState<string | null>(null);
  const [searchQuery,      setSearchQuery]      = useState("");
  const [email,            setEmail]            = useState("");
  const [emailSent,        setEmailSent]        = useState(false);

  const navigate  = useNavigate();
  const { addItem } = useCart();
  const { t }     = useTranslation();
  const countdown = useCountdown(OFFER_END);

  const handleSearch = () => {
    if (searchQuery.trim()) navigate(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) { setEmailSent(true); setEmail(""); }
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { getProductos, getConfiguracion } = await import("../api/products");
        const [data, config] = await Promise.all([getProductos(0, 300), getConfiguracion()]);
        const content: Producto[] = data.content || [];
        const withImage = content.filter(p => !!p.imagen && p.stock > 0);

        const novedadesBrands = config.novedadesBrands
          ? config.novedadesBrands.split(",").map((s: string) => s.trim().toUpperCase()).filter(Boolean)
          : [];
        const recomendadosBrands = config.recomendadosBrands
          ? config.recomendadosBrands.split(",").map((s: string) => s.trim().toUpperCase()).filter(Boolean)
          : [];

        const isBrand = (brands: string[]) => (p: Producto) =>
          !!p.manufacturer && brands.some(b => p.manufacturer!.toUpperCase().includes(b));

        // Novedades
        const novBranded = shuffleArray(withImage.filter(isBrand(novedadesBrands)));
        const novExtra   = shuffleArray(withImage.filter(p => !isBrand(novedadesBrands)(p)));
        setNovedadesPool([...novBranded, ...novExtra]);

        // Oferta destacada — mayor descuento absoluto
        const conDesc = withImage.filter(p => p.precioPVP > p.precio);
        const ofertaPool = conDesc.filter(isBrand(novedadesBrands)).length > 0
          ? conDesc.filter(isBrand(novedadesBrands)) : conDesc;
        const oferta = ofertaPool.sort((a, b) => (b.precioPVP - b.precio) - (a.precioPVP - a.precio))[0] ?? null;
        setFeaturedProduct(oferta);

        // Top Ventas — productos con imagen ordenados por precio desc (proxy de popularidad)
        const topPool = shuffleArray(
          withImage.filter(p => p.id !== oferta?.id).slice(0, 60)
        ).slice(0, 10);
        setTopVentasPool(topPool);

        // Recomendados
        const novIds = new Set(novBranded.map(p => p.id));
        const recBase = withImage.filter(p => p.id !== oferta?.id && !novIds.has(p.id));
        const recBranded = shuffleArray(recBase.filter(isBrand(recomendadosBrands)));
        const recExtra   = shuffleArray(recBase.filter(p => !isBrand(recomendadosBrands)(p)));
        setRecommendedPool([...recBranded, ...recExtra]);
      } catch (e: any) {
        setError(e.message ?? "Error al cargar productos");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ─── descuento oferta ──────────────────────────────────────────────────────
  const ofertaPrecio   = featuredProduct ? (featuredProduct.precioPVP || featuredProduct.precio || 0) : 0;
  const ofertaOriginal = featuredProduct ? (featuredProduct.precioPVP > featuredProduct.precio
    ? featuredProduct.precioPVP * 1.25
    : featuredProduct.precio * 1.35
  ) : 0;
  const ofertaPct = ofertaOriginal > 0
    ? Math.round((1 - ofertaPrecio / ofertaOriginal) * 100) : 0;

  return (
    <div className="text-white font-display flex flex-col min-h-screen relative" style={{ backgroundColor: "#080808" }}>

      {/* Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none"
        style={{
          backgroundImage: `url(${homeBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(8px) brightness(0.15) saturate(0.4)",
          transform: "scale(1.05)",
        }}
      />

      <SEO
        title="Eros & Afrodita | Perfumería & Cosmética Premium"
        description="Más de 10.000 referencias en perfumería y cosmética de lujo. Envío 24h, 100% originales y los mejores precios. Descubre la esencia que te define."
        keywords="perfumes de lujo, cosmética premium, Eros y Afrodita, belleza divina, fragancias exclusivas, perfumes baratos"
      />
      <script type="application/ld+json">
        {JSON.stringify([
          { "@context":"https://schema.org","@type":"WebSite","name":"Eros & Afrodita","url":"https://erosyafrodita.com","potentialAction":{"@type":"SearchAction","target":"https://erosyafrodita.com/#/catalog?search={search_term_string}","query-input":"required name=search_term_string"} },
          { "@context":"https://schema.org","@type":"Organization","name":"Eros & Afrodita","url":"https://erosyafrodita.com","logo":"https://erosyafrodita.com/logo-eros.png","sameAs":["https://www.instagram.com/erosyafrodita","https://www.facebook.com/erosyafrodita"] }
        ])}
      </script>

      <Header />
      <main className="flex-grow">

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            1. HERO BANNER
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="w-full px-0 sm:px-4 lg:px-8 xl:px-16 pb-0">
          <div className="max-w-[1600px] mx-auto relative">
            <motion.div
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.16,1,0.3,1] }}
              className="relative w-full overflow-hidden sm:rounded-2xl xl:rounded-3xl shadow-2xl border border-white/5"
              style={{ minHeight: "320px" }}
            >
              <img
                src={homeHeader}
                alt="Eros & Afrodita — Colección Premium"
                className="w-full h-auto object-cover"
                style={{ minHeight: "220px", objectPosition: window.innerWidth < 640 ? "right center" : "center center" }}
                loading="eager"
              />
              {/* Overlay gradiente sobre imagen */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

              {/* Copy hero — izquierda */}
              <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10 lg:px-16 py-8">
                <motion.span
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="section-label mb-4 sm:mb-6"
                >
                  Nueva Colección 2026
                </motion.span>
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6, ease: [0.16,1,0.3,1] }}
                  className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-none uppercase tracking-tighter text-white max-w-xl"
                >
                  La Esencia<br />
                  <span className="text-gradient-gold italic">que te Define</span>
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                  className="mt-3 sm:mt-4 text-xs sm:text-sm text-white/50 max-w-xs font-light leading-relaxed hidden sm:block"
                >
                  Más de 10.000 referencias. Envío en 24h. 100% originales.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.85, duration: 0.5 }}
                  className="flex gap-3 mt-5 sm:mt-7"
                >
                  <Link
                    to="/catalog"
                    className="h-10 sm:h-12 px-6 sm:px-8 rounded-full bg-primary text-charcoal text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-white transition-all shadow-xl shadow-primary/20 flex items-center"
                  >
                    Explorar todo
                  </Link>
                  <Link
                    to="/catalog?descuento=true"
                    className="h-10 sm:h-12 px-5 sm:px-7 rounded-full border border-white/20 text-white text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-primary text-sm">local_fire_department</span>
                    Ofertas
                  </Link>
                </motion.div>
              </div>
            </motion.div>

            {/* ─── BUSCADOR ─────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="mt-4 sm:-mt-8 relative z-20 px-2 sm:px-0"
            >
              <div className="max-w-3xl mx-auto">
                <div className="bg-black/60 backdrop-blur-3xl border border-white/15 p-1.5 sm:p-2 rounded-full shadow-2xl shadow-black/50 flex items-center group focus-within:border-primary/50 transition-all duration-500">
                  <div className="size-10 sm:size-13 rounded-full bg-white/5 flex items-center justify-center text-white/30 group-focus-within:text-primary group-focus-within:bg-primary/10 transition-all shrink-0">
                    <span className="material-symbols-outlined text-xl sm:text-2xl">search</span>
                  </div>
                  <input
                    type="text"
                    name="q"
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="Busca marca, fragancia o referencia..."
                    className="flex-1 bg-transparent border-none outline-none px-3 sm:px-5 text-white text-sm sm:text-base font-light placeholder:text-white/30"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSearch()}
                  />
                  <button
                    onClick={handleSearch}
                    className="hidden sm:flex h-11 px-8 rounded-full bg-primary text-charcoal text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white transition-all items-center"
                  >
                    Buscar
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
                  <span className="text-primary/40 italic">Tendencias:</span>
                  {["Rochas","Kilian","Hermès","Dior","Chanel"].map(b => (
                    <Link key={b} to={`/catalog?search=${b}`} className="hover:text-primary transition-colors">{b}</Link>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            2. TRUST BAR
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="px-4 lg:px-8 xl:px-16 py-6 sm:py-8 mt-6">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={stagger}
            className="max-w-[1600px] mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
          >
            {TRUST_BADGES.map((b, i) => (
              <motion.div key={i} variants={fadeUp} custom={i} className="trust-badge">
                <span className="material-symbols-outlined text-primary text-[22px] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>{b.icon}</span>
                <div>
                  <p className="text-[11px] font-black text-white uppercase tracking-wide leading-none">{b.title}</p>
                  <p className="text-[10px] text-white/35 mt-0.5 font-light">{b.sub}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            3. CATEGORÍAS VISUALES
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="px-4 lg:px-8 xl:px-16 py-10 sm:py-14">
          <div className="max-w-[1600px] mx-auto">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger}>
              <motion.div variants={fadeUp} className="flex items-center justify-between mb-6 sm:mb-8">
                <div>
                  <span className="section-label">Categorías</span>
                  <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight mt-2">Encuentra tu Ritual</h2>
                </div>
                <Link to="/catalog" className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-white transition-colors flex items-center gap-1">
                  Ver todo <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </motion.div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                {CATEGORIES.map((cat, i) => (
                  <motion.div key={cat.slug} variants={fadeUp} custom={i}>
                    <Link to={`/catalog?categoria=${encodeURIComponent(cat.slug)}`}
                      className="group flex flex-col items-center gap-3 p-4 sm:p-5 rounded-2xl border border-white/5 bg-white/[0.03] hover:border-primary/25 hover:bg-white/[0.06] transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className={`size-12 sm:size-14 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform duration-300`}>
                        <span className={`material-symbols-outlined text-2xl ${cat.accent}`} style={{ fontVariationSettings: "'FILL' 1" }}>{cat.icon}</span>
                      </div>
                      <span className="text-[10px] sm:text-xs font-black text-white/70 uppercase tracking-wider text-center group-hover:text-white transition-colors leading-tight">{cat.label}</span>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            4. NOVEDADES
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="px-4 lg:px-8 xl:px-16 py-12 sm:py-16" style={{ background: "rgba(255,255,255,0.02)" }}>
          <div className="max-w-[1600px] mx-auto">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger}>
              <motion.div variants={fadeUp} className="flex items-end justify-between mb-7 sm:mb-10">
                <div>
                  <span className="section-label">Recién llegados</span>
                  <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight mt-2">
                    Novedades
                    <span className="ml-3 text-[10px] font-black bg-primary text-black px-2.5 py-1 rounded-full tracking-widest align-middle">NEW</span>
                  </h2>
                </div>
                <Link to="/catalog?status=NOVEDADES" className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-white transition-colors flex items-center gap-1">
                  Ver todas <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </motion.div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-5">
                {loading && Array.from({ length: 10 }).map((_, i) => (
                  <motion.div key={i} variants={fadeUp} custom={i}
                    className="aspect-[3/4] rounded-xl bg-white/[0.03] border border-white/5 animate-pulse"
                  />
                ))}
                {error && !loading && (
                  <p className="text-red-400/70 text-sm col-span-full">{error}</p>
                )}
                {!loading && !error && novedadesPool.slice(0, novedadesCount).map((product, i) => (
                  <motion.div key={product.id} variants={fadeUp} custom={i % 10}>
                    <ProductCard product={product} onHide={() => setNovedadesCount(c => c + 1)} />
                  </motion.div>
                ))}
              </div>

              {novedadesPool.length > novedadesCount && (
                <motion.div variants={fadeUp} className="mt-10 flex justify-center">
                  <button
                    onClick={() => setNovedadesCount(c => c + 10)}
                    className="group h-11 px-8 rounded-full border border-white/10 text-white/50 text-[10px] font-black uppercase tracking-widest hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm group-hover:animate-bounce">expand_more</span>
                    Cargar más
                  </button>
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            5. BANNER EDITORIAL DE MARCA
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="relative overflow-hidden grain-overlay" style={{ background: "linear-gradient(135deg, #0d0b07 0%, #1a1500 50%, #0a0800 100%)" }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(242,185,13,0.06) 0%, transparent 70%)" }} />
          <div className="relative z-10 max-w-[1600px] mx-auto px-6 lg:px-16 py-20 sm:py-28 text-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger}>
              <motion.div variants={fadeUp} className="flex justify-center mb-6">
                <span className="section-label">La Filosofía Eros & Afrodita</span>
              </motion.div>
              <motion.h2 variants={fadeUp} custom={1}
                className="text-4xl sm:text-5xl lg:text-7xl font-black uppercase tracking-tighter leading-none text-white max-w-4xl mx-auto"
              >
                Cada Fragancia<br />
                <span className="text-gradient-gold italic">Cuenta Tu Historia</span>
              </motion.h2>
              <motion.p variants={fadeUp} custom={2}
                className="mt-6 sm:mt-8 text-sm sm:text-base text-white/40 max-w-xl mx-auto font-light leading-relaxed"
              >
                Los dioses griegos entendían que la esencia es poder. En Eros & Afrodita reunimos las fragancias y la cosmética que transforman tu presencia. Originales, exclusivos, entregados en tu puerta.
              </motion.p>
              <motion.div variants={fadeUp} custom={3} className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-8">
                {[
                  { value: "+10.000", label: "Referencias" },
                  { value: "+50.000", label: "Clientes satisfechos" },
                  { value: "24h",     label: "Envío express" },
                  { value: "4.9★",   label: "Valoración media" },
                ].map(stat => (
                  <div key={stat.label} className="text-center">
                    <p className="text-2xl sm:text-3xl font-black text-gradient-gold">{stat.value}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            6. OFERTA DESTACADA + COUNTDOWN
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {featuredProduct && (
          <section className="px-4 lg:px-8 xl:px-16 py-12 sm:py-16">
            <div className="max-w-[1200px] mx-auto">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger}>
                <motion.div variants={fadeUp} className="flex items-end justify-between mb-6 sm:mb-8">
                  <div>
                    <span className="section-label">Tiempo limitado</span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight mt-2">Oferta del Día</h2>
                  </div>
                  {/* Countdown */}
                  <div className="flex items-center gap-2">
                    <CountdownBox value={countdown.h} label="h" />
                    <span className="text-primary font-black text-lg">:</span>
                    <CountdownBox value={countdown.m} label="min" />
                    <span className="text-primary font-black text-lg">:</span>
                    <CountdownBox value={countdown.s} label="seg" />
                  </div>
                </motion.div>

                <motion.div
                  variants={fadeUp} custom={1}
                  className="rounded-2xl lg:rounded-3xl overflow-hidden border border-white/5 flex flex-col lg:flex-row"
                  style={{ background: "linear-gradient(135deg, #111113 0%, #0e0c08 100%)" }}
                >
                  {/* Imagen */}
                  <div className="w-full lg:w-[420px] h-64 sm:h-80 lg:h-[440px] bg-white flex items-center justify-center relative overflow-hidden group/img p-10">
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent" />
                    <img
                      src={featuredProduct.imagen || ""}
                      alt={featuredProduct.nombre}
                      className="max-w-full max-h-full object-contain drop-shadow-2xl transition-transform duration-700 group-hover/img:scale-108"
                      loading="lazy"
                    />
                    <span className="absolute top-4 left-4 bg-primary text-black text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                      -{ofertaPct}%
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 p-7 sm:p-10 lg:p-14 flex flex-col justify-center">
                    <span className="text-[10px] font-black tracking-[0.3em] uppercase text-primary mb-3">
                      {featuredProduct.manufacturer}
                    </span>
                    <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight mb-4">
                      {featuredProduct.nombre}
                    </h3>
                    <p className="text-xs text-white/40 mb-8 max-w-md font-light leading-relaxed">
                      Una fragancia que trasciende el tiempo. Descúbrela hoy a precio especial, solo por tiempo limitado.
                    </p>

                    {/* Precios */}
                    <div className="flex items-baseline gap-4 mb-8">
                      <span className="text-3xl sm:text-4xl font-black text-emerald-400">
                        {ofertaPrecio.toFixed(2)} €
                      </span>
                      <span className="text-base text-white/20 line-through">
                        {ofertaOriginal.toFixed(2)} €
                      </span>
                      <span className="text-xs font-black text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">
                        Ahorras {(ofertaOriginal - ofertaPrecio).toFixed(2)} €
                      </span>
                    </div>

                    {/* Features rápidas */}
                    <div className="flex flex-wrap gap-3 mb-8">
                      {["Original garantizado","Envío en 24h","Devolución gratuita"].map(f => (
                        <span key={f} className="flex items-center gap-1.5 text-[10px] font-black text-white/40 uppercase tracking-widest">
                          <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                          {f}
                        </span>
                      ))}
                    </div>

                    {/* CTAs */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => addItem(featuredProduct)}
                        className="flex-1 sm:flex-none h-12 px-8 sm:px-12 rounded-full bg-primary text-black text-xs font-black uppercase tracking-widest hover:bg-white transition-all shadow-xl shadow-primary/20"
                      >
                        Añadir al carrito
                      </button>
                      <Link
                        to={`/product/${featuredProduct.id}`}
                        className="flex-1 sm:flex-none h-12 px-7 sm:px-10 rounded-full border border-white/10 text-white text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-all flex items-center justify-center"
                      >
                        Ver detalles
                      </Link>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </section>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            7. TOP VENTAS
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {topVentasPool.length > 0 && (
          <section className="px-4 lg:px-8 xl:px-16 py-12 sm:py-16" style={{ background: "rgba(242,185,13,0.02)" }}>
            <div className="max-w-[1600px] mx-auto">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger}>
                <motion.div variants={fadeUp} className="flex items-end justify-between mb-7 sm:mb-10">
                  <div>
                    <span className="section-label">Ranking</span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight mt-2">
                      Los Más Vendidos
                      <span className="ml-3 material-symbols-outlined text-primary align-middle text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                    </h2>
                  </div>
                  <Link to="/catalog?sort=ventas" className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-white transition-colors flex items-center gap-1">
                    Ver ranking <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                </motion.div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-5">
                  {topVentasPool.map((product, i) => (
                    <motion.div key={product.id} variants={fadeUp} custom={i} className="relative">
                      <div className="top-badge">#{i + 1}</div>
                      <ProductCard product={product} onHide={() => {}} />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </section>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            8. MARCAS — carrusel premium
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="py-10 sm:py-14 border-y border-white/5 overflow-hidden relative" style={{ background: "#0a0a0b" }}>
          <div className="absolute inset-y-0 left-0 w-24 sm:w-40 bg-gradient-to-r from-[#0a0a0b] to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-24 sm:w-40 bg-gradient-to-l from-[#0a0a0b] to-transparent z-10 pointer-events-none" />
          <p className="text-center text-[9px] font-black uppercase tracking-[0.5em] text-white/15 mb-7">Marcas exclusivas</p>
          <motion.div
            className="flex w-max items-center gap-12 sm:gap-20"
            animate={{ x: [0, -2000] }}
            transition={{ x: { repeat: Infinity, repeatType: "loop", duration: 35, ease: "linear" } }}
          >
            {[...BRANDS, ...BRANDS].map((brand, i) => (
              <Link
                key={i}
                to={`/catalog?manufacturer=${encodeURIComponent(brand)}`}
                className="text-[9px] sm:text-[10px] font-black tracking-[0.4em] text-white/12 uppercase hover:text-primary transition-all whitespace-nowrap hover:scale-110"
                title={`Ver productos de ${brand}`}
              >
                {brand}
              </Link>
            ))}
          </motion.div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            9. PRUEBA SOCIAL — Reseñas
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="px-4 lg:px-8 xl:px-16 py-14 sm:py-20">
          <div className="max-w-[1600px] mx-auto">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger}>
              <motion.div variants={fadeUp} className="text-center mb-10 sm:mb-14">
                <span className="section-label justify-center">Opiniones reales</span>
                <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight mt-2">Lo Que Dicen Nuestros Clientes</h2>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Stars n={5} />
                  <span className="text-sm font-black text-white">4.9</span>
                  <span className="text-xs text-white/30 font-light">· Más de 12.000 valoraciones</span>
                </div>
              </motion.div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {REVIEWS.map((r, i) => (
                  <motion.div
                    key={i} variants={fadeUp} custom={i}
                    className="p-5 sm:p-6 rounded-2xl border border-white/5 flex flex-col gap-4 hover:border-primary/20 transition-colors"
                    style={{ background: "var(--charcoal-card)" }}
                  >
                    <Stars n={r.stars} />
                    <p className="text-sm text-white/60 font-light leading-relaxed italic flex-1">&ldquo;{r.text}&rdquo;</p>
                    <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                      <div className="size-8 rounded-full bg-primary/20 border border-primary/20 flex items-center justify-center text-[11px] font-black text-primary">
                        {r.name[0]}
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-white">{r.name}</p>
                        <p className="text-[10px] text-white/30">{r.city}</p>
                      </div>
                      <span className="ml-auto material-symbols-outlined text-emerald-400 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            10. NEWSLETTER — Captura de leads
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="px-4 lg:px-8 xl:px-16 py-14 sm:py-20 relative overflow-hidden grain-overlay"
          style={{ background: "linear-gradient(135deg, #0f0d06 0%, #160f00 50%, #0b0900 100%)" }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 80% at 50% 100%, rgba(242,185,13,0.07) 0%, transparent 70%)" }} />
          <div className="relative z-10 max-w-2xl mx-auto text-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger}>
              <motion.span variants={fadeUp} className="section-label justify-center">Comunidad exclusiva</motion.span>
              <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tighter mt-3 mb-3">
                Sé el Primero en Descubrirlo
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} className="text-sm text-white/40 font-light leading-relaxed mb-2">
                Únete a más de 50.000 apasionados de la perfumería. Ofertas exclusivas, novedades avant-première y
              </motion.p>
              <motion.p variants={fadeUp} custom={2} className="text-sm font-black text-primary mb-8">
                -10% de descuento en tu primer pedido.
              </motion.p>

              <AnimatePresence mode="wait">
                {emailSent ? (
                  <motion.div
                    key="sent"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-3"
                  >
                    <span className="material-symbols-outlined text-emerald-400 text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <p className="text-white font-black text-lg">¡Bienvenido/a a la familia!</p>
                    <p className="text-white/40 text-sm">Revisa tu correo para obtener tu cupón de bienvenida.</p>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    onSubmit={handleNewsletter}
                    variants={fadeUp} custom={3}
                    className="flex flex-col sm:flex-row gap-3"
                  >
                    <div className="flex-1 flex items-center bg-black/50 border border-white/10 rounded-full focus-within:border-primary/50 transition-colors overflow-hidden px-5">
                      <span className="material-symbols-outlined text-white/20 text-lg mr-2">mail</span>
                      <input
                        type="email"
                        required
                        placeholder="Tu correo electrónico"
                        className="newsletter-input py-3"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                      />
                    </div>
                    <button
                      type="submit"
                      className="h-12 px-8 rounded-full bg-primary text-black text-xs font-black uppercase tracking-widest hover:bg-white transition-all shadow-xl shadow-primary/20 whitespace-nowrap"
                    >
                      Quiero mi -10%
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>

              <motion.p variants={fadeUp} custom={4} className="mt-4 text-[10px] text-white/20 font-light">
                Sin spam. Cancela cuando quieras. Prometemos solo enviarte lo bueno.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            11. RECOMENDADOS
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="px-4 lg:px-8 xl:px-16 py-12 sm:py-16 pb-24">
          <div className="max-w-[1600px] mx-auto">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger}>
              <motion.div variants={fadeUp} className="flex items-end justify-between mb-7 sm:mb-10">
                <div>
                  <span className="section-label">Selección especial</span>
                  <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight mt-2">Recomendados para Ti</h2>
                </div>
                <Link to="/catalog" className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-white transition-colors flex items-center gap-1">
                  Ver catálogo <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </motion.div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-5">
                {!loading && !error && recommendedPool.slice(0, recommendedCount).map((product, i) => (
                  <motion.div key={product.id} variants={fadeUp} custom={i % 10}>
                    <ProductCard product={product} onHide={() => setRecommendedCount(c => c + 1)} />
                  </motion.div>
                ))}
              </div>
              {recommendedPool.length > recommendedCount && (
                <motion.div variants={fadeUp} className="mt-10 flex justify-center">
                  <button
                    onClick={() => setRecommendedCount(c => c + 10)}
                    className="group h-11 px-8 rounded-full border border-white/10 text-white/50 text-[10px] font-black uppercase tracking-widest hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">expand_more</span>
                    Cargar más
                  </button>
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
