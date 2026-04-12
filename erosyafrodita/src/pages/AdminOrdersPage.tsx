import React, { useEffect, useState } from "react";
import { getAllPedidos, PedidoSalida, PedidoEstado, updateOrderStatus, pushOrderToProvider, PushProviderRequest, getProductoOpciones, syncOrderTracking, deletePedidoCompleto } from "../api/order";
import { useAlert } from "../context/AlertContext";
import AdminLayout from "../components/AdminLayout";

const AdminOrdersPage: React.FC = () => {
    const [pedidos, setPedidos] = useState<PedidoSalida[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPedido, setSelectedPedido] = useState<PedidoSalida | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isCheckingTracking, setIsCheckingTracking] = useState<number | null>(null);
    const [isPushModalOpen, setIsPushModalOpen] = useState(false);
    const [optionsByEan, setOptionsByEan] = useState<Record<string, any[]>>({});
    const [manualSelections, setManualSelections] = useState<Record<string, number>>({});
    const [pushStep, setPushStep] = useState(1);
    const [selectedDistributor, setSelectedDistributor] = useState<'BTS' | 'NOVAENGEL' | null>(null);
    const [mappedAddress, setMappedAddress] = useState({
        nombre: '', apellidos: '', calle: '', ciudad: '', codigoPostal: '', provincia: '', telefono: '', pais: 'ES'
    });
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [syncProgress, setSyncProgress] = useState<{ current: number; total: number } | null>(null);

    const { showAlert } = useAlert();

    const fetchAll = async () => {
        try {
            setLoading(true);
            const data = await getAllPedidos();
            setPedidos(data);
        } catch (error) {
            showAlert("Error", "No se pudieron cargar los pedidos globales", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, []);

    const handleOpenPushModal = async (pedido: PedidoSalida) => {
        setSelectedPedido(pedido);
        setIsPushModalOpen(true);
        setPushStep(1);
        setSelectedDistributor(null);
        setManualSelections({});
        
        // Abrir modal y cargar opciones
        const uniqueEans = Array.from(new Set(pedido.productos.map(p => p.ean).filter(ean => ean && ean !== '0')));
        const results: Record<string, any[]> = {};
        for (const ean of uniqueEans) {
            try {
                if (ean) {
                    const options = await getProductoOpciones(ean);
                    results[ean] = options;
                }
            } catch (e) { console.error("Error fetching options", e); }
        }
        setOptionsByEan(results);
    };

    const getInitials = (nombre: string, apellidos: string) => {
        return `${nombre.charAt(0)}${apellidos ? apellidos.charAt(0) : ''}`.toUpperCase();
    };

    const handleSelectProvider = (dist: 'BTS' | 'NOVAENGEL') => {
        setSelectedDistributor(dist);
        if (selectedPedido) {
            setMappedAddress({
                nombre: selectedPedido.nombre || '',
                apellidos: selectedPedido.apellidos || '',
                calle: selectedPedido.calle || '',
                ciudad: selectedPedido.ciudad || '',
                codigoPostal: selectedPedido.codigoPostal || '',
                provincia: selectedPedido.provincia || '',
                telefono: selectedPedido.telefono || '',
                pais: selectedPedido.pais || 'ES'
            });
        }
        setPushStep(2);
    };

    const handleStatusChange = async (id: number, newStatus: PedidoEstado) => {
        try {
            await updateOrderStatus(id, newStatus);
            showAlert("Éxito", `Estado del pedido #${id} actualizado a ${newStatus}`, "success");
            fetchAll();
        } catch (error) {
            showAlert("Error", "No se pudo actualizar el estado del pedido", "error");
        }
    };

    const formatStatusLabel = (estado: PedidoEstado) => {
        switch (estado) {
            case 'PENDIENTE': return 'Pendiente';
            case 'PENDIENTE_DE_PAGO': return 'Espera Pago';
            case 'PAGADO': return 'Confirmado';
            case 'RECIBIDO': return 'Preparando';
            case 'ENVIADO': return 'En Camino';
            case 'ENTREGADO': return 'Entregado';
            case 'CANCELADO': return 'Cancelado';
            case 'DEVOLUCION_SOLICITADA': return 'Devolución Solicitada';
            case 'DEVUELTO': return 'Devuelto';
            default: return estado;
        }
    };

    const handleSyncTracking = async (pedido: PedidoSalida) => {
        try {
            setIsCheckingTracking(pedido.idPedido);
            // Llama al proveedor y persiste estadoProveedor, num, url y avanza estado local si procede
            await syncOrderTracking(pedido.idPedido);
            showAlert('Sincronizado', `Pedido #${pedido.idPedido} actualizado desde el proveedor.`, 'success');
            await fetchAll();
        } catch (error) {
            showAlert('Error', 'No se pudo sincronizar con el proveedor', 'error');
        } finally {
            setIsCheckingTracking(null);
        }
    };

    const handleBatchSync = async (ids: number[]) => {
        const objetivos = pedidos.filter(p => ids.includes(p.idPedido) && p.pedidoProveedorId);
        if (objetivos.length === 0) {
            showAlert('Sin datos', 'Ninguno de los pedidos seleccionados tiene proveedor tramitado', 'warning');
            return;
        }
        setSyncProgress({ current: 0, total: objetivos.length });
        let ok = 0;
        let fail = 0;
        for (let i = 0; i < objetivos.length; i++) {
            try {
                await syncOrderTracking(objetivos[i].idPedido);
                ok++;
            } catch (e) {
                console.error('Sync failed for pedido', objetivos[i].idPedido, e);
                fail++;
            }
            setSyncProgress({ current: i + 1, total: objetivos.length });
        }
        setSyncProgress(null);
        showAlert(
            'Sincronización completada',
            `${ok} actualizados · ${fail} fallidos de ${objetivos.length} pedidos`,
            fail > 0 ? 'warning' : 'success'
        );
        await fetchAll();
    };

    const toggleSelect = (id: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const pedidosConProveedor = pedidos.filter(p => p.pedidoProveedorId);
    const allVisibleSelected = pedidosConProveedor.length > 0 && pedidosConProveedor.every(p => selectedIds.has(p.idPedido));

    const toggleSelectAll = () => {
        if (allVisibleSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(pedidosConProveedor.map(p => p.idPedido)));
        }
    };

    const handleDeletePedido = async (id: number) => {
        if (!window.confirm(`⚠️ ADVERTENCIA CRÍTICA ⚠️\n\n¿Estás completamente seguro de que deseas eliminar el pedido #${id} del sistema por completo?\n\nEsta acción NO se puede deshacer y borrará permanentemente todo el historial del pedido y sus productos vinculados.`)) {
            return;
        }

        try {
            await deletePedidoCompleto(id);
            showAlert("Eliminado", `El pedido #${id} ha sido borrado completamente de la base de datos.`, "success");
            fetchAll();
        } catch (error) {
            showAlert("Error", "No se pudo eliminar el pedido por completo. Puede que haya errores de conexión.", "error");
        }
    };

    const formatExternalStatus = (estado?: string | null) => {
        if (!estado) return 'PENDIENTE';
        
        // Limpieza y normalización
        let clean = estado.toUpperCase()
            .replace(/_/g, ' ')
            .replace(/DROPSHIPPING/g, '')
            .replace(/PAGADO/g, 'CONFIRMADO')
            .trim();

        // Mapeo profesional
        if (clean.includes('PROCESS') || clean.includes('TRAMI') || clean.includes('READY')) return 'EN PREPARACIÓN';
        if (clean.includes('SEND') || clean.includes('SHIP') || clean.includes('ENVI')) return 'ENVIADO';
        if (clean.includes('DELIVER') || clean.includes('ENTRE')) return 'ENTREGADO';
        
        return clean || 'SIN DATOS';
    };

    const getStatusColor = (estado: PedidoEstado) => {
        switch (estado) {
            case 'PAGADO': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'RECIBIDO': return 'bg-orange-500/10 text-orange-400 border-orange-500/20'; // Preparando
            case 'ENVIADO': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'ENTREGADO': return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'CANCELADO': return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'PENDIENTE': return 'bg-slate-500/10 text-slate-400 border-white/10';
            case 'PENDIENTE_DE_PAGO': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border-white/10';
        }
    };

    const getProviderColor = (provId: string | null | undefined) => {
        if (!provId) return 'bg-white/5 text-slate-500 border-white/10';
        if (provId.startsWith('BTS-')) return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        if (provId.startsWith('NOVA-')) return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
        return 'bg-primary/5 text-primary border-primary/20';
    };

    return (
        <AdminLayout>
            <div className="flex flex-col gap-8">
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">
                            Gestión de <span className="text-primary not-italic">Pedidos</span>
                        </h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.4em] mt-1">Control logístico y operacional</p>
                    </div>
                    <div className="flex gap-4 items-center">
                        {syncProgress && (
                            <div className="flex items-center gap-3 px-5 h-12 bg-primary/10 border border-primary/30 rounded-2xl">
                                <div className="size-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                                    Sincronizando {syncProgress.current}/{syncProgress.total}
                                </span>
                            </div>
                        )}
                        {selectedIds.size > 0 && (
                            <button
                                onClick={() => handleBatchSync(Array.from(selectedIds))}
                                disabled={!!syncProgress}
                                className="h-12 px-6 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white rounded-2xl border border-blue-500/20 transition-all flex items-center gap-3 text-[10px] font-black uppercase tracking-widest disabled:opacity-40"
                            >
                                <span className="material-symbols-outlined text-lg">sync</span>
                                Sincronizar Seleccionados ({selectedIds.size})
                            </button>
                        )}
                        <button
                            onClick={() => handleBatchSync(pedidos.map(p => p.idPedido))}
                            disabled={!!syncProgress || pedidosConProveedor.length === 0}
                            className="h-12 px-6 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-2xl border border-emerald-500/20 transition-all flex items-center gap-3 text-[10px] font-black uppercase tracking-widest disabled:opacity-40"
                            title="Sincroniza todos los pedidos con proveedor tramitado"
                        >
                            <span className="material-symbols-outlined text-lg">sync_alt</span>
                            Sincronizar Todo
                        </button>
                        <button
                            onClick={fetchAll}
                            className="h-12 px-6 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/10 transition-all flex items-center gap-3 text-[10px] font-black uppercase tracking-widest"
                        >
                            <span className="material-symbols-outlined text-lg">refresh</span>
                            Actualizar
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="h-64 flex items-center justify-center">
                        <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="glass-panel rounded-[2.5rem] overflow-hidden border border-white/10 bg-white/5 shadow-2xl">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 border-b border-white/10">
                                    <th className="p-6 w-12">
                                        <input
                                            type="checkbox"
                                            checked={allVisibleSelected}
                                            onChange={toggleSelectAll}
                                            disabled={pedidosConProveedor.length === 0}
                                            className="size-4 accent-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-30"
                                            title={allVisibleSelected ? 'Deseleccionar todos' : 'Seleccionar todos con proveedor'}
                                        />
                                    </th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID / Fecha</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente / Envío</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Productos</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Base / PVP</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado Externo</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {pedidos.map((pedido) => (
                                    <tr key={pedido.idPedido} className={`hover:bg-white/2 transition-colors group ${selectedIds.has(pedido.idPedido) ? 'bg-primary/5' : ''}`}>
                                        <td className="p-6 w-12">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(pedido.idPedido)}
                                                onChange={() => toggleSelect(pedido.idPedido)}
                                                disabled={!pedido.pedidoProveedorId}
                                                className="size-4 accent-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-30"
                                                title={pedido.pedidoProveedorId ? 'Seleccionar para sincronizar' : 'Sin proveedor tramitado'}
                                            />
                                        </td>
                                        <td className="p-6">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-black text-white italic leading-tight">#{pedido.idPedido}</span>
                                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{new Date(pedido.fechaCreacion + (pedido.fechaCreacion.endsWith('Z') ? '' : 'Z')).toLocaleString()}</span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="size-6 rounded-lg bg-primary/20 text-primary flex items-center justify-center text-[10px] font-black">
                                                        {getInitials(pedido.nombre || 'U', pedido.apellidos || 'E')}
                                                    </div>
                                                    <p className="text-[11px] font-black text-white uppercase truncate max-w-[150px]">{pedido.nombre} {pedido.apellidos}</p>
                                                </div>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase italic truncate max-w-[180px]">{pedido.calle}</p>
                                                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{pedido.codigoPostal} {pedido.ciudad}</p>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex -space-x-4 overflow-hidden group/stack relative pr-12">
                                                {pedido.productos.slice(0, 3).map((p, i) => (
                                                    <div key={i} className="size-10 rounded-xl border-2 border-charcoal bg-white/5 overflow-hidden flex-shrink-0 z-[1] hover:z-[2] hover:scale-110 transition-all">
                                                        <img src={p.imagen || ''} alt={p.nombreProducto} className="w-full h-full object-cover" />
                                                    </div>
                                                ))}
                                                {pedido.productos.length > 3 && (
                                                    <div className="size-10 rounded-xl border-2 border-charcoal bg-white/10 flex items-center justify-center text-[10px] font-black text-white z-[0]">
                                                        +{pedido.productos.length - 3}
                                                    </div>
                                                )}
                                                <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-1 items-end">
                                                    <span className="text-[6px] font-black bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1 py-0.5 rounded uppercase">BTS</span>
                                                    <span className="text-[6px] font-black bg-orange-500/10 text-orange-400 border border-orange-500/20 px-1 py-0.5 rounded uppercase">NV</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex flex-col items-center">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-base font-black text-primary italic leading-none">
                                                        {pedido.productos.reduce((acc, p) => acc + ((p.precioPVP || 0) * p.cantidad), 0).toFixed(2)}€
                                                    </span>
                                                    <span className="text-slate-600 font-black">/</span>
                                                    <span className="text-base font-black text-emerald-400 italic leading-none">{pedido.total.toFixed(2)}€</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex flex-col gap-1">
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border inline-block w-fit ${getStatusColor(pedido.estado)}`}>
                                                    {formatStatusLabel(pedido.estado)}
                                                </span>
                                                <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest pl-1">
                                                    Ext: {formatExternalStatus(pedido.estadoProveedor)}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center justify-center gap-2">
                                                <span className={`px-2 py-1 rounded-md border font-black text-[9px] uppercase tracking-tighter ${getProviderColor(pedido.pedidoProveedorId)}`}>
                                                    {formatExternalStatus(pedido.estadoProveedor)}
                                                </span>
                                                {pedido.pedidoProveedorId && (
                                                    <button
                                                        onClick={() => handleSyncTracking(pedido)}
                                                        disabled={isCheckingTracking === pedido.idPedido}
                                                        className="size-8 rounded-xl bg-white/5 hover:bg-primary hover:text-background-dark text-white border border-white/10 transition-all flex items-center justify-center shadow-lg disabled:opacity-40"
                                                        title="Sincronizar con proveedor"
                                                    >
                                                        <span className={`material-symbols-outlined text-sm ${isCheckingTracking === pedido.idPedido ? 'animate-spin' : ''}`}>sync</span>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-6 text-center">
                                            <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => handleOpenPushModal(pedido)}
                                                    className="size-10 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20 hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center shadow-lg shadow-orange-500/10"
                                                    title="Tramitar Envío Externo"
                                                >
                                                    <span className="material-symbols-outlined text-lg">shopping_cart_checkout</span>
                                                </button>
                                                {pedido.pedidoProveedorId && (
                                                    <button
                                                        disabled={isCheckingTracking === pedido.idPedido}
                                                        onClick={() => handleSyncTracking(pedido)}
                                                        className={`size-10 rounded-xl border transition-all flex items-center justify-center bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500 hover:text-white ${isCheckingTracking === pedido.idPedido ? 'opacity-50 cursor-wait' : ''}`}
                                                        title="Sincronizar con proveedor"
                                                    >
                                                        <span className={`material-symbols-outlined text-lg ${isCheckingTracking === pedido.idPedido ? 'animate-spin' : ''}`}>
                                                            sync
                                                        </span>
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => {
                                                        setSelectedPedido(pedido);
                                                        setIsDetailModalOpen(true);
                                                    }}
                                                    className="size-10 rounded-xl bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center"
                                                    title="Ver Detalles"
                                                >
                                                    <span className="material-symbols-outlined text-lg">visibility</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePedido(pedido.idPedido)}
                                                    className="size-10 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-lg shadow-red-500/10"
                                                    title="Eliminar Pedido Completamente"
                                                >
                                                    <span className="material-symbols-outlined text-lg">delete_forever</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {pedidos.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="p-20 text-center">
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

            {/* MODAL DETALLES - REDISEÑO ELITE 360° */}
            {isDetailModalOpen && selectedPedido && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-background-dark/90 backdrop-blur-2xl">
                    <div className="w-full max-w-6xl bg-charcoal border-2 border-white/5 rounded-[3.5rem] overflow-hidden shadow-2xl animate-fade-in-up flex flex-col max-h-[95vh]">
                        
                        {/* Cabecera Dinámica */}
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
                                        Generado el {new Date(selectedPedido.fechaCreacion + (selectedPedido.fechaCreacion.endsWith('Z') ? '' : 'Z')).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsDetailModalOpen(false)} className="size-12 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400 transition-all hover:rotate-90">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Cuerpo del Modal */}
                        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                            <div className="grid grid-cols-3 gap-10">
                                
                                {/* Columna Izquierda: Información del Cliente y Envío */}
                                <div className="col-span-1 space-y-8">
                                    {/* Card: Perfil del Cliente */}
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
                                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Contacto Directo</p>
                                                <div className="flex items-center gap-2 text-white">
                                                    <span className="material-symbols-outlined text-xs text-primary">phone_iphone</span>
                                                    <p className="text-[12px] font-black">{selectedPedido.telefono || 'No proporcionado'}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Territorio / País</p>
                                                <div className="flex items-center gap-2 text-white">
                                                    <span className="material-symbols-outlined text-xs text-primary">public</span>
                                                    <p className="text-[12px] font-black uppercase">{selectedPedido.pais || 'ES'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card: Dirección de Entrega */}
                                    <div className="p-8 bg-black/20 border border-white/5 rounded-[3rem] space-y-6">
                                        <div className="flex items-center gap-3 text-blue-400">
                                            <span className="material-symbols-outlined text-lg">home_pin</span>
                                            <h4 className="text-[10px] font-black uppercase tracking-widest">Punto de Entrega</h4>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Dirección / Calle</p>
                                                <p className="text-[12px] font-black text-white uppercase leading-relaxed italic">{selectedPedido.calle}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Código Postal</p>
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
                                </div>

                                {/* Columna Central y Derecha: Productos y Logística */}
                                <div className="col-span-2 space-y-8">
                                    
                                    {/* Grid interna para Logística y Resumen Financiero */}
                                    <div className="grid grid-cols-2 gap-8">
                                        {/* Card: Logística Avanzada */}
                                        <div className="p-8 bg-white/5 border border-white/10 rounded-[3rem] space-y-6">
                                            <div className="flex items-center gap-3 text-orange-500">
                                                <span className="material-symbols-outlined text-lg">local_shipping</span>
                                                <h4 className="text-[10px] font-black uppercase tracking-widest">Trazabilidad Logística</h4>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Proveedor ID</p>
                                                        <p className="text-[10px] font-bold text-white uppercase truncate">{selectedPedido.pedidoProveedorId || 'Pendiente'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Status Externo</p>
                                                        <span className="text-[9px] font-black text-orange-400 uppercase tracking-tighter">{formatExternalStatus(selectedPedido.estadoProveedor)}</span>
                                                    </div>
                                                </div>
                                                <div className="pt-4 border-t border-white/5">
                                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Seguimiento Real-Time</p>
                                                    {selectedPedido.numSeguimiento ? (
                                                        <a href={selectedPedido.urlSeguimiento || '#'} target="_blank" rel="noreferrer" className="flex items-center justify-between bg-primary/10 p-3 rounded-xl border border-primary/20 group/link">
                                                            <p className="text-[10px] font-black text-primary truncate">{selectedPedido.numSeguimiento}</p>
                                                            <span className="material-symbols-outlined text-sm text-primary group-hover/link:translate-x-1 transition-transform">open_in_new</span>
                                                        </a>
                                                    ) : (
                                                        <p className="text-[10px] text-slate-600 font-bold uppercase italic">No disponible todavía</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card: Resumen de Operación */}
                                        <div className="p-8 bg-black/20 border border-white/5 rounded-[3rem] flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-center gap-3 text-emerald-500 mb-6">
                                                    <span className="material-symbols-outlined text-lg">monetization_on</span>
                                                    <h4 className="text-[10px] font-black uppercase tracking-widest">Resumen Financiero</h4>
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Artículos Totales</p>
                                                    <p className="text-xl font-black text-white italic">{selectedPedido.productos.reduce((acc, p) => acc + p.cantidad, 0)} Unidades</p>
                                                </div>
                                            </div>
                                            <div className="pt-6 border-t border-white/10 space-y-4">
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Inversión Base (Coste)</p>
                                                    <p className="text-2xl font-black text-primary italic tracking-tighter">
                                                        {selectedPedido.productos.reduce((acc, p) => acc + ((p.precioPVP || 0) * p.cantidad), 0).toFixed(2)}€
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-emerald-500/50 uppercase tracking-widest">Venta Total (PVP)</p>
                                                    <p className="text-5xl font-black text-emerald-400 italic tracking-tighter">{selectedPedido.total.toFixed(2)}€</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Lista de Productos Premium */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-4">
                                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Items del Pedido</h4>
                                            <span className="text-[9px] font-bold text-slate-600 uppercase">{selectedPedido.productos.length} Referencias</span>
                                        </div>
                                        <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-4 italic">
                                            {selectedPedido.productos.map((item, idx) => {
                                                const cleanSku = item.sku ? (item.sku.startsWith('B') || item.sku.startsWith('N') ? item.sku.substring(1) : item.sku) : 'N/A';
                                                return (
                                                    <div key={idx} className="p-5 bg-white/5 border border-white/10 rounded-[2rem] flex items-center gap-6 group/item hover:bg-white/10 transition-colors">
                                                        <div className="size-16 rounded-2xl bg-white p-1 shadow-xl flex-shrink-0 group-hover:rotate-3 transition-transform">
                                                            <img src={item.imagen || ''} alt="" className="w-full h-full object-contain" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[12px] font-black text-white uppercase italic leading-tight truncate group-hover:text-primary transition-colors">{item.nombreProducto}</p>
                                                            <div className="flex gap-4 mt-1.5">
                                                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">REF: <span className="text-slate-300">{cleanSku}</span></p>
                                                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">COSTE PROV: <span className="text-primary">{(item.precioPVP || 0).toFixed(2)}€</span></p>
                                                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">PAGADO (WEB): <span className="text-emerald-400">{item.precioUnitario.toFixed(2)}€</span></p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-lg font-black text-white italic">x{item.cantidad}</p>
                                                            <div className="flex flex-col items-end">
                                                                <div className="flex items-center gap-2">
                                                                    <p className="text-xl font-black text-primary italic leading-none">{((item.precioPVP || 0) * item.cantidad).toFixed(2)}€</p>
                                                                    <span className="text-slate-600 font-black">/</span>
                                                                    <p className="text-xl font-black text-emerald-400 italic leading-none">{item.precioTotalLinea.toFixed(2)}€</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>

                        {/* Footer con Acciones */}
                        <div className="p-8 border-t border-white/10 bg-white/5 flex gap-4">
                            {selectedPedido.pedidoProveedorId ? (
                                <button
                                    disabled={isCheckingTracking === selectedPedido.idPedido}
                                    onClick={() => handleSyncTracking(selectedPedido)}
                                    className="flex-1 h-16 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white border border-blue-500/20 rounded-2xl transition-all text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-lg disabled:opacity-50"
                                >
                                    <span className={`material-symbols-outlined text-lg ${isCheckingTracking === selectedPedido.idPedido ? 'animate-spin' : ''}`}>sync</span>
                                    Sincronizar con Proveedor
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        setIsDetailModalOpen(false);
                                        handleOpenPushModal(selectedPedido);
                                    }}
                                    className="flex-1 h-16 bg-orange-500/10 hover:bg-orange-500 text-orange-500 hover:text-white border border-orange-500/20 rounded-2xl transition-all text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3"
                                >
                                    <span className="material-symbols-outlined text-lg">shopping_cart_checkout</span>
                                    Tramitar a Proveedor
                                </button>
                            )}
                            <button
                                onClick={() => setIsDetailModalOpen(false)}
                                className="px-10 h-16 bg-white/5 hover:bg-white/10 text-slate-400 rounded-2xl border border-white/10 transition-all text-[10px] font-black uppercase tracking-widest"
                            >
                                Cerrar Panel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL CONFIRMAR PUSH PROVEEDOR - REDISEÑADO 2 STEPS */}
            {isPushModalOpen && selectedPedido && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-background-dark/80 backdrop-blur-2xl">
                    <div className="w-full max-w-5xl bg-charcoal border-2 border-white/5 rounded-[3.5rem] overflow-hidden shadow-2xl animate-fade-in-up flex flex-col max-h-[90vh]">
                        
                        <div className="p-8 border-b border-white/10 bg-white/5 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className={`size-12 rounded-2xl flex items-center justify-center transition-colors ${
                                    pushStep === 1 
                                        ? 'bg-primary/20 text-primary' 
                                        : selectedDistributor === 'BTS' 
                                            ? 'bg-blue-500/20 text-blue-500' 
                                            : 'bg-orange-500/20 text-orange-500'
                                }`}>
                                    <span className="material-symbols-outlined text-2xl">{pushStep === 1 ? 'compare_arrows' : 'person_pin_circle'}</span>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                                        {pushStep === 1 ? 'Selección de' : 'Validación de'} <span className={
                                            pushStep === 1 
                                                ? 'text-primary not-italic' 
                                                : selectedDistributor === 'BTS' 
                                                    ? 'text-blue-500 not-italic' 
                                                    : 'text-orange-500 not-italic'
                                        }>{pushStep === 1 ? 'Proveedor' : 'Datos Cliente'}</span>
                                    </h3>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.3em]">Tramitación de Pedido #{selectedPedido.idPedido} (Paso {pushStep} de 2)</p>
                                </div>
                            </div>
                            <button onClick={() => setIsPushModalOpen(false)} className="size-10 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400 transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            {pushStep === 1 ? (
                                <div className="grid grid-cols-2 gap-8 h-full">
                                    {['BTS', 'NOVAENGEL'].map((dist) => {
                                        // Buscamos si el primer producto tiene opción en este distribuidor para mostrar la card
                                        const firstEan = selectedPedido.productos[0]?.ean;
                                        const options = optionsByEan[firstEan || ''] || [];
                                        const option = options.find(o => o.distribuidor === (dist === 'NOVAENGEL' ? 'NOVA' : dist) || o.distribuidor === dist);
                                        
                                        const isBts = dist === 'BTS';
                                        
                                        return (
                                            <div 
                                                key={dist}
                                                onClick={() => option && handleSelectProvider(dist as any)}
                                                className={`group relative p-8 rounded-[3rem] border-2 transition-all duration-500 flex flex-col gap-6 ${
                                                    !option 
                                                        ? 'bg-white/5 border-white/5 opacity-40 grayscale cursor-not-allowed' 
                                                        : isBts 
                                                            ? 'bg-blue-500/5 border-blue-500/10 hover:border-blue-500/40 hover:shadow-[0_0_50px_rgba(59,130,246,0.15)] cursor-pointer hover:scale-[1.02]' 
                                                            : 'bg-orange-500/5 border-orange-500/10 hover:border-orange-500/40 hover:shadow-[0_0_50px_rgba(249,115,22,0.15)] cursor-pointer hover:scale-[1.02]'
                                                }`}
                                            >
                                                {!option && (
                                                    <div className="absolute inset-0 flex items-center justify-center z-10">
                                                        <div className="bg-red-500 text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest shadow-xl rotate-[-12deg]">
                                                            No Disponible
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex justify-between items-start">
                                                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${!option ? 'bg-slate-700 text-slate-400' : isBts ? 'bg-blue-500 text-white' : 'bg-orange-500 text-white'}`}>
                                                        {dist} LOGISTICS
                                                    </div>
                                                    {option && (
                                                        <div className="text-right">
                                                            <p className="text-[8px] font-black text-slate-500 uppercase">Stock Disponible</p>
                                                            <p className={`text-lg font-black italic ${option.stock > 0 ? 'text-green-500' : 'text-red-500'}`}>{option.stock} UNID.</p>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-1 flex flex-col items-center justify-center gap-4 py-4">
                                                    <div className="size-32 bg-white rounded-3xl p-4 shadow-2xl relative overflow-hidden group-hover:rotate-3 transition-transform">
                                                        <img src={option?.imagen || selectedPedido.productos[0]?.imagen || ''} alt="" className="w-full h-full object-contain" />
                                                        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 to-white/20"></div>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-[11px] font-black text-white uppercase italic leading-tight max-w-[200px]">{option?.nombre || selectedPedido.productos[0]?.nombreProducto}</p>
                                                        <p className="text-[9px] font-bold text-slate-500 mt-1">SKU: {option?.sku || 'N/A'}</p>
                                                    </div>
                                                </div>

                                                <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Tu Coste (Base)</p>
                                                        <p className={`text-3xl font-black italic ${!option ? 'text-slate-600' : isBts ? 'text-blue-400' : 'text-orange-400'}`}>{option?.precio ? option.precio.toFixed(2) : '---'}€</p>
                                                    </div>
                                                    {option && (
                                                        <div className={`size-12 rounded-2xl flex items-center justify-center transition-all group-hover:translate-x-2 ${isBts ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                                            <span className="material-symbols-outlined">arrow_forward_ios</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-10 items-stretch h-full">
                                    <div className="col-span-2 flex flex-col justify-between py-2 h-full">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Nombre</label>
                                                <input value={mappedAddress.nombre} onChange={e => setMappedAddress({...mappedAddress, nombre: e.target.value})} className="w-full h-14 px-6 bg-white/5 border border-white/10 rounded-2xl text-[12px] font-black uppercase text-white focus:border-orange-500 outline-none transition-all" />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Apellidos</label>
                                                <input value={mappedAddress.apellidos} onChange={e => setMappedAddress({...mappedAddress, apellidos: e.target.value})} className="w-full h-14 px-6 bg-white/5 border border-white/10 rounded-2xl text-[12px] font-black uppercase text-white focus:border-orange-500 outline-none transition-all" />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Dirección / Calle</label>
                                            <input value={mappedAddress.calle} onChange={e => setMappedAddress({...mappedAddress, calle: e.target.value})} className="w-full h-14 px-6 bg-white/5 border border-white/10 rounded-2xl text-[12px] font-black uppercase text-white focus:border-orange-500 outline-none transition-all" />
                                        </div>
                                        <div className="grid grid-cols-3 gap-6">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">C. Postal</label>
                                                <input value={mappedAddress.codigoPostal} onChange={e => setMappedAddress({...mappedAddress, codigoPostal: e.target.value})} className="w-full h-14 px-6 bg-white/5 border border-white/10 rounded-2xl text-[12px] font-black text-white focus:border-orange-500 outline-none transition-all" />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Ciudad</label>
                                                <input value={mappedAddress.ciudad} onChange={e => setMappedAddress({...mappedAddress, ciudad: e.target.value})} className="w-full h-14 px-6 bg-white/5 border border-white/10 rounded-2xl text-[12px] font-black uppercase text-white focus:border-orange-500 outline-none transition-all" />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Provincia</label>
                                                <input value={mappedAddress.provincia} onChange={e => setMappedAddress({...mappedAddress, provincia: e.target.value})} className="w-full h-14 px-6 bg-white/5 border border-white/10 rounded-2xl text-[12px] font-black uppercase text-white focus:border-orange-500 outline-none transition-all" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Teléfono Movil</label>
                                                <input value={mappedAddress.telefono} onChange={e => setMappedAddress({...mappedAddress, telefono: e.target.value})} className="w-full h-14 px-6 bg-white/5 border border-white/10 rounded-2xl text-[12px] font-black text-white focus:border-orange-500 outline-none transition-all" />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">País</label>
                                                <input value={mappedAddress.pais} placeholder="EJ: ES, PT, FR" onChange={e => setMappedAddress({...mappedAddress, pais: e.target.value})} className="w-full h-14 px-6 bg-white/5 border border-white/10 rounded-2xl text-[12px] font-black uppercase text-white focus:border-orange-500 outline-none transition-all" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-black/20 rounded-[2.5rem] p-8 flex flex-col justify-between border border-white/5">
                                        <div className="space-y-6">
                                            <div className={`size-16 rounded-[2rem] flex items-center justify-center ${selectedDistributor === 'BTS' ? 'bg-blue-500/20 text-blue-500' : 'bg-orange-500/20 text-orange-500'}`}>
                                                <span className="material-symbols-outlined text-3xl">local_shipping</span>
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-black text-white italic uppercase leading-tight">Confirmación <br/><span className={selectedDistributor === 'BTS' ? 'text-blue-500' : 'text-orange-500'}>Logística</span></h4>
                                                <p className="text-[9px] text-slate-500 font-bold uppercase mt-2">Proveedor: {selectedDistributor}</p>
                                            </div>

                                            <div className="pt-4 border-t border-white/10 space-y-2">
                                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Destinatario</p>
                                                <p className="text-[11px] font-black text-white uppercase">{mappedAddress.nombre} {mappedAddress.apellidos}</p>
                                                <p className="text-[10px] font-bold text-primary">{mappedAddress.telefono}</p>
                                            </div>
                                            
                                            <div className="pt-4 border-t border-white/10 space-y-3">
                                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Productos a Tramitar</p>
                                                {selectedPedido.productos.map((p, idx) => {
                                                    const cleanSku = p.sku ? (p.sku.startsWith('B') || p.sku.startsWith('N') ? p.sku.substring(1) : p.sku) : 'N/A';
                                                    return (
                                                        <div key={idx} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                                                            <div>
                                                                <p className="text-[10px] font-black text-white truncate max-w-[120px]">{p.nombreProducto}</p>
                                                                <p className="text-[9px] font-bold text-primary">SKU: {cleanSku}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-xs font-black text-white">x{p.cantidad}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                                                <div>
                                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Base (Coste)</p>
                                                    <p className="text-lg font-black text-primary italic">
                                                        {selectedPedido.productos.reduce((acc, p) => acc + ((p.precioPVP || 0) * p.cantidad), 0).toFixed(2)}€
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[8px] font-black text-emerald-500/50 uppercase tracking-widest">PVP (Venta)</p>
                                                    <p className="text-3xl font-black text-emerald-400 italic leading-none">{selectedPedido.total.toFixed(2)}€</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <button 
                                                onClick={async () => {
                                                    if (!selectedDistributor) return;
                                                    try {
                                                        const pushData: PushProviderRequest = {
                                                            distribuidor: selectedDistributor,
                                                            manualSelections: Object.keys(manualSelections).length > 0 ? manualSelections : undefined,
                                                            ...mappedAddress
                                                        };
                                                        await pushOrderToProvider(selectedPedido.idPedido, pushData);
                                                        showAlert("Éxito", `Pedido tramitado con ${selectedDistributor}`, "success");
                                                        setIsPushModalOpen(false);
                                                        fetchAll();
                                                    } catch (e) {
                                                        showAlert("Error", "No se pudo tramitar el pedido", "error");
                                                    }
                                                }}
                                                className={`w-full h-14 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                                                    selectedDistributor === 'BTS' 
                                                        ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20' 
                                                        : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20'
                                                } shadow-xl`}
                                            >
                                                Ejecutar Pedido {selectedDistributor}
                                                <span className="material-symbols-outlined text-sm">rocket_launch</span>
                                            </button>
                                            <button 
                                                onClick={() => setPushStep(1)}
                                                className="w-full h-12 bg-white/5 border border-white/10 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-white/10 transition-all text-slate-400"
                                            >
                                                Volver Atrás
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </AdminLayout>
    );
};

export default AdminOrdersPage;
