import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { getPedidoById, PedidoSalida, confirmarPago } from "../api/order";
import { useAlert } from "../context/AlertContext";
import { useCart } from "../context/CartContext";
import type { Producto } from "../api/products";

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pedido, setPedido] = useState<PedidoSalida | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [paying, setPaying] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const { showAlert, showConfirm } = useAlert();
  const { addItem } = useCart();

  useEffect(() => {
    if (!id) return;

    const fetchPedido = async () => {
      try {
        setLoading(true);
        const data = await getPedidoById(Number(id));
        setPedido(data);

        // PLAN B: Si el pedido está pendiente pero tenemos paymentId, intentamos confirmar
        if (data.estado === "PENDIENTE_DE_PAGO" || data.estado === "PENDIENTE") {
          if (data.paymentId) {
            try {
              await confirmarPago(data.paymentId);
              // Si tiene éxito, recargamos el estado
              const updated = await getPedidoById(Number(id));
              setPedido(updated);
            } catch (e) {
              console.log("Aún no se ha detectado el pago.");
            }
          }
        }
      } catch (err: any) {
        setError(err.message ?? "No se pudo cargar el pedido.");
      } finally {
        setLoading(false);
      }
    };

    fetchPedido();
  }, [id]);

  const handleCancelar = async () => {
    if (!pedido) return;

    showConfirm(
      "¿Anular pedido?",
      "¿Estás seguro de que deseas anular este pedido? Esta acción no se puede deshacer. El dinero se le devolverá en un plazo de 2-4 días.",
      async () => {
        try {
          setCancelling(true);
          const { cancelarPedido } = await import("../api/order");
          await cancelarPedido(pedido.idPedido);
          const data = await getPedidoById(Number(id));
          setPedido(data);
          showAlert("Pedido Anulado", "El pedido ha sido anulado correctamente.", "success");
        } catch (err: any) {
          showAlert("Error", "No se pudo anular el pedido: " + (err.message || "error desconocido"), "error");
        } finally {
          setCancelling(false);
        }
      },
      "warning",
      "Anular ahora"
    );
  };

  const handleRePay = async () => {
    if (!pedido) return;
    try {
      setPaying(true);
      const { iniciarPagoRevolut } = await import("../api/order");
      const paymentInfo = await iniciarPagoRevolut(pedido.idPedido);
      if (paymentInfo && paymentInfo.paymentUrl) {
        window.location.href = paymentInfo.paymentUrl;
      } else {
        showAlert("Error", "No se recibió respuesta válida de la pasarela de pago.", "error");
      }
    } catch (err: any) {
      showAlert("Error", "No se ha podido conectar con la pasarela de pago para este pedido.", "error");
    } finally {
      setPaying(false);
    }
  };

  const handleReOrderAll = () => {
    if (!pedido) return;
    pedido.productos.forEach(prod => {
      addItem({
        id: prod.idProducto,
        nombre: prod.nombreProducto,
        imagen: prod.imagen || "",
        precio: prod.precioUnitario,
        precioPVP: prod.precioUnitario,
        stock: 99,
        ean: prod.ean || "",
        categoria: "",
        manufacturer: ""
      } as any as Producto, prod.cantidad, false);
    });
    showAlert("Ritual Reinvocado", "Hemos añadido los artículos de este ritual a tu bolsa divina.", "success");
    navigate("/cart");
  };

  if (loading) {
    return (
      <div className="bg-background-dark min-h-screen flex items-center justify-center text-white">
        Cargando pedido...
      </div>
    );
  }

  if (error || !pedido) {
    return (
      <div className="bg-background-dark min-h-screen flex flex-col items-center justify-center text-white">
        <p className="mb-4">{error ?? "Pedido no encontrado."}</p>
        <Link
          to="/profile?tab=pedidos"
          className="px-6 py-3 rounded-full bg-primary text-black font-bold hover:bg-white transition-colors"
        >
          Volver a mis pedidos
        </Link>
      </div>
    );
  }

  const fechaStr = pedido.fechaCreacion.endsWith('Z') ? pedido.fechaCreacion : `${pedido.fechaCreacion}Z`;
  const fecha = new Date(fechaStr).toLocaleString();
  const numArticulos = pedido.productos.reduce(
    (acc, p) => acc + p.cantidad,
    0
  );

  return (
    <div className="bg-background-dark font-display min-h-screen flex flex-col">
      <Header />

      {/* Main Content */}
      <div className="flex-1 flex justify-center py-10 px-4 md:px-8">
        <div className="w-full max-w-[1024px] flex flex-col gap-8">
          {/* Page Heading & Actions */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <h1 className="text-white text-3xl md:text-4xl font-black tracking-tight">
                  Pedido #{pedido.idPedido}
                </h1>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${pedido.estado === 'ENTREGADO'
                    ? 'bg-green-500/20 text-green-500 border-green-500/30'
                    : pedido.estado === 'CANCELADO'
                      ? 'bg-red-400/20 text-red-400 border-red-400/30'
                      : 'bg-amber-500/20 text-amber-500 border-amber-500/30'
                  }`}>
                  {pedido.estado}
                </span>
              </div>
              <p className="text-[#cbbc90] text-base">
                Realizado el {fecha}
              </p>
            </div>
            <div className="flex gap-3">
              {(pedido.estado === "PENDIENTE" || pedido.estado === "PENDIENTE_DE_PAGO") && (
                <button
                  onClick={handleRePay}
                  disabled={paying}
                  className="group flex items-center justify-center gap-2 h-10 px-5 rounded-full border border-primary/30 text-primary hover:text-background-dark hover:bg-primary transition-all text-sm font-bold bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className={`material-symbols-outlined text-[18px] ${paying ? 'animate-spin' : ''}`}>
                    {paying ? 'sync' : 'credit_card'}
                  </span>
                  <span>{paying ? "Conectando..." : "Efectuar Pago"}</span>
                </button>
              )}
              {(pedido.estado === "PAGADO") && (
                <button
                  onClick={handleCancelar}
                  disabled={cancelling}
                  className="group flex items-center justify-center gap-2 h-10 px-5 rounded-full border border-red-500/30 text-red-400 hover:text-white hover:bg-red-500 hover:border-red-500 transition-all text-sm font-bold bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    cancel
                  </span>
                  <span>{cancelling ? "Anulando..." : "Anular Pedido"}</span>
                </button>
              )}
              <button onClick={() => setShowInvoiceModal(true)} className="group flex items-center justify-center gap-2 h-10 px-5 rounded-full border border-[#493f22] text-[#cbbc90] hover:text-white hover:border-white transition-all text-sm font-bold bg-transparent">
                <span className="material-symbols-outlined text-[18px]">
                  print
                </span>
                <span>Factura</span>
              </button>
              <button className="group flex items-center justify-center gap-2 h-10 px-5 rounded-full border border-[#493f22] text-[#cbbc90] hover:text-white hover:border-white transition-all text-sm font-bold bg-transparent">
                <span className="material-symbols-outlined text-[18px]">
                  support_agent
                </span>
                <span>Soporte</span>
              </button>
            </div>
          </div>

          {/* Order Status Steps (Dinámico y Sincronizado) */}
          <div className="w-full bg-[#1a170d] rounded-2xl p-8 md:p-12 border border-[#493f22]/30 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

            <div className="flex flex-col md:flex-row justify-between w-full relative">
              {/* Barra de progreso de fondo */}
              <div className="hidden md:block absolute top-[16px] left-[40px] right-[40px] h-[3px] bg-white/5 z-0 rounded-full">
                <div
                  className="h-full bg-primary shadow-[0_0_15px_rgba(242,185,13,0.3)] transition-all duration-1000 ease-out"
                  style={{
                    width: `${pedido.estado === 'ENTREGADO' ? '100%' :
                        pedido.estado === 'ENVIADO' ? '100%' :
                          pedido.estado === 'RECIBIDO' ? '66%' :
                            pedido.estado === 'PAGADO' ? '33%' : '0%'
                      }`
                  }}
                />
              </div>

              {/* Paso 1: Confirmado (Estado: PAGADO+) */}
              <div className="relative z-10 flex flex-row md:flex-col items-center gap-4 md:gap-3 mb-6 md:mb-0 text-white">
                <div className={`size-8 rounded-full flex items-center justify-center transition-all duration-500 ${['PAGADO', 'RECIBIDO', 'ENVIADO', 'ENTREGADO'].includes(pedido.estado)
                    ? 'bg-primary text-background-dark shadow-[0_0_20px_rgba(242,185,13,0.4)] scale-110'
                    : 'bg-white/5 text-white/20 border border-white/5'
                  }`}>
                  <span className="material-symbols-outlined text-sm font-black">
                    {['PAGADO', 'RECIBIDO', 'ENVIADO', 'ENTREGADO'].includes(pedido.estado) ? 'check' : 'pending'}
                  </span>
                </div>
                <div className="text-left md:text-center">
                  <p className={`text-xs md:text-sm font-black uppercase tracking-widest ${['PAGADO', 'RECIBIDO', 'ENVIADO', 'ENTREGADO'].includes(pedido.estado) ? 'text-primary' : 'text-white/20'
                    }`}>Confirmado</p>
                  <p className="text-[10px] text-white/30 hidden md:block">Pedido Recibido</p>
                </div>
              </div>

              {/* Paso 2: Preparando (Estado: RECIBIDO+) */}
              <div className="relative z-10 flex flex-row md:flex-col items-center gap-4 md:gap-3 mb-6 md:mb-0 text-white">
                <div className={`size-8 rounded-full flex items-center justify-center transition-all duration-500 ${['RECIBIDO', 'ENVIADO', 'ENTREGADO'].includes(pedido.estado)
                    ? 'bg-primary text-background-dark shadow-[0_0_20px_rgba(242,185,13,0.4)] scale-110'
                    : pedido.estado === 'PAGADO'
                      ? 'bg-white/5 text-primary border border-primary/30 animate-pulse'
                      : 'bg-white/5 text-white/20 border border-white/5'
                  }`}>
                  <span className="material-symbols-outlined text-sm font-black">
                    {['RECIBIDO', 'ENVIADO', 'ENTREGADO'].includes(pedido.estado) ? 'check' : 'inventory_2'}
                  </span>
                </div>
                <div className="text-left md:text-center">
                  <p className={`text-xs md:text-sm font-black uppercase tracking-widest ${['RECIBIDO', 'ENVIADO', 'ENTREGADO'].includes(pedido.estado) ? 'text-primary' : 'text-white/20'
                    }`}>Preparando</p>
                  <p className="text-[10px] text-white/30 hidden md:block">En Almacén</p>
                </div>
              </div>

              {/* Paso 3: En Camino (Estado: ENVIADO+) */}
              <div className="relative z-10 flex flex-row md:flex-col items-center gap-4 md:gap-3 mb-6 md:mb-0 text-white">
                <div className={`size-8 rounded-full flex items-center justify-center transition-all duration-500 ${['ENVIADO', 'ENTREGADO'].includes(pedido.estado)
                    ? 'bg-primary text-background-dark shadow-[0_0_20px_rgba(242,185,13,0.4)] scale-110'
                    : pedido.estado === 'RECIBIDO'
                      ? 'bg-white/5 text-primary border border-primary/30 animate-pulse'
                      : 'bg-white/5 text-white/20 border border-white/5'
                  }`}>
                  <span className="material-symbols-outlined text-sm font-black">
                    {['ENTREGADO'].includes(pedido.estado) ? 'check' : 'local_shipping'}
                  </span>
                </div>
                <div className="text-left md:text-center">
                  <p className={`text-xs md:text-sm font-black uppercase tracking-widest ${['ENVIADO', 'ENTREGADO'].includes(pedido.estado) ? 'text-primary' : 'text-white/20'
                    }`}>En Camino</p>
                  <p className="text-[10px] text-white/30 hidden md:block">Transporte Activo</p>
                </div>
              </div>

              {/* Paso 4: Entregado (Estado: ENTREGADO) */}
              <div className="relative z-10 flex flex-row md:flex-col items-center gap-4 md:gap-3 text-white">
                <div className={`size-8 rounded-full flex items-center justify-center transition-all duration-500 ${pedido.estado === 'ENTREGADO'
                    ? 'bg-green-500 text-charcoal shadow-[0_0_20px_rgba(34,197,94,0.4)] scale-110'
                    : pedido.estado === 'ENVIADO'
                      ? 'bg-white/5 text-primary border border-primary/30 animate-pulse'
                      : 'bg-white/5 text-white/20 border border-white/5'
                  }`}>
                  <span className="material-symbols-outlined text-sm font-black">
                    {pedido.estado === 'ENTREGADO' ? 'done_all' : 'package_2'}
                  </span>
                </div>
                <div className="text-left md:text-center">
                  <p className={`text-xs md:text-sm font-black uppercase tracking-widest ${pedido.estado === 'ENTREGADO' ? 'text-green-500' : 'text-white/20'
                    }`}>Entregado</p>
                  <p className="text-[10px] text-white/30 hidden md:block">Finalizado</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Column: Items */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <h3 className="text-white text-xl font-bold">
                Artículos ({numArticulos})
              </h3>

              {pedido.productos.map((prod) => (
                <div
                  key={prod.idProducto + (prod.sku ?? '')}
                  className="flex flex-col sm:flex-row gap-4 bg-[#2d281a] p-4 rounded-xl border border-[#493f22]/30 hover:border-primary/30 transition-colors group"
                >
                  {prod.imagen && (
                    <img
                      src={prod.imagen}
                      alt={prod.nombreProducto}
                      className="rounded-lg size-24 sm:size-28 shrink-0 border border-[#493f22] object-cover"
                    />
                  )}
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="text-white text-lg font-bold leading-tight group-hover:text-primary transition-colors">
                          {prod.nombreProducto}
                        </h4>
                        <p className="text-white text-lg font-bold">
                          {prod.precioTotalLinea.toFixed(2)} €
                        </p>
                      </div>
                      <p className="text-[#cbbc90] text-sm mt-1">
                        SKU: {prod.sku ?? "-"}
                      </p>
                      <p className="text-[#cbbc90] text-sm">
                        Cantidad: {prod.cantidad}{" "}
                        <span className="text-xs opacity-60">
                          ({prod.precioUnitario.toFixed(2)} €/u)
                        </span>
                      </p>

                      {/* Dirección Integrada */}
                      <div className="mt-6 pt-4 border-t border-white/5">
                        <p className="text-primary/40 text-[10px] uppercase font-black tracking-widest mb-2">Destino del Ritual</p>
                        <p className="text-gray-400 text-sm font-medium leading-relaxed italic">
                          {pedido.nombre} {pedido.apellidos}<br />
                          {pedido.calle}<br />
                          {pedido.codigoPostal} {pedido.ciudad} ({pedido.provincia})
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end mt-4 sm:mt-0">
                      <button className="flex items-center gap-2 text-sm font-medium text-white hover:text-primary transition-colors px-3 py-1.5 rounded-full hover:bg-[#493f22]">
                        <span className="material-symbols-outlined text-[18px]">
                          rate_review
                        </span>
                        Escribir reseña
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="mt-4 flex justify-end">
                <button 
                  onClick={handleReOrderAll}
                  className="flex w-full sm:w-auto cursor-pointer items-center justify-center rounded-full h-12 px-8 bg-primary hover:bg-[#d9a50b] text-[#221e10] text-base font-bold tracking-wide transition-all shadow-[0_0_20px_rgba(242,185,13,0.3)] hover:shadow-[0_0_30px_rgba(242,185,13,0.5)]"
                >
                  <span className="material-symbols-outlined mr-2">
                    replay
                  </span>
                  Volver a pedir todo
                </button>
              </div>
            </div>

            {/* Sidebar: Resumen + info */}
            <div className="flex flex-col gap-6">
              {/* Resumen */}
              <div className="bg-[#2d281a] rounded-xl p-6 border border-[#493f22]/50">
                <h3 className="text-white text-lg font-bold mb-4">
                  Resumen
                </h3>

                {/* Miniaturas de productos */}
                {pedido.productos && pedido.productos.length > 0 && (
                  <div className="flex -space-x-2 mb-4">
                    {pedido.productos.slice(0, 5).map((prod, idx) =>
                      prod.imagen ? (
                        <img
                          key={idx}
                          src={prod.imagen}
                          alt={prod.nombreProducto}
                          className="w-8 h-8 rounded-lg border border-[#493f22] object-cover bg-background-dark"
                        />
                      ) : (
                        <div
                          key={idx}
                          className="w-8 h-8 rounded-lg border border-[#493f22] bg-background-dark flex items-center justify-center text-[10px] text-gray-400"
                        >
                          {prod.cantidad}
                        </div>
                      )
                    )}
                    {pedido.productos.length > 5 && (
                      <div className="w-8 h-8 rounded-lg border border-[#493f22] bg-background-dark flex items-center justify-center text-[10px] text-gray-400">
                        +{pedido.productos.length - 5}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-3 pb-4 border-b border-[#493f22]">
                  <div className="flex justify-between text-[#cbbc90] text-sm">
                    <span>Subtotal</span>
                    <span>{pedido.total.toFixed(2)} €</span>
                  </div>
                </div>
                <div className="flex justify-between pt-4 items-end">
                  <span className="text-white text-base font-bold">
                    Total
                  </span>
                  <span className="text-primary text-2xl font-black">
                    {pedido.total.toFixed(2)} €
                  </span>
                </div>
              </div>


            </div>
          </div>

          <div className="mt-4">
            <Link
              to="/profile?tab=pedidos"
              className="text-sm text-primary font-bold hover:underline"
            >
              Volver a mis pedidos
            </Link>
          </div>
        </div>
      </div>

      {/* Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 animate-fadeIn">
          <div className="bg-surface-dark border border-border-gold rounded-2xl p-8 max-w-sm w-full shadow-2xl relative">
            <button
              onClick={() => setShowInvoiceModal(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="flex flex-col items-center text-center gap-4">
              <span className="material-symbols-outlined text-primary text-5xl">description</span>
              <h3 className="text-white text-xl font-bold">Solicitar Factura</h3>
              <p className="text-sm text-yellow-300/80 mb-2">
                Si desea que le emitamos una factura oficial de compra, por favor póngase en contacto con nosotros a través de WhatsApp o mediante nuestra página de Contacto, indicando el número de pedido: <strong className="text-white">#{pedido.idPedido}</strong>.
              </p>
              <div className="flex gap-4 w-full mt-2">
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="flex-1 py-3 rounded-xl border border-white/20 text-[#cbbc90] font-bold hover:bg-white/5 transition-colors text-sm"
                >
                  Cerrar
                </button>
                <Link
                  to="/contacto"
                  className="flex-1 py-3 rounded-xl bg-primary text-background-dark font-black uppercase text-xs tracking-widest flex items-center justify-center hover:bg-yellow-400 transition-all shadow-xl shadow-primary/20"
                >
                  Contacto
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default OrderDetailPage;
