import React, { useEffect, useState } from "react";
import { getAllPedidos, PedidoSalida, deletePedidoCompleto } from "../api/order";
import { useAlert } from "../context/AlertContext";
import AdminLayout from "../components/AdminLayout";

const AdminOrdersPage: React.FC = () => {
    const [pedidos, setPedidos] = useState<PedidoSalida[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPedido, setSelectedPedido] = useState<PedidoSalida | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const { showAlert } = useAlert();

    const fetchAll = async () => {
        try {
            setLoading(true);
            const data = await getAllPedidos();
            setPedidos(data);
        } catch (error) {
            showAlert("Error", "No se pudieron cargar los pedidos", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, []);

    const getInitials = (nombre: string, apellidos: string) =>
        `${nombre.charAt(0)}${apellidos ? apellidos.charAt(0) : ""}`.toUpperCase();

    const formatStatusLabel = (estado: string) => {
        switch (estado) {
            case "PENDIENTE":            return "Pendiente";
            case "PENDIENTE_DE_PAGO":    return "Espera Pago";
            case "PAGADO":               return "Confirmado";
            case "RECIBIDO":             return "Preparando";
            case "ENVIADO":              return "En Camino";
            case "ENTREGADO":            return "Entregado";
            case "CANCELADO":            return "Cancelado";
            case "DEVOLUCION_SOLICITADA":return "Dev. Solicitada";
            case "DEVUELTO":             return "Devuelto";
            default:                     return estado;
        }
    };

    const getStatusColor = (estado: string) => {
        switch (estado) {
            case "PAGADO":               return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
            case "RECIBIDO":             return "bg-orange-500/10 text-orange-400 border-orange-500/20";
            case "ENVIADO":              return "bg-blue-500/10 text-blue-500 border-blue-500/20";
            case "ENTREGADO":            return "bg-green-500/10 text-green-500 border-green-500/20";
            case "CANCELADO":            return "bg-red-500/10 text-red-500 border-red-500/20";
            case "PENDIENTE_DE_PAGO":    return "bg-amber-500/10 text-amber-500 border-amber-500/20";
            default:                     return "bg-slate-500/10 text-slate-400 border-white/10";
        }
    };

    const handleDeletePedido = async (id: number) => {
        if (!window.confirm(
            `⚠️ ¿Eliminar el pedido #${id} completamente?\n\nEsta acción NO se puede deshacer.`
        )) return;
        try {
            await deletePedidoCompleto(id);
            showAlert("Eliminado", `Pedido #${id} borrado del sistema.`, "success");
            fetchAll();
        } catch {
            showAlert("Error", "No se pudo eliminar el pedido.", "error");
        }
    };

    return (
        <AdminLayout>
            <div className="flex flex-col gap-8">

                {/* ── Header ── */}
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">
                            Gestión de <span className="text-primary not-italic">Pedidos</span>
                        </h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.4em] mt-1">
                            Los pedidos se gestionan desde SellerKing · aquí sólo lectura
                        </p>
                    </div>
                    <button
                        onClick={fetchAll}
                        className="h-12 px-6 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/10 transition-all flex items-center gap-3 text-[10px] font-black uppercase tracking-widest"
                    >
                        <span className="material-symbols-outlined text-lg">refresh</span>
                        Actualizar
                    </button>
                </div>

                {/* ── Table ── */}
                {loading ? (
                    <div className="h-64 flex items-center justify-center">
                        <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="glass-panel rounded-[2.5rem] overflow-hidden border border-white/10 bg-white/5 shadow-2xl">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 border-b border-white/10">
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID / Fecha</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente / Envío</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Productos</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Total</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Tracking</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {pedidos.map((pedido) => {
                                    const hasTracking = !!pedido.numSeguimiento;
                                    return (
                                        <tr key={pedido.idPedido} className="hover:bg-white/2 transition-colors group">

                                            {/* ID / Fecha */}
                                            <td className="p-6">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs font-black text-white italic">#{pedido.idPedido}</span>
                                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                                                        {new Date(pedido.fechaCreacion + (pedido.fechaCreacion.endsWith("Z") ? "" : "Z")).toLocaleString()}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Cliente */}
                                            <td className="p-6">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className="size-6 rounded-lg bg-primary/20 text-primary flex items-center justify-center text-[10px] font-black">
                                                            {getInitials(pedido.nombre || "U", pedido.apellidos || "E")}
                                                        </div>
                                                        <p className="text-[11px] font-black text-white uppercase truncate max-w-[150px]">
                                                            {pedido.nombre} {pedido.apellidos}
                                                        </p>
                                                    </div>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase italic truncate max-w-[180px]">{pedido.calle}</p>
                                                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{pedido.codigoPostal} {pedido.ciudad}</p>
                                                </div>
                                            </td>

                                            {/* Productos (thumbs) */}
                                            <td className="p-6">
                                                <div className="flex -space-x-4 overflow-hidden">
                                                    {pedido.productos.slice(0, 3).map((p, i) => (
                                                        <div key={i} className="size-10 rounded-xl border-2 border-charcoal bg-white/5 overflow-hidden flex-shrink-0 hover:z-10 hover:scale-110 transition-all">
                                                            <img src={p.imagen || ""} alt={p.nombreProducto} className="w-full h-full object-cover" />
                                                        </div>
                                                    ))}
                                                    {pedido.productos.length > 3 && (
                                                        <div className="size-10 rounded-xl border-2 border-charcoal bg-white/10 flex items-center justify-center text-[10px] font-black text-white">
                                                            +{pedido.productos.length - 3}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Total */}
                                            <td className="p-6 text-center">
                                                <span className="text-base font-black text-emerald-400 italic">{pedido.total.toFixed(2)}€</span>
                                            </td>

                                            {/* Estado — badge sólo lectura */}
                                            <td className="p-6 text-center">
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColor(pedido.estado)}`}>
                                                    {formatStatusLabel(pedido.estado)}
                                                </span>
                                            </td>

                                            {/* Tracking — ghost si no hay, sólido si lo hay */}
                                            <td className="p-6 text-center">
                                                {hasTracking ? (
                                                    <a
                                                        href={pedido.urlSeguimiento || "#"}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500/15 hover:bg-teal-500 text-teal-400 hover:text-white border border-teal-500/30 transition-all text-[9px] font-black uppercase tracking-widest shadow-lg shadow-teal-500/10"
                                                        title={pedido.numSeguimiento ?? ""}
                                                    >
                                                        <span className="material-symbols-outlined text-sm">local_shipping</span>
                                                        {pedido.numSeguimiento}
                                                    </a>
                                                ) : (
                                                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-white/10 text-white/20 text-[9px] font-black uppercase tracking-widest cursor-default select-none">
                                                        <span className="material-symbols-outlined text-sm">local_shipping</span>
                                                        Sin tracking
                                                    </span>
                                                )}
                                            </td>

                                            {/* Acciones */}
                                            <td className="p-6 text-center">
                                                <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => { setSelectedPedido(pedido); setIsDetailModalOpen(true); }}
                                                        className="size-10 rounded-xl bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center"
                                                        title="Ver Detalles"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">visibility</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeletePedido(pedido.idPedido)}
                                                        className="size-10 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                                                        title="Eliminar Pedido"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">delete_forever</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {pedidos.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="p-20 text-center">
                                            <div className="flex flex-col items-center gap-4 opacity-30">
                                                <span className="material-symbols-outlined text-6xl">inventory_2</span>
                                                <p className="text-[10px] font-black uppercase tracking-[0.4em]">No hay pedidos en el sistema</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── MODAL DETALLE ── */}
            {isDetailModalOpen && selectedPedido && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-background-dark/90 backdrop-blur-2xl">
                    <div className="w-full max-w-6xl bg-charcoal border-2 border-white/5 rounded-[3.5rem] overflow-hidden shadow-2xl animate-fade-in-up flex flex-col max-h-[95vh]">

                        {/* Cabecera */}
                        <div className="p-8 border-b border-white/10 bg-white/5 flex justify-between items-center">
                            <div className="flex items-center gap-6">
                                <div className="size-16 rounded-[2rem] bg-primary/20 flex items-center justify-center text-primary shadow-lg shadow-primary/10">
                                    <span className="material-symbols-outlined text-3xl">receipt_long</span>
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">
                                            Detalle <span className="text-primary not-italic">#{selectedPedido.idPedido}</span>
                                        </h3>
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColor(selectedPedido.estado)}`}>
                                            {formatStatusLabel(selectedPedido.estado)}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em] mt-1">
                                        Generado el {new Date(selectedPedido.fechaCreacion + (selectedPedido.fechaCreacion.endsWith("Z") ? "" : "Z")).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsDetailModalOpen(false)}
                                className="size-12 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400 transition-all hover:rotate-90"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Cuerpo */}
                        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                            <div className="grid grid-cols-3 gap-10">

                                {/* Columna Izquierda */}
                                <div className="col-span-1 space-y-8">
                                    {/* Cliente */}
                                    <div className="p-8 bg-white/5 border border-white/10 rounded-[3rem] space-y-6">
                                        <div className="flex items-center gap-3 text-primary">
                                            <span className="material-symbols-outlined text-lg">person_pin</span>
                                            <h4 className="text-[10px] font-black uppercase tracking-widest">Información del Cliente</h4>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Nombre Completo</p>
                                                <p className="text-[13px] font-black text-white uppercase italic">{selectedPedido.nombre} {selectedPedido.apellidos}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Teléfono</p>
                                                <div className="flex items-center gap-2 text-white">
                                                    <span className="material-symbols-outlined text-xs text-primary">phone_iphone</span>
                                                    <p className="text-[12px] font-black">{selectedPedido.telefono || "No proporcionado"}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">País</p>
                                                <div className="flex items-center gap-2 text-white">
                                                    <span className="material-symbols-outlined text-xs text-primary">public</span>
                                                    <p className="text-[12px] font-black uppercase">{selectedPedido.pais || "ES"}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dirección */}
                                    <div className="p-8 bg-black/20 border border-white/5 rounded-[3rem] space-y-6">
                                        <div className="flex items-center gap-3 text-blue-400">
                                            <span className="material-symbols-outlined text-lg">home_pin</span>
                                            <h4 className="text-[10px] font-black uppercase tracking-widest">Punto de Entrega</h4>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Dirección</p>
                                                <p className="text-[12px] font-black text-white uppercase leading-relaxed italic">{selectedPedido.calle}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">C. Postal</p>
                                                    <p className="text-[12px] font-black text-white">{selectedPedido.codigoPostal}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Ciudad</p>
                                                    <p className="text-[12px] font-black text-white uppercase">{selectedPedido.ciudad}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Provincia</p>
                                                <p className="text-[12px] font-black text-white uppercase">{selectedPedido.provincia}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tracking */}
                                    <div className="p-8 bg-white/5 border border-white/10 rounded-[3rem] space-y-4">
                                        <div className="flex items-center gap-3 text-teal-400">
                                            <span className="material-symbols-outlined text-lg">local_shipping</span>
                                            <h4 className="text-[10px] font-black uppercase tracking-widest">Tracking</h4>
                                        </div>
                                        {selectedPedido.numSeguimiento ? (
                                            <a
                                                href={selectedPedido.urlSeguimiento || "#"}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center justify-between bg-teal-500/10 p-4 rounded-2xl border border-teal-500/20 group/link hover:bg-teal-500/20 transition-all"
                                            >
                                                <div>
                                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Número de seguimiento</p>
                                                    <p className="text-[11px] font-black text-teal-400">{selectedPedido.numSeguimiento}</p>
                                                </div>
                                                <span className="material-symbols-outlined text-sm text-teal-400 group-hover/link:translate-x-1 transition-transform">open_in_new</span>
                                            </a>
                                        ) : (
                                            <div className="flex flex-col items-center gap-3 py-4 opacity-30 border border-dashed border-white/10 rounded-2xl">
                                                <span className="material-symbols-outlined text-3xl">hourglass_empty</span>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-center">Pendiente de envío<br />desde SellerKing</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Columna Derecha */}
                                <div className="col-span-2 space-y-8">

                                    {/* Resumen Financiero */}
                                    <div className="p-8 bg-black/20 border border-white/5 rounded-[3rem] flex justify-between items-end">
                                        <div>
                                            <div className="flex items-center gap-3 text-emerald-500 mb-4">
                                                <span className="material-symbols-outlined text-lg">monetization_on</span>
                                                <h4 className="text-[10px] font-black uppercase tracking-widest">Resumen Financiero</h4>
                                            </div>
                                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Artículos totales</p>
                                            <p className="text-xl font-black text-white italic">{selectedPedido.productos.reduce((acc, p) => acc + p.cantidad, 0)} Unidades</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-emerald-500/50 uppercase tracking-widest">Total pagado</p>
                                            <p className="text-5xl font-black text-emerald-400 italic tracking-tighter">{selectedPedido.total.toFixed(2)}€</p>
                                        </div>
                                    </div>

                                    {/* Productos */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-4">
                                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Items del Pedido</h4>
                                            <span className="text-[9px] font-bold text-slate-600 uppercase">{selectedPedido.productos.length} Referencias</span>
                                        </div>
                                        <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-4 italic">
                                            {selectedPedido.productos.map((item, idx) => (
                                                <div key={idx} className="p-5 bg-white/5 border border-white/10 rounded-[2rem] flex items-center gap-6 group/item hover:bg-white/10 transition-colors">
                                                    <div className="size-16 rounded-2xl bg-white p-1 shadow-xl flex-shrink-0 group-hover:rotate-3 transition-transform">
                                                        <img src={item.imagen || ""} alt="" className="w-full h-full object-contain" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[12px] font-black text-white uppercase italic leading-tight truncate group-hover:text-primary transition-colors">{item.nombreProducto}</p>
                                                        <div className="flex gap-4 mt-1.5">
                                                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                                                                PAGADO: <span className="text-emerald-400">{item.precioUnitario.toFixed(2)}€</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-lg font-black text-white italic">x{item.cantidad}</p>
                                                        <p className="text-xl font-black text-emerald-400 italic leading-none">{item.precioTotalLinea.toFixed(2)}€</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-8 border-t border-white/10 bg-white/5 flex justify-end">
                            <button
                                onClick={() => setIsDetailModalOpen(false)}
                                className="px-10 h-14 bg-white/5 hover:bg-white/10 text-slate-400 rounded-2xl border border-white/10 transition-all text-[10px] font-black uppercase tracking-widest"
                            >
                                Cerrar Panel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminOrdersPage;
