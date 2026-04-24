import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import {
  getProductos,
  filtrarProductos,
  getCategorias,
  getManufacturers,
  type Producto,
  type FiltroProductos,
} from "../api/products";
import SEO from "../components/SEO";

const Catalog: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [paginacion, setPaginacion] = useState({
    page: 0,
    totalPages: 0,
    totalElements: 0,
    size: 20
  });
  
  // Inicializamos filtros desde la URL si existen
  const initialSearch = searchParams.get("search") || searchParams.get("nombre");
  const initialCat = searchParams.get("categoria") || searchParams.get("category");
  const initialGender = searchParams.get("gender") || searchParams.get("genero");
  const initialOrder = searchParams.get("orden") || searchParams.get("order") || "fechaDesc";
  const initialMaxPrecio = searchParams.get("maxPrecio");
  const initialManufacturer = searchParams.get("manufacturer");

  const [filtros, setFiltros] = useState<FiltroProductos>({
    maxPrecio: initialMaxPrecio ? parseInt(initialMaxPrecio) : 500,
    page: 0,
    size: 20,
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

  // Carga inicial y reacción a cambios en la URL
  useEffect(() => {
    const search = searchParams.get("search") || searchParams.get("nombre") || undefined;
    const cat = searchParams.get("categoria") || searchParams.get("category") || undefined;
    const gender = searchParams.get("gender") || searchParams.get("genero") || undefined;
    const order = searchParams.get("orden") || searchParams.get("order") || "idDesc";
    const maxP = searchParams.get("maxPrecio");
    const status = searchParams.get("status") || "ACTIVOS";
    const manufacturer = searchParams.get("manufacturer") || searchParams.get("marca") || undefined;

    const syncFiltros: FiltroProductos = {
      ...filtros,
      maxPrecio: maxP ? parseInt(maxP) : 500,
      page: 0,
      nombre: search,
      categoria: cat,
      gender: gender,
      orden: order,
      status: status,
      manufacturer: manufacturer,
    };
    
    setFiltros(syncFiltros);

    // Aplicar filtros basados en la URL
    aplicarFiltros(syncFiltros);
    
    if (categorias.length === 0) fetchCategorias();
    if (marcas.length === 0) fetchMarcas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // Re-ejecutar si cambian los params de la URL

  const fetchCategorias = async () => {
    try {
      const cats = await getCategorias();
      const seen = new Set<string>();
      const unique = cats.filter(c => {
        if (!c) return false;
        const key = c.trim().toLowerCase();
        if (key === "sin categoria" || key === "sin categoría" || key === "no category") return false;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setCategorias(unique);
    } catch (e) {
      console.error("Error al cargar categorías", e);
    }
  };

  const fetchMarcas = async () => {
    try {
      const brands = await getManufacturers();
      setMarcas(brands.filter(b => b && b.trim() !== ""));
    } catch (e) {
      console.error("Error al cargar marcas", e);
    }
  };

  const fetchInitial = async () => {
    try {
      setLoading(true);
      const data = await getProductos(0, 20);
      setProductos(data.content);
      setPaginacion({
        page: data.number,
        totalPages: data.totalPages,
        totalElements: data.totalElements,
        size: data.size
      });
    } catch (e: any) {
      setError(e.message ?? "Error al cargar productos");
    } finally {
      setLoading(false);
    }
  };

  async function aplicarFiltros(nuevosFiltros: FiltroProductos) {
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
        size: data.size
      });
    } catch (e: any) {
      setError(e.message ?? "Error al filtrar productos");
    } finally {
      setLoading(false);
    }
  }

  const handlePageChange = (newPage: number) => {
    if (newPage < 0 || newPage >= paginacion.totalPages) return;
    aplicarFiltros({ ...filtros, page: newPage });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFilterChange = (key: keyof FiltroProductos, value: any) => {
    const updated = { ...filtros, [key]: value };
    // Si el valor es undefined o string vacío, lo quitamos
    if (value === undefined || value === "") delete updated[key];
    aplicarFiltros(updated);
  };

  const clearFilters = () => {
    const reset = { maxPrecio: 500, page: 0, size: 20, orden: "fechaDesc" };
    aplicarFiltros(reset);
  };

  return (
    <div className="bg-background-dark text-white font-display min-h-screen flex flex-col selection:bg-primary/30">
      <SEO 
        title="Catálogo Exclusivo | Eros & Afrodita"
        description="Explora nuestra colección curada de perfumes de lujo y cosmética premium. Encuentra tu esencia divina entre las mejores marcas del mundo."
        keywords="catálogo perfumes, fragancias exclusivas, marcas de lujo, cosmética premium, eros y afrodita"
      />
      <Header />
      
      <div className="flex-1 flex flex-col lg:flex-row max-w-[1600px] mx-auto w-full px-4 lg:px-6 py-6 lg:py-10 gap-6 lg:gap-6">
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden flex items-center justify-between bg-surface-dark p-4 rounded-2xl border border-white/5">
           <div className="flex flex-col">
             <span className="text-[10px] font-black uppercase tracking-widest text-primary">Filtros</span>
             <span className="text-[10px] text-gray-400 font-bold uppercase">{paginacion.totalElements} Productos</span>
           </div>
           <button 
             onClick={() => setShowMobileFilters(!showMobileFilters)}
             className="flex items-center gap-2 bg-primary text-background-dark px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20"
           >
             {showMobileFilters ? 'Ocultar' : 'Filtrar'}
             <span className="material-symbols-outlined text-sm">{showMobileFilters ? 'expand_less' : 'tune'}</span>
           </button>
        </div>

        {/* Sidebar de Filtros */}
        <aside className={`${showMobileFilters ? 'block' : 'hidden'} lg:block w-full lg:w-[220px] shrink-0 animate-in fade-in slide-in-from-top-4 duration-300`}>
          <div className="bg-surface-dark rounded-2xl p-5 border border-white/5 lg:sticky lg:top-28 shadow-2xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors"></div>

            <div className="flex justify-between items-center mb-5 relative z-10">
              <h3 className="text-base font-black text-white tracking-tight">Filtros</h3>
              <button
                onClick={clearFilters}
                className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-primary transition-all underline decoration-white/10 underline-offset-4"
              >
                Limpiar
              </button>
            </div>

            <div className="space-y-6 relative z-10">
              {/* Búsqueda por Nombre */}
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-3">Búsqueda</h4>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm group-focus-within:text-primary transition-colors">search</span>
                  <input
                    type="text"
                    placeholder="¿Qué buscas?..."
                    value={filtros.nombre || ""}
                    onChange={(e) => handleFilterChange("nombre", e.target.value)}
                    className="w-full bg-background-dark border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-xs font-bold text-white placeholder:text-gray-600 focus:border-primary/50 focus:ring-0 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Marca / Fabricante */}
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-3">Marca</h4>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm group-focus-within:text-primary transition-colors">branding_watermark</span>
                  <select
                    value={filtros.manufacturer || ""}
                    onChange={(e) => handleFilterChange("manufacturer", e.target.value || undefined)}
                    className="w-full bg-background-dark border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-xs font-bold text-white appearance-none focus:border-primary/50 focus:ring-0 transition-all outline-none cursor-pointer"
                  >
                    <option value="" className="bg-surface-dark text-gray-500 italic">Cualquier marca...</option>
                    {marcas.map((m) => (
                      <option key={m} value={m} className="bg-surface-dark text-white">{m}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">expand_more</span>
                </div>
              </div>

              {/* Categoría */}
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-3">Categoría</h4>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm group-focus-within:text-primary transition-colors">category</span>
                  <select
                    value={filtros.categoria || ""}
                    onChange={(e) => handleFilterChange("categoria", e.target.value || undefined)}
                    className="w-full bg-background-dark border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-xs font-bold text-white appearance-none focus:border-primary/50 focus:ring-0 transition-all outline-none cursor-pointer"
                  >
                    <option value="" className="bg-surface-dark text-gray-500 italic">Cualquier categoría...</option>
                    {categorias.map((cat) => (
                      <option key={cat} value={cat} className="bg-surface-dark text-white">{cat}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">expand_more</span>
                </div>
              </div>

              {/* Género */}
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-3">Género</h4>
                <div className="space-y-2">
                  {["HOMBRE", "MUJER", "UNISEX"].map((g) => (
                    <label key={g} className="flex items-center group cursor-pointer justify-between pr-1">
                      <span className="text-xs font-bold text-gray-400 group-hover:text-white transition-colors tracking-widest">{g}</span>
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          className="peer appearance-none size-4 rounded border border-white/10 bg-background-dark checked:bg-primary checked:border-primary transition-all cursor-pointer"
                          checked={filtros.gender === g}
                          onChange={(e) => handleFilterChange("gender", e.target.checked ? g : undefined)}
                        />
                        <span className="material-symbols-outlined absolute text-background-dark text-[12px] font-black opacity-0 peer-checked:opacity-100 pointer-events-none">check</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Precio */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Presupuesto</h4>
                  <span className="text-[10px] font-black text-primary italic">Hasta {filtros.maxPrecio}€</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="500" 
                  step="10"
                  value={filtros.maxPrecio ?? 500}
                  onChange={(e) => setFiltros({ ...filtros, maxPrecio: parseInt(e.target.value) })}
                  onMouseUp={(e: any) => handleFilterChange("maxPrecio", parseInt(e.target.value))}
                  className="w-full h-1.5 bg-background-dark rounded-lg appearance-none cursor-pointer accent-primary border border-white/5"
                />
                <div className="flex justify-between text-[10px] font-black text-gray-600 mt-3 uppercase tracking-[0.2em]">
                  <span>0€</span>
                  <span>500€+</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Listado de Productos */}
        <main className="flex-1">
          <div className="flex flex-col sm:flex-row justify-between items-end mb-10 gap-6">
            <div>
              <nav className="mb-2 hidden sm:flex items-center gap-2 text-[10px] text-primary/60 font-black uppercase tracking-widest">
                <Link to="/" className="hover:text-primary transition-colors">Inicio</Link>
                <span className="material-symbols-outlined !text-[12px]">chevron_right</span>
                <span>Catálogo</span>
              </nav>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tighter">
                {filtros.status === "NOVEDADES" ? (
                  <>Nuestras <span className="text-primary italic font-serif">Novedades</span></>
                ) : (
                  <>Nuestra <span className="text-primary italic font-serif">Colección</span></>
                )}
              </h1>
            </div>
            
            <div className="flex items-center gap-4 bg-surface-dark pl-4 sm:pl-6 pr-2 py-1.5 sm:py-2 rounded-full border border-white/5 shadow-xl w-full sm:w-auto mt-4 sm:mt-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Ordenar:</span>
              <select
                className="bg-transparent border-none text-[10px] sm:text-xs font-bold text-white focus:ring-0 cursor-pointer pr-8 sm:pr-10 grow"
                value={filtros.orden || ""}
                onChange={(e) => handleFilterChange("orden", e.target.value || undefined)}
              >
                <option value="idDesc" className="bg-surface-dark text-white">Novedades</option>
                <option value="" className="bg-surface-dark text-white">Recomendados</option>
                <option value="precioAsc" className="bg-surface-dark text-white">Precio: Menor a Mayor</option>
                <option value="precioDesc" className="bg-surface-dark text-white">Precio: Mayor a Menor</option>
              </select>
            </div>
          </div>

          {loading && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 opacity-30">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <div key={n} className="aspect-[3/4.5] rounded-3xl bg-surface-dark animate-pulse border border-white/5"></div>
              ))}
            </div>
          )}

          {error && !loading && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
              <span className="material-symbols-outlined text-red-500 text-4xl mb-4">error</span>
              <p className="text-red-200 font-medium">{error}</p>
              <button 
                onClick={() => aplicarFiltros(filtros)}
                className="mt-4 px-6 py-2 bg-red-500/20 text-red-500 rounded-full text-xs font-bold hover:bg-red-500 hover:text-white transition-all"
              >
                Reintentar
              </button>
            </div>
          )}

          {!loading && !error && (
            <div className="flex flex-col h-full">
              {productos.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-4 gap-y-10 animate-in fade-in duration-700">
                    {productos.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>

                  {/* Paginación UI Avanzada */}
                  {paginacion.totalPages > 1 && (
                    <div className="mt-20 mb-10 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                      <button
                        onClick={() => handlePageChange(paginacion.page - 1)}
                        disabled={paginacion.page === 0}
                        className="size-10 sm:size-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-background-dark disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-white transition-all group shrink-0"
                      >
                        <span className="material-symbols-outlined group-active:-translate-x-1 transition-transform">chevron_left</span>
                      </button>
                      
                      <div className="flex items-center gap-1 sm:gap-2">
                        {(() => {
                          const total = paginacion.totalPages;
                          const current = paginacion.page;
                          
                          // Construir conjunto de indices a mostrar
                          const pages = new Set<number>();
                          
                          // Siempre las primeras 5 (0 al 4)
                          for (let i = 0; i < Math.min(5, total); i++) pages.add(i);
                          
                          // Siempre las últimas 4 (total-4 al total-1)
                          for (let i = Math.max(0, total - 4); i < total; i++) pages.add(i);
                          
                          // Bloque central de 5 (current-2 al current+2)
                          for (let i = Math.max(0, current - 2); i <= Math.min(total - 1, current + 2); i++) pages.add(i);
                          
                          const sortedPages = Array.from(pages).sort((a, b) => a - b);
                          const items: (number | string)[] = [];
                          
                          for (let i = 0; i < sortedPages.length; i++) {
                            if (i > 0 && sortedPages[i] - sortedPages[i-1] > 1) {
                              items.push("...");
                            }
                            items.push(sortedPages[i]);
                          }
                          
                          return items.map((item, idx) => {
                            if (item === "...") {
                              return <span key={`dots-${idx}`} className="size-8 flex items-center justify-center text-white/20 font-black">...</span>;
                            }
                            const val = item as number;
                            return (
                              <button
                                key={val}
                                onClick={() => handlePageChange(val)}
                                className={`size-9 sm:size-11 rounded-full text-[10px] sm:text-xs font-black transition-all ${
                                  current === val 
                                    ? "bg-primary text-background-dark shadow-[0_0_15px_rgba(242,185,13,0.4)]" 
                                    : "text-white/40 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10"
                                }`}
                              >
                                {val + 1}
                              </button>
                            );
                          });
                        })()}
                      </div>

                      <button
                        onClick={() => handlePageChange(paginacion.page + 1)}
                        disabled={paginacion.page === paginacion.totalPages - 1}
                        className="size-10 sm:size-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-background-dark disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-white transition-all group shrink-0"
                      >
                        <span className="material-symbols-outlined group-active:translate-x-1 transition-transform">chevron_right</span>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
                  <span className="material-symbols-outlined text-gray-600 text-[64px] mb-4">search_off</span>
                  <h3 className="text-2xl font-bold mb-2">No hay resultados</h3>
                  <p className="text-gray-400 max-w-xs font-light">Intenta ajustando los filtros para encontrar lo que buscas.</p>
                  <button 
                    onClick={clearFilters}
                    className="mt-6 px-10 py-3 bg-white text-background-dark rounded-full font-black text-xs tracking-widest uppercase hover:bg-primary transition-all"
                  >
                    Restablecer
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default Catalog;
