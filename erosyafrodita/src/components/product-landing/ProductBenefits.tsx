import React from "react";
import type { ProductMarketingContent } from "../../types/marketing";

interface ProductBenefitsProps {
  marketing: ProductMarketingContent | null;
  sectionTitle?: string;
}

export const ProductBenefits: React.FC<ProductBenefitsProps> = ({
  marketing,
  sectionTitle = "¿Por qué elegir este producto?",
}) => {
  if (!marketing?.benefits?.length) {
    return null;
  }

  return (
    <section className="w-full bg-perfume-sand text-perfume-green font-display py-16 md:py-24 border-b border-perfume-sand-dark">
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-10">

        <div className="text-center mb-8 md:mb-12">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-perfume-green/60 block mb-2">
            Atributos Principales
          </span>
          <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-perfume-green">
            {sectionTitle}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {marketing.benefits.map((benefit, i) => (
            <div key={i} className="flex gap-4 p-6 rounded-3xl bg-white border border-perfume-sand-dark shadow-sm items-start">
              <span className="text-perfume-lime text-base font-black shrink-0 mt-0.5">✦</span>
              <p className="text-lg text-perfume-green/80 font-light leading-relaxed">
                {benefit}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
