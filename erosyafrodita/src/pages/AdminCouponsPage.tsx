import React, { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import { getCupones, createCupon, deleteCupon, Cupon } from "../api/coupons";
import { useAlert } from "../context/AlertContext";

const AdminCouponsPage: React.FC = () => {
    const [cupones, setCupones] = useState<Cupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const { showAlert } = useAlert();

    const [newCupon, setNewCupon] = useState<Cupon>({
        nombre: "",
        codigo: "",
        porcentajeDescuento: 0,
        fechaExpiracion: "",
        activo: true
    });

    const fetchCupones = async () => {
        try {
            setLoading(true);
            const data = await getCupones();
            setCupones(data);
        } catch (error) {
            showAlert("Error", "No se pudieron cargar los cupones", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCupones();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Convertimos la fecha al formato que espera el backend (LocalDateTime)
            const formattedCupon = {
                ...newCupon,
                fechaExpiracion: newCupon.fechaExpiracion + ":00" 
            };
            await createCupon(formattedCupon);
            showAlert("Éxito", "Cupón creado correctamente", "success");
            setShowForm(false);
            setNewCupon({ nombre: "", codigo: "", porcentajeDescuento: 0, fechaExpiracion: "", activo: true });
            fetchCupones();
        } catch (error) {
            showAlert("Error", "No se pudo crear el cupón", "error");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("¿Estás seguro de eliminar este cupón?")) return;
        try {
            await deleteCupon(id);
            showAlert("Eliminado", "Cupón borrado con éxito", "success");
            fetchCupones();
        } catch (error) {
            showAlert("Error", "No se pudo eliminar", "error");
        }
    };

    return (
        <AdminLayout>
            <div className="flex flex-col gap-10">
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">
                            Campaña de <span className="text-primary not-italic">Cupones</span>
                        </h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.4em] mt-2">Marketing y Fidelización</p>
                    </div>
                    <button 
                        onClick={() => setShowForm(!showForm)}
                        className="h-12 px-8 bg-primary hover:bg-primary-hover text-charcoal rounded-2xl transition-all flex items-center gap-3 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                    >
                        <span className="material-symbols-outlined text-lg">{showForm ? 'close' : 'add'}</span>
                        {showForm ? 'Cancelar' : 'Nuevo Código'}
                    </button>
                </div>

                {showForm && (
                    <div className="glass-panel p-10 rounded-[3rem] border border-white/10 bg-white/5 animate-in fade-in slide-in-from-top-4 duration-500">
                        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Nombre Campaña</label>
                                <input 
                                    type="text" 
                                    required
                                    placeholder="Ej: Rebajas Verano"
                                    className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-white text-sm focus:border-primary/50 transition-all outline-none"
                                    value={newCupon.nombre}
                                    onChange={(e) => setNewCupon({...newCupon, nombre: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Código (Cupón)</label>
                                <input 
                                    type="text" 
                                    required
                                    placeholder="Ej: VERANO20"
                                    className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-white text-sm font-black uppercase tracking-widest focus:border-primary/50 transition-all outline-none"
                                    value={newCupon.codigo}
                                    onChange={(e) => setNewCupon({...newCupon, codigo: e.target.value.toUpperCase()})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">% Descuento</label>
                                <input 
                                    type="number" 
                                    required
                                    min="0"
                                    max="100"
                                    className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-white text-sm focus:border-primary/50 transition-all outline-none"
                                    value={newCupon.porcentajeDescuento}
                                    onChange={(e) => setNewCupon({...newCupon, porcentajeDescuento: parseInt(e.target.value)})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Válido Hasta</label>
                                <input 
                                    type="datetime-local" 
                                    required
                                    className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-white text-sm focus:border-primary/50 transition-all outline-none"
                                    value={newCupon.fechaExpiracion}
                                    onChange={(e) => setNewCupon({...newCupon, fechaExpiracion: e.target.value})}
                                />
                            </div>
                            <div className="lg:col-span-4 flex justify-end pt-4">
                                <button type="submit" className="h-14 px-12 bg-white text-charcoal font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-primary transition-all">
                                    Lanzar Campaña
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="glass-panel rounded-[3.5rem] border border-white/10 bg-white/5 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/2">
                                <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Campaña</th>
                                <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Código</th>
                                <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Descuento</th>
                                <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Expiración</th>
                                <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Estado</th>
                                <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cupones.map((cupon) => {
                                const isExpired = new Date(cupon.fechaExpiracion) < new Date();
                                return (
                                    <tr key={cupon.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                                        <td className="p-8">
                                            <p className="text-sm font-black text-white italic">{cupon.nombre}</p>
                                        </td>
                                        <td className="p-8">
                                            <span className="px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl text-xs font-black tracking-widest uppercase">
                                                {cupon.codigo}
                                            </span>
                                        </td>
                                        <td className="p-8">
                                            <p className="text-2xl font-black text-white italic">-{cupon.porcentajeDescuento}%</p>
                                        </td>
                                        <td className="p-8">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                {new Date(cupon.fechaExpiracion).toLocaleDateString()}
                                            </p>
                                        </td>
                                        <td className="p-8">
                                            {isExpired ? (
                                                <span className="text-[9px] font-black text-red-400 uppercase tracking-widest px-3 py-1 bg-red-400/10 rounded-full border border-red-400/20">Expirado</span>
                                            ) : (
                                                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest px-3 py-1 bg-emerald-400/10 rounded-full border border-emerald-400/20">Activo</span>
                                            )}
                                        </td>
                                        <td className="p-8 text-right">
                                            <button 
                                                onClick={() => handleDelete(cupon.id!)}
                                                className="size-10 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                                            >
                                                <span className="material-symbols-outlined text-lg">delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {cupones.length === 0 && !loading && (
                        <div className="p-20 text-center opacity-30">
                            <span className="material-symbols-outlined text-6xl">loyalty</span>
                            <p className="text-[10px] font-black uppercase tracking-widest mt-4">No hay campañas activas</p>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminCouponsPage;
