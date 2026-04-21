import React, { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { rastrearPedido, PedidoSalida } from "../api/order";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const TrackOrder: React.FC = () => {
    const [orderId, setOrderId] = useState("");
    const [email, setEmail] = useState("");
    const [pedido, setPedido] = useState<PedidoSalida | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);


  // Traductor de estados a español
  const estadoLabel = (estado: string): string => {
    const labels: Record<string, string> = {
      PENDIENTE_DE_PAGO: "Pendiente",
      PENDIENTE: "Pendiente",
      PAGADO: "Pagado",
      RECIBIDO: "Recibido",
      ENVIADO: "Enviado",
      ENTREGADO: "Entregado",
      CANCELADO: "Cancelado",
      DEVOLUCION_SOLICITADA: "Devolución Solicitada",
      DEVUELTO: "Devuelto",
    };
    return labels[estado] ?? estado;
  };
    const handleTrack = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orderId || !email) return;
        
        if (isNaN(Number(orderId))) {
            setError("El número de pedido debe ser una cifra válida.");
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const data = await rastrearPedido(Number(orderId), email.trim());
            setPedido(data);
        } catch (err: any) {
            setError("No hemos encontrado ningún pedido con esos datos en nuestro registro divino. Por favor, verifica el número y el correo.");
            setPedido(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-background-dark font-display min-h-screen flex flex-col text-white">
            <Header />

            <main className="flex-1 flex flex-col items-center py-12 px-4">
                <AnimatePresence mode="wait">
                    {!pedido ? (
                        <motion.div 
                            key="form"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="w-full max-w-lg"
                        >
                            <div className="text-center mb-10">
                                <span className="text-primary text-[10px] font-black uppercase tracking-[0.5em] mb-4 block">Seguimiento de Pedido</span>
                                <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Rastrea tu Tesoro</h1>
                                <p className="text-yellow-300/60 text-sm font-light leading-relaxed">
                                    Introduce los detalles que recibiste en tu correo de confirmación para ver el estado de tu ritual de belleza en tiempo real.
                                </p>
                            </div>

                            <form onSubmit={handleTrack} className="bg-surface-dark border border-border-gold rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden group">
                                {/* Ambient Light */}
                                <div className="absolute -top-24 -right-24 size-48 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
                                
                                {error && (
                                    <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold leading-relaxed text-center italic">
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Número de Pedido</label>
                                        <div className="relative">
                                            <span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary/50 text-xl">tag</span>
                                            <input 
                                                type="number" 
                                                value={orderId}
                                                onChange={(e) => setOrderId(e.target.value)}
                                                placeholder="Ej: 1024"
                                                className="w-full h-14 bg-background-dark border border-white/5 rounded-2xl pl-14 pr-6 text-white placeholder:text-white/10 focus:border-primary/50 outline-none transition-all group-hover:border-white/10"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Correo Electrónico</label>
                                        <div className="relative">
                                            <span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary/50 text-xl">mail</span>
                                            <input 
                                                type="email" 
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="tu@email.com"
                                                className="w-full h-14 bg-background-dark border border-white/5 rounded-2xl pl-14 pr-6 text-white placeholder:text-white/10 focus:border-primary/50 outline-none transition-all group-hover:border-white/10"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <button 
                                        disabled={loading}
                                        type="submit"
                                        className="w-full h-14 bg-primary hover:bg-white text-background-dark font-black text-xs uppercase tracking-[0.2em] rounded-2xl mt-4 transition-all shadow-xl shadow-primary/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                                    >
                                        {loading ? (
                                            <>
                                                <span className="size-4 border-2 border-background-dark/30 border-t-background-dark rounded-full animate-spin" />
                                                Buscando...
                                            </>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined text-xl">travel_explore</span>
                                                Localizar Pedido
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="result"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full max-w-4xl"
                        >
                            <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={() => setPedido(null)}
                                        className="size-12 rounded-full border border-white/5 flex items-center justify-center hover:bg-white/5 transition-all text-white/50 hover:text-white"
                                    >
                                        <span className="material-symbols-outlined">arrow_back</span>
                                    </button>
                                    <div>
                                        <h2 className="text-3xl font-black tracking-tight">Pedido #{pedido.idPedido}</h2>
                                        <p className="text-primary text-[10px] font-black uppercase tracking-widest mt-1">
                                            Estado Atual: {estadoLabel(pedido.estado)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex bg-[#1a170d] px-6 py-3 rounded-2xl border border-primary/20 items-center gap-3">
                                    <span className="material-symbols-outlined text-primary">calendar_month</span>
                                    <span className="text-sm font-bold text-yellow-300/80">
                                        {new Date(pedido.fechaCreacion).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </span>
                                </div>
                            </div>

                            {/* Tracking visual simplified from OrderDetailPage */}
                            <div className="w-full bg-[#1a170d] rounded-[2.5rem] p-8 md:p-12 border border-[#493f22]/30 shadow-2xl mb-8">
                                <div className="flex flex-col md:flex-row justify-between w-full relative">
                                    <div className="hidden md:block absolute top-[16px] left-[40px] right-[40px] h-[3px] bg-white/5 z-0 rounded-full">
                                        <div
                                            className="h-full bg-primary shadow-[0_0_15px_rgba(242,185,13,0.3)] transition-all duration-1000 ease-out"
                                            style={{
                                                width: `${pedido.estado === 'ENTREGADO' || pedido.estado === 'ENVIADO' ? '100%' :
                                                    pedido.estado === 'RECIBIDO' ? '66%' :
                                                        pedido.estado === 'PAGADO' ? '33%' : '0%'
                                                }`
                                            }}
                                        />
                                    </div>

                                    {/* Steps */}
                                    {[
                                        { label: 'Confirmado', icon: 'check', active: ['PAGADO', 'RECIBIDO', 'ENVIADO', 'ENTREGADO'].includes(pedido.estado) },
                                        { label: 'Preparando', icon: 'inventory_2', active: ['RECIBIDO', 'ENVIADO', 'ENTREGADO'].includes(pedido.estado) },
                                        { label: 'En Camino', icon: 'local_shipping', active: ['ENVIADO', 'ENTREGADO'].includes(pedido.estado) },
                                        { label: 'Entregado', icon: 'done_all', active: pedido.estado === 'ENTREGADO' }
                                    ].map((step, idx) => (
                                        <div key={idx} className="relative z-10 flex flex-row md:flex-col items-center gap-4 md:gap-3 mb-6 md:mb-0">
                                            <div className={`size-8 rounded-full flex items-center justify-center transition-all duration-500 ${step.active 
                                                ? 'bg-primary text-background-dark shadow-[0_0_20px_rgba(242,185,13,0.4)] scale-110' 
                                                : 'bg-white/5 text-white/20 border border-white/5'
                                            }`}>
                                                <span className="material-symbols-outlined text-sm font-black">{step.icon}</span>
                                            </div>
                                            <p className={`text-[10px] font-black uppercase tracking-widest ${step.active ? 'text-primary' : 'text-white/20'}`}>{step.label}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Action Card */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-surface-dark p-8 rounded-[2rem] border border-white/5">
                                    <h3 className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-4">Detalles del Destinatario</h3>
                                    <p className="text-xl font-bold mb-1">{pedido.nombre} {pedido.apellidos}</p>
                                    <p className="text-white/50 text-sm leading-relaxed">{pedido.calle}, {pedido.codigoPostal} {pedido.ciudad}</p>
                                </div>
                                <div className="bg-primary/5 p-8 rounded-[2rem] border border-primary/20 flex flex-col justify-center">
                                    <h3 className="text-primary/60 text-[10px] font-black uppercase tracking-widest mb-4">¿Necesitas ayuda?</h3>
                                    <div className="flex gap-4">
                                        <Link to="/contact" className="flex-1 h-12 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-xs font-bold transition-all">Soporte</Link>
                                        <a href={`https://wa.me/34600000000?text=Hola, tengo una duda sobre mi pedido #${pedido.idPedido}`} className="flex-1 h-12 bg-primary text-background-dark rounded-xl flex items-center justify-center text-xs font-black uppercase tracking-tighter transition-all">WhatsApp</a>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <Footer />
        </div>
    );
};

export default TrackOrder;
