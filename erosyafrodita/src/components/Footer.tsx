import React from "react";
import { Link } from "react-router-dom";
import logoEros from "../assets/logo-eros.png";

const Footer: React.FC = () => (
  <footer className="bg-charcoal border-t border-white/10 mt-auto">
    <div className="max-w-[1440px] mx-auto px-4 lg:px-10 py-10">
      <div className="grid md:grid-cols-5 gap-8 text-xs text-white/60">
        {/* Marca */}
        <div className="md:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <img
              src={logoEros}
              alt="Eros & Afrodita"
              className="size-6 rounded-full object-cover"
            />
            <span className="font-semibold text-sm text-white">
              Erosyafrodita
            </span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Tienda de lujo en fragancias y cosmética, seleccionando solo las
            esencias más exclusivas.
          </p>
        </div>

        {/* Columnas */}
        <div>
          <h4 className="text-white text-xs font-semibold mb-3">Comprar</h4>
          <ul className="space-y-1">
            <li>
              <Link to="/catalog" className="hover:text-primary transition-colors">
                Perfumes Mujer
              </Link>
            </li>
            <li>
              <Link to="/catalog" className="hover:text-primary transition-colors">
                Perfumes Hombre
              </Link>
            </li>
            <li>
              <Link to="/catalog" className="hover:text-primary transition-colors">
                Novedades
              </Link>
            </li>
            <li>
              <Link to="/catalog" className="hover:text-primary transition-colors">
                Ofertas
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-white text-xs font-semibold mb-3">Ayuda</h4>
          <ul className="space-y-1">
            <li>
              <Link to="/faq" className="hover:text-primary transition-colors">
                Envíos y Devoluciones
              </Link>
            </li>
            <li>
              <Link to="/profile?tab=pedidos" className="hover:text-primary transition-colors">
                Mis pedidos
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-primary transition-colors">
                Contacto
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-white text-xs font-semibold mb-3">Legal</h4>
          <ul className="space-y-1">
             <li>
              <Link to="/legal/avisoLegal" className="hover:text-primary transition-colors">
                Aviso legal
              </Link>
            </li>
            <li>
              <Link to="/legal/privacidad" className="hover:text-primary transition-colors">
                Privacidad
              </Link>
            </li>
            <li>
              <Link to="/legal/terminos" className="hover:text-primary transition-colors">
                Términos y condiciones
              </Link>
            </li>
          </ul>
        </div>

        {/* Newsletter 
        <div>
          <h4 className="text-white text-xs font-semibold mb-3">
            Suscríbete
          </h4>
          <p className="text-[11px] mb-3">
            Recibe antes que nadie lanzamientos y ofertas exclusivas.
          </p>
          <div className="flex items-center gap-2">
            <input
              className="flex-1 rounded-full bg-charcoal-lighter border border-white/10 px-3 py-2 text-[11px] placeholder-white/40 outline-none focus:border-primary/60"
              placeholder="Tu correo electrónico"
            />
            <button className="h-8 px-4 rounded-full bg-primary text-[11px] font-semibold text-charcoal hover:bg-white transition-colors">
              Suscribirme
            </button>
          </div>
        </div>
        */}
      </div>

      {/* Trust Badges */}
      <div className="mt-12 py-10 border-y border-white/5 grid grid-cols-2 md:grid-cols-4 gap-8">
        {[
          { icon: "security", title: "Pago Seguro", desc: "Cifrado nivel bancario" },
          { icon: "local_shipping", title: "Envío Prioritario", desc: "Entrega en 24/48h" },
          { icon: "verified", title: "Originalidad", desc: "Productos garantizados" },
          { icon: "support_agent", title: "Atención VIP", desc: "Soporte personalizado" }
        ].map((badge, idx) => (
          <div key={idx} className="flex flex-col items-center text-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">{badge.icon}</span>
            <div className="flex flex-col">
              <span className="text-white text-[10px] font-black uppercase tracking-widest">{badge.title}</span>
              <span className="text-white/20 text-[9px] font-light italic">{badge.desc}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
        <span>© 2026 Eros & Afrodita.</span>
        <div className="flex gap-6">
          <span className="hover:text-primary cursor-pointer transition-colors">Instagram</span>
          <span className="hover:text-primary cursor-pointer transition-colors">LinkedIn</span>
          <span className="hover:text-primary cursor-pointer transition-colors">X / Twitter</span>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
