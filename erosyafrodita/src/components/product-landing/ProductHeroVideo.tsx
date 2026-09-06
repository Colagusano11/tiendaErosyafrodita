import React from "react";
import { motion } from "framer-motion";
import type { Producto } from "../../api/products";
import type { ProductMarketingContent } from "../../types/marketing";

interface ProductHeroVideoProps {
  product: Producto;
  marketing: ProductMarketingContent | null;
}

export const ProductHeroVideo: React.FC<ProductHeroVideoProps> = ({ product, marketing }) => {
  const name = product.nombre;
  const brand = marketing?.brand || product.manufacturer || "Lacoste";
  const claim = marketing?.claim || "Fresco, elegante y atemporal.";
  const shortDesc = marketing?.shortDescription || "La fragancia clásica inspirada en el polo blanco.";

  // Scroll suave al ID comprar
  const handleScrollToBuy = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById("comprar");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleScrollToNotes = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById("notas");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative h-[85vh] min-h-[580px] overflow-hidden flex items-center justify-center font-display">
      {/* Video de fondo */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src="/uploads/Generame_imagenes_para_mi_land.mp4" type="video/mp4" />
      </video>

      {/* Capa de contraste adaptada a la estética premium (oscurecimiento para que lea el texto blanco/lima) */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0C3528]/40 via-[#0C3528]/70 to-[#F9F8F3] z-10" />

      {/* Contenido flotante */}
      <div className="relative z-20 text-center max-w-[750px] px-6 text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          {/* Badge */}
          <span className="inline-block px-4 py-1.5 rounded-full bg-perfume-lime/20 border border-perfume-lime/40 text-perfume-lime text-[10px] font-black uppercase tracking-[0.2em] mb-6 shadow-inner">
            EAU DE TOILETTE · 100 ML
          </span>

          {/* Título Principal */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-none mb-4 uppercase">
            {brand} <span className="text-perfume-lime italic font-serif normal-case">{name.split(" ").slice(1).join(" ")}</span>
          </h1>

          {/* Claim / Descripción corta */}
          <p className="text-sm sm:text-base md:text-lg font-light text-white/80 leading-relaxed max-w-[580px] mb-10">
            {claim} {shortDesc}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="#comprar"
              onClick={handleScrollToBuy}
              className="px-8 py-4 rounded-full bg-perfume-lime text-perfume-green font-black text-xs uppercase tracking-widest hover:bg-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-perfume-lime/20"
            >
              Comprar Ahora
            </a>
            <a
              href="#notas"
              onClick={handleScrollToNotes}
              className="px-8 py-4 rounded-full bg-transparent border border-white/30 text-white font-black text-xs uppercase tracking-widest hover:border-perfume-lime hover:text-perfume-lime hover:scale-105 active:scale-95 transition-all"
            >
              Descubrir Notas
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
