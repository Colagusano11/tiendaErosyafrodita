import React, { useState } from "react";
import type { ProductMarketingContent } from "../../types/marketing";

interface ProductFAQAccordionProps {
  marketing: ProductMarketingContent | null;
}

export const ProductFAQAccordion: React.FC<ProductFAQAccordionProps> = ({ marketing }) => {
  const faqs = marketing?.faqs || [];
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  if (faqs.length === 0) return null;

  const toggleFaq = (idx: number) => {
    setOpenFaq((prev) => (prev === idx ? null : idx));
  };

  return (
    <section id="faq" className="w-full bg-background-dark text-charcoal font-display py-16 md:py-24 border-t border-charcoal/5">
      <div className="w-full max-w-[800px] mx-auto px-4">
        
        {/* Cabecera */}
        <div className="text-center mb-12 md:mb-16">
          <p className="text-primary font-black text-[10px] uppercase tracking-[0.3em] mb-3">
            Preguntas Frecuentes
          </p>
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-charcoal">
            ¿Tienes Dudas?
          </h2>
        </div>

        {/* Acordeones en Modo Oscuro */}
        <div className="flex flex-col gap-4">
          {faqs.map((faq, i) => {
            const isOpen = openFaq === i;
            return (
              <div
                key={i}
                className="bg-surface-dark border border-border-dark rounded-2xl overflow-hidden transition-all duration-300 shadow-lg hover:border-primary/25"
              >
                {/* Botón Pregunta */}
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full flex items-center justify-between gap-6 py-5 px-6 bg-transparent border-none text-white text-xs md:text-sm font-black uppercase tracking-widest text-left cursor-pointer transition-colors hover:text-primary"
                >
                  <span>{faq.question}</span>
                  <span
                    className={`flex-shrink-0 size-8 rounded-lg bg-surface-lighter flex items-center justify-center font-bold text-sm text-primary transition-transform duration-300
                      ${isOpen ? "rotate-45" : "rotate-0"}`}
                  >
                    +
                  </span>
                </button>

                {/* Respuesta */}
                <div
                  className="transition-all duration-300 overflow-hidden"
                  style={{ maxHeight: isOpen ? "200px" : "0px" }}
                >
                  <div className="px-6 pb-5 text-xs text-text-muted font-light leading-relaxed border-t border-border-dark/40 pt-4">
                    {faq.answer}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
