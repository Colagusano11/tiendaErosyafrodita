import React from "react";
import type { ProductMarketingContent } from "../../types/marketing";

interface ProductFAQProps {
  marketing: ProductMarketingContent | null;
}

export const ProductFAQ: React.FC<ProductFAQProps> = ({ marketing }) => {
  if (!marketing || !marketing.faqs || marketing.faqs.length === 0) {
    return null;
  }

  return (
    <section className="w-full bg-perfume-sand-dark text-perfume-green font-display py-16 md:py-24 border-b border-perfume-sand-dark/60">
      <div className="w-full max-w-[800px] mx-auto px-4">
        
        {/* Cabecera */}
        <div className="text-center mb-12 md:mb-16">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-perfume-green/60 block mb-2">
            Preguntas Frecuentes
          </span>
          <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-perfume-green">
            Resolviendo tus Dudas
          </h3>
        </div>

        {/* Acordeones de Preguntas */}
        <div className="flex flex-col gap-4">
          {marketing.faqs.map((faq, idx) => (
            <details 
              key={idx} 
              className="bg-white border border-perfume-sand-dark rounded-3xl p-6 cursor-pointer group shadow-sm transition-all duration-300 hover:border-perfume-green/30"
            >
              <summary className="list-none flex justify-between items-center text-xs font-black uppercase tracking-widest text-perfume-green">
                <span>{faq.question}</span>
                <span className="material-symbols-outlined transition-transform duration-300 group-open:rotate-180 text-perfume-green/50">
                  expand_more
                </span>
              </summary>
              <div className="mt-4 text-xs text-perfume-green/70 font-light leading-relaxed border-t border-perfume-sand-dark pt-4">
                <p>{faq.answer}</p>
              </div>
            </details>
          ))}
        </div>

      </div>
    </section>
  );
};
