import React, { useEffect, useState } from "react";

import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import { getProductos, type Producto } from "../api/products";
import { useCart } from "../context/CartContext";
import { useTranslation } from "../i18n";
import { motion } from "framer-motion";
import SEO from "../components/SEO";
import homeBg from "../assets/home-background.png";
import homeHeader from "../assets/home-header.png";

// Marcas curadas para la sección Novedades — basadas en el catálogo real
const NOVEDADES_BRANDS = [
  "CALVIN KLEIN",

  "HOLLISTER",
  "KARL LAGERFELD",
  "L'OCCITANE EN PROVENCE",
  "MOSCHINO",
  "ELIZABETH ARDEN",
  "LATTAFA",
  "MAISON ALHAMBRA",
  "ARD AL ZAAFARAN",
  "MYRURGIA",
  "POLICE",
  "DUPONT",

  "DEVOTA & LOMBA",
];

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

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getProductos(0, 200);
        const content: Producto[] = data.content || [];

        const withImage = content.filter(p => !!p.imagen && p.stock > 0);

        const isNovedadBrand = (p: Producto) =>
          !!p.manufacturer &&
          NOVEDADES_BRANDS.some((b: string) =>
            p.manufacturer!.toUpperCase().includes(b)
          );

        // --- NOVEDADES: marcas curadas primero, luego resto del catálogo como reserva ---
        const novedadesBranded = shuffleArray(withImage.filter(isNovedadBrand));
        const novedadesExtra = shuffleArray(withImage.filter(p => !isNovedadBrand(p)));
        setNovedadesPool([...novedadesBranded, ...novedadesExtra]);

        // --- OFERTA DE LA SEMANA: mayor ahorro absoluto (PVP − precio) ---
        // Prioriza marcas curadas si las hay con descuento, si no usa todo el catálogo
        const conDescuento = withImage.filter(p => p.precioPVP > p.precio);
        const highAppealConDescuento = conDescuento.filter(isNovedadBrand);
        const ofertaPool = highAppealConDescuento.length > 0 ? highAppealConDescuento : conDescuento;
        const ofertaCandidate = ofertaPool
          .sort((a, b) => (b.precioPVP - b.precio) - (a.precioPVP - a.precio))[0] ?? null;
        setFeaturedProduct(ofertaCandidate);

        // --- RECOMENDADOS: Prioriza marcas curadas + mejores ofertas del resto ---
        const recomendadosBase = withImage.filter(p => p.precioPVP > 0 && p.precio < p.precioPVP && p.id !== ofertaCandidate?.id);
        
        const sortRecomendados = (arr: Producto[]) => [...arr].sort((a, b) => {
          const ratioA = (a.precioPVP - a.precio) / a.precioPVP;
          const ratioB = (b.precioPVP - b.precio) / b.precioPVP;
          return ratioB - ratioA;
        });

        const recomendadosBranded = sortRecomendados(recomendadosBase.filter(isNovedadBrand));
        const recomendadosExtra = sortRecomendados(recomendadosBase.filter(p => !isNovedadBrand(p)));
        
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
    <div className="text-white font-display flex flex-col min-h-screen relative">
      {/* Full-page background image — blurred & dimmed */}
      <div
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{
          backgroundImage: `url(${homeBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(6px) brightness(0.22) saturate(0.6)",
          transform: "scale(1.05)",
        }}
      />
      <SEO
        title="Eros & Afrodita | Ritual de Belleza y Lujo"
        description="Descubre nuestra exclusiva colección de perfumes y cosmética premium. Ritual de belleza inspirado en los dioses para hombres y mujeres."
        keywords="perfumes de lujo, cosmética premium, Eros y Afrodita, belleza divina, fragancias exclusivas"
      />
      <Header />
      <main className="flex-grow">
        {/* Categories Strip */}
        <div className="px-4 lg:px-20 py-6 lg:py-8">
          <div className="max-w-[1440px] mx-auto">
            <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar sm:justify-center">
              <Link
                to="/catalog"
                className="flex h-10 whitespace-nowrap items-center justify-center gap-2 rounded-full bg-primary text-charcoal px-6 transition-transform active:scale-95 shadow-lg shadow-primary/20"
              >
                <span className="material-symbols-outlined text-[18px]">
                  temp_preferences_custom
                </span>
                <span className="text-sm font-bold">Todo</span>
              </Link>
              <Link
                to="/catalog?genero=HOMBRE"
                className="flex h-10 whitespace-nowrap items-center justify-center gap-2 rounded-full bg-surface-dark text-gray-200 border border-white/10 hover:border-blue-400 hover:text-blue-300 px-6 transition-all hover:bg-white/5"
              >
                <span className="material-symbols-outlined text-[18px] text-blue-400">
                  male
                </span>
                <span className="text-sm font-medium">Hombre</span>
              </Link>
              <Link
                to="/catalog?genero=MUJER"
                className="flex h-10 whitespace-nowrap items-center justify-center gap-2 rounded-full bg-surface-dark text-gray-200 border border-white/10 hover:border-pink-400 hover:text-pink-300 px-6 transition-all hover:bg-white/5"
              >
                <span className="material-symbols-outlined text-[18px] text-pink-400">
                  female
                </span>
                <span className="text-sm font-medium">Mujer</span>
              </Link>
              <Link
                to="/catalog?orden=fechaDesc"
                className="flex h-10 whitespace-nowrap items-center justify-center gap-2 rounded-full bg-surface-dark text-gray-200 border border-white/10 hover:border-purple-400 hover:text-purple-300 px-6 transition-all hover:bg-white/5"
              >
                <span className="material-symbols-outlined text-[18px] text-purple-400">
                  new_releases
                </span>
                <span className="text-sm font-medium">Novedades</span>
              </Link>
              <Link
                to="/catalog?maxPrecio=50"
                className="flex h-10 whitespace-nowrap items-center justify-center gap-2 rounded-full bg-surface-dark text-primary border border-primary/30 hover:border-primary hover:bg-primary/10 px-6 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">
                  local_offer
                </span>
                <span className="text-sm font-bold italic">Ofertas</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Home Header Banner */}
        <div className="w-full px-4 lg:px-20 pb-6">
          <div className="max-w-[1440px] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="w-full overflow-hidden rounded-2xl shadow-2xl shadow-black/40 border border-white/5"
            >
              <img
                src={homeHeader}
                alt="Eros & Afrodita — Colección"
                className="w-full h-auto object-cover max-h-[520px]"
                style={{ objectPosition: "center top" }}
              />
            </motion.div>
          </div>
        </div>

        {/* Novedades */}
        <section className="px-4 lg:px-20 py-16 bg-charcoal/75">
          <div className="max-w-[1440px] mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                Novedades
              </h2>
              <Link
                to="/catalog"
                className="text-xs font-medium text-white/60 hover:text-primary flex items-center gap-1"
              >
                Ver todo
                <span className="material-symbols-outlined text-[16px]">
                  arrow_forward
                </span>
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-6">
              {loading && (
                <p className="text-white/60 col-span-full">
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
          </div>
        </section>


        {/* Marcas Destacadas (Loop Infinito) - Versión Compacta */}
        <section className="py-12 border-y border-white/5 bg-charcoal/75 overflow-hidden relative">
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-charcoal to-transparent z-10"></div>
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-charcoal to-transparent z-10"></div>
          
          <motion.div 
            className="flex w-max items-center gap-16"
            animate={{ x: [0, -1500] }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 25,
                ease: "linear",
              },
            }}
          >
            {[
              "ADOLFO DOMINGUEZ", "KILIAN", "4711", "CLARINS", "ROCHAS",
              "LOLITA LEMPICKA", "HERMÈS", "CLINIQUE", "SLAVA ZAÏTSEV", "LOEWE",
              "CHANEL", "DIOR", "GUCCI", "PRADA", "ARMANI",
            ].concat([
              "ADOLFO DOMINGUEZ", "KILIAN", "4711", "CLARINS", "ROCHAS",
              "LOLITA LEMPICKA", "HERMÈS", "CLINIQUE", "SLAVA ZAÏTSEV", "LOEWE",
              "CHANEL", "DIOR", "GUCCI", "PRADA", "ARMANI",
            ]).map((brand, i) => (
              <Link
                key={i}
                to={`/catalog?manufacturer=${encodeURIComponent(brand)}`}
                className="text-[10px] font-black tracking-[0.4em] text-white/15 uppercase hover:text-primary transition-all whitespace-nowrap cursor-pointer hover:scale-110"
                title={`Ver productos de ${brand}`}
              >
                {brand}
              </Link>
            ))}
          </motion.div>
        </section>

        {/* Oferta destacada - Versión más compacta */}
        {featuredProduct && (
          <section className="px-4 lg:px-20 py-12 bg-charcoal/75">
            <div className="max-w-[1200px] mx-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="rounded-[2.5rem] overflow-hidden bg-charcoal-surface border border-white/5 flex flex-col lg:flex-row shadow-2xl glass-panel"
              >
                <div className="w-full lg:w-[400px] h-64 lg:h-[400px] bg-white flex items-center justify-center relative overflow-hidden group/img">
                  <div className="absolute inset-0 bg-gradient-to-tr from-charcoal/5 to-transparent pointer-events-none" />
                  <img
                    src={featuredProduct.imagen || ""}
                    alt={featuredProduct.nombre}
                    className="max-w-[75%] max-h-[75%] object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.12)] transition-transform duration-700 group-hover/img:scale-110"
                  />
                </div>
                <div className="flex-1 p-8 lg:p-12 flex flex-col justify-center">
                  <span className="text-[12px] font-black tracking-[0.3em] uppercase text-primary mb-4">Oferta de la semana</span>
                  <h3 className="text-3xl lg:text-4xl font-black mb-4 text-white leading-tight">
                    {featuredProduct.nombre}
                  </h3>
                  <p className="text-sm text-white/50 mb-8 max-w-md font-light leading-relaxed">
                    Descubre la esencia exclusiva de {featuredProduct.manufacturer}.
                    Una oportunidad única para elevar tu colección personal.
                  </p>
                  <div className="flex items-baseline gap-6 mb-8">
                    <span className="text-3xl font-black text-emerald-400">
                      {(featuredProduct.precioPVP || featuredProduct.precio || 0).toFixed(2)} €
                    </span>
                    <span className="text-lg text-white/20 line-through">
                      {((featuredProduct.precioPVP || featuredProduct.precio || 0) * 1.35).toFixed(2)} €
                    </span>
                    <span className="text-xs font-black text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">
                      -35%
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={() => addItem(featuredProduct)}
                      className="h-12 px-10 rounded-full bg-primary text-charcoal text-xs font-black uppercase tracking-widest hover:bg-white hover:scale-105 transition-all shadow-xl shadow-primary/20"
                    >
                      Añadir al carrito
                    </button>
                    <Link
                      to={`/product/${featuredProduct.id}`}
                      className="h-12 px-8 rounded-full border border-white/10 text-white text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-all flex items-center justify-center"
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
        <section className="px-4 lg:px-20 pb-24 bg-charcoal/75">
          <div className="max-w-[1440px] mx-auto">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-2xl font-bold text-white">Recomendados para ti</h3>
              <Link to="/catalog" className="text-xs font-black uppercase tracking-widest text-primary hover:text-white flex items-center gap-2 transition-colors">
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
