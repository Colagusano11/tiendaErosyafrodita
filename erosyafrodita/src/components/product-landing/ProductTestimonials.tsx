import React from "react";
import type { ProductMarketingContent } from "../../types/marketing";

interface ProductTestimonialsProps {
  marketing: ProductMarketingContent | null;
}

export const ProductTestimonials: React.FC<ProductTestimonialsProps> = ({ marketing }) => {
  const testimonials = marketing?.testimonials || [];

  if (testimonials.length === 0) return null;

  return (
    <section className="w-full bg-perfume-sand text-perfume-green font-display py-16 md:py-24 border-b border-perfume-sand-dark">
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-10">

        <div className="text-center mb-12 md:mb-16">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-perfume-green/60 mb-3">
            Opiniones Reales
          </p>
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-perfume-green">
            Lo que dicen nuestras clientas
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="flex flex-col gap-4 p-6 rounded-3xl bg-white border border-perfume-sand-dark shadow-sm">
              {t.rating && (
                <div className="flex text-perfume-green">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span
                      key={s}
                      className={`material-symbols-outlined !text-[15px] ${s <= t.rating! ? "text-perfume-green" : "text-perfume-green/20"}`}
                    >
                      star
                    </span>
                  ))}
                </div>
              )}
              <p className="text-lg text-perfume-green/80 font-light leading-relaxed italic">
                “{t.text}”
              </p>
              <div className="flex items-center gap-3 mt-auto pt-2">
                {t.photo ? (
                  <img src={t.photo} alt={t.name} className="size-8 rounded-full object-cover" />
                ) : (
                  <div className="size-8 rounded-full bg-perfume-green text-perfume-sand flex items-center justify-center text-[10px] font-black">
                    {t.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-[10px] font-black uppercase tracking-widest text-perfume-green/60">
                  {t.name}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
