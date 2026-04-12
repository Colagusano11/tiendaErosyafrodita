import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { logout, name } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const menuItems = [
        { path: "/admin/orders", label: "Pedidos Globales", icon: "shopping_cart" },
        { path: "/admin/products", label: "Gestión Productos", icon: "inventory_2" },
        { path: "/admin/users", label: "Clientes", icon: "group" },
    ];

    return (
        <div className="min-h-screen bg-aura-sapphire flex selection:bg-primary/30">
            {/* Sidebar */}
            <aside className="w-72 bg-white/5 backdrop-blur-xl border-r border-white/10 flex flex-col shrink-0">
                <div className="p-8 border-b border-white/5">
                    <Link to="/" className="block">
                        <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase">
                            Admin <span className="text-primary not-italic">E&A</span>
                        </h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-1">Backoffice Operativo</p>
                    </Link>
                </div>

                <nav className="flex-1 p-6 space-y-2">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${
                                    isActive 
                                        ? "bg-primary text-charcoal shadow-lg shadow-primary/20" 
                                        : "text-slate-400 hover:text-white hover:bg-white/5"
                                }`}
                            >
                                <span className={`material-symbols-outlined ${isActive ? "font-bold" : "text-slate-500 group-hover:text-white"}`}>
                                    {item.icon}
                                </span>
                                <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-6 border-t border-white/5 bg-white/5">
                   <div className="flex items-center gap-4 mb-6 px-2">
                        <div className="size-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-black uppercase italic">
                            {name?.charAt(0) || "A"}
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Administrador</p>
                            <p className="text-xs font-black text-white uppercase italic">{name || "Admin"}</p>
                        </div>
                   </div>
                    <button 
                        onClick={handleLogout}
                        className="w-full h-12 rounded-xl bg-white/5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-white/10 hover:border-red-500/30 transition-all flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest"
                    >
                        <span className="material-symbols-outlined text-lg">logout</span>
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Content Area */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="h-20 border-b border-white/5 bg-white/2 backdrop-blur-md flex items-center justify-between px-10 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Sistema de Gestión de Lujo</span>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-black/10">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
