import React, { useEffect, useState } from "react";
import { getProductos, deleteProducto, Producto, updateProducto, createProducto, updateBulkStatus, updateBulkPricing, Configuracion, syncWebImages, updateBulkOffer, syncCategories, getFilteredIds, getCategorias, getManufacturers, getDistribuidores } from "../api/products";
import AdminLayout from "../components/AdminLayout";
import { useAlert } from "../context/AlertContext";
import api from "../api/axios";

const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Producto[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(50);
  const [loading, setLoading] = useState(true);
  const [skuFilter, setSkuFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [providerFilter, setProviderFilter] = useState("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"TODOS" | "ACTIVOS" | "INACTIVOS" | "OFERTAS" | "BAJO_MARGEN">("TODOS");
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [providers, setProviders] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [expandedEans, setExpandedEans] = useState<string[]>([]);

  // --- Pestaña Nuevos Productos ---
  const [nuevosCount, setNuevosCount] = useState(0);
  const [nuevosProducts, setNuevosProducts] = useState<any[]>([]);
  const [nuevosLoading, setNuevosLoading] = useState(false);
  const [nuevosPage, setNuevosPage] = useState(0);
  const [nuevosTotalPages, setNuevosTotalPages] = useState(0);
  const [nuevosPvpEdits, setNuevosPvpEdits] = useState<Record<number, string>>({});
  const [catalogPvpEdits, setCatalogPvpEdits] = useState<Record<number, string>>({});
  const [savingPvp, setSavingPvp] = useState<Record<number, boolean>>({});

  // --- Pestaña Imágenes Rotas ---
  const [activeTab, setActiveTab] = useState<"catalogo" | "imagenes" | "nuevos">("catalogo");
  const [brokenImages, setBrokenImages] = useState<Producto[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanTotal, setScanTotal] = useState(0);
  const [enricherRunning, setEnricherRunning] = useState(false);

  const { showAlert, showConfirm } = useAlert();

  // Estados para modal producto
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Producto> | null>(null);

  // Estados para modal precios globales
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [selectedPricingProvider, setSelectedPricingProvider] = useState<string | null>(null);
  const [pricingConfig, setPricingConfig] = useState<Configuracion>({
    iva: 21,
    margen: 25,
    envio: 5,
    comisionTarjeta: 1.20
  });

  // Estados para modal ofertas
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [offerDiscount, setOfferDiscount] = useState<number>(10);

  // Estados para modal Home
  const [isHomeModalOpen, setIsHomeModalOpen] = useState(false);
  const [homeNovedades, setHomeNovedades] = useState<string[]>([]);
  const [homeRecomendados, setHomeRecomendados] = useState<string[]>([]);
  const [savingHome, setSavingHome] = useState(false);

  const fetchNuevosCount = async () => {
    try {
      const res = await api.get<number>("/productos/nuevos/count");
      setNuevosCount(res.data);
    } catch { /* silencioso */ }
  };

  const fetchNuevos = async (page = 0) => {
    setNuevosLoading(true);
    try {
      const res = await api.get(`/productos/nuevos?page=${page}&size=20`);
      setNuevosProducts(res.data.content ?? []);
      setNuevosTotalPages(res.data.totalPages ?? 0);
      setNuevosPage(page);
    } catch { showAlert("Error", "No se pudieron cargar los productos nuevos", "error"); }
    finally { setNuevosLoading(false); }
  };

  const savePvp = async (id: number) => {
    const pvp = parseFloat(nuevosPvpEdits[id] ?? "");
    if (isNaN(pvp) || pvp <= 0) { showAlert("Precio inválido", "Introduce un PVP mayor que 0", "error"); return; }
    setSavingPvp(s => ({ ...s, [id]: true }));
    try {
      await api.put(`/productos/${id}`, { precioPVP: pvp });
      showAlert("Guardado", `PVP actualizado a ${pvp.toFixed(2)} €`, "success");
    } catch { showAlert("Error", "No se pudo actualizar el precio", "error"); }
    finally { setSavingPvp(s => ({ ...s, [id]: false })); }
  };

  const marcarRevisados = async (ids: number[]) => {
    try {
      await api.post("/productos/nuevos/revisar", ids);
      setNuevosProducts(p => p.filter(x => !ids.includes(x.id)));
      setNuevosCount(c => Math.max(0, c - ids.length));
      showAlert("Revisado", `${ids.length} producto${ids.length > 1 ? "s" : ""} marcado${ids.length > 1 ? "s" : ""} como revisado${ids.length > 1 ? "s" : ""}`, "success");
    } catch { showAlert("Error", "No se pudo marcar como revisado", "error"); }
  };

  const saveCatalogPvp = async (id: number) => {
    const pvp = parseFloat(catalogPvpEdits[id] ?? "");
    if (isNaN(pvp) || pvp <= 0) { showAlert("Precio inválido", "Introduce un PVP mayor que 0", "error"); return; }
    setSavingPvp(s => ({ ...s, [id]: true }));
    try {
      await updateProducto(id, { precioPVP: pvp });
      setProducts(prev => prev.map(p => p.id === id ? { ...p, precioPVP: pvp } : p));
      showAlert("Guardado", `PVP actualizado con éxito`, "success");
      // Limpiar edit
      const newEdits = { ...catalogPvpEdits };
      delete newEdits[id];
      setCatalogPvpEdits(newEdits);
    } catch { showAlert("Error", "No se pudo actualizar el precio", "error"); }
    finally { setSavingPvp(s => ({ ...s, [id]: false })); }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await import("../api/products").then(m => m.filtrarProductos({
        nombre: nameFilter,
        sku: skuFilter,
        distribuidor: providerFilter,
        manufacturer: brandFilter,
        categoria: categoryFilter,
        status: statusFilter,
        minPrecio: minPrice ? parseFloat(minPrice) : undefined,
        maxPrecio: maxPrice ? parseFloat(maxPrice) : undefined,
        page: currentPage,
        size: pageSize
      }));
      
      setProducts(data.content);
      setTotalProducts(data.totalElements);
      setTotalPages(data.totalPages);
    } catch (error) {
      showAlert("Error", "No se pudieron filtrar los productos", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await getCategorias();
      setCategories(data.filter(c => c && c !== "Sin Categoria"));
    } catch (error) {
      console.error("Error fetching categories", error);
    }
  };

  const fetchBrands = async () => {
    try {
      const data = await getManufacturers();
      setBrands(data.filter(b => b && b.trim() !== ""));
    } catch (error) {
      console.error("Error fetching brands", error);
    }
  };

  const fetchProviders = async () => {
    try {
      const data = await getDistribuidores();
      setProviders(data.filter(p => p && p.trim() !== ""));
    } catch (error) {
      console.error("Error fetching providers", error);
    }
  };

  useEffect(() => {
    setCurrentPage(0);
  }, [nameFilter, brandFilter, categoryFilter, statusFilter, skuFilter, providerFilter, minPrice, maxPrice]);

  useEffect(() => {
    const timer = setTimeout(() => {
        fetchProducts();
    }, 500); 
    return () => clearTimeout(timer);
  }, [nameFilter, brandFilter, categoryFilter, statusFilter, skuFilter, providerFilter, currentPage, minPrice, maxPrice]);

  const fetchConfig = async () => {
    try {
        const data = await import("../api/products").then(m => m.getConfiguracion());
        setPricingConfig(data);
        return data;
    } catch (error) {
        console.error("Error fetching config", error);
        return null;
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchBrands();
    fetchProviders();
    fetchConfig().then(config => {
      if (config) {
        setHomeNovedades(config.novedadesBrands ? config.novedadesBrands.split(",").map(s => s.trim()).filter(Boolean) : []);
        setHomeRecomendados(config.recomendadosBrands ? config.recomendadosBrands.split(",").map(s => s.trim()).filter(Boolean) : []);
      }
    });
    fetchNuevosCount();
  }, []);

  const handleDelete = (id: number, name: string) => {
    showConfirm(
      "Eliminar Producto",
      `¿Estás seguro de eliminar "${name}"? Esta acción no se puede deshacer.`,
      async () => {
        try {
          await deleteProducto(id);
          showAlert("Éxito", "Producto eliminado correctamente", "success");
          fetchProducts();
        } catch (error) {
          showAlert("Error", "No se pudo eliminar el producto", "error");
        }
      }
    );
  };

  const handleBulkStatus = async (activo: boolean) => {
    try {
        let idsToSend: number[] | null = null;
        let filters = undefined;
        
        // Si hay selección virtual (Todo el filtro) usamos filtros
        if (isAllSelected) {
            filters = {
                nombre: nameFilter,
                sku: skuFilter,
                manufacturer: brandFilter,
                categoria: categoryFilter,
                distribuidor: providerFilter,
                status: statusFilter,
                minPrecio: minPrice ? parseFloat(minPrice) : undefined,
                maxPrecio: maxPrice ? parseFloat(maxPrice) : undefined,
            };
        } else if (selectedIds.length > 0) {
            idsToSend = selectedIds;
        }

        if (!idsToSend && !filters) {
            showAlert("Atención", "Selecciona productos o aplica un filtro para realizar esta acción", "info");
            return;
        }

        await updateBulkStatus(idsToSend, activo, filters);
        
        const targetLabel = isAllSelected 
            ? "todo el catálogo filtrado"
            : `${selectedIds.length} productos seleccionados`;

        showAlert("Éxito", `Acción completada sobre ${targetLabel}: ${activo ? 'activados' : 'ocultados'} correctamente`, "success");
        setSelectedIds([]);
        setIsAllSelected(false);
        fetchProducts();
    } catch (error) {
        showAlert("Error", "No se pudo actualizar el estado masivo", "error");
    }
  };

  const handleUpdateBulkPricing = async (distribuidor?: string) => {
    try {
        let idsToSend: number[] | undefined = undefined;

        if (isAllSelected) {
            // Selección virtual: obtenemos todos los IDs que coinciden con los filtros activos
            idsToSend = await getFilteredIds({
                nombre: nameFilter,
                sku: skuFilter,
                manufacturer: brandFilter,
                categoria: categoryFilter,
                distribuidor: providerFilter,
                status: statusFilter,
                minPrecio: minPrice ? parseFloat(minPrice) : undefined,
                maxPrecio: maxPrice ? parseFloat(maxPrice) : undefined,
            });
        } else if (selectedIds.length > 0) {
            idsToSend = selectedIds;
        } else if (isSearchActive) {
            idsToSend = products.map(p => p.id);
        }

        await updateBulkPricing(pricingConfig, idsToSend, distribuidor);

        const targetLabel = isAllSelected
            ? `todo el catálogo filtrado (${idsToSend?.length} productos)`
            : idsToSend
            ? `${idsToSend.length} productos seleccionados/filtrados`
            : (distribuidor ? `catálogo de ${distribuidor}` : "todo el catálogo");

        showAlert("Éxito", `Precios de ${targetLabel} actualizados correctamente`, "success");
        setIsPricingModalOpen(false);
        setSelectedIds([]);
        setIsAllSelected(false);
        fetchProducts();
    } catch (error) {
        showAlert("Error", "No se pudo actualizar los precios", "error");
    }
  };

  const handleUpdateBulkOffer = async (enOferta: boolean) => {
    try {
        let idsToSend: number[] | null = null;
        let filters = undefined;
        
        if (isAllSelected) {
            filters = {
                nombre: nameFilter,
                sku: skuFilter,
                manufacturer: brandFilter,
                categoria: categoryFilter,
                distribuidor: providerFilter,
                status: statusFilter,
                minPrecio: minPrice ? parseFloat(minPrice) : undefined,
                maxPrecio: maxPrice ? parseFloat(maxPrice) : undefined,
            };
        } else if (selectedIds.length > 0) {
            idsToSend = selectedIds;
        }

        if (!idsToSend && !filters) {
            showAlert("Atención", "Selecciona productos o aplica un filtro para realizar esta acción", "info");
            return;
        }

        await updateBulkOffer(idsToSend, enOferta, offerDiscount / 100, filters);
        showAlert("Éxito", enOferta ? "Ofertas aplicadas correctamente" : "Ofertas retiradas correctamente", "success");
        setSelectedIds([]);
        setIsAllSelected(false);
        fetchProducts();
    } catch (error) {
        showAlert("Error", "No se pudo actualizar las ofertas", "error");
    }
  };

  const handleUpdateHomeConfig = async () => {
    setSavingHome(true);
    try {
      const { updateHomeConfig } = await import("../api/products");
      await updateHomeConfig(homeNovedades.join(","), homeRecomendados.join(","));
      showAlert("Éxito", "Configuración de inicio actualizada", "success");
      setIsHomeModalOpen(false);
    } catch {
      showAlert("Error", "No se pudo actualizar la configuración", "error");
    } finally {
      setSavingHome(false);
    }
  };

  const isSearchActive = skuFilter || nameFilter || brandFilter || categoryFilter || providerFilter || statusFilter !== "TODOS";

  const toggleSelectAll = () => {
    // Si ya está todo seleccionado o hay IDs sueltos, limpiamos todo
    if (isAllSelected || selectedIds.length > 0) {
        setSelectedIds([]);
        setIsAllSelected(false);
    } else {
        // En lugar de bajar 18k IDs, simplemente marcamos como "Todo el filtro"
        setIsAllSelected(true);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      if (editingProduct.id) {
        await updateProducto(editingProduct.id, editingProduct);
        showAlert("Éxito", "Producto actualizado", "success");
      } else {
        await createProducto(editingProduct);
        showAlert("Éxito", "Producto creado", "success");
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (error) {
      showAlert("Error", "Error al guardar el producto", "error");
    }
  };

  const groupedProducts = products.reduce((acc, p) => {
    const key = p.ean || `no-ean-${p.id}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {} as Record<string, Producto[]>);

  const toggleEan = (ean: string) => {
    setExpandedEans(prev =>
        prev.includes(ean) ? prev.filter(e => e !== ean) : [...prev, ean]
    );
  };

  const scanBrokenImages = async () => {
    setScanning(true);
    setBrokenImages([]);
    setScanProgress(0);

    try {
      // Paginar para traer todos los productos (el backend limita a 200 por página)
      const PAGE_SIZE = 200;
      const firstPage = await getProductos(0, PAGE_SIZE);
      const totalPages = firstPage.totalPages;
      let allContent = [...firstPage.content];

      for (let page = 1; page < totalPages; page++) {
        const pageData = await getProductos(page, PAGE_SIZE);
        allContent = [...allContent, ...pageData.content];
      }

      const withImage = allContent.filter(p => !!p.imagen);
      setScanTotal(withImage.length);

      const testImage = (url: string): Promise<boolean> =>
        new Promise((resolve) => {
          const img = new window.Image();
          const timer = setTimeout(() => resolve(false), 6000);
          img.onload = () => { clearTimeout(timer); resolve(true); };
          img.onerror = () => { clearTimeout(timer); resolve(false); };
          img.src = url;
        });

      const broken: Producto[] = [];
      const BATCH = 30;

      for (let i = 0; i < withImage.length; i += BATCH) {
        const batch = withImage.slice(i, i + BATCH);
        const results = await Promise.all(
          batch.map(async (p) => ({ p, ok: await testImage(p.imagen!) }))
        );
        results.forEach(({ p, ok }) => { if (!ok) broken.push(p); });
        setScanProgress(Math.min(i + BATCH, withImage.length));
      }

      setBrokenImages(broken);
    } catch {
      showAlert("Error", "No se pudo completar el escaneo", "error");
    } finally {
      setScanning(false);
    }
  };

  const [normalizingGender, setNormalizingGender] = useState(false);

  const normalizeGenders = async () => {
    setNormalizingGender(true);
    try {
      const res = await api.post<Record<string, number>>("/productos/admin/normalize-gender");
      const d = res.data;
      showAlert(
        "Género normalizado",
        `Actualizados → HOMBRE: ${d.HOMBRE}, MUJER: ${d.MUJER}, UNISEX: ${d.UNISEX}, vaciados: ${d.VACIADOS}`,
        "success"
      );
    } catch {
      showAlert("Error", "No se pudo normalizar el género de los productos", "error");
    } finally {
      setNormalizingGender(false);
    }
  };

  const launchImageEnricher = async () => {
    setEnricherRunning(true);
    try {
      await api.post("/admin/import/web/images");
      showAlert("Batida lanzada", "El script de búsqueda de imágenes se está ejecutando en segundo plano. Puede tardar varios minutos.", "success");
    } catch {
      showAlert("Error", "No se pudo lanzar el script de imágenes", "error");
    } finally {
      setEnricherRunning(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-8 relative pb-24">
        
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-white italic uppercase tracking-tighter">
                Gestión de <span className="text-primary not-italic">Inventario</span>
              </h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.4em] mt-1">Control de Catálogo y Stock</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Tabs */}
              <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1 gap-1 flex-wrap">
                <button
                  onClick={() => setActiveTab("catalogo")}
                  className={`h-9 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === "catalogo" ? "bg-primary text-background-dark shadow-lg" : "text-slate-400 hover:text-white"}`}
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">inventory_2</span>
                    <span className="hidden xs:inline">Catálogo</span>
                  </span>
                </button>
                <button
                  onClick={() => { setActiveTab("imagenes"); }}
                  className={`h-9 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === "imagenes" ? "bg-red-500 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">hide_image</span>
                    <span className="hidden xs:inline">Imágenes Rotas</span>
                    {brokenImages.length > 0 && (
                      <span className="bg-red-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full">{brokenImages.length}</span>
                    )}
                  </span>
                </button>
                <button
                  onClick={() => { setActiveTab("nuevos"); fetchNuevos(0); }}
                  className={`h-9 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all relative ${activeTab === "nuevos" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" : "text-slate-400 hover:text-white"}`}
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">fiber_new</span>
                    <span className="hidden xs:inline">Nuevos</span>
                    {nuevosCount > 0 && (
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${activeTab === "nuevos" ? "bg-white text-emerald-600" : "bg-emerald-500 text-white animate-pulse"}`}>
                        {nuevosCount}
                      </span>
                    )}
                  </span>
                </button>
              </div>

                <button
                    onClick={() => { setEditingProduct({}); setIsModalOpen(true); }}
                    className="h-10 sm:h-12 px-4 sm:px-6 bg-primary hover:bg-yellow-500 text-background-dark rounded-2xl transition-all flex items-center gap-2 sm:gap-3 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:-translate-y-1 active:translate-y-0 whitespace-nowrap"
                >
                    <span className="material-symbols-outlined text-lg">add_circle</span>
                    Nuevo Producto
                </button>
            </div>
          </div>

        {activeTab === "catalogo" && (<>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 p-6 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-2xl transition-all shadow-inner-white">
               <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-base group-focus-within:text-primary transition-colors">qr_code</span>
                    <input 
                        type="text" 
                        placeholder="SKU/EAN..."
                        value={skuFilter}
                        onChange={(e) => setSkuFilter(e.target.value)}
                        className="w-full h-11 pl-11 pr-4 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest text-white placeholder:text-slate-600 focus:border-primary/50 focus:bg-white/10 outline-none transition-all shadow-soft"
                    />
               </div>
               <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-base group-focus-within:text-primary transition-colors">label</span>
                    <input 
                        type="text" 
                        placeholder="NOMBRE..."
                        value={nameFilter}
                        onChange={(e) => setNameFilter(e.target.value)}
                        className="w-full h-11 pl-11 pr-4 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest text-white placeholder:text-slate-600 focus:border-primary/50 focus:bg-white/10 outline-none transition-all shadow-soft"
                    />
               </div>
               <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-base group-focus-within:text-primary transition-colors">brand_awareness</span>
                    <select 
                        value={brandFilter}
                        onChange={(e) => setBrandFilter(e.target.value)}
                        className="w-full h-11 pl-11 pr-10 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest text-white focus:border-primary/50 focus:bg-white/10 outline-none transition-all appearance-none cursor-pointer shadow-soft"
                    >
                        <option value="" className="bg-charcoal text-slate-500 italic">MARCA</option>
                        {brands.map(b => (
                            <option key={b} value={b} className="bg-charcoal text-white">{b}</option>
                        ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none opacity-50">unfold_more</span>
               </div>
               <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-base group-focus-within:text-primary transition-colors">category</span>
                    <select 
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full h-11 pl-11 pr-10 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest text-white focus:border-primary/50 focus:bg-white/10 outline-none transition-all appearance-none cursor-pointer shadow-soft"
                    >
                        <option value="" className="bg-charcoal text-slate-500 italic">CATEGORÍA</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat} className="bg-charcoal text-white">{cat}</option>
                        ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none opacity-50">unfold_more</span>
               </div>
               <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-base group-focus-within:text-primary transition-colors">potted_plant</span>
                    <select 
                        value={providerFilter}
                        onChange={(e) => setProviderFilter(e.target.value)}
                        className="w-full h-11 pl-11 pr-10 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest text-white focus:border-primary/50 focus:bg-white/10 outline-none transition-all appearance-none cursor-pointer shadow-soft"
                    >
                        <option value="" className="bg-charcoal text-slate-500 italic">PROVEEDOR</option>
                        {providers.map(p => (
                            <option key={p} value={p} className="bg-charcoal text-white">{p}</option>
                        ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none opacity-50">unfold_more</span>
               </div>
               <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-base group-focus-within:text-primary transition-colors">filter_list</span>
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="w-full h-11 pl-11 pr-10 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest text-white focus:border-primary/50 focus:bg-white/10 outline-none transition-all appearance-none cursor-pointer shadow-soft"
                    >
                        <option value="TODOS" className="bg-charcoal text-white">ESTADO</option>
                        <option value="ACTIVOS" className="bg-charcoal text-white">ACTIVOS</option>
                        <option value="INACTIVOS" className="bg-charcoal text-white">OCULTOS</option>
                        <option value="OFERTAS" className="bg-charcoal text-white text-rose-400">EN OFERTA</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none opacity-50">unfold_more</span>
               </div>
               <div className="flex gap-2">
                    <div className="relative group flex-1">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[12px]">payments</span>
                        <input 
                            type="number" 
                            step="0.01"
                            placeholder="MÍN €"
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                            className="w-full h-11 pl-9 pr-2 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black uppercase text-white placeholder:text-slate-600 focus:border-primary/50 outline-none shadow-soft"
                        />
                    </div>
                    <div className="relative group flex-1">
                        <input 
                            type="number" 
                            step="0.01"
                            placeholder="MÁX €"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                            className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black uppercase text-white placeholder:text-slate-600 focus:border-primary/50 outline-none shadow-soft"
                        />
                    </div>
               </div>
          </div>

          {/* PANEL DE ACCIONES (SOLO BOTONES CON VIDA) */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-6 bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-xl transition-all duration-500">
                <div className="flex flex-col gap-2 min-w-[120px]">
                    <div className="flex flex-col">
                        <span className="text-[14px] font-black text-white italic uppercase leading-none">
                            {totalProducts.toLocaleString()} 
                            <span className="text-primary ml-1">PRODUCTOS</span>
                        </span>
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-1">
                            CATÁLOGO TOTAL
                        </span>
                    </div>

                    {(isAllSelected || selectedIds.length > 0) && (
                        <div className="flex flex-col pt-2 border-t border-white/5 animate-fade-in">
                            <span className="text-[14px] font-black text-rose-500 italic uppercase leading-none">
                                {isAllSelected ? totalProducts : selectedIds.length}
                                <span className="text-white/40 ml-1">SELECCIONADOS</span>
                            </span>
                            <span className="text-[8px] font-bold text-rose-500/50 uppercase tracking-[0.3em] mt-1">
                                PARA ACCIÓN MASIVA
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-start sm:justify-end w-full sm:w-auto">
                    <button 
                        onClick={() => setStatusFilter("BAJO_MARGEN")}
                        className={`h-10 px-4 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-2 group border ${
                            statusFilter === "BAJO_MARGEN" 
                            ? "bg-orange-500 text-white border-orange-600 shadow-lg shadow-orange-500/20" 
                            : "bg-orange-500/10 border-orange-500/20 text-orange-500 hover:bg-orange-500 hover:text-white"
                        }`}
                    >
                        <span className="material-symbols-outlined text-base">warning</span>
                        Alerta Margen
                    </button>

                    <button 
                        onClick={() => handleBulkStatus(true)}
                        className="h-10 px-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-[9px] font-black uppercase hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-2 group"
                    >
                        <span className="material-symbols-outlined text-base">visibility</span>
                        Activar
                    </button>
                    <button 
                        onClick={() => handleBulkStatus(false)}
                        className="h-10 px-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-[9px] font-black uppercase hover:bg-red-500 hover:text-white transition-all flex items-center gap-2 group"
                    >
                        <span className="material-symbols-outlined text-base">visibility_off</span>
                        Ocultar
                    </button>
                    
                    <div className="w-px h-10 bg-white/10 mx-2"></div>

                    <button 
                        onClick={() => setIsPricingModalOpen(true)}
                        className="h-10 px-6 bg-primary text-background-dark rounded-xl text-[9px] font-black uppercase hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group"
                    >
                        <span className="material-symbols-outlined text-base">payments</span>
                        Precios
                    </button>

                    <button 
                        onClick={() => setIsHomeModalOpen(true)}
                        className="h-10 px-6 bg-purple-500 text-white rounded-xl text-[9px] font-black uppercase hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group shadow-lg shadow-purple-500/20"
                    >
                        <span className="material-symbols-outlined text-base">home_app_logo</span>
                        Home
                    </button>

                    {/* SELECTOR DE % INTEGRADO EN ACCIÓN */}
                    <div className="h-10 px-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 group hover:border-rose-500/40 transition-all">
                        <span className="material-symbols-outlined text-rose-500 text-sm">percent</span>
                        <input 
                            type="number" 
                            value={offerDiscount}
                            onChange={(e) => setOfferDiscount(parseFloat(e.target.value))}
                            className="w-12 bg-transparent text-white font-black text-[10px] outline-none border-b border-rose-500/30 focus:border-rose-500 transition-colors text-center"
                        />
                    </div>

                    <button 
                        onClick={() => handleUpdateBulkOffer(true)}
                        className={`h-10 px-6 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-2 group bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white shadow-lg shadow-rose-500/10 active:scale-95`}
                    >
                        <span className="material-symbols-outlined text-base group-hover:scale-110 transition-transform">sell</span>
                        Aplicar Ofertas
                    </button>

                    <button 
                         onClick={() => handleUpdateBulkOffer(false)}
                         className="h-10 px-4 bg-white/5 border border-white/10 text-slate-400 rounded-xl text-[9px] font-black uppercase hover:bg-white/10 hover:text-white transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-base">leak_remove</span>
                        Retirar Ofertas
                    </button>

                    <button 
                        onClick={() => {
                            setSkuFilter("");
                            setNameFilter("");
                            setBrandFilter("");
                            setCategoryFilter("");
                            setProviderFilter("");
                            setMinPrice("");
                            setMaxPrice("");
                            setStatusFilter("TODOS");
                            setSelectedIds([]);
                        }}
                        className="h-10 px-4 bg-white/5 text-slate-400 border border-white/10 rounded-xl text-[8px] font-black uppercase hover:text-white transition-all"
                    >
                        Limpiar
                    </button>
                </div>
          </div>
        </>)}
        </div>

        {activeTab === "catalogo" && (loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="glass-panel rounded-[2.5rem] overflow-hidden border border-white/10 bg-white/5 shadow-2xl">
            <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="p-6 w-12">
                      <input 
                        type="checkbox" 
                        checked={isAllSelected || (selectedIds.length > 0 && selectedIds.length === products.length && products.length > 0)}
                        onChange={toggleSelectAll}
                        className="size-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary/50 accent-primary cursor-pointer"
                      />
                  </th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Producto</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[220px]">Sku / Ean</th>
                   <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Precio base / PVP</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Beneficio Neto</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(Object.entries(groupedProducts) as [string, Producto[]][]).map(([ean, group]) => {
                  const hasDuplicates = group.length > 1;
                  const isExpanded = expandedEans.includes(ean);
                  // El producto "principal" es el primero del grupo
                  const mainProduct = group[0];
                  
                  return (
                    <React.Fragment key={ean}>
                      <tr className={`hover:bg-white/2 transition-colors group ${!mainProduct.activo ? 'bg-white/[0.01]' : ''} ${hasDuplicates ? 'border-l-2 border-primary/50' : ''}`}>
                        <td className="p-6">
                          <input 
                              type="checkbox" 
                              checked={isAllSelected || group.every(p => selectedIds.includes(p.id))}
                              onChange={() => {
                                  if (group.every(p => selectedIds.includes(p.id))) {
                                      setSelectedIds(prev => prev.filter(id => !group.map(p => p.id).includes(id)));
                                  } else {
                                      setSelectedIds(prev => [...new Set([...prev, ...group.map(p => p.id)])]);
                                  }
                              }}
                              className="size-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary/50 accent-primary cursor-pointer"
                          />
                        </td>
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            {hasDuplicates && (
                                <button 
                                    onClick={() => toggleEan(ean)}
                                    className={`size-6 flex items-center justify-center rounded-lg transition-all ${isExpanded ? 'bg-primary text-background-dark rotate-180' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                >
                                    <span className="material-symbols-outlined text-sm font-black">expand_more</span>
                                </button>
                            )}
                            <div className="size-12 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex-shrink-0 relative">
                              {mainProduct.imagen ? (
                                <img src={mainProduct.imagen} alt={mainProduct.nombre} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
                                    <span className="material-symbols-outlined">image</span>
                                </div>
                              )}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="text-[11px] font-black text-white uppercase italic leading-tight">{mainProduct.nombre}</p>
                                    {hasDuplicates && (
                                        <span className="text-[7px] font-black bg-primary/20 text-primary px-1.5 py-0.5 rounded-full border border-primary/30 uppercase tracking-tighter">
                                            {group.length} fuentes
                                        </span>
                                    )}
                                </div>
                                <p className="text-[9px] font-bold text-primary uppercase tracking-wider">{mainProduct.manufacturer || 'Sin Marca'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-6 min-w-[220px]">
                          <div className="flex flex-col gap-1.5 items-start">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-white/40 uppercase italic w-6">Sku</span>
                              <span className="text-[10px] font-bold text-slate-300 tracking-wider bg-white/5 px-2 py-0.5 rounded border border-white/5">{mainProduct.sku || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-white/40 uppercase italic w-6">Ean</span>
                              <span className="text-[10px] font-bold text-primary tracking-widest bg-primary/5 px-2 py-0.5 rounded border border-primary/10">{mainProduct.ean || 'N/A'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                            <div className="flex flex-col gap-2">
                                <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest border block text-center ${
                                    mainProduct.activo 
                                        ? 'bg-primary/10 text-primary border-primary/20' 
                                        : 'bg-red-500/10 text-red-500 border-red-500/20'
                                }`}>
                                    {mainProduct.activo ? 'Visible' : 'Oculto'}
                                </span>
                                {mainProduct.enOferta && (
                                    <span className="px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest border border-rose-500/20 bg-rose-500/10 text-rose-500 text-center animate-pulse">
                                        Oferta
                                    </span>
                                )}
                            </div>
                        </td>
                        <td className="p-6">
                          <span className={`text-xs font-black ${mainProduct.stock > 10 ? 'text-green-400' : mainProduct.stock > 0 ? 'text-amber-400' : 'text-red-500'} italic`}>
                            {mainProduct.stock} <span className="text-[9px] not-italic opacity-50 uppercase ml-1">unid</span>
                          </span>
                        </td>
                        <td className="p-6">
                          <div className="flex flex-col">
                            <span className={`text-sm font-black ${mainProduct.enOferta ? 'text-white/30 line-through text-[11px]' : 'text-white/50'}`}>
                                {mainProduct.precio.toFixed(2)}€
                            </span>
                            <div className="flex items-center gap-1.5 mt-1">
                                <div className="relative group/pvp">
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        placeholder={(mainProduct.precioPVP || 0).toFixed(2)}
                                        value={catalogPvpEdits[mainProduct.id] ?? ""}
                                        onChange={(e) => setCatalogPvpEdits({...catalogPvpEdits, [mainProduct.id]: e.target.value})}
                                        className={`w-20 h-7 bg-white/5 border ${catalogPvpEdits[mainProduct.id] ? 'border-primary' : 'border-white/10'} rounded-lg px-2 text-[10px] font-black text-white focus:outline-none focus:border-primary transition-all font-mono`}
                                    />
                                    {!catalogPvpEdits[mainProduct.id] && (
                                        <span className={`absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-black italic pointer-events-none ${mainProduct.enOferta ? 'line-through opacity-40 text-[8px]' : 'text-primary'}`}>
                                            PVP: {(mainProduct.precioPVP || 0).toFixed(2)}€
                                        </span>
                                    )}
                                </div>
                                {catalogPvpEdits[mainProduct.id] && (
                                    <button 
                                        onClick={() => saveCatalogPvp(mainProduct.id)}
                                        disabled={savingPvp[mainProduct.id]}
                                        className="size-7 bg-primary text-background-dark rounded-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-primary/20"
                                    >
                                        {savingPvp[mainProduct.id] ? (
                                            <div className="size-3 border-2 border-background-dark/20 border-t-background-dark rounded-full animate-spin"></div>
                                        ) : (
                                            <span className="material-symbols-outlined text-sm font-black">done</span>
                                        )}
                                    </button>
                                )}
                                {mainProduct.activo && mainProduct.precioPVP < (mainProduct.precio * 1.21) && (
                                    <span className="material-symbols-outlined text-orange-500 text-sm animate-pulse" title="¡PRECIO BAJO EL COSTE CON IVA!">warning</span>
                                )}
                            </div>
                            {mainProduct.enOferta && (
                                <div className="flex items-center gap-2 animate-fade-in">
                                    <span className="text-[14px] font-black text-rose-500 uppercase italic drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]">
                                        {(mainProduct.precioOferta || 0).toFixed(2)}€
                                    </span>
                                    <span className="text-[8px] font-black bg-rose-500/20 text-rose-500 px-1.5 py-0.5 rounded border border-rose-500/30">
                                        -{mainProduct.descuentoOferta}%
                                    </span>
                                </div>
                            )}
                          </div>
                        </td>
                        <td className="p-6 text-center">
                            {(() => {
                                const salePrice = mainProduct.enOferta ? mainProduct.precioOferta : mainProduct.precioPVP;
                                const costPrice = mainProduct.precio;
                                const { iva, envio, comisionTarjeta } = pricingConfig;
                                
                                const ivaFactor = 1 + (iva / 100);
                                const netIncome = salePrice / ivaFactor;
                                const totalCost = costPrice + envio + (comisionTarjeta / ivaFactor);
                                const profit = netIncome - totalCost;
                                const margin = (profit / netIncome) * 100;
  
                                return (
                                    <div className="flex flex-col items-center">
                                        <span className={`text-xs font-black italic ${margin > 15 ? 'text-emerald-400' : margin > 5 ? 'text-amber-400' : 'text-rose-500'}`}>
                                            {margin.toFixed(1)}%
                                        </span>
                                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">
                                            ({profit.toFixed(2)}€ netos)
                                        </span>
                                    </div>
                                );
                            })()}
                        </td>
                        <td className="p-6 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => { setEditingProduct(mainProduct); setIsModalOpen(true); }}
                              className="size-9 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center shadow-lg shadow-blue-500/10"
                            >
                              <span className="material-symbols-outlined text-lg">edit</span>
                            </button>
                            <button 
                              onClick={() => handleDelete(mainProduct.id, mainProduct.nombre)}
                              className="size-9 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-lg shadow-red-500/10"
                            >
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Desplegable de duplicados */}
                      {isExpanded && group.slice(1).map((dup, idx) => (
                        <tr key={dup.id} className="bg-white/[0.03] border-l-2 border-primary/20 animate-fade-in">
                          <td className="p-6">
                            <input 
                                type="checkbox" 
                                checked={selectedIds.includes(dup.id)}
                                onChange={() => toggleSelect(dup.id)}
                                className="size-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary/50 accent-primary cursor-pointer"
                            />
                          </td>
                          <td className="p-6 pl-16">
                            <div className="flex items-center gap-4">
                              <div className="size-10 rounded-lg bg-white/5 border border-white/10 overflow-hidden flex-shrink-0">
                                {dup.imagen ? (
                                  <img src={dup.imagen} alt={dup.nombre} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
                                      <span className="material-symbols-outlined text-sm">image</span>
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-white/80 uppercase italic leading-tight">{dup.nombre}</p>
                                <p className="text-[8px] font-bold text-slate-500 uppercase">{dup.manufacturer || 'Sin Marca'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-6">
                            <div className="flex flex-col gap-1">
                              <span className="text-[9px] font-bold text-slate-400 tracking-wider">SKU: {dup.sku}</span>
                              <span className="text-[9px] font-bold text-slate-500 tracking-widest">EAN: {dup.ean}</span>
                            </div>
                          </td>
                          <td className="p-6">
                             <div className="flex flex-col gap-1.5">
                                <span className={`px-2 py-1 rounded-md text-[7px] font-black uppercase tracking-widest border block text-center ${
                                    dup.activo 
                                        ? 'bg-primary/10 text-primary border-primary/20' 
                                        : 'bg-red-500/10 text-red-500 border-red-500/20'
                                }`}>
                                    {dup.activo ? 'Visible' : 'Oculto'}
                                </span>
                                {dup.enOferta && (
                                    <span className="px-2 py-1 rounded-md text-[7px] font-black uppercase border border-rose-500/20 bg-rose-500/10 text-rose-500 text-center italic">
                                        Oferta
                                    </span>
                                )}
                             </div>
                          </td>
                          <td className="p-6 text-center">
                            <span className={`text-[9px] font-black uppercase tracking-widest ${dup.distribuidor === 'BTS' ? 'text-blue-400' : 'text-amber-400'}`}>
                                {dup.distribuidor || 'Propio'}
                            </span>
                          </td>
                          <td className="p-6">
                            <span className={`text-xs font-black ${dup.stock > 10 ? 'text-green-400' : dup.stock > 0 ? 'text-amber-400' : 'text-red-500'} italic`}>
                              {dup.stock} <span className="text-[9px] opacity-50 ml-1">unid</span>
                            </span>
                          </td>
                          <td className="p-6">
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-white/40">{dup.precio.toFixed(2)}€</span>
                              <span className={`text-[8px] font-black text-primary/60 uppercase ${dup.enOferta ? 'line-through opacity-30' : ''}`}>
                                PVP: {(dup.precioPVP || 0).toFixed(2)}€
                              </span>
                              {dup.enOferta && (
                                <span className="text-[9px] font-black text-rose-500 uppercase italic">Promo: {(dup.precioOferta || 0).toFixed(2)}€</span>
                              )}
                            </div>
                          </td>
                          <td className="p-6 text-right">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => { setEditingProduct(dup); setIsModalOpen(true); }}
                                className="size-8 rounded-lg bg-white/5 text-slate-400 hover:bg-primary hover:text-background-dark transition-all flex items-center justify-center shadow-lg"
                              >
                                <span className="material-symbols-outlined text-base">edit</span>
                              </button>
                              <button 
                                onClick={() => handleDelete(dup.id, dup.nombre)}
                                className="size-8 rounded-lg bg-white/5 text-slate-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-lg"
                              >
                                <span className="material-symbols-outlined text-base">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
            </div>

            {/* PAGINACIÓN */}
            <div className="p-6 bg-white/2 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                        Página <span className="text-white">{currentPage + 1}</span> de <span className="text-white">{totalPages || 1}</span>
                    </span>
                    <div className="h-4 w-px bg-white/10"></div>
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                        Mostrando {products.length} de {totalProducts} resultados
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        disabled={currentPage === 0}
                        onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                        className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-primary hover:text-background-dark disabled:opacity-20 disabled:hover:bg-white/5 disabled:hover:text-white transition-all group"
                    >
                        <span className="material-symbols-outlined text-xl group-active:scale-90 transition-transform">chevron_left</span>
                    </button>

                    <div className="flex items-center gap-1">
                        {[...Array(totalPages)].map((_, i) => {
                            if (i === 0 || i === totalPages - 1 || (i >= currentPage - 1 && i <= currentPage + 1)) {
                                return (
                                    <button 
                                        key={i}
                                        onClick={() => setCurrentPage(i)}
                                        className={`size-10 rounded-xl text-[10px] font-black transition-all ${
                                            currentPage === i 
                                                ? 'bg-primary text-background-dark shadow-lg shadow-primary/20' 
                                                : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                        }`}
                                    >
                                        {i + 1}
                                    </button>
                                );
                            }
                            if (i === 1 || i === totalPages - 2) {
                                return <span key={i} className="text-slate-600 px-1">...</span>;
                            }
                            return null;
                        })}
                    </div>

                    <button 
                        disabled={currentPage >= totalPages - 1}
                        onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                        className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-primary hover:text-background-dark disabled:opacity-20 disabled:hover:bg-white/5 disabled:hover:text-white transition-all group"
                    >
                        <span className="material-symbols-outlined text-xl group-active:scale-90 transition-transform">chevron_right</span>
                    </button>
                </div>
            </div>
          </div>
        ))}

        {/* ===== PESTAÑA: NUEVOS PRODUCTOS ===== */}
        {activeTab === "nuevos" && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-[2.5rem]">
              <div>
                <p className="text-emerald-400 font-black text-lg uppercase tracking-tight flex items-center gap-3">
                  <span className="material-symbols-outlined">fiber_new</span>
                  Productos Nuevos sin Precio
                </p>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                  Productos importados en el último volcado que necesitan revisión de precio
                </p>
              </div>
              {nuevosProducts.length > 0 && (
                <button
                  onClick={() => marcarRevisados(nuevosProducts.map((p: any) => p.id))}
                  className="h-10 px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">done_all</span>
                  Marcar todos revisados
                </button>
              )}
            </div>

            {nuevosLoading && (
              <div className="h-40 flex items-center justify-center">
                <div className="size-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
              </div>
            )}

            {!nuevosLoading && nuevosProducts.length === 0 && (
              <div className="flex flex-col items-center justify-center p-16 bg-white/5 border border-white/10 rounded-[2.5rem] gap-4">
                <span className="material-symbols-outlined text-5xl text-emerald-500">check_circle</span>
                <p className="text-white font-black text-lg uppercase">¡Todo revisado!</p>
                <p className="text-slate-400 text-sm">No hay productos nuevos pendientes de revisión.</p>
              </div>
            )}

            {!nuevosLoading && nuevosProducts.length > 0 && (
              <div className="glass-panel rounded-[2.5rem] overflow-hidden border border-emerald-500/20 bg-white/5 shadow-2xl">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-emerald-500/10 border-b border-white/10">
                      <th className="p-4 text-[9px] font-black text-emerald-400 uppercase tracking-widest">Imagen</th>
                      <th className="p-4 text-[9px] font-black text-emerald-400 uppercase tracking-widest">Producto</th>
                      <th className="p-4 text-[9px] font-black text-emerald-400 uppercase tracking-widest">Marca</th>
                      <th className="p-4 text-[9px] font-black text-emerald-400 uppercase tracking-widest">Proveedor</th>
                      <th className="p-4 text-[9px] font-black text-emerald-400 uppercase tracking-widest">Coste</th>
                      <th className="p-4 text-[9px] font-black text-emerald-400 uppercase tracking-widest">PVP</th>
                      <th className="p-4 text-[9px] font-black text-emerald-400 uppercase tracking-widest">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {nuevosProducts.map((p: any) => (
                      <tr key={p.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-3">
                          {p.imagen
                            ? <img src={p.imagen} alt="" className="size-12 object-contain rounded-xl bg-white/5 border border-white/10" />
                            : <div className="size-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center"><span className="material-symbols-outlined text-slate-600 text-sm">image_not_supported</span></div>
                          }
                        </td>
                        <td className="p-4">
                          <p className="text-[11px] font-bold text-white line-clamp-2 max-w-[220px]">{p.nombre}</p>
                          <p className="text-[9px] text-slate-500 font-mono mt-0.5">{p.ean ?? "—"}</p>
                        </td>
                        <td className="p-4 text-[10px] font-bold text-slate-300">{p.manufacturer ?? "—"}</td>
                        <td className="p-4 text-[10px] font-black text-slate-400 uppercase">{p.distribuidor ?? "—"}</td>
                        <td className="p-4 text-[11px] font-black text-white">{(p.precio ?? 0).toFixed(2)} €</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder={p.precioPVP ? p.precioPVP.toFixed(2) : "0.00"}
                              value={nuevosPvpEdits[p.id] ?? ""}
                              onChange={e => setNuevosPvpEdits(prev => ({ ...prev, [p.id]: e.target.value }))}
                              className="w-24 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:border-emerald-500/50 outline-none"
                            />
                            <span className="text-slate-500 text-xs">€</span>
                            <button
                              onClick={() => savePvp(p.id)}
                              disabled={savingPvp[p.id] || !nuevosPvpEdits[p.id]}
                              className="h-8 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                            >
                              {savingPvp[p.id] ? "..." : "Guardar"}
                            </button>
                          </div>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => marcarRevisados([p.id])}
                            className="h-8 px-4 bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/40 text-slate-400 hover:text-emerald-400 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-sm">check</span>
                            Revisado
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Paginación */}
                {nuevosTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 p-5 border-t border-white/10">
                    <button onClick={() => fetchNuevos(nuevosPage - 1)} disabled={nuevosPage === 0}
                      className="size-9 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 disabled:opacity-30 transition-all">
                      <span className="material-symbols-outlined text-sm">chevron_left</span>
                    </button>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Página {nuevosPage + 1} de {nuevosTotalPages}
                    </span>
                    <button onClick={() => fetchNuevos(nuevosPage + 1)} disabled={nuevosPage >= nuevosTotalPages - 1}
                      className="size-9 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 disabled:opacity-30 transition-all">
                      <span className="material-symbols-outlined text-sm">chevron_right</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===== PESTAÑA: IMÁGENES ROTAS ===== */}
        {activeTab === "imagenes" && (
          <div className="flex flex-col gap-6">
            {/* Header de la pestaña */}
            <div className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-[2.5rem]">
              <div>
                <p className="text-white font-black text-lg uppercase tracking-tight">Escáner de Imágenes Rotas</p>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                  Detecta productos cuya URL de imagen no carga correctamente
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={normalizeGenders}
                  disabled={normalizingGender}
                  className="h-12 px-6 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 shadow-lg shadow-teal-500/20"
                >
                  <span className={`material-symbols-outlined text-lg ${normalizingGender ? "animate-spin" : ""}`}>
                    {normalizingGender ? "sync" : "wc"}
                  </span>
                  {normalizingGender ? "Normalizando..." : "Normalizar Género"}
                </button>
                <button
                  onClick={launchImageEnricher}
                  disabled={enricherRunning || scanning}
                  className="h-12 px-6 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 shadow-lg shadow-violet-500/20"
                >
                  <span className={`material-symbols-outlined text-lg ${enricherRunning ? "animate-spin" : ""}`}>
                    {enricherRunning ? "sync" : "travel_explore"}
                  </span>
                  {enricherRunning ? "Lanzando..." : "Batida de Imágenes"}
                </button>
                <button
                  onClick={scanBrokenImages}
                  disabled={scanning}
                  className="h-12 px-8 bg-red-500 hover:bg-red-400 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 shadow-lg shadow-red-500/20"
                >
                  <span className={`material-symbols-outlined text-lg ${scanning ? "animate-spin" : ""}`}>
                    {scanning ? "sync" : "image_search"}
                  </span>
                  {scanning ? `Escaneando... ${scanProgress}/${scanTotal}` : "Detectar Rotas"}
                </button>
              </div>
            </div>

            {/* Barra de progreso */}
            {scanning && (
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
                <div
                  className="h-full bg-red-500 transition-all duration-300 rounded-full"
                  style={{ width: scanTotal > 0 ? `${(scanProgress / scanTotal) * 100}%` : "0%" }}
                />
              </div>
            )}

            {/* Resultado */}
            {!scanning && brokenImages.length === 0 && scanTotal > 0 && (
              <div className="flex flex-col items-center justify-center p-16 bg-white/5 border border-white/10 rounded-[2.5rem] gap-4">
                <span className="material-symbols-outlined text-5xl text-emerald-500">check_circle</span>
                <p className="text-white font-black text-lg uppercase">¡Sin imágenes rotas!</p>
                <p className="text-slate-400 text-sm">Todos los {scanTotal} productos escaneados tienen imagen correcta.</p>
              </div>
            )}

            {brokenImages.length > 0 && (
              <div className="glass-panel rounded-[2.5rem] overflow-hidden border border-red-500/20 bg-white/5 shadow-2xl">
                <div className="p-5 border-b border-white/10 bg-red-500/5 flex items-center justify-between">
                  <p className="text-red-400 text-[10px] font-black uppercase tracking-widest">
                    {brokenImages.length} producto{brokenImages.length !== 1 ? "s" : ""} con imagen rota detectado{brokenImages.length !== 1 ? "s" : ""}
                  </p>
                  <button
                    onClick={() => {
                      const lines = brokenImages.map(p => `${p.id}\t${p.ean ?? ""}\t${p.nombre}\t${p.manufacturer ?? ""}\t${p.imagen}`).join("\n");
                      navigator.clipboard.writeText("ID\tEAN\tNombre\tMarca\tURL Imagen\n" + lines);
                      showAlert("Copiado", "Lista copiada al portapapeles (TSV)", "success");
                    }}
                    className="h-9 px-5 bg-white/5 border border-white/10 text-slate-300 rounded-xl text-[9px] font-black uppercase hover:bg-white/10 transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">content_copy</span>
                    Copiar lista
                  </button>
                </div>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10">
                      <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">ID</th>
                      <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">EAN</th>
                      <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Nombre</th>
                      <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Marca</th>
                      <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">URL rota</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {brokenImages.map((p) => (
                      <tr key={p.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 text-[10px] font-black text-slate-500">{p.id}</td>
                        <td className="p-4 text-[10px] font-mono text-slate-400">{p.ean ?? "—"}</td>
                        <td className="p-4 text-[11px] font-bold text-white">{p.nombre}</td>
                        <td className="p-4 text-[10px] font-bold text-slate-400">{p.manufacturer ?? "—"}</td>
                        <td className="p-4 max-w-xs">
                          <span className="text-[9px] font-mono text-red-400 break-all line-clamp-2">{p.imagen}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* MODAL PRECIOS GLOBALES */}
      {isPricingModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background-dark/80 backdrop-blur-xl">
             <div className="w-full max-w-lg bg-charcoal border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl animate-fade-in-up">
                <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <div>
                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                            Configurar <span className="text-primary not-italic">Precios Globales</span>
                        </h3>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.3em]">Recálculo masivo del catálogo</p>
                        {(isAllSelected || selectedIds.length > 0) && (
                            <div className="mt-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-lg inline-flex items-center gap-2 animate-pulse">
                                <span className="material-symbols-outlined text-sm text-primary">priority_high</span>
                                <span className="text-[10px] font-black uppercase text-primary">PRIORIDAD: {isAllSelected ? "TODO EL CATÁLOGO" : `${selectedIds.length} PRODUCTOS`} SELECCIONADOS</span>
                            </div>
                        )}
                    </div>
                    <button onClick={() => setIsPricingModalOpen(false)} className="size-10 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div className="p-8 space-y-6">
                    <div className="space-y-4 p-4 bg-white/5 border border-white/10 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="material-symbols-outlined text-5xl">local_shipping</span>
                        </div>
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Gastos de Envío Fijos (€)</label>
                        <input 
                            type="number" 
                            step="0.01"
                            required
                            value={pricingConfig.envio} 
                            onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                setPricingConfig({...pricingConfig, envio: isNaN(val) ? 0 : val});
                            }}
                            className="w-full h-14 px-6 bg-background-dark border border-white/10 rounded-xl text-lg font-black text-white focus:border-primary/50 outline-none transition-all font-mono"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-4 p-4 bg-white/5 border border-white/10 rounded-2xl relative overflow-hidden group">
                             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="material-symbols-outlined text-4xl">account_balance</span>
                            </div>
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">IVA (%)</label>
                            <input 
                                type="number" 
                                required
                                value={pricingConfig.iva} 
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    setPricingConfig({...pricingConfig, iva: isNaN(val) ? 0 : val});
                                }}
                                className="w-full h-14 px-6 bg-background-dark border border-white/10 rounded-xl text-lg font-black text-white focus:border-primary/50 outline-none transition-all font-mono"
                            />
                        </div>
                        <div className="space-y-4 p-4 bg-white/5 border border-white/10 rounded-2xl relative overflow-hidden group">
                             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="material-symbols-outlined text-4xl">trending_up</span>
                            </div>
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Margen (%)</label>
                            <input 
                                type="number" 
                                required
                                value={pricingConfig.margen} 
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    setPricingConfig({...pricingConfig, margen: isNaN(val) ? 0 : val});
                                }}
                                className="w-full h-14 px-6 bg-background-dark border border-white/10 rounded-xl text-lg font-black text-white focus:border-primary/50 outline-none transition-all font-mono"
                            />
                        </div>
                        <div className="space-y-4 p-4 bg-white/5 border border-white/10 rounded-2xl relative overflow-hidden group">
                             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="material-symbols-outlined text-4xl">credit_card</span>
                            </div>
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Card (€)</label>
                            <input 
                                type="number" 
                                step="0.01"
                                required
                                value={pricingConfig.comisionTarjeta} 
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    setPricingConfig({...pricingConfig, comisionTarjeta: isNaN(val) ? 0 : val});
                                }}
                                className="w-full h-14 px-6 bg-background-dark border border-white/10 rounded-xl text-lg font-black text-white focus:border-primary/50 outline-none transition-all font-mono"
                            />
                        </div>
                    </div>

                    {/* Simulador de Ejemplo */}
                    <div className="p-6 bg-primary/5 border border-primary/10 rounded-3xl space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-primary uppercase italic">Simulador de Ejemplo (Para 20€ de coste)</span>
                            <span className="material-symbols-outlined text-primary text-sm">calculate</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col">
                                <span className="text-[8px] font-bold text-slate-500 uppercase">Coste + Envío</span>
                                <span className="text-sm font-black text-white">{(20 + pricingConfig.envio).toFixed(2)}€</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[8px] font-bold text-slate-500 uppercase">Con IVA ({pricingConfig.iva}%)</span>
                                <span className="text-sm font-black text-white">{((20 + pricingConfig.envio) * (1 + pricingConfig.iva/100)).toFixed(2)}€</span>
                            </div>
                            <div className="flex flex-col pt-2 border-t border-white/5">
                                <span className="text-[8px] font-bold text-primary uppercase">PVP FINAL (con {pricingConfig.margen}% margen)</span>
                                <span className="text-xl font-black text-primary italic">
                                    {(((20 + pricingConfig.envio) * (1 + pricingConfig.iva/100) / (1 - pricingConfig.margen/100)) + pricingConfig.comisionTarjeta).toFixed(2)}€
                                </span>
                            </div>
                            <div className="flex flex-col pt-2 border-t border-white/5 justify-center">
                                <span className="text-[8px] font-bold text-emerald-500 uppercase">Beneficio Neto</span>
                                <span className="text-xs font-black text-emerald-400">
                                    {((((20 + pricingConfig.envio) * (1 + pricingConfig.iva/100) / (1 - pricingConfig.margen/100))) / (1 + pricingConfig.iva/100) - (20 + pricingConfig.envio + (pricingConfig.comisionTarjeta / (1 + pricingConfig.iva/100)))).toFixed(2)}€
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 space-y-4">
                        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-4">
                            <span className="material-symbols-outlined text-amber-500">info</span>
                            <p className="text-[9px] font-bold text-amber-200/80 uppercase leading-relaxed tracking-wider">
                                {selectedPricingProvider 
                                    ? `Esta acción actualizará SOLO los productos de ${selectedPricingProvider}.`
                                    : `Esta acción actualizará TODO el catálogo seleccionado/filtrado.`
                                }
                            </p>
                        </div>
                        
                        <div className="flex flex-col gap-3">
                             <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1 mb-1">Seleccionar Proveedor (Opcional)</label>
                             <div className="grid grid-cols-2 gap-3">
                                <div 
                                    onClick={() => setSelectedPricingProvider(prev => prev === "NOVAENGEL" ? null : "NOVAENGEL")}
                                    className={`h-20 rounded-2xl border cursor-pointer transition-all flex flex-col items-center justify-center gap-1 group overflow-hidden relative ${
                                        selectedPricingProvider === "NOVAENGEL" 
                                            ? 'bg-blue-500/20 border-blue-500 shadow-lg shadow-blue-500/10' 
                                            : 'bg-white/5 border-white/10 hover:border-white/20'
                                    }`}
                                >
                                    <span className={`material-symbols-outlined text-xl ${selectedPricingProvider === "NOVAENGEL" ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`}>rocket_launch</span>
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${selectedPricingProvider === "NOVAENGEL" ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>Novaengel</span>
                                    {selectedPricingProvider === "NOVAENGEL" && <div className="absolute top-2 right-2 size-2 bg-blue-500 rounded-full animate-pulse"></div>}
                                </div>
                                <div 
                                    onClick={() => setSelectedPricingProvider(prev => prev === "BTS" ? null : "BTS")}
                                    className={`h-20 rounded-2xl border cursor-pointer transition-all flex flex-col items-center justify-center gap-1 group overflow-hidden relative ${
                                        selectedPricingProvider === "BTS" 
                                            ? 'bg-emerald-500/20 border-emerald-500 shadow-lg shadow-emerald-500/10' 
                                            : 'bg-white/5 border-white/10 hover:border-white/20'
                                    }`}
                                >
                                    <span className={`material-symbols-outlined text-xl ${selectedPricingProvider === "BTS" ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'}`}>rocket_launch</span>
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${selectedPricingProvider === "BTS" ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>BTS</span>
                                    {selectedPricingProvider === "BTS" && <div className="absolute top-2 right-2 size-2 bg-emerald-500 rounded-full animate-pulse"></div>}
                                </div>
                             </div>
                             
                             <div className="h-px bg-white/5 my-2"></div>

                             <button 
                                type="button" 
                                onClick={() => handleUpdateBulkPricing(selectedPricingProvider || undefined)}
                                className="h-16 bg-primary hover:bg-yellow-500 text-background-dark text-[11px] font-black uppercase tracking-[0.2em] rounded-3xl shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-3 group"
                             >
                                <span className="material-symbols-outlined text-xl group-hover:rotate-12 transition-transform">payments</span>
                                Aplicar Precios
                             </button>
                             
                             <button type="button" onClick={() => setIsPricingModalOpen(false)} className="h-10 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] hover:text-white transition-all">
                                Cancelar y Cerrar
                             </button>
                        </div>
                    </div>
                </div>
             </div>
          </div>
      )}

      {/* MODAL DE EDICIÓN / CREACIÓN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background-dark/80 backdrop-blur-xl">
          <div className="w-full max-w-2xl bg-charcoal border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl animate-fade-in-up">
            <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/5">
                <div>
                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                        {editingProduct?.id ? 'Editar' : 'Nuevo'} <span className="text-primary not-italic">Producto</span>
                    </h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.3em]">Completa los detalles de la esencia</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="size-10 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400 transition-colors">
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>
            <form onSubmit={handleSave} className="p-8 grid grid-cols-2 gap-6 overflow-y-auto max-h-[70vh]">
                <div className="col-span-2 space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">Nombre del Producto</label>
                    <input 
                        type="text" 
                        required
                        value={editingProduct?.nombre || ""} 
                        onChange={(e) => setEditingProduct({...editingProduct, nombre: e.target.value})}
                        className="w-full h-14 px-6 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white focus:border-primary/50 outline-none transition-all"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">Marca / Fabricante</label>
                    <input 
                        type="text" 
                        value={editingProduct?.manufacturer || ""} 
                        onChange={(e) => setEditingProduct({...editingProduct, manufacturer: e.target.value})}
                        className="w-full h-14 px-6 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white focus:border-primary/50 outline-none transition-all"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">Categoría</label>
                    <input 
                        type="text" 
                        value={editingProduct?.categoria || ""} 
                        onChange={(e) => setEditingProduct({...editingProduct, categoria: e.target.value})}
                        className="w-full h-14 px-6 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white focus:border-primary/50 outline-none transition-all"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">Precio Proveedor (€)</label>
                    <input 
                        type="number" 
                        step="0.01"
                        required
                        value={editingProduct?.precio || ""} 
                        onChange={(e) => setEditingProduct({...editingProduct, precio: parseFloat(e.target.value)})}
                        className="w-full h-14 px-6 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white focus:border-primary/50 outline-none transition-all font-mono"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">PVP Web (€)</label>
                    <input 
                        type="number" 
                        step="0.01"
                        required
                        value={editingProduct?.precioPVP || ""} 
                        onChange={(e) => setEditingProduct({...editingProduct, precioPVP: parseFloat(e.target.value)})}
                        className="w-full h-14 px-6 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white focus:border-primary/50 outline-none transition-all font-mono"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">Stock Actual</label>
                    <input 
                        type="number" 
                        required
                        value={editingProduct?.stock || ""} 
                        onChange={(e) => setEditingProduct({...editingProduct, stock: parseInt(e.target.value)})}
                        className="w-full h-14 px-6 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white focus:border-primary/50 outline-none transition-all"
                    />
                </div>
                <div className="col-span-2 space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">URL Imagen Principal</label>
                    <input 
                        type="text" 
                        value={editingProduct?.imagen || ""} 
                        onChange={(e) => setEditingProduct({...editingProduct, imagen: e.target.value})}
                        className="w-full h-14 px-6 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-black lowercase text-white focus:border-primary/50 outline-none transition-all"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">URL Imagen 2</label>
                    <input 
                        type="text" 
                        value={editingProduct?.imagen2 || ""} 
                        onChange={(e) => setEditingProduct({...editingProduct, imagen2: e.target.value})}
                        className="w-full h-14 px-6 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-black lowercase text-white focus:border-primary/50 outline-none transition-all"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">URL Imagen 3</label>
                    <input 
                        type="text" 
                        value={editingProduct?.imagen3 || ""} 
                        onChange={(e) => setEditingProduct({...editingProduct, imagen3: e.target.value})}
                        className="w-full h-14 px-6 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-black lowercase text-white focus:border-primary/50 outline-none transition-all"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">URL Imagen 4 (Banquillo)</label>
                    <input 
                        type="text" 
                        value={editingProduct?.imagen4 || ""} 
                        onChange={(e) => setEditingProduct({...editingProduct, imagen4: e.target.value})}
                        className="w-full h-14 px-6 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-black lowercase text-white focus:border-primary/50 outline-none transition-all"
                    />
                </div>
                
                <div className="col-span-2 p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-white uppercase italic">Visibilidad en Tienda</p>
                        <p className="text-[8px] font-bold text-slate-500 uppercase">Activa este check para mostrar el producto en la web pública</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={editingProduct?.activo ?? true}
                            onChange={(e) => setEditingProduct({...editingProduct, activo: e.target.checked})}
                        />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-400 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-checked:after:bg-background-dark peer-checked:after:border-background-dark"></div>
                    </label>
                </div>

                <div className="col-span-2 pt-6 flex gap-4">
                    <button type="submit" className="flex-1 h-16 bg-primary hover:bg-yellow-500 text-background-dark text-[11px] font-black uppercase tracking-[0.2em] rounded-3xl shadow-xl shadow-primary/20 transition-all">
                        {editingProduct?.id ? 'Guardar Cambios' : 'Crear Producto'}
                    </button>
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 h-16 bg-white/5 hover:bg-white/10 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-3xl border border-white/10 transition-all">
                        Cancelar
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIGURACIÓN DE OFERTAS */}
      {isOfferModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background-dark/80 backdrop-blur-xl">
             <div className="w-full max-w-lg bg-charcoal border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl animate-fade-in-up">
                <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <div>
                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                            Configurar <span className="text-rose-500 not-italic">Lógica de Ofertas</span>
                        </h3>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.3em]">Define el descuento para el botón rápido</p>
                    </div>
                    <button onClick={() => setIsOfferModalOpen(false)} className="size-10 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                
                <div className="p-8 space-y-6">
                    <div className="space-y-4 p-6 bg-rose-500/5 border border-rose-500/10 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="material-symbols-outlined text-5xl text-rose-500">percent</span>
                        </div>
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Porcentaje de Descuento (%)</label>
                        <div className="flex items-center gap-4">
                            <input 
                                type="number" 
                                min="1"
                                max="99"
                                value={offerDiscount} 
                                onChange={(e) => setOfferDiscount(parseInt(e.target.value))}
                                className="flex-1 h-16 px-6 bg-background-dark border border-white/10 rounded-xl text-2xl font-black text-rose-500 focus:border-rose-500/50 outline-none transition-all font-mono"
                            />
                            <div className="flex flex-col gap-2">
                                <button onClick={() => setOfferDiscount(d => Math.min(99, d + 5))} className="size-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all">
                                    <span className="material-symbols-outlined text-sm">add</span>
                                </button>
                                <button onClick={() => setOfferDiscount(d => Math.max(1, d - 5))} className="size-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all">
                                    <span className="material-symbols-outlined text-sm">remove</span>
                                </button>
                            </div>
                        </div>
                        <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wide">Este % se aplicará al PVP actual cuando pulses "Poner en oferta"</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            type="button"
                            disabled={!isAllSelected && selectedIds.length === 0}
                            onClick={() => handleUpdateBulkOffer(true)}
                            className="h-16 bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-3xl shadow-xl shadow-rose-500/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="material-symbols-outlined text-lg">local_offer</span>
                            Aplicar Oferta
                        </button>
                        <button 
                            type="button"
                            disabled={!isAllSelected && selectedIds.length === 0}
                            onClick={() => handleUpdateBulkOffer(false)}
                            className="h-16 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-3xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="material-symbols-outlined text-lg">block</span>
                            Quitar Ofertas
                        </button>
                    </div>

                    <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest italic border-t border-white/5 pt-4">
                        {(isAllSelected || selectedIds.length > 0) 
                            ? (isAllSelected ? `Se afectará todo el catálogo filtrado (${totalProducts} productos)` : `Se afectarán ${selectedIds.length} productos seleccionados`) 
                            : "Usa el filtro o selecciona productos para realizar acciones masivas"}
                    </p>
                </div>
             </div>
          </div>
      )}
      {/* MODAL CONFIGURACIÓN HOME */}
      {isHomeModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background-dark/80 backdrop-blur-xl">
          <div className="w-full max-w-4xl bg-charcoal border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl animate-fade-in-up">
            <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/5">
              <div>
                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                  Gestionar <span className="text-purple-400 not-italic">Marcas Destacadas</span>
                </h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.3em]">Selecciona las marcas que aparecen en secciones del Home</p>
              </div>
              <button onClick={() => setIsHomeModalOpen(false)} className="size-10 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-8 grid grid-cols-2 gap-8 overflow-y-auto max-h-[70vh]">
              {/* Sección Novedades */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-emerald-400">
                  <span className="material-symbols-outlined">new_releases</span>
                  <p className="text-[11px] font-black uppercase tracking-widest">Sección Novedades</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 max-h-[400px] overflow-y-auto">
                   <div className="grid grid-cols-1 gap-2">
                      {brands.map(brand => (
                        <label key={`nov-${brand}`} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl cursor-pointer transition-colors group">
                           <input 
                              type="checkbox" 
                              checked={homeNovedades.includes(brand)}
                              onChange={() => {
                                setHomeNovedades(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]);
                              }}
                              className="size-4 rounded border-white/20 bg-white/5 text-emerald-500 accent-emerald-500"
                           />
                           <span className={`text-[10px] font-black uppercase tracking-wider transition-colors ${homeNovedades.includes(brand) ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>{brand}</span>
                        </label>
                      ))}
                   </div>
                </div>
              </div>

              {/* Sección Recomendados */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-blue-400">
                  <span className="material-symbols-outlined">recommend</span>
                  <p className="text-[11px] font-black uppercase tracking-widest">Sección Recomendados</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 max-h-[400px] overflow-y-auto">
                   <div className="grid grid-cols-1 gap-2">
                      {brands.map(brand => (
                        <label key={`rec-${brand}`} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl cursor-pointer transition-colors group">
                           <input 
                              type="checkbox" 
                              checked={homeRecomendados.includes(brand)}
                              onChange={() => {
                                setHomeRecomendados(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]);
                              }}
                              className="size-4 rounded border-white/20 bg-white/5 text-blue-500 accent-blue-500"
                           />
                           <span className={`text-[10px] font-black uppercase tracking-wider transition-colors ${homeRecomendados.includes(brand) ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>{brand}</span>
                        </label>
                      ))}
                   </div>
                </div>
              </div>

              <div className="col-span-2 pt-4 flex gap-4">
                <button 
                  onClick={handleUpdateHomeConfig}
                  disabled={savingHome}
                  className="flex-1 h-14 bg-purple-500 hover:bg-purple-600 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-3xl shadow-xl shadow-purple-500/20 transition-all flex items-center justify-center gap-3"
                >
                  {savingHome ? (
                    <div className="size-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg">save</span>
                      Guardar Configuración
                    </>
                  )}
                </button>
                <button 
                  onClick={() => setIsHomeModalOpen(false)}
                  className="px-8 h-14 bg-white/5 hover:bg-white/10 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-3xl border border-white/10 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminProductsPage;
