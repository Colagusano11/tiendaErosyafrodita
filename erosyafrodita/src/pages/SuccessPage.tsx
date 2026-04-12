import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { getPedidoById, PedidoSalida, confirmarPago } from "../api/order";

interface LocationState {
  pedidoId?: number;
  total?: number;
}

const SuccessPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state || {}) as LocationState;

  const [pedido, setPedido] = useState<PedidoSalida | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extraer parámetros de búsqueda (para redirecciones externas)
  const searchParams = new URLSearchParams(location.search);
  const queryPedidoId = searchParams.get("pedidoId");

  const finalPedidoId = state.pedidoId || (queryPedidoId ? parseInt(queryPedidoId) : null);

  useEffect(() => {
    if (!finalPedidoId) return;

    const procesarExito = async () => {
      try {
        setLoading(true);
        
        // 1. Cargamos el pedido
        const data = await getPedidoById(finalPedidoId);
        setPedido(data);

        // 2. Si el pedido sigue "Pendiente de pago", intentamos confirmarlo ahora
        if (data.estado === "PENDIENTE_DE_PAGO" || data.estado === "PENDIENTE") {
          if (data.paymentId) {
            try {
              await confirmarPago(data.paymentId);
              // Recargamos para ver el estado actualizado (Pagado)
              const updated = await getPedidoById(finalPedidoId);
              setPedido(updated);
            } catch (e) {
              console.error("Error confirmando pago", e);
            }
          }
        }
      } catch (err: any) {
        setError(err.message ?? "No se pudo cargar el pedido.");
      } finally {
        setLoading(false);
      }
    };

    procesarExito();
  }, [finalPedidoId]);

  const totalMostrar = state.total ?? (pedido ? pedido.total : 0);

  return (
    <div className="bg-background-dark font-display text-white antialiased min-h-screen flex flex-col selection:bg-primary/30">
      <Header />

      <main className="flex-grow flex justify-center py-12 md:py-20 px-4">
        <div className="w-full max-w-[900px] flex flex-col gap-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          
          {/* Hero Success Section */}
          <div className="text-center flex flex-col items-center gap-8">
            <div className="relative">
              <div className="absolute inset-0 bg-primary blur-[40px] opacity-20 animate-pulse"></div>
              <div className="relative size-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/30 shadow-2xl">
                <span className="material-symbols-outlined text-primary text-6xl">
                  check_circle
                </span>
              </div>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white">
                Pedido <span className="text-primary italic">Confirmado</span>
              </h1>
              <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
                Gracias por confiar en <span className="text-white font-bold">Erosyafrodita</span>. 
                {finalPedidoId && (
                  <> Tu orden <span className="text-primary font-black">#{finalPedidoId}</span> ha sido procesada con éxito.</>
                )}
              </p>
            </div>
          </div>

          {/* Loader / Error */}
          {loading && (
            <div className="flex justify-center py-10">
              <div className="size-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
          )}
          
          {error && !loading && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center text-red-400 text-sm">
              <span className="material-symbols-outlined mb-2">error</span>
              <p>{error}</p>
            </div>
          )}

          {/* Main Receipt Card */}
          {!loading && (
            <div className="bg-surface-dark rounded-[2.5rem] overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] border border-white/5 relative group">
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -mr-48 -mt-48 transition-colors group-hover:bg-primary/10"></div>
              
              {/* Receipt Header */}
              <div className="bg-gradient-to-r from-surface-dark to-charcoal px-8 py-6 border-b border-white/5 flex justify-between items-center relative z-10">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">shopping_bag</span>
                  <h3 className="text-white font-black uppercase tracking-widest text-sm">
                    Resumen de Operación
                  </h3>
                </div>
                {pedido && (
                  <span className="text-[10px] font-black text-primary bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20 tracking-[0.2em] uppercase">
                    {pedido.estado}
                  </span>
                )}
              </div>

              <div className="p-8 md:p-12 space-y-12 relative z-10">
                {/* Product List */}
                {pedido && pedido.productos && pedido.productos.length > 0 ? (
                  <div className="space-y-8">
                    {pedido.productos.map((prod, idx) => (
                      <div key={idx} className="flex items-center gap-6 group/item">
                        <div className="size-20 md:size-24 shrink-0 rounded-2xl overflow-hidden bg-background-dark border border-white/5 p-2 transition-all group-hover/item:border-primary/30 flex items-center justify-center">
                          {prod.imagen ? (
                            <img src={prod.imagen} alt={prod.nombreProducto} className="max-w-full max-h-full object-contain" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-white/5 uppercase text-[10px] font-bold text-gray-600">No Img</div>
                          )}
                        </div>
                        <div className="flex-grow">
                          <h4 className="text-white font-bold text-lg md:text-xl tracking-tight leading-tight group-hover/item:text-primary transition-colors">
                            {prod.nombreProducto}
                          </h4>
                          <p className="text-gray-500 text-xs mt-2 uppercase tracking-widest font-bold">
                            SKU: {prod.sku ?? "---"} <span className="mx-2 opacity-30">|</span> Cant: {prod.cantidad}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-black text-lg">
                            {prod.precioTotalLinea.toFixed(2)}<span className="text-primary text-xs ml-1">€</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center border-2 border-dashed border-white/5 rounded-3xl">
                    <p className="text-gray-500 font-light">Cargando detalles de los artículos...</p>
                  </div>
                )}
                <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent w-full" />

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary">
                      <span className="material-symbols-outlined text-sm">local_shipping</span>
                      <h5 className="text-[10px] font-black uppercase tracking-[0.2em]">Envío de Lujo</h5>
                    </div>
                    <p className="text-gray-400 text-sm font-light leading-relaxed">
                      Tu selección está siendo preparada en nuestro taller central. Recibirás un enlace de seguimiento en tiempo real en breve.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary">
                      <span className="material-symbols-outlined text-sm">verified_user</span>
                      <h5 className="text-[10px] font-black uppercase tracking-[0.2em]">Pago Seguro</h5>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-background-dark border border-white/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-white/40 text-sm">credit_card</span>
                      </div>
                      <span className="text-white text-sm font-bold tracking-tight">Transacción Finalizada</span>
                    </div>
                  </div>
                </div>

                {/* Totals Section */}
                <div className="bg-background-dark/50 rounded-[2rem] p-8 border border-white/5 space-y-4 shadow-inner">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                    <span className="text-gray-500">Valor de la Colección</span>
                    <span className="text-white">{totalMostrar.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                    <span className="text-gray-500">Servicio de Entrega</span>
                    <span className="text-primary">Premium Gratis</span>
                  </div>
                  <div className="h-px bg-white/5 my-2" />
                  <div className="flex justify-between items-baseline pt-2">
                    <span className="text-xl font-black text-white uppercase tracking-tighter">Importe total</span>
                    <span className="text-4xl font-black text-primary shadow-primary/20 drop-shadow-xl">
                      {totalMostrar.toFixed(2)}<span className="text-xl ml-1">€</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Luxury Action Bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
            <button
              onClick={() => navigate("/profile?tab=pedidos")}
              className="w-full sm:w-auto px-10 h-14 rounded-full border border-white/10 bg-surface-dark text-white font-bold text-xs tracking-widest uppercase hover:bg-white hover:text-background-dark transition-all flex items-center justify-center gap-3"
            >
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
              Mis Pedidos
            </button>

            <button
              onClick={() => navigate("/")}
              className="w-full sm:w-auto px-12 h-14 rounded-full bg-primary text-background-dark font-black text-xs tracking-widest uppercase hover:bg-yellow-400 hover:shadow-[0_0_30px_rgba(242,185,13,0.3)] transition-all flex items-center justify-center gap-3 group"
            >
              Ir a la tienda
              <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                arrow_right_alt
              </span>
            </button>
          </div>

          <p className="text-center text-gray-500 text-xs font-medium tracking-widest uppercase">
            Experiencia gestionada por Erosyafrodita Concierge
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SuccessPage;
