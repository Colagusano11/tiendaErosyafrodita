import React from "react";
import { Link } from "react-router-dom";
import ProductCard from "../ProductCard";
import type { Producto } from "../../api/products";

interface RelatedProductsProps {
  recomendados: Producto[];
}

export const RelatedProducts: React.FC<RelatedProductsProps> = ({ recomendados }) => {
  if (recomendados.length === 0) return null;

  return (
    <section className="w-full bg-perfume-sand text-perfume-green font-display py-16 md:py-24 border-b border-perfume-sand-dark">
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-10">
        
        {/* Cabecera de la Sección */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-perfume-green/60 block mb-2">
              Sugerencias del Olimpo
            </span>
            <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-perfume-green">
              Joyas Recomendadas
            </h3>
          </div>
          <Link 
            to="/catalog" 
            className="text-[10px] font-black uppercase tracking-widest text-perfume-green hover:text-perfume-lime transition-colors underline underline-offset-8"
          >
            Ver catálogo completo
          </Link>
        </div>

        {/* Carrusel Horizontal de Productos */}
        <div className="flex gap-6 overflow-x-auto pb-6 -mx-4 px-4 no-scrollbar">
          {recomendados.map((p) => (
            <div key={p.id} className="min-w-[220px] md:min-w-[260px] max-w-[260px] shrink-0">
              <ProductCard product={p} />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
