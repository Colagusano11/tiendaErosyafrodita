import React, { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import { getDashboardStats, DashboardStats } from "../api/dashboard";
import { useAlert } from "../context/AlertContext";

const DashboardPage: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const { showAlert } = useAlert();

    const fetchStats = async () => {
        try {
            setLoading(true);
            const data = await getDashboardStats();
            setStats(data);
        } catch (error) {
            showAlert("Error", "No se pudieron cargar las estadísticas", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const MetricCard = ({ title, value, icon, subvalue, color }: { title: string, value: string, icon: string, subvalue?: string, color: string }) => (
        <div className="relative group overflow-hidden bg-white/5 border border-white/10 rounded-[2.5rem] p-8 hover:bg-white/10 transition-all duration-500">
            <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 bg-${color}-500/10 blur-3xl rounded-full group-hover:bg-${color}-500/20 transition-all duration-700`}></div>
            <div className="relative flex flex-col gap-6">
                <div className="flex justify-between items-start">
                    <div className={`size-14 rounded-2xl bg-${color}-500/10 border border-${color}-500/20 flex items-center justify-center text-${color}-400 shadow-lg shadow-${color}-500/5`}>
                        <span className="material-symbols-outlined text-3xl">{icon}</span>
                    </div>
                    {subvalue && (
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-${color}-500/10 text-${color}-400 rounded-full border border-${color}-500/20`}>
                            {subvalue}
                        </span>
                    )}
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">{title}</p>
                    <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase">{value}</h3>
                </div>
            </div>
        </div>
    );

    const CostRow = ({ label, value, percentage, color }: { label: string, value: number, percentage: number, color: string }) => (
        <div className="space-y-2">
            <div className="flex justify-between items-end">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-xs font-black text-white italic">{value.toLocaleString()}€</span>
                    <span className={`text-[9px] font-black text-${color}-400 opacity-60`}>({percentage.toFixed(1)}%)</span>
                </div>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div 
                    className={`h-full bg-${color}-500 transition-all duration-1000`} 
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );

    return (
        <AdminLayout>
            <div className="flex flex-col gap-10">
                {/* Header Section */}
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">
                            Contabilidad <span className="text-primary not-italic">Avanzada</span>
                        </h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.4em] mt-2">Auditoría financiera y desglose de capital</p>
                    </div>
                    <button 
                        onClick={fetchStats}
                        className="h-12 px-6 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/10 transition-all flex items-center gap-3 text-[10px] font-black uppercase tracking-widest"
                    >
                        <span className={`material-symbols-outlined text-lg ${loading ? 'animate-spin' : ''}`}>refresh</span>
                        Actualizar Balances
                    </button>
                </div>

                {loading && !stats ? (
                    <div className="h-96 flex items-center justify-center">
                        <div className="size-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    </div>
                ) : stats ? (
                    <div className="space-y-10">
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <MetricCard 
                                title="Ventas Brutas" 
                                value={`${stats.totalVentas.toLocaleString()}€`} 
                                icon="payments" 
                                subvalue="Ingreso Total" 
                                color="emerald" 
                            />
                            <MetricCard 
                                title="Beneficio Real" 
                                value={`${stats.beneficioNeto.toLocaleString()}€`} 
                                icon="account_balance_wallet" 
                                subvalue="Neto Limpio" 
                                color="primary" 
                            />
                            <MetricCard 
                                title="Margen Neto" 
                                value={`${stats.margenMedio.toFixed(1)}%`} 
                                icon="trending_up" 
                                subvalue="Rentabilidad" 
                                color="blue" 
                            />
                            <MetricCard 
                                title="Pedidos" 
                                value={stats.totalPedidos.toString()} 
                                icon="shopping_bag" 
                                subvalue={`${stats.pedidosValidos} Pagados`} 
                                color="orange" 
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Desglose de Gastos */}
                            <div className="lg:col-span-1 glass-panel rounded-[3rem] border border-white/10 bg-white/5 p-8 flex flex-col gap-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-3xl"></div>
                                <div className="relative z-10">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estructura de Gastos</h4>
                                    <p className="text-xl font-black text-white italic uppercase tracking-tighter">Fugas de Capital</p>
                                </div>
                                
                                <div className="space-y-6 relative z-10">
                                    <CostRow 
                                        label="Coste Producto" 
                                        value={stats.totalCoste} 
                                        percentage={stats.totalVentas > 0 ? (stats.totalCoste / stats.totalVentas) * 100 : 0} 
                                        color="blue" 
                                    />
                                    <CostRow 
                                        label="Impuestos (IVA)" 
                                        value={stats.totalImpuestos} 
                                        percentage={stats.totalVentas > 0 ? (stats.totalImpuestos / stats.totalVentas) * 100 : 0} 
                                        color="slate" 
                                    />
                                    <CostRow 
                                        label="Comisiones Pasarela" 
                                        value={stats.totalComisiones} 
                                        percentage={stats.totalVentas > 0 ? (stats.totalComisiones / stats.totalVentas) * 100 : 0} 
                                        color="orange" 
                                    />
                                    <CostRow 
                                        label="Logística (Envíos)" 
                                        value={stats.totalEnvios} 
                                        percentage={stats.totalVentas > 0 ? (stats.totalEnvios / stats.totalVentas) * 100 : 0} 
                                        color="purple" 
                                    />
                                </div>

                                <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total Gastos</span>
                                        <span className="text-sm font-black text-red-400 italic">
                                            {(stats.totalVentas - stats.beneficioNeto).toLocaleString()}€
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Balance y ROI */}
                            <div className="lg:col-span-2 glass-panel rounded-[3rem] border border-white/10 bg-white/5 p-10 flex flex-col justify-between overflow-hidden relative">
                                <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 blur-[120px] rounded-full translate-x-1/2 translate-y-1/2"></div>
                                <div className="relative z-10">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Análisis de Retorno</h4>
                                    <p className="text-3xl font-black text-white italic uppercase tracking-tighter mb-10">Eficiencia de Inversión</p>
                                    
                                    <div className="space-y-12">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Salud Financiera (Margen Neto)</p>
                                                <p className="text-xl font-black text-primary italic">{stats.margenMedio.toFixed(2)}%</p>
                                            </div>
                                            <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden border border-white/5 p-1">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-1000 ease-out" 
                                                    style={{ width: `${Math.min(stats.margenMedio * 3, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-10">
                                            <div className="p-8 border-l-2 border-primary/20 bg-primary/5 rounded-r-3xl">
                                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">ROI (Retorno de Inversión)</p>
                                                <p className="text-4xl font-black text-white italic">
                                                    {stats.totalCoste > 0 
                                                        ? `${((stats.beneficioNeto / stats.totalCoste) * 100).toFixed(1)}%` 
                                                        : '0%'}
                                                </p>
                                                <p className="text-[7px] text-slate-500 uppercase mt-2">Beneficio neto vs coste producto</p>
                                            </div>
                                            <div className="p-8 border-l-2 border-emerald-500/20 bg-emerald-500/5 rounded-r-3xl">
                                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Ticket Medio Neto</p>
                                                <p className="text-4xl font-black text-white italic">
                                                    {stats.pedidosValidos > 0 
                                                        ? `${(stats.beneficioNeto / stats.pedidosValidos).toFixed(2)}€` 
                                                        : '0€'}
                                                </p>
                                                <p className="text-[7px] text-slate-500 uppercase mt-2">Lo que ganas "limpio" por pedido</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-12 p-6 bg-white/2 border border-white/5 rounded-3xl flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="size-3 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Auditoría contable sincronizada</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-end">
                                            <span className="text-[8px] font-black text-slate-500 uppercase">IVA Acumulado</span>
                                            <span className="text-xs font-black text-white">{stats.totalImpuestos.toLocaleString()}€</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tabla de Evolución Temporal simplificada */}
                        <div className="glass-panel rounded-[3.5rem] border border-white/10 bg-white/5 p-10">
                             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Histórico de Ventas Brutas</h4>
                             <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
                                {Object.entries(stats.ventasPorDia).sort().reverse().map(([date, value]) => (
                                    <div key={date} className="flex-shrink-0 min-w-[120px] p-4 bg-white/2 border border-white/5 rounded-2xl">
                                        <p className="text-[8px] font-black text-slate-500 uppercase mb-1">{date}</p>
                                        <p className="text-lg font-black text-white italic">{value.toLocaleString()}€</p>
                                    </div>
                                ))}
                             </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-20 text-center opacity-30">
                        <span className="material-symbols-outlined text-6xl">account_balance</span>
                        <p className="text-[10px] font-black uppercase tracking-widest mt-4">Error en la sincronización contable</p>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default DashboardPage;
