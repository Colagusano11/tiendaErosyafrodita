import React from "react";
import type { ProductMarketingContent } from "../../types/marketing";

interface ProductBenefitsProps {
  marketing: ProductMarketingContent | null;
}

export const ProductBenefits: React.FC<ProductBenefitsProps> = ({ marketing }) => {
  if (
    !marketing ||
    (!marketing.benefits?.length &&
      !marketing.recommendedFor?.length &&
      !marketing.recommendedOccasions?.length &&
      !marketing.season?.length)
  ) {
    return null;
  }

  const columns = [
    {
      icon: "diversity_1",
      title: "Público Objetivo",
      items: marketing.recommendedFor || []
    },
    {
      icon: "schedule",
      title: "Ocasiones",
      items: marketing.recommendedOccasions || []
    },
    {
      icon: "wb_sunny",
      title: "Estaciones del Año",
      items: marketing.season || []
    }
  ];

  return (
    <section className="w-full bg-perfume-sand text-perfume-green font-display py-16 md:py-24 border-b border-perfume-sand-dark">
      <div className="w-full max-w-[1100px] mx-auto px-4 md:px-10">
        
        {/* Fila superior: Beneficios Clave (si existen) */}
        {marketing.benefits && marketing.benefits.length > 0 && (
          <div className="mb-16">
            <div className="text-center mb-8 md:mb-12">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-perfume-green/60 block mb-2">
                Atributos Principales
              </span>
              <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-perfume-green">
                ¿Por qué elegir esta fragancia?
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {marketing.benefits.map((benefit, i) => (
                <div key={i} className="flex gap-4 p-6 rounded-3xl bg-white border border-perfume-sand-dark shadow-sm items-start">
                  <span className="text-perfume-lime text-base font-black shrink-0 mt-0.5">✦</span>
                  <p className="text-xs text-perfume-green/80 font-light leading-relaxed">
                    {benefit}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fila inferior: Recomendaciones de Uso y Estilo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-10 border-t border-perfume-sand-dark/60">
          {columns.map((col, idx) => (
            <div key={idx} className="flex flex-col gap-4">
              {/* Encabezado */}
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-full bg-perfume-green text-perfume-sand flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined !text-[16px]">{col.icon}</span>
                </div>
                <h4 className="text-xs font-black uppercase tracking-widest text-perfume-green">
                  {col.title}
                </h4>
              </div>

              {/* Lista */}
              <ul className="flex flex-col gap-2.5 pl-11">
                {col.items.length > 0 ? (
                  col.items.map((item, iIdx) => (
                    <li key={iIdx} className="text-xs text-perfume-green/70 font-light list-disc">
                      {item}
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-perfume-green/30 italic">No especificado</li>
                )}
              </ul>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
