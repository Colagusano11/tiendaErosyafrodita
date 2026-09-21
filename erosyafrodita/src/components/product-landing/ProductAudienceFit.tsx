import React from "react";
import type { ProductMarketingContent } from "../../types/marketing";

interface ProductAudienceFitProps {
  marketing: ProductMarketingContent | null;
  sectionTitle?: string;
}

export const ProductAudienceFit: React.FC<ProductAudienceFitProps> = ({
  marketing,
  sectionTitle = "¿Es para ti?",
}) => {
  if (!marketing?.audienceFit?.length) {
    return null;
  }

  return (
    <section className="w-full bg-background-dark text-charcoal font-display py-16 md:py-24 border-t border-charcoal/5">
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-10">

        <div className="text-center mb-8 md:mb-12">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary block mb-2">
            Indicaciones de Uso
          </span>
          <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-charcoal">
            {sectionTitle}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {marketing.audienceFit.map((item, i) => (
            <div
              key={i}
              className="flex gap-5 p-6 md:p-7 rounded-3xl bg-surface-dark border border-border-dark shadow-lg items-start"
            >
              <div className="size-9 rounded-full bg-primary/15 border border-primary/30 text-primary flex items-center justify-center shrink-0 font-black text-xs">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="flex flex-col gap-1.5">
                <h4 className="text-sm font-black uppercase tracking-wide text-white">
                  {item.title}
                </h4>
                <p className="text-lg text-text-muted font-light leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
