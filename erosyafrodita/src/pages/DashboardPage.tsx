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

    return (
        <AdminLayout>
            <div className="flex flex-col gap-10">
                {/* Header Section */}
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">
                            Dashboard <span className="text-primary not-italic">Operativo</span>
                        </h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.4em] mt-2">Métricas en tiempo real y rentabilidad</p>
                    </div>
                    <button 
                        onClick={fetchStats}
                        className="h-12 px-6 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/10 transition-all flex items-center gap-3 text-[10px] font-black uppercase tracking-widest"
                    >
                        <span className={`material-symbols-outlined text-lg ${loading ? 'animate-spin' : ''}`}>refresh</span>
                        Actualizar Datos
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
                                subvalue="PVP Web" 
                                color="emerald" 
                            />
                            <MetricCard 
                                title="Inversión Prov." 
                                value={`${stats.totalCoste.toLocaleString()}€`} 
                                icon="inventory" 
                                subvalue="Coste" 
                                color="blue" 
                            />
                            <MetricCard 
                                title="Beneficio Neto" 
                                value={`${stats.beneficioNeto.toLocaleString()}€`} 
                                icon="trending_up" 
                                subvalue={`${stats.margenMedio.toFixed(1)}% Margen`} 
                                color="primary" 
                            />
                            <MetricCard 
                                title="Pedidos" 
                                value={stats.totalPedidos.toString()} 
                                icon="shopping_bag" 
                                subvalue={`${stats.pedidosValidos} Válidos`} 
                                color="orange" 
                            />
                        </div>

                        {/* Gráfica de Evolución Temporal */}
                        <div className="glass-panel rounded-[3.5rem] border border-white/10 bg-white/5 p-10 overflow-hidden relative">
                            <div className="flex justify-between items-start mb-10">
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Evolución Comercial</h4>
                                    <p className="text-3xl font-black text-white italic uppercase tracking-tighter">Ventas & Beneficios (30d)</p>
                                </div>
                                <div className="flex gap-6">
                                    <div className="flex items-center gap-2">
                                        <div className="size-2 rounded-full bg-primary"></div>
                                        <span className="text-[9px] font-black text-slate-500 uppercase">Ventas</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="size-2 rounded-full bg-emerald-500"></div>
                                        <span className="text-[9px] font-black text-slate-500 uppercase">Beneficio</span>
                                    </div>
                                </div>
                            </div>

                            <div className="h-64 w-full relative mt-8">
                                <svg viewBox="0 0 1000 200" className="w-full h-full overflow-visible">
                                    {/* Grilla horizontal */}
                                    {[0, 50, 100, 150, 200].map(y => (
                                        <line key={y} x1="0" y1={y} x2="1000" y2={y} stroke="white" strokeOpacity="0.05" strokeWidth="1" />
                                    ))}
                                    
                                    {/* Generar puntos de la gráfica */}
                                    {(() => {
                                        const dates = Object.keys(stats.ventasPorDia).sort();
                                        if (dates.length < 2) return <text x="500" y="100" textAnchor="middle" className="fill-slate-600 text-[20px] font-black uppercase italic">Esperando más datos históricos...</text>;
                                        
                                        const maxVenta = Math.max(...Object.values(stats.ventasPorDia), 100);
                                        const getX = (i: number) => (i / (dates.length - 1)) * 1000;
                                        const getY = (v: number) => 200 - (v / maxVenta) * 180;

                                        const pointsVentas = dates.map((d, i) => `${getX(i)},${getY(stats.ventasPorDia[d] || 0)}`).join(' ');
                                        const pointsBeneficio = dates.map((d, i) => `${getX(i)},${getY(stats.beneficioPorDia[d] || 0)}`).join(' ');

                                        return (
                                            <>
                                                <polyline points={pointsVentas} fill="none" stroke="url(#gradientVentas)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                                                <polyline points={pointsBeneficio} fill="none" stroke="url(#gradientBeneficio)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="8 4" />
                                                
                                                <defs>
                                                    <linearGradient id="gradientVentas" x1="0%" y1="0%" x2="100%" y2="0%">
                                                        <stop offset="0%" stopColor="#FFB800" />
                                                        <stop offset="100%" stopColor="#FF7A00" />
                                                    </linearGradient>
                                                    <linearGradient id="gradientBeneficio" x1="0%" y1="0%" x2="100%" y2="0%">
                                                        <stop offset="0%" stopColor="#10b981" />
                                                        <stop offset="100%" stopColor="#059669" />
                                                    </linearGradient>
                                                </defs>
                                            </>
                                        );
                                    })()}
                                </svg>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Distribución por Estado */}
                            <div className="lg:col-span-1 glass-panel rounded-[3rem] border border-white/10 bg-white/5 p-8 flex flex-col gap-8">
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estado de la Operación</h4>
                                    <p className="text-xl font-black text-white italic uppercase tracking-tighter">Desglose de Pedidos</p>
                                </div>
                                <div className="space-y-4">
                                    {Object.entries(stats.pedidosPorEstado).map(([estado, count]) => (
                                        <div key={estado} className="flex items-center justify-between p-4 bg-white/2 border border-white/5 rounded-2xl group hover:bg-white/5 transition-colors">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors">{estado.replace(/_/g, ' ')}</span>
                                            <span className="text-sm font-black text-primary italic">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Panel de Contabilidad Visual */}
                            <div className="lg:col-span-2 glass-panel rounded-[3rem] border border-white/10 bg-white/5 p-10 flex flex-col justify-between overflow-hidden relative">
                                <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 blur-[120px] rounded-full translate-x-1/2 translate-y-1/2"></div>
                                <div className="relative z-10">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Contabilidad Avanzada</h4>
                                    <p className="text-3xl font-black text-white italic uppercase tracking-tighter mb-10">Estructura de Capital</p>
                                    
                                    <div className="space-y-12">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Balance de Beneficio</p>
                                                <p className="text-xl font-black text-primary italic">+{stats.margenMedio.toFixed(2)}%</p>
                                            </div>
                                            <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden border border-white/5 p-1">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(255,184,0,0.3)]" 
                                                    style={{ width: `${Math.min(stats.margenMedio * 2, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-10">
                                            <div className="p-6 border-l-2 border-primary/20 bg-primary/5 rounded-r-3xl">
                                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Retorno de Inversión (ROI)</p>
                                                <p className="text-3xl font-black text-white italic">
                                                    {stats.totalCoste > 0 
                                                        ? `${((stats.beneficioNeto / stats.totalCoste) * 100).toFixed(1)}%` 
                                                        : '0%'}
                                                </p>
                                            </div>
                                            <div className="p-6 border-l-2 border-emerald-500/20 bg-emerald-500/5 rounded-r-3xl">
                                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Ticket Medio</p>
                                                <p className="text-3xl font-black text-white italic">
                                                    {stats.pedidosValidos > 0 
                                                        ? `${(stats.totalVentas / stats.pedidosValidos).toFixed(2)}€` 
                                                        : '0€'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-12 p-6 bg-white/2 border border-white/5 rounded-3xl flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="size-3 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sistema de auditoría contable activo</p>
                                    </div>
                                    <span className="material-symbols-outlined text-slate-600">verified_user</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-20 text-center opacity-30">
                        <span className="material-symbols-outlined text-6xl">bar_chart</span>
                        <p className="text-[10px] font-black uppercase tracking-widest mt-4">Error al cargar datos</p>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default DashboardPage;
