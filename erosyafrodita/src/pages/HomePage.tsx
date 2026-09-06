import React, { useEffect, useState } from "react";

import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import { getProductos, type Producto } from "../api/products";
import { useCart } from "../context/CartContext";
import { useTranslation } from "../i18n";
import { motion } from "framer-motion";
import SEO from "../components/SEO";
import homeHeader from "../assets/home-header.jpeg";

// Las marcas se cargan ahora desde la configuración del backend.

const CATEGORY_PILLS = [
  { value: "Perfumes", label: "Perfumes", icon: "flare", color: "amber" },
  { value: "Cosmética", label: "Cosmética", icon: "spa", color: "emerald" },
  { value: "Maquillaje", label: "Maquillaje", icon: "brush", color: "rose" },
  { value: "Cabello", label: "Cabello", icon: "content_cut", color: "yellow" },
  { value: "Parafarmacia", label: "Parafarmacia", icon: "medical_services", color: "green" },
  { value: "Linea de Baño", label: "Línea de Baño", icon: "bathtub", color: "sky" },
  { value: "Complementos", label: "Complementos", icon: "eyeglasses", color: "cyan" },
  { value: "Otros", label: "Otros", icon: "apps", color: "violet" },
] as const;

const CATEGORY_PILL_CLASSES: Record<string, string> = {
  amber: "hover:border-amber-400 hover:text-amber-300",
  emerald: "hover:border-emerald-400 hover:text-emerald-300",
  rose: "hover:border-rose-400 hover:text-rose-300",
  yellow: "hover:border-yellow-500 hover:text-yellow-400",
  green: "hover:border-green-400 hover:text-green-300",
  sky: "hover:border-sky-400 hover:text-sky-300",
  cyan: "hover:border-cyan-400 hover:text-cyan-300",
  violet: "hover:border-violet-400 hover:text-violet-300",
};

const CATEGORY_ICON_COLOR_CLASSES: Record<string, string> = {
  amber: "text-amber-400",
  emerald: "text-emerald-400",
  rose: "text-rose-400",
  yellow: "text-yellow-500",
  green: "text-green-400",
  sky: "text-sky-400",
  cyan: "text-cyan-400",
  violet: "text-violet-400",
};

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const HomePage: React.FC = () => {
  const [featuredProduct, setFeaturedProduct] = useState<Producto | null>(null);
  const [novedadesPool, setNovedadesPool] = useState<Producto[]>([]);
  const [novedadesCount, setNovedadesCount] = useState(10);
  const [recommendedPool, setRecommendedPool] = useState<Producto[]>([]);
  const [recommendedCount, setRecommendedCount] = useState(10);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { getProductos, getConfiguracion } = await import("../api/products");
        
        // Cargar productos y configuración en paralelo
        const [data, config] = await Promise.all([
          getProductos(0, 200),
          getConfiguracion()
        ]);

        const content: Producto[] = data.content || [];
        const withImage = content.filter(p => !!p.imagen && p.stock > 0);

        // Marcas y categorías realmente disponibles ahora mismo (catálogo en vivo,
        // no una lista fija) — así el marquee y las pastillas de categoría se
        // adaptan solos según lo que subas a la tienda.
        const brandSet = new Set<string>();
        const categorySet = new Set<string>();
        withImage.forEach(p => {
          if (p.manufacturer) brandSet.add(p.manufacturer.trim());
          if (p.categoria) categorySet.add(p.categoria.trim());
        });
        setAvailableBrands(Array.from(brandSet).sort((a, b) => a.localeCompare(b)));
        setAvailableCategories(categorySet);

        // Parsear marcas desde config
        const novedadesBrands = config.novedadesBrands 
          ? config.novedadesBrands.split(",").map(s => s.trim().toUpperCase()).filter(Boolean)
          : [];
        const recomendadosBrands = config.recomendadosBrands
          ? config.recomendadosBrands.split(",").map(s => s.trim().toUpperCase()).filter(Boolean)
          : [];

        const isNovedadBrand = (p: Producto) =>
          !!p.manufacturer &&
          novedadesBrands.some((b: string) =>
            p.manufacturer!.toUpperCase().includes(b)
          );

        const isRecomendadoBrand = (p: Producto) =>
          !!p.manufacturer &&
          recomendadosBrands.some((b: string) =>
            p.manufacturer!.toUpperCase().includes(b)
          );

        // --- NOVEDADES ---
        const novedadesBranded = shuffleArray(withImage.filter(isNovedadBrand));
        const novedadesExtra = shuffleArray(withImage.filter(p => !isNovedadBrand(p)));
        const novedadesAll = [...novedadesBranded, ...novedadesExtra];
        setNovedadesPool(novedadesAll);

        const novedadesIds = new Set(novedadesBranded.map(p => p.id));

        // --- OFERTA DE LA SEMANA ---
        const conDescuento = withImage.filter(p => p.precioPVP > p.precio);
        const highAppealConDescuento = conDescuento.filter(isNovedadBrand);
        const ofertaPool = highAppealConDescuento.length > 0 ? highAppealConDescuento : conDescuento;
        const ofertaCandidate = ofertaPool
          .sort((a, b) => (b.precioPVP - b.precio) - (a.precioPVP - a.precio))[0] ?? null;
        setFeaturedProduct(ofertaCandidate);

        // --- RECOMENDADOS ---
        const recomendadosBase = withImage.filter(p =>
          p.id !== ofertaCandidate?.id &&
          !novedadesIds.has(p.id)
        );

        const recomendadosBranded = shuffleArray(recomendadosBase.filter(isRecomendadoBrand));
        const recomendadosExtra = shuffleArray(recomendadosBase.filter(p => !isRecomendadoBrand(p)));

        setRecommendedPool([...recomendadosBranded, ...recomendadosExtra]);

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
    <div className="bg-white text-charcoal font-display flex flex-col min-h-screen relative">
      <SEO
        title="AGE Parfums | Ritual de Belleza y Lujo"
        description="Descubre nuestra exclusiva colección de perfumes y cosmética premium. Ritual de belleza inspirado en los dioses para hombres y mujeres."
        keywords="perfumes de lujo, cosmética premium, AGE Parfums, belleza divina, fragancias exclusivas"
      />
      {/* Schema.org JSON-LD para la Organización y Sitio Web */}
      <script type="application/ld+json">
        {JSON.stringify([
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "AGE Parfums",
            "url": "https://erosyafrodita.com",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://erosyafrodita.com/#/catalog?search={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          },
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "AGE Parfums",
            "url": "https://erosyafrodita.com",
            "logo": "https://erosyafrodita.com/logo-eros.png",
            "contactPoint": {
              "@type": "ContactPoint",
              "telephone": "+34-600-000-000",
              "contactType": "customer service",
              "areaServed": "ES",
              "availableLanguage": "Spanish"
            },
            "sameAs": [
              "https://www.instagram.com/erosyafrodita",
              "https://www.facebook.com/erosyafrodita"
            ]
          }
        ])}
      </script>
      <Header />
      <main className="flex-grow">

        {/* Home Header Banner */}
        <div className="w-full px-0 sm:px-4 lg:px-20 pb-4 sm:pb-6">
          <div className="max-w-[1440px] mx-auto relative sm:px-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="w-full overflow-hidden rounded-xl sm:rounded-2xl shadow-2xl shadow-black/40 border border-white/5 bg-black"
            >
              <img
                src={homeHeader}
                alt="AGE Parfums — Colección"
                className="w-full h-auto min-h-[200px] sm:min-h-[300px] lg:h-auto object-cover sm:object-cover"
                style={{ objectPosition: window.innerWidth < 640 ? "right center" : "center center" }}
              />
              
              {/* Texto "Mágico" solo para móvil (donde se corta la foto) */}
              <div className="absolute inset-0 h-full w-full flex flex-col items-center justify-center p-4 text-center sm:hidden bg-black/10 backdrop-blur-[1px] z-10">
                  <motion.h1 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-2xl xs:text-3xl font-black text-white leading-none uppercase tracking-tighter drop-shadow-[0_4px_15px_rgba(0,0,0,1)]"
                  >
                    AGE <span className="text-primary italic font-serif">Parfums</span>
                  </motion.h1>
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-2 text-[9px] font-black uppercase tracking-[0.5em] text-primary drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
                  >
                    La Esencia Divina
                  </motion.p>
              </div>
            </motion.div>

            {/* BUSCADOR PREMIUM INTEGRADO - Optimizado para Mobile */}
            <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.3, duration: 0.5 }}
               className="mt-4 sm:-mt-10 relative z-20 px-2 sm:px-0"
            >
              <div className="max-w-3xl mx-auto">
                <div className="bg-charcoal/60 backdrop-blur-3xl border border-white/20 p-1.5 sm:p-2 rounded-full sm:rounded-[2.5rem] shadow-2xl shadow-black/50 flex items-center group focus-within:border-primary/50 transition-all duration-500">
                  <div className="size-10 sm:size-14 rounded-full bg-white/5 flex items-center justify-center text-white/40 group-focus-within:text-primary group-focus-within:bg-primary/10 transition-all shrink-0">
                    <span className="material-symbols-outlined text-xl sm:text-2xl">search</span>
                  </div>
                  <input 
                    type="text" 
                    name="q"
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="Busca marca, aroma o nombre..."
                    className="flex-1 bg-transparent border-none outline-none px-3 sm:px-6 text-white text-sm sm:text-base font-light placeholder:text-white/40"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleSearch();
                        }
                    }}
                  />
                  <button 
                    onClick={handleSearch}
                    className="hidden sm:flex h-12 px-8 rounded-full bg-primary text-charcoal text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white transition-all items-center justify-center"
                  >
                    Buscar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Categories Strip sanitized */}
        <div className="px-4 lg:px-6 py-4 lg:py-6">
          <div className="max-w-[1440px] mx-auto">
            <div className="flex flex-wrap lg:flex-nowrap items-center justify-center gap-2 sm:gap-2 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 no-scrollbar">
              
              {/* Solo se muestran las categorías con productos disponibles ahora mismo */}
              {CATEGORY_PILLS.filter(cat => availableCategories.has(cat.value)).map(cat => (
                <Link
                  key={cat.value}
                  to={`/catalog?categoria=${encodeURIComponent(cat.value)}`}
                  className={`flex h-10 whitespace-nowrap items-center justify-center gap-2 rounded-full bg-surface-dark text-gray-200 border border-white/10 px-3 sm:px-4 transition-all hover:bg-white/5 ${CATEGORY_PILL_CLASSES[cat.color]}`}
                >
                  <span className={`material-symbols-outlined notranslate normal-case text-[18px] ${CATEGORY_ICON_COLOR_CLASSES[cat.color]}`}>
                    {cat.icon}
                  </span>
                  <span className="text-sm font-medium">{cat.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
        

        {/* Novedades */}
        <section className="px-4 lg:px-20 py-16 bg-white">
          <div className="max-w-[1440px] mx-auto">
            <Link to="/catalog?status=NOVEDADES" className="group block mb-8">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-charcoal uppercase italic flex items-center gap-4 group-hover:text-primary transition-colors">
                Novedades
                <span className="material-symbols-outlined text-primary group-hover:translate-x-2 transition-transform">arrow_forward</span>
              </h2>
            </Link>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-6">
              {loading && (
                <p className="text-charcoal/60 col-span-full">
                  Cargando productos...
                </p>
              )}
              {error && !loading && (
                <p className="text-red-400 col-span-full">{error}</p>
              )}
              {!loading &&
                !error &&
                novedadesPool.slice(0, novedadesCount).map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onHide={() => setNovedadesCount(c => c + 1)}
                  />
                ))}
            </div>

            {/* Botón Ver Más */}
            {novedadesPool.length > novedadesCount && (
              <div className="mt-12 flex justify-center">
                <button
                  onClick={() => setNovedadesCount(c => c + 10)}
                  className="group flex flex-col items-center gap-2 transition-all hover:scale-105"
                >
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-charcoal/40 group-hover:text-primary transition-colors">Ver más</span>
                  <div className="size-10 rounded-full border border-charcoal/10 flex items-center justify-center group-hover:border-primary/50 group-hover:bg-primary/5 transition-all">
                    <span className="material-symbols-outlined text-charcoal/30 group-hover:text-primary transition-colors">expand_more</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </section>


        {/* Marcas Destacadas (Loop Infinito) — construido con las marcas realmente
            disponibles en el catálogo, para no anunciar marcas que no vendemos */}
        {availableBrands.length > 0 && (
          <section className="py-12 border-y border-charcoal/10 bg-white overflow-hidden relative">
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white to-transparent z-10"></div>
            <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white to-transparent z-10"></div>

            <div className="animate-infinite-scroll items-center gap-16">
              {availableBrands.concat(availableBrands).map((brand, i) => (
                <Link
                  key={`${brand}-${i}`}
                  to={`/catalog?manufacturer=${encodeURIComponent(brand)}`}
                  className="text-[10px] font-black tracking-[0.4em] text-charcoal/20 uppercase hover:text-primary transition-all whitespace-nowrap cursor-pointer hover:scale-110"
                  title={`Ver productos de ${brand}`}
                >
                  {brand}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Oferta destacada - Versión más compacta */}
        {featuredProduct && (
          <section className="px-4 lg:px-20 py-12 bg-white">
            <div className="max-w-[1200px] mx-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="rounded-[1.5rem] lg:rounded-[2.5rem] overflow-hidden bg-charcoal-surface border border-charcoal/10 flex flex-col lg:flex-row shadow-2xl glass-panel"
              >
                <div className="w-full lg:w-[400px] h-64 sm:h-80 lg:h-[400px] bg-white flex items-center justify-center relative overflow-hidden group/img p-10">
                  <div className="absolute inset-0 bg-gradient-to-tr from-charcoal/5 to-transparent pointer-events-none" />
                  <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.05)]" />
                  <img
                    src={featuredProduct.imagen || ""}
                    alt={featuredProduct.nombre}
                    className="max-w-full max-h-full object-contain drop-shadow-xl transition-transform duration-700 group-hover/img:scale-110"
                  />
                </div>
                <div className="flex-1 p-6 sm:p-8 lg:p-12 flex flex-col justify-center">
                  <span className="text-[10px] sm:text-[12px] font-black tracking-[0.3em] uppercase text-primary mb-2 sm:mb-4">Oferta de la semana</span>
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-3 sm:mb-4 text-charcoal leading-tight">
                    {featuredProduct.nombre}
                  </h3>
                  <p className="text-xs sm:text-sm text-charcoal/50 mb-6 sm:mb-8 max-w-md font-light leading-relaxed">
                    Descubre la esencia exclusiva de {featuredProduct.manufacturer}.
                    Una oportunidad única para elevar tu colección personal.
                  </p>
                  <div className="flex items-baseline gap-4 sm:gap-6 mb-6 sm:mb-8">
                    <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                      {(featuredProduct.precioPVP || featuredProduct.precio || 0).toFixed(2)} €
                    </span>
                    <span className="text-base sm:text-lg text-charcoal/20 line-through">
                      {((featuredProduct.precioPVP || featuredProduct.precio || 0) * 1.35).toFixed(2)} €
                    </span>
                    <span className="text-[10px] sm:text-xs font-black text-emerald-400 bg-emerald-400/10 px-2 sm:px-3 py-1 rounded-full border border-emerald-400/20">
                      -35%
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 sm:gap-4">
                    <button
                      onClick={() => addItem(featuredProduct)}
                      className="flex-1 sm:flex-none h-11 sm:h-12 px-6 sm:px-10 rounded-full bg-primary text-charcoal text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-white transition-all shadow-xl shadow-primary/20"
                    >
                      Añadir
                    </button>
                    <Link
                      to={`/product/${featuredProduct.id}`}
                      className="flex-1 sm:flex-none h-11 sm:h-12 px-6 sm:px-8 rounded-full border border-charcoal/10 text-charcoal text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-charcoal/5 transition-all flex items-center justify-center"
                    >
                      Detalles
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>
        )}

        {/* Recomendados */}
        <section className="px-4 lg:px-20 pb-24 bg-white">
          <div className="max-w-[1440px] mx-auto">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-2xl font-bold text-charcoal">Recomendados para ti</h3>
              <Link to="/catalog" className="text-xs font-black uppercase tracking-widest text-primary hover:text-charcoal flex items-center gap-2 transition-colors">
                Ver más <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-6">
              {!loading && !error && recommendedPool.slice(0, recommendedCount).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onHide={() => setRecommendedCount(c => c + 1)}
                />
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
