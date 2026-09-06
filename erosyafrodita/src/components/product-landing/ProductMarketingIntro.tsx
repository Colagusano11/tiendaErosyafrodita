import React from "react";
import type { Producto } from "../../api/products";
import type { ProductMarketingContent } from "../../types/marketing";

interface ProductMarketingIntroProps {
  product: Producto;
  marketing: ProductMarketingContent | null;
}

export const ProductMarketingIntro: React.FC<ProductMarketingIntroProps> = ({
  product,
  marketing,
}) => {
  const claim = marketing?.claim || "Esencia selecta y sofisticación atemporal.";
  const description = marketing?.shortDescription || product.descripcion;

  return (
    <section className="w-full bg-perfume-sand text-perfume-green font-display py-16 md:py-24 border-b border-perfume-sand-dark">
      <div className="w-full max-w-[900px] mx-auto px-4 text-center">
        
        {/* Claim Principal */}
        <h2 className="font-serif italic text-3xl md:text-5xl text-perfume-green leading-tight tracking-tight mb-8 md:mb-12">
          “{claim}”
        </h2>

        {/* Línea divisoria minimalista */}
        <div className="w-20 h-px bg-perfume-green/20 mx-auto mb-8 md:mb-12" />

        {/* Descripción Persuasiva */}
        {description && (
          <div className="text-sm md:text-base text-perfume-green/80 font-light leading-relaxed max-w-[720px] mx-auto">
            {description.includes("<") ? (
              <div 
                className="rich-text-content"
                dangerouslySetInnerHTML={{ __html: description }} 
              />
            ) : (
              <p>{description}</p>
            )}
          </div>
        )}

      </div>
    </section>
  );
};
