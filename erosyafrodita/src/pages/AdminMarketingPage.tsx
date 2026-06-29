import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';

interface Producto {
  id: number;
  nombre: string;
  marca?: string;
  manufacturer?: string;
  categoria?: string;
  precioPVP?: number;
  precio?: number;
  sku?: string;
}

interface ContenidoIA {
  titulo_seo?: string;
  descripcion_seo?: string;
  descripcion_producto?: string;
  copy_instagram_1?: string;
  copy_instagram_2?: string;
  copy_instagram_3?: string;
  hashtags?: string;
  error?: string;
}

const AdminMarketingPage: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loadingProductos, setLoadingProductos] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [contenidoIA, setContenidoIA] = useState<ContenidoIA | null>(null);
  const [generando, setGenerando] = useState(false);
  const [copiado, setCopiado] = useState<string | null>(null);

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const res = await fetch('/api/productos');
        if (res.ok) {
          const data = await res.json();
          setProductos(data);
        }
      } catch (e) {
        console.error('Error cargando productos', e);
      } finally {
        setLoadingProductos(false);
      }
    };
    fetchProductos();
  }, []);

  const productosFiltrados = productos.filter(p =>
    p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.marca || p.manufacturer || '').toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleGenerar = async (producto: Producto) => {
    setProductoSeleccionado(producto);
    setContenidoIA(null);
    setGenerando(true);
    try {
      const res = await fetch('/api/admin/marketing/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: producto.nombre,
          marca: producto.manufacturer || producto.marca || 'Eros y Afrodita',
          categoria: producto.categoria || 'Perfumes',
          precio: producto.precioPVP || producto.precio || 0,
        }),
      });
      const data = await res.json();
      setContenidoIA(data);
    } catch (e) {
      setContenidoIA({ error: 'Error de conexión con el servidor' });
    } finally {
      setGenerando(false);
    }
  };

  const copiar = (texto: string, clave: string) => {
    navigator.clipboard.writeText(texto);
    setCopiado(clave);
    setTimeout(() => setCopiado(null), 2000);
  };

  const CopyField = ({ label, value, fieldKey }: { label: string; value?: string; fieldKey: string }) => (
    value ? (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-2">
        <div className="flex justify-between items-center">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
          <button
            onClick={() => copiar(value, fieldKey)}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
              copiado === fieldKey
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-xs">{copiado === fieldKey ? 'check' : 'content_copy'}</span>
            {copiado === fieldKey ? 'Copiado' : 'Copiar'}
          </button>
        </div>
        <p className="text-sm text-white leading-relaxed">{value}</p>
        <p className="text-[9px] text-slate-600">{value.length} caracteres</p>
      </div>
    ) : null
  );

  return (
    <AdminLayout>
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div>
          <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">
            Motor <span className="text-primary not-italic">IA</span>
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.4em] mt-2">
            Generación automática de contenido con Gemini Pro
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Panel izquierdo: selector de producto */}
          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 flex flex-col gap-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {productos.length} productos disponibles
            </p>

            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg">search</span>
              <input
                type="text"
                placeholder="Buscar por nombre o marca..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="w-full h-12 pl-11 pr-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-primary/50 transition-all"
              />
            </div>

            {loadingProductos ? (
              <div className="flex items-center justify-center h-40">
                <div className="size-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                {productosFiltrados.slice(0, 50).map(producto => (
                  <button
                    key={producto.id}
                    onClick={() => handleGenerar(producto)}
                    disabled={generando}
                    className={`flex items-center justify-between px-5 py-4 rounded-xl border transition-all text-left disabled:opacity-40 ${
                      productoSeleccionado?.id === producto.id
                        ? 'bg-primary/10 border-primary/30 text-white'
                        : 'bg-white/2 border-white/5 text-slate-300 hover:bg-white/8 hover:border-white/15 hover:text-white'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{producto.nombre}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {producto.manufacturer || producto.marca || '—'} · {(producto.precioPVP || producto.precio || 0).toFixed(2)}€
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-slate-600 text-base ml-3 shrink-0">
                      {generando && productoSeleccionado?.id === producto.id ? 'hourglass_empty' : 'auto_awesome'}
                    </span>
                  </button>
                ))}
                {productosFiltrados.length === 0 && (
                  <p className="text-center text-slate-600 text-sm py-10">No se encontraron productos</p>
                )}
              </div>
            )}
          </div>

          {/* Panel derecho: resultado IA */}
          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 flex flex-col gap-4">
            {generando ? (
              <div className="flex flex-col items-center justify-center h-full gap-6 py-20">
                <div className="size-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <div className="text-center">
                  <p className="text-sm font-black text-white uppercase tracking-widest">Generando contenido...</p>
                  <p className="text-[10px] text-slate-500 mt-1">Gemini Pro está creando tu copy</p>
                </div>
              </div>
            ) : contenidoIA ? (
              <div className="flex flex-col gap-3">
                {contenidoIA.error ? (
                  <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl">
                    <p className="text-sm text-red-400">{contenidoIA.error}</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="size-2 rounded-full bg-primary animate-pulse" />
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest">
                        Contenido generado para: {productoSeleccionado?.nombre}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 overflow-y-auto max-h-[500px] pr-1 custom-scrollbar">
                      <CopyField label="Título SEO (Google)" value={contenidoIA.titulo_seo} fieldKey="titulo_seo" />
                      <CopyField label="Meta Descripción SEO" value={contenidoIA.descripcion_seo} fieldKey="desc_seo" />
                      <CopyField label="Descripción del Producto" value={contenidoIA.descripcion_producto} fieldKey="desc_prod" />
                      <CopyField label="Copy Instagram #1 (Corto)" value={contenidoIA.copy_instagram_1} fieldKey="ig1" />
                      <CopyField label="Copy Instagram #2 (Storytelling)" value={contenidoIA.copy_instagram_2} fieldKey="ig2" />
                      <CopyField label="Copy Instagram #3 (Oferta)" value={contenidoIA.copy_instagram_3} fieldKey="ig3" />
                      <CopyField label="Hashtags" value={contenidoIA.hashtags} fieldKey="hashtags" />
                    </div>

                    <button
                      onClick={() => productoSeleccionado && handleGenerar(productoSeleccionado)}
                      className="mt-2 h-11 w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-base">refresh</span>
                      Regenerar
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4 py-20 text-center opacity-40">
                <span className="material-symbols-outlined text-6xl">auto_awesome</span>
                <p className="text-[10px] font-black uppercase tracking-widest">Selecciona un producto para generar contenido</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminMarketingPage;
