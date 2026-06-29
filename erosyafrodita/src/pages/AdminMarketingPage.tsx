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
  imagen?: string;
  imagen2?: string;
  imagen3?: string;
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

type EstadoPublicacion = 'idle' | 'publicando' | 'ok' | 'error';

const AdminMarketingPage: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loadingProductos, setLoadingProductos] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [contenidoIA, setContenidoIA] = useState<ContenidoIA | null>(null);
  const [generando, setGenerando] = useState(false);
  const [copiado, setCopiado] = useState<string | null>(null);

  // Instagram
  const [copySeleccionado, setCopySeleccionado] = useState<'copy_instagram_1' | 'copy_instagram_2' | 'copy_instagram_3'>('copy_instagram_1');
  const [imagenSeleccionada, setImagenSeleccionada] = useState<string>('');
  const [estadoPublicacion, setEstadoPublicacion] = useState<EstadoPublicacion>('idle');
  const [mensajePublicacion, setMensajePublicacion] = useState<string>('');
  const [urlPublicada, setUrlPublicada] = useState<string>('');

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const res = await fetch('/api/productos');
        if (res.ok) setProductos(await res.json());
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
    setEstadoPublicacion('idle');
    setUrlPublicada('');
    setImagenSeleccionada(producto.imagen || producto.imagen2 || '');
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
      setContenidoIA(await res.json());
    } catch (e) {
      setContenidoIA({ error: 'Error de conexión con el servidor' });
    } finally {
      setGenerando(false);
    }
  };

  const handlePublicarInstagram = async () => {
    if (!contenidoIA || !imagenSeleccionada) return;
    const caption = contenidoIA[copySeleccionado] || '';
    if (!caption) return;

    setEstadoPublicacion('publicando');
    setMensajePublicacion('');
    setUrlPublicada('');

    try {
      const res = await fetch('/api/admin/marketing/instagram/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imagenUrl: imagenSeleccionada,
          caption,
          hashtags: contenidoIA.hashtags || '',
        }),
      });
      const data = await res.json();
      if (data.success === 'true') {
        setEstadoPublicacion('ok');
        setMensajePublicacion('Post publicado en Instagram');
        setUrlPublicada(data.url || '');
      } else {
        setEstadoPublicacion('error');
        setMensajePublicacion(data.error || 'Error desconocido');
      }
    } catch (e) {
      setEstadoPublicacion('error');
      setMensajePublicacion('Error de red al publicar');
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

  const imagenesProducto = productoSeleccionado
    ? [productoSeleccionado.imagen, productoSeleccionado.imagen2, productoSeleccionado.imagen3].filter(Boolean) as string[]
    : [];

  return (
    <AdminLayout>
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div>
          <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">
            Motor <span className="text-primary not-italic">IA</span>
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.4em] mt-2">
            Gemini Pro — Generación y publicación automática
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda: selector de producto */}
          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 flex flex-col gap-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {productos.length} productos disponibles
            </p>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg">search</span>
              <input
                type="text"
                placeholder="Buscar producto..."
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
                    <div className="flex items-center gap-3">
                      {producto.imagen && (
                        <img src={producto.imagen} alt="" className="size-10 rounded-lg object-cover shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">{producto.nombre}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {producto.manufacturer || producto.marca || '—'} · {(producto.precioPVP || producto.precio || 0).toFixed ? (producto.precioPVP || producto.precio || 0).toFixed(2) : producto.precioPVP || producto.precio}€
                        </p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-slate-600 text-base ml-3 shrink-0">auto_awesome</span>
                  </button>
                ))}
                {productosFiltrados.length === 0 && (
                  <p className="text-center text-slate-600 text-sm py-10">No se encontraron productos</p>
                )}
              </div>
            )}
          </div>

          {/* Columna central: resultado IA */}
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
              contenidoIA.error ? (
                <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl">
                  <p className="text-sm text-red-400">{contenidoIA.error}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 overflow-y-auto max-h-[620px] pr-1 custom-scrollbar">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="size-2 rounded-full bg-primary animate-pulse" />
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest truncate">
                      {productoSeleccionado?.nombre}
                    </p>
                  </div>
                  <CopyField label="Título SEO" value={contenidoIA.titulo_seo} fieldKey="titulo_seo" />
                  <CopyField label="Meta Descripción" value={contenidoIA.descripcion_seo} fieldKey="desc_seo" />
                  <CopyField label="Descripción Producto" value={contenidoIA.descripcion_producto} fieldKey="desc_prod" />
                  <CopyField label="Instagram #1 (Corto)" value={contenidoIA.copy_instagram_1} fieldKey="ig1" />
                  <CopyField label="Instagram #2 (Storytelling)" value={contenidoIA.copy_instagram_2} fieldKey="ig2" />
                  <CopyField label="Instagram #3 (Oferta)" value={contenidoIA.copy_instagram_3} fieldKey="ig3" />
                  <CopyField label="Hashtags" value={contenidoIA.hashtags} fieldKey="hashtags" />
                  <button
                    onClick={() => productoSeleccionado && handleGenerar(productoSeleccionado)}
                    className="mt-1 h-11 w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">refresh</span>
                    Regenerar
                  </button>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4 py-20 text-center opacity-40">
                <span className="material-symbols-outlined text-6xl">auto_awesome</span>
                <p className="text-[10px] font-black uppercase tracking-widest">Selecciona un producto para generar contenido</p>
              </div>
            )}
          </div>

          {/* Columna derecha: publicar en Instagram */}
          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <svg viewBox="0 0 24 24" className="size-5 fill-pink-400" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Publicar en Instagram</p>
            </div>

            {contenidoIA && !contenidoIA.error ? (
              <>
                {/* Selector de imagen */}
                {imagenesProducto.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Imagen del post</p>
                    <div className="flex gap-2">
                      {imagenesProducto.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setImagenSeleccionada(img)}
                          className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                            imagenSeleccionada === img
                              ? 'border-pink-400 scale-105'
                              : 'border-white/10 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={img} alt={`imagen ${i + 1}`} className="size-16 object-cover" />
                          {imagenSeleccionada === img && (
                            <div className="absolute inset-0 bg-pink-400/20 flex items-center justify-center">
                              <span className="material-symbols-outlined text-pink-400 text-sm">check_circle</span>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preview del post */}
                {imagenSeleccionada && (
                  <div className="bg-black/30 rounded-2xl overflow-hidden border border-white/10">
                    <img
                      src={imagenSeleccionada}
                      alt="Preview"
                      className="w-full aspect-square object-cover"
                    />
                    <div className="p-4">
                      <p className="text-[10px] text-slate-300 leading-relaxed line-clamp-4">
                        {contenidoIA[copySeleccionado]}
                      </p>
                      <p className="text-[9px] text-pink-400/70 mt-2 line-clamp-2">{contenidoIA.hashtags}</p>
                    </div>
                  </div>
                )}

                {/* Selector de copy */}
                <div className="space-y-2">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Copy a publicar</p>
                  {(['copy_instagram_1', 'copy_instagram_2', 'copy_instagram_3'] as const).map((key, i) => (
                    <button
                      key={key}
                      onClick={() => setCopySeleccionado(key)}
                      className={`w-full text-left px-4 py-3 rounded-xl border text-[10px] transition-all ${
                        copySeleccionado === key
                          ? 'bg-pink-400/10 border-pink-400/30 text-white'
                          : 'bg-white/3 border-white/8 text-slate-400 hover:bg-white/8 hover:text-white'
                      }`}
                    >
                      <span className="font-black uppercase tracking-widest block mb-1">
                        {['Corto', 'Storytelling', 'Oferta'][i]}
                      </span>
                      <span className="line-clamp-2 leading-relaxed">{contenidoIA[key]}</span>
                    </button>
                  ))}
                </div>

                {/* Botón publicar */}
                <button
                  onClick={handlePublicarInstagram}
                  disabled={estadoPublicacion === 'publicando' || !imagenSeleccionada}
                  className="h-14 w-full rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-3
                    bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white hover:opacity-90 shadow-lg"
                >
                  {estadoPublicacion === 'publicando' ? (
                    <><div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Publicando...</>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" className="size-5 fill-white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                      Publicar en Instagram
                    </>
                  )}
                </button>

                {/* Estado publicación */}
                {estadoPublicacion === 'ok' && (
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-center">
                    <p className="text-sm font-black text-green-400">✅ {mensajePublicacion}</p>
                    {urlPublicada && (
                      <a href={urlPublicada} target="_blank" rel="noopener noreferrer"
                        className="text-[10px] text-green-400/70 underline mt-1 block"
                      >
                        Ver post en Instagram ↗
                      </a>
                    )}
                  </div>
                )}
                {estadoPublicacion === 'error' && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                    <p className="text-xs text-red-400">❌ {mensajePublicacion}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 gap-4 py-16 opacity-30 text-center">
                <svg viewBox="0 0 24 24" className="size-12 fill-white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                <p className="text-[10px] font-black uppercase tracking-widest">Genera contenido primero</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminMarketingPage;
