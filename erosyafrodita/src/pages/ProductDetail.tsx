import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { getProductoById, getVariantes, getNuevos, type Producto, getProductos } from "../api/products";
import { getResenas, crearResena, checkPurchaseStatus, type Resena } from "../api/reviews";
import ProductCard from "../components/ProductCard";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import SEO from "../components/SEO";
import { LAUNCH_PROMO_ACTIVE, LAUNCH_DISCOUNT, applyPromo } from "../config/promo";
import { useImageGallery } from "../hooks/useImageGallery";

// Marcas curadas de Novedades (Sincronizado con Home)
const NOVEDADES_BRANDS = [
  "CALVIN KLEIN", "HOLLISTER", "KARL LAGERFELD", "L'OCCITANE EN PROVENCE",
  "MOSCHINO", "ABERCROMOBIE AND FITCH", "LATTAFA", "MAISON ALHAMBRA",
  "ARD AL ZAAFARAN", "ANGEL SCHLESSER", "LOLITA LEMPICKA", "LORENZO VILLORESI",
  "LOEWE", "HERMÈS", "CHANEL", "CAROLINA HERRERA", "PILEXIL", "DOLCE & GABBANA",
  "DONNA KARAN", "VERSACE", "PRADA", "JIMMY CHOO", "MYRURGIA", "POLICE",
];

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState<Producto | null>(null);
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPurchased, setHasPurchased] = useState(false);
  
  // Variantes y Recomendados
  const [variantes, setVariantes] = useState<Producto[]>([]);
  const [recomendados, setRecomendados] = useState<Producto[]>([]);

  // Filtramos imágenes que no cargan
  const { validUrls, loading: imgLoading } = useImageGallery([
    product?.imagen,
    product?.imagen2,
    product?.imagen3,
    product?.imagen4
  ]);

  // Reseñas reales
  const [reviews, setReviews] = useState<Resena[]>([]);
  const [reviewsMedia, setReviewsMedia] = useState(0);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [newRating, setNewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        setLoading(true);
        const data = await getProductoById(Number(id));
        setProduct(data);
        
        // Cargar variantes (otros tamaños)
        const v = await getVariantes(data);
        setVariantes(v);

        // Cargar recomendados (Lógica NOVEDADES_BRANDS de la Home con pool ampliado)
        const resNovedades = await getProductos(0, 300); // Ampliamos a 300 para asegurar variedad
        const isNovedadBrand = (p: Producto) =>
            !!p.manufacturer &&
            NOVEDADES_BRANDS.some((b: string) =>
              p.manufacturer!.toUpperCase().includes(b)
            );
        
        let branded = resNovedades.content.filter(p => isNovedadBrand(p) && p.id !== data.id && p.stock > 0);
        let nonBranded = resNovedades.content.filter(p => !isNovedadBrand(p) && p.id !== data.id && p.stock > 0);
        
        // Mezclamos ambos pero priorizamos los de marca
        let finalPool = [...shuffleArray(branded), ...shuffleArray(nonBranded)];
        
        setRecomendados(finalPool.slice(0, 12)); // Subimos a 12
        
      } catch (e: any) {
        setError(e.message ?? "No se pudo cargar el producto");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    getResenas(Number(id)).then(data => {
      setReviews(data.resenas);
      setReviewsMedia(data.media);
      setReviewsTotal(data.total);
    });

    if (isAuthenticated) {
      checkPurchaseStatus(Number(id)).then(setHasPurchased);
    }
  }, [id, isAuthenticated]);

  // Si no hay imagen seleccionada, usamos la primera válida
  useEffect(() => {
    if (validUrls.length > 0 && !selectedImg) {
      setSelectedImg(validUrls[0]);
    }
  }, [validUrls, selectedImg]);

  const handleSubmitReview = async () => {
    if (newRating === 0) { setSubmitError("Selecciona una valoración."); return; }
    if (!newComment.trim()) { setSubmitError("Escribe un comentario."); return; }
    setSubmitError(null);
    setSubmitting(true);
    try {
      const resena = await crearResena(Number(id), newRating, newComment.trim());
      setReviews(prev => [resena, ...prev]);
      setReviewsTotal(t => t + 1);
      setReviewsMedia(prev => Math.round(((prev * (reviewsTotal) + newRating) / (reviewsTotal + 1)) * 10) / 10);
      setNewRating(0);
      setNewComment("");
    } catch (e: any) {
      setSubmitError(e.response?.data ?? "Error al publicar la reseña.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-background-dark text-text-main font-display flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="animate-pulse text-primary font-bold">Cargando esencia...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="bg-background-dark text-text-main font-display flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 md:px-10 py-20 text-center">
          <h2 className="text-3xl font-bold mb-6 italic text-red-400">{error ?? "Producto no encontrado"}</h2>
          <Link to="/catalog" className="px-8 py-3 bg-white text-black rounded-full font-bold uppercase tracking-widest text-xs hover:bg-primary transition-colors">
            Volver al catálogo
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const img = product.imagen;
  const name = product.nombre;
  const brand = product.manufacturer ?? "Eros & Afrodita";
  // precioPVP es el precio web configurado; precio es el coste del proveedor
  const precioPVP = product.precioPVP ?? product.precio;
  const precioFinal = product.enOferta
    ? (product.precioOferta ?? applyPromo(precioPVP))
    : applyPromo(precioPVP);
  const hayDescuento = product.enOferta || LAUNCH_PROMO_ACTIVE;
  const rating = 4.8;
  const mainImg = selectedImg ?? img;

  return (
    <div className="bg-background-dark text-text-main font-display flex flex-col min-h-screen">
      <SEO
        title={name}
        description={product.descripcion || `Descubre ${name} de ${brand}. Una fragancia exclusiva de la colección Eros & Afrodita.`}
        image={mainImg || undefined}
        keywords={`${name}, ${brand}, perfumes de lujo, eros y afrodita`}
      />
      {/* Schema.org JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org/",
          "@type": "Product",
          "name": name,
          "image": mainImg,
          "description": product.descripcion,
          "brand": {
            "@type": "Brand",
            "name": brand
          },
          "offers": {
            "@type": "Offer",
            "url": window.location.href,
            "priceCurrency": "EUR",
            "price": precioFinal.toFixed(2),
            "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
          }
        })}
      </script>
      <Header />
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 md:px-10 py-6 md:py-10">
        <nav className="mb-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/30">
          <Link to="/" className="hover:text-primary transition-colors">Inicio</Link>
          <span className="material-symbols-outlined !text-[12px]">chevron_right</span>
          <Link to="/catalog" className="hover:text-primary transition-colors">Catálogo</Link>
          <span className="material-symbols-outlined !text-[12px]">chevron_right</span>
          <span className="text-primary">{name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
          {/* Gallery - Versión inteligente que solo muestra lo que carga */}
          <div className="flex flex-col gap-6 lg:max-w-[420px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-white/5 to-transparent backdrop-blur-2xl rounded-[2.5rem] p-8 aspect-square flex items-center justify-center relative overflow-hidden group shadow-2xl border border-white/10"
            >
              <div className="absolute inset-0 inner-glow-dark pointer-events-none" />
              {(imgLoading || loading) ? (
                <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              ) : validUrls.length > 0 ? (
                <img
                  src={selectedImg || validUrls[0]}
                  alt={name}
                  className="max-w-[85%] max-h-[85%] object-contain image-mask-blend transition-transform duration-700 group-hover:scale-110 drop-shadow-[0_0_30px_rgba(255,255,255,0.05)]"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 text-white/20">
                  <span className="material-symbols-outlined text-6xl">hide_image</span>
                  <span className="text-xs font-bold uppercase tracking-widest">Sin imagen válida</span>
                </div>
              )}
            </motion.div>

            {validUrls.length > 1 && (
              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                {validUrls.map((thumb, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImg(thumb)}
                    className={`size-24 rounded-2xl bg-white/5 backdrop-blur-md p-2 border-2 transition-all shrink-0 overflow-hidden ${selectedImg === thumb ? "border-primary" : "border-transparent opacity-40 hover:opacity-100"}`}
                  >
                    <img
                      src={thumb}
                      className="w-full h-full object-contain image-mask-blend"
                      alt={`vista-${i}`}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Detail Info */}
          <div className="flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="text-xs font-black tracking-[0.4em] text-primary uppercase mb-4 block">{brand}</span>
              <h1 className="text-2xl lg:text-3xl font-black text-white mb-4 leading-tight tracking-tighter">
                {name}
              </h1>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex text-primary">
                  {[1, 2, 3, 4, 5].map(s => (
                    <span key={s} className={`material-symbols-outlined !text-[16px] ${s <= Math.round(reviewsMedia) ? "text-primary" : "text-gray-600"}`}>star</span>
                  ))}
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-white/40">
                  {reviewsTotal > 0 ? `${reviewsTotal} opinión${reviewsTotal !== 1 ? "es" : ""}` : "Sin opiniones aún"}
                </span>
              </div>

              {/* Tag EAN */}
              <div className="flex items-center gap-2 mb-6 text-[10px] uppercase tracking-widest text-white/30 font-bold">
                <span>ean:</span>
                <span className="text-white/60">{product.ean || "—"}</span>
              </div>

              <div className="flex items-center gap-6 mb-8">
                <div className="flex items-baseline gap-4">
                  <span className={`text-2xl font-black text-emerald-400`}>
                    {precioFinal.toFixed(2)} €
                  </span>
                  {hayDescuento && (
                    <span className="text-sm text-white/30 line-through">{precioPVP.toFixed(2)} €</span>
                  )}
                  {product.enOferta && (
                    <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">Oferta</span>
                  )}
                  {!product.enOferta && LAUNCH_PROMO_ACTIVE && (
                    <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">
                      -{Math.round(LAUNCH_DISCOUNT * 100)}% lanzamiento
                    </span>
                  )}
                </div>
                {product.stock === 0 && (
                  <div className="px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 animate-pulse">
                    <span className="size-1.5 rounded-full bg-rose-500"></span>
                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">Próximamente</span>
                  </div>
                )}
              </div>

              {/* Selector de Tamaños (Variantes) - AHORA ENCIMA DE LA DESCRIPCIÓN */}
              {variantes.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined !text-[12px]">Straighten</span> Selección de Tamaño:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {/* El actual */}
                    <div className="px-4 py-2 rounded-xl bg-primary text-charcoal text-[9px] font-black border border-primary shadow-lg shadow-primary/10 cursor-default">
                      {product.nombre.match(/\d+\s*ml/i)?.[0] || "Actual"}
                    </div>
                    {/* Los otros */}
                    {variantes.map(v => (
                      <Link 
                        key={v.id} 
                        to={`/product/${v.id}`}
                        className="px-4 py-2 rounded-xl border border-white/5 text-white/30 text-[9px] font-black hover:border-primary hover:text-white transition-all bg-white/5"
                      >
                        {v.nombre.match(/\d+\s*ml/i)?.[0] || "Ver opción"}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-white/40 text-[11px] leading-relaxed mb-8 max-w-lg font-light">
                {product.descripcion || "Una obra maestra olfativa diseñada para aquellos que buscan dejar una huella divina. Ingredientes seleccionados para garantizar la máxima pureza y longevidad en la piel."}
              </p>

              <div className="flex flex-wrap gap-4 mb-10">
                <button
                  onClick={() => product && product.stock > 0 && addItem(product)}
                  disabled={product.stock === 0}
                  className={`flex-1 h-12 rounded-full font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${product.stock === 0
                      ? "bg-white/5 text-white/20 cursor-not-allowed border border-white/5"
                      : "bg-primary text-charcoal shadow-xl shadow-primary/20 hover:bg-white hover:scale-105"
                    }`}
                >
                  {product.stock === 0 ? "Próximamente" : "Añadir al Carrito"}
                  <span className="material-symbols-outlined !text-[18px]">
                    {product.stock === 0 ? "block" : "shopping_cart"}
                  </span>
                </button>
                <button
                  onClick={() => product && toggleWishlist(product)}
                  className={`size-12 rounded-full border flex items-center justify-center transition-all ${isInWishlist(product.id)
                      ? "bg-primary border-primary text-charcoal"
                      : "border-white/10 text-white/30 hover:border-primary hover:text-primary"
                    }`}
                >
                  <span className={`material-symbols-outlined ${isInWishlist(product.id) ? "filled" : ""}`}>favorite</span>
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* --- SECCIÓN RECOMENDACIONES (Novedades) --- */}
        {recomendados.length > 0 && (
          <section className="mb-24 py-16 px-4 md:px-10 bg-gradient-to-r from-primary/5 via-transparent to-transparent rounded-[3rem] border-l border-primary/20">
            <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
              <div>
                <h3 className="text-2xl font-black text-white tracking-tighter">Joyas del <span className="text-primary italic font-serif">Olimpo</span></h3>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mt-2">Novedades recomendadas para ti</p>
              </div>
              <Link to="/catalog?status=NUEVOS" className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-white transition-colors underline underline-offset-8">Ver todas las novedades</Link>
            </div>
            
            <div className="flex gap-6 overflow-x-auto pb-10 -mx-4 px-4 scrollbar-hide">
              {recomendados.map(p => (
                <div key={p.id} className="min-w-[200px] md:min-w-[240px] max-w-[240px]">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* --- SECCIÓN DE RESEÑAS --- */}
        <section className="border-t border-white/5 pt-24 pb-20">
          <div className="flex flex-col lg:flex-row gap-20">
            {/* Resumen de Ratings */}
            <div className="w-full lg:w-1/3">
              <h3 className="text-2xl font-black mb-8 tracking-tighter">Voces del <span className="text-primary italic font-serif">Olimpo</span></h3>
              <div className="flex items-center gap-6 mb-10">
                <span className="text-7xl font-black text-primary">{reviewsTotal > 0 ? reviewsMedia.toFixed(1) : "—"}</span>
                <div>
                  <div className="flex mb-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <span key={s} className={`material-symbols-outlined ${s <= Math.round(reviewsMedia) ? "text-primary" : "text-gray-600"}`}>star</span>
                    ))}
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/30">
                    {reviewsTotal > 0 ? `Basado en ${reviewsTotal} ritual${reviewsTotal !== 1 ? "es" : ""}` : "Sin valoraciones aún"}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map(num => {
                  const count = reviews.filter(r => r.rating === num).length;
                  const pct = reviewsTotal > 0 ? Math.round((count / reviewsTotal) * 100) : 0;
                  return (
                    <div key={num} className="flex items-center gap-4">
                      <span className="text-[10px] font-bold text-white/40 w-2">{num}</span>
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }}></div>
                      </div>
                      <span className="text-[10px] text-white/20 w-6 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Lista y Formulario */}
            <div className="flex-1">
              {/* Formulario */}
              <div className="bg-white/5 backdrop-blur-3xl p-8 lg:p-12 rounded-[2.5rem] border border-white/10 mb-16 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <h4 className="text-lg font-black mb-6 uppercase tracking-widest">Comparte tu Experiencia</h4>

                {!isAuthenticated ? (
                  <p className="text-white/40 text-sm font-light">
                    <Link to="/login" className="text-primary hover:underline font-bold">Inicia sesión</Link> para dejar una reseña.
                  </p>
                ) : !hasPurchased ? (
                  <div className="flex flex-col gap-4">
                    <p className="text-white/40 text-sm font-light">
                      Solo los usuarios que han <span className="text-primary font-bold italic">adquirido esta esencia</span> pueden compartir su experiencia.
                    </p>
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 inline-block w-fit">
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <span className="material-symbols-outlined !text-[16px]">receipt_long</span> Compra verificada requerida
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-1 mb-8 items-center">
                      <span className="text-xs text-white/40 mr-4 font-bold uppercase">Calificación:</span>
                      {[1, 2, 3, 4, 5].map(s => (
                        <button
                          key={s}
                          onClick={() => setNewRating(s)}
                          onMouseEnter={() => setHoverRating(s)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="transition-colors"
                        >
                          <span className={`material-symbols-outlined text-[28px] ${s <= (hoverRating || newRating) ? "text-primary" : "text-white/20"}`}>star</span>
                        </button>
                      ))}
                    </div>
                    <textarea
                      className="w-full bg-black/30 border border-white/5 rounded-3xl p-6 text-sm focus:border-primary/50 outline-none h-32 mb-4 font-light text-white/70 placeholder:text-white/20 transition-all"
                      placeholder="Describe cómo te hizo sentir esta fragancia..."
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                    />
                    {submitError && <p className="text-red-400 text-xs mb-4 font-bold">{submitError}</p>}
                    <button
                      onClick={handleSubmitReview}
                      disabled={submitting}
                      className="px-10 py-4 bg-primary text-charcoal rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white hover:scale-105 transition-all shadow-lg shadow-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? "Publicando..." : "Publicar en el Olimpo"}
                    </button>
                  </>
                )}
              </div>

              {/* Comentarios */}
              <div className="space-y-12">
                {reviews.length === 0 && (
                  <p className="text-white/30 text-sm font-light italic">Aún no hay reseñas. ¡Sé el primero!</p>
                )}
                {reviews.map(r => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="border-b border-white/5 pb-12 last:border-0"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <p className="font-black text-sm uppercase tracking-widest mb-2">{r.nombreUsuario}</p>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map(s => (
                            <span key={s} className={`material-symbols-outlined !text-[14px] ${s <= r.rating ? "text-primary" : "text-gray-600"}`}>star</span>
                          ))}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                        {new Date(r.fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    {r.comentario && <p className="text-white/50 text-sm leading-relaxed italic font-light">"{r.comentario}"</p>}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;
