import React, { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import {
  filtrarProductos,
  getCategorias,
  getManufacturers,
  type Producto,
  type FiltroProductos,
} from "../api/products";
import SEO from "../components/SEO";

// ── Skeleton Card ──
const SkeletonCard: React.FC = () => (
  <div className="flex flex-col rounded-2xl bg-charcoal-surface border border-white/5 overflow-hidden animate-pulse">
    <div className="aspect-square bg-white/5" />
    <div className="p-3 space-y-2">
      <div className="h-2 w-1/3 bg-white/10 rounded-full" />
      <div className="h-3 w-full bg-white/8 rounded-full" />
      <div className="h-3 w-4/5 bg-white/8 rounded-full" />
      <div className="flex justify-between items-center pt-1">
        <div className="h-4 w-12 bg-emerald-500/20 rounded-full" />
        <div className="size-9 rounded-full bg-white/5" />
      </div>
    </div>
  </div>
);

// ── Active filter counter ──
const countActiveFilters = (f: FiltroProductos): number => {
  let n = 0;
  if (f.nombre) n++;
  if (f.categoria) n++;
  if (f.gender) n++;
  if (f.manufacturer) n++;
  if (f.maxPrecio && f.maxPrecio < 500) n++;
  return n;
};

// ── Chip component ──
const Chip: React.FC<{ label: string; onRemove: () => void }> = ({ label, onRemove }) => (
  <motion.span
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    exit={{ scale: 0.8, opacity: 0 }}
    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-[10px] font-black uppercase tracking-wider"
  >
    {label}
    <button
      onClick={onRemove}
      className="hover:text-rose-400 transition-colors"
      aria-label={`Quitar filtro ${label}`}
    >
      <span className="material-symbols-outlined !text-[12px]">close</span>
    </button>
  </motion.span>
);

const Catalog: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [paginacion, setPaginacion] = useState({
    page: 0,
    totalPages: 0,
    totalElements: 0,
    size: 24,
  });

  const initialSearch = searchParams.get("search") || searchParams.get("nombre");
  const initialCat = searchParams.get("categoria") || searchParams.get("category");
  const initialGender = searchParams.get("gender") || searchParams.get("genero");
  const initialOrder = searchParams.get("orden") || searchParams.get("order") || "idDesc";
  const initialMaxPrecio = searchParams.get("maxPrecio");
  const initialManufacturer = searchParams.get("manufacturer");

  const [filtros, setFiltros] = useState<FiltroProductos>({
    maxPrecio: initialMaxPrecio ? parseInt(initialMaxPrecio) : 500,
    page: 0,
    size: 24,
    nombre: initialSearch || undefined,
    categoria: initialCat || undefined,
    gender: initialGender || undefined,
    orden: initialOrder,
    manufacturer: initialManufacturer || undefined,
  });

  const [categorias, setCategorias] = useState<string[]>([]);
  const [marcas, setMarcas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [sliderVal, setSliderVal] = useState<number>(filtros.maxPrecio ?? 500);

  const activeCount = countActiveFilters(filtros);

  useEffect(() => {
    const search = searchParams.get("search") || searchParams.get("nombre") || undefined;
    const cat = searchParams.get("categoria") || searchParams.get("category") || undefined;
    const gender = searchParams.get("gender") || searchParams.get("genero") || undefined;
    const order = searchParams.get("orden") || searchParams.get("order") || "idDesc";
    const maxP = searchParams.get("maxPrecio");
    const status = searchParams.get("status") || "ACTIVOS";
    const manufacturer =
      searchParams.get("manufacturer") || searchParams.get("marca") || undefined;

    const syncFiltros: FiltroProductos = {
      ...filtros,
      maxPrecio: maxP ? parseInt(maxP) : 500,
      page: 0,
      nombre: search,
      categoria: cat,
      gender,
      orden: order,
      status,
      manufacturer,
    };
    setFiltros(syncFiltros);
    setSliderVal(syncFiltros.maxPrecio ?? 500);
    aplicarFiltros(syncFiltros);
    if (categorias.length === 0) fetchCategorias();
    if (marcas.length === 0) fetchMarcas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const fetchCategorias = async () => {
    try {
      const cats = await getCategorias();
      const seen = new Set<string>();
      const unique = cats.filter((c) => {
        if (!c) return false;
        const key = c.trim().toLowerCase();
        if (["sin categoria", "sin categoría", "no category"].includes(key)) return false;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setCategorias(unique);
    } catch (e) {
      console.error("Error cargando categorías", e);
    }
  };

  const fetchMarcas = async () => {
    try {
      const brands = await getManufacturers();
      setMarcas(brands.filter((b) => b && b.trim() !== ""));
    } catch (e) {
      console.error("Error cargando marcas", e);
    }
  };

  const aplicarFiltros = useCallback(async (nuevosFiltros: FiltroProductos) => {
    try {
      setLoading(true);
      setError(null);
      setFiltros(nuevosFiltros);
      const data = await filtrarProductos(nuevosFiltros);
      setProductos(data.content);
      setPaginacion({
        page: data.number,
        totalPages: data.totalPages,
        totalElements: data.totalElements,
        size: data.size,
      });
    } catch (e: any) {
      setError(e.message ?? "Error al filtrar productos");
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePageChange = (newPage: number) => {
    if (newPage < 0 || newPage >= paginacion.totalPages) return;
    aplicarFiltros({ ...filtros, page: newPage });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFilterChange = (key: keyof FiltroProductos, value: any) => {
    const updated = { ...filtros, [key]: value, page: 0 };
    if (value === undefined || value === "") delete updated[key];
    aplicarFiltros(updated);
  };

  const clearFilters = () => {
    setSliderVal(500);
    aplicarFiltros({ maxPrecio: 500, page: 0, size: 24, orden: "idDesc" });
  };

  const getDynamicSEO = () => {
    let title = "Catálogo Exclusivo | Eros & Afrodita";
    let description =
      "Explora nuestra colección curada de perfumes de lujo y cosmética premium.";
    if (filtros.gender === "HOMBRE") {
      title = "Perfumes para Hombre | Eros & Afrodita";
      description = "Descubre fragancias masculinas originales.";
    } else if (filtros.gender === "MUJER") {
      title = "Perfumes para Mujer | Eros & Afrodita";
      description = "Sumérgete en esencias femeninas exclusivas.";
    } else if (filtros.categoria === "Cosmética") {
      title = "Cosmética Premium | Eros & Afrodita";
      description = "Rituales de belleza de alta gama.";
    } else if (filtros.manufacturer) {
      title = `Perfumes ${filtros.manufacturer} | Eros & Afrodita`;
      description = `Toda la colección de ${filtros.manufacturer}.`;
    } else if (filtros.nombre) {
      title = `"${filtros.nombre}" | Eros & Afrodita`;
    }
    return { title, description };
  };

  const { title: seoTitle, description: seoDescription } = getDynamicSEO();

  const buildPageItems = (): (number | "...")[] => {
    const total = paginacion.totalPages;
    const current = paginacion.page;
    const pages = new Set<number>();
    for (let i = 0; i < Math.min(3, total); i++) pages.add(i);
    for (let i = Math.max(0, total - 2); i < total; i++) pages.add(i);
    for (let i = Math.max(0, current - 2); i <= Math.min(total - 1, current + 2); i++)
      pages.add(i);
    const sorted = Array.from(pages).sort((a, b) => a - b);
    const items: (number | "...")[] = [];
    sorted.forEach((p, idx) => {
      if (idx > 0 && p - sorted[idx - 1] > 1) items.push("...");
      items.push(p);
    });
    return items;
  };

  return (
    <div className="bg-background-dark text-white font-display min-h-screen flex flex-col selection:bg-primary/30">
      <SEO
        title={seoTitle}
        description={seoDescription}
        keywords="catálogo perfumes, fragancias exclusivas, cosmética premium"
      />
      <Header />

      <div className="flex-1 flex flex-col lg:flex-row max-w-[1600px] mx-auto w-full px-4 lg:px-6 py-6 lg:py-10 gap-6">

        {/* ── Mobile filter toggle ── */}
        <div className="lg:hidden flex items-center justify-between bg-charcoal-surface p-3.5 rounded-2xl border border-white/5">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Filtros</span>
            <span className="text-[10px] text-gray-400 font-bold uppercase">
              {paginacion.totalElements} productos
            </span>
          </div>
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="relative flex items-center gap-2 bg-primary text-background-dark px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20"
          >
            {showMobileFilters ? "Ocultar" : "Filtrar"}
            <span className="material-symbols-outlined text-sm">
              {showMobileFilters ? "expand_less" : "tune"}
            </span>
            {activeCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center font-black">
                {activeCount}
              </span>
            )}
          </button>
        </div>

        {/* ── Sidebar ── */}
        <aside
          className={`${
            showMobileFilters ? "block" : "hidden"
          } lg:block w-full lg:w-[230px] shrink-0`}
        >
          <div className="bg-charcoal-surface rounded-2xl p-5 border border-white/5 lg:sticky lg:top-28 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/4 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

            {/* Sidebar header */}
            <div className="flex justify-between items-center mb-5 relative z-10">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white tracking-tight">Filtros</h3>
                <AnimatePresence>
                  {activeCount > 0 && (
                    <motion.span
                      key="badge"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="size-5 rounded-full bg-primary text-charcoal text-[10px] flex items-center justify-center font-black"
                    >
                      {activeCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              {activeCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-rose-400 transition-colors"
                >
                  Limpiar
                </button>
              )}
            </div>

            <div className="space-y-6 relative z-10">

              {/* Búsqueda */}
              <div>
                <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2.5">
                  Búsqueda
                </h4>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    search
                  </span>
                  <input
                    type="text"
                    placeholder="¿Qué buscas?..."
                    value={filtros.nombre || ""}
                    onChange={(e) => handleFilterChange("nombre", e.target.value || undefined)}
                    className="w-full bg-background-dark border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-xs font-semibold text-white placeholder:text-gray-600 focus:border-primary/50 outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Marca */}
              <div>
                <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2.5">
                  Marca
                </h4>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    branding_watermark
                  </span>
                  <select
                    value={filtros.manufacturer || ""}
                    onChange={(e) =>
                      handleFilterChange("manufacturer", e.target.value || undefined)
                    }
                    className="w-full bg-background-dark border border-white/10 rounded-xl py-2.5 pl-9 pr-8 text-xs font-semibold text-white appearance-none focus:border-primary/50 outline-none cursor-pointer transition-colors"
                  >
                    <option value="">Cualquier marca</option>
                    {marcas.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Categoría */}
              <div>
                <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2.5">
                  Categoría
                </h4>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    category
                  </span>
                  <select
                    value={filtros.categoria || ""}
                    onChange={(e) =>
                      handleFilterChange("categoria", e.target.value || undefined)
                    }
                    className="w-full bg-background-dark border border-white/10 rounded-xl py-2.5 pl-9 pr-8 text-xs font-semibold text-white appearance-none focus:border-primary/50 outline-none cursor-pointer transition-colors"
                  >
                    <option value="">Cualquier categoría</option>
                    {categorias.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Género — chips animados */}
              <div>
                <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2.5">
                  Género
                </h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    { val: "HOMBRE", label: "Hombre", icon: "man" },
                    { val: "MUJER", label: "Mujer", icon: "woman" },
                    { val: "UNISEX", label: "Unisex", icon: "wc" },
                  ].map(({ val, label, icon }) => {
                    const active = filtros.gender === val;
                    return (
                      <motion.button
                        key={val}
                        whileTap={{ scale: 0.9 }}
                        onClick={() =>
                          handleFilterChange("gender", active ? undefined : val)
                        }
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-200 border ${
                          active
                            ? "bg-primary text-charcoal border-primary shadow shadow-primary/30"
                            : "bg-background-dark text-gray-400 border-white/10 hover:border-white/25 hover:text-white"
                        }`}
                      >
                        <span className="material-symbols-outlined !text-[13px]">{icon}</span>
                        {label}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Precio */}
              <div>
                <div className="flex justify-between items-center mb-2.5">
                  <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">
                    Precio máx.
                  </h4>
                  <span className="text-[10px] font-black text-primary">
                    {sliderVal >= 500 ? "500€+" : `${sliderVal}€`}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="500"
                  step="10"
                  value={sliderVal}
                  onChange={(e) => setSliderVal(parseInt(e.target.value))}
                  onMouseUp={(e: any) =>
                    handleFilterChange("maxPrecio", parseInt(e.target.value))
                  }
                  onTouchEnd={(e: any) =>
                    handleFilterChange("maxPrecio", parseInt(e.target.value))
                  }
                  className="w-full h-1.5 bg-background-dark rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-[9px] font-black text-gray-600 mt-2">
                  <span>0€</span>
                  <span>500€+</span>
                </div>
              </div>

            </div>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 min-w-0">

          {/* Title + sort row */}
          <div className="flex flex-col sm:flex-row justify-between items-end mb-8 gap-4">
            <div>
              <nav className="mb-1.5 hidden sm:flex items-center gap-1.5 text-[10px] text-primary/50 font-bold uppercase tracking-widest">
                <Link to="/" className="hover:text-primary transition-colors">Inicio</Link>
                <span className="material-symbols-outlined !text-[12px]">chevron_right</span>
                <span className="text-white/40">Catálogo</span>
              </nav>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter">
                {filtros.status === "NOVEDADES" ? (
                  <>
                    Nuestras <span className="text-primary italic font-serif">Novedades</span>
                  </>
                ) : filtros.gender === "HOMBRE" ? (
                  <>
                    Perfumes para{" "}
                    <span className="text-primary italic font-serif">Hombre</span>
                  </>
                ) : filtros.gender === "MUJER" ? (
                  <>
                    Perfumes para{" "}
                    <span className="text-primary italic font-serif">Mujer</span>
                  </>
                ) : (
                  <>
                    Nuestra <span className="text-primary italic font-serif">Colección</span>
                  </>
                )}
              </h1>
              {!loading && (
                <p className="text-xs text-gray-500 mt-1 font-semibold">
                  {paginacion.totalElements.toLocaleString("es-ES")} producto
                  {paginacion.totalElements !== 1 ? "s" : ""}
                  {activeCount > 0 && " · filtros aplicados"}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 bg-charcoal-surface pl-4 pr-2 py-1.5 rounded-full border border-white/5 shadow-lg w-full sm:w-auto">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 whitespace-nowrap">
                Ordenar
              </span>
              <select
                className="bg-transparent border-none text-xs font-bold text-white focus:ring-0 cursor-pointer pr-6 grow outline-none"
                value={filtros.orden || ""}
                onChange={(e) => handleFilterChange("orden", e.target.value || undefined)}
              >
                <option value="idDesc">Novedades</option>
                <option value="">Recomendados</option>
                <option value="precioAsc">Precio: menor a mayor</option>
                <option value="precioDesc">Precio: mayor a menor</option>
              </select>
            </div>
          </div>

          {/* Active filter chips */}
          <AnimatePresence>
            {activeCount > 0 && (
              <motion.div
                key="chips"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap gap-2 mb-6 overflow-hidden"
              >
                {filtros.nombre && (
                  <Chip
                    label={`"${filtros.nombre}"`}
                    onRemove={() => handleFilterChange("nombre", undefined)}
                  />
                )}
                {filtros.categoria && (
                  <Chip
                    label={filtros.categoria}
                    onRemove={() => handleFilterChange("categoria", undefined)}
                  />
                )}
                {filtros.manufacturer && (
                  <Chip
                    label={filtros.manufacturer}
                    onRemove={() => handleFilterChange("manufacturer", undefined)}
                  />
                )}
                {filtros.gender && (
                  <Chip
                    label={filtros.gender}
                    onRemove={() => handleFilterChange("gender", undefined)}
                  />
                )}
                {filtros.maxPrecio && filtros.maxPrecio < 500 && (
                  <Chip
                    label={`Hasta ${filtros.maxPrecio}€`}
                    onRemove={() => {
                      setSliderVal(500);
                      handleFilterChange("maxPrecio", 500);
                    }}
                  />
                )}
                <button
                  onClick={clearFilters}
                  className="text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-rose-400 transition-colors px-1"
                >
                  Limpiar todo
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          {error && !loading && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-8 text-center">
              <span className="material-symbols-outlined text-rose-500 text-5xl mb-3 block">
                error
              </span>
              <p className="text-rose-200 font-semibold mb-4">{error}</p>
              <button
                onClick={() => aplicarFiltros(filtros)}
                className="px-6 py-2 bg-rose-500/20 text-rose-400 rounded-full text-xs font-bold hover:bg-rose-500 hover:text-white transition-all"
              >
                Reintentar
              </button>
            </div>
          )}

          {/* Skeletons */}
          {loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {/* Product grid */}
          {!loading && !error && (
            <>
              {productos.length > 0 ? (
                <motion.div
                  key={JSON.stringify({ ...filtros, page: filtros.page })}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4"
                >
                  {productos.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-24 text-center"
                >
                  <span className="material-symbols-outlined text-gray-600 text-[64px] mb-4">
                    search_off
                  </span>
                  <h3 className="text-xl font-bold mb-2">Sin resultados</h3>
                  <p className="text-gray-400 text-sm max-w-xs">
                    Prueba ajustando los filtros para encontrar lo que buscas.
                  </p>
                  <button
                    onClick={clearFilters}
                    className="mt-6 px-8 py-2.5 bg-white text-background-dark rounded-full font-black text-xs tracking-widest uppercase hover:bg-primary transition-all"
                  >
                    Restablecer filtros
                  </button>
                </motion.div>
              )}

              {/* Pagination */}
              {paginacion.totalPages > 1 && (
                <div className="mt-16 mb-8 flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={() => handlePageChange(paginacion.page - 1)}
                    disabled={paginacion.page === 0}
                    className="size-11 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-background-dark disabled:opacity-20 transition-all"
                  >
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>

                  {buildPageItems().map((item, idx) =>
                    item === "..." ? (
                      <span
                        key={`d${idx}`}
                        className="w-8 text-center text-white/20 font-black text-sm"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => handlePageChange(item as number)}
                        className={`size-11 rounded-full text-xs font-black transition-all ${
                          paginacion.page === item
                            ? "bg-primary text-charcoal shadow-lg shadow-primary/30"
                            : "text-white/40 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10"
                        }`}
                      >
                        {(item as number) + 1}
                      </button>
                    )
                  )}

                  <button
                    onClick={() => handlePageChange(paginacion.page + 1)}
                    disabled={paginacion.page === paginacion.totalPages - 1}
                    className="size-11 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-background-dark disabled:opacity-20 transition-all"
                  >
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default Catalog;
