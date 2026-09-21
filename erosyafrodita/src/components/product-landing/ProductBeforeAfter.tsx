import React from "react";
import type { ProductMarketingContent } from "../../types/marketing";

interface ProductBeforeAfterProps {
  marketing: ProductMarketingContent | null;
}

export const ProductBeforeAfter: React.FC<ProductBeforeAfterProps> = ({ marketing }) => {
  const pairs = marketing?.beforeAfter || [];

  if (pairs.length === 0) return null;

  return (
    <section className="w-full bg-background-dark text-charcoal font-display py-16 md:py-24 border-t border-charcoal/5">
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-10">

        <div className="text-center mb-12 md:mb-16">
          <p className="text-primary font-black text-[10px] uppercase tracking-[0.3em] mb-3">
            Resultados Reales
          </p>
          <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight text-charcoal">
            Antes y Después
          </h2>
        </div>

        <div className="flex flex-col gap-10">
          {pairs.map((pair, i) => (
            <div key={i} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl overflow-hidden border border-border-dark bg-surface-dark relative">
                  <span className="absolute top-3 left-3 z-10 bg-charcoal/80 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                    Antes
                  </span>
                  <img src={pair.beforeImage} alt="Antes" className="w-full aspect-square object-cover" />
                </div>
                <div className="rounded-2xl overflow-hidden border border-border-dark bg-surface-dark relative">
                  <span className="absolute top-3 left-3 z-10 bg-primary text-charcoal text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                    Después{pair.weeks ? ` · ${pair.weeks} sem.` : ""}
                  </span>
                  <img src={pair.afterImage} alt="Después" className="w-full aspect-square object-cover" />
                </div>
              </div>
              {pair.caption && (
                <p className="text-lg text-text-muted font-light text-center leading-relaxed">
                  {pair.caption}
                </p>
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
