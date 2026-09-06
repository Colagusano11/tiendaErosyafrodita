import React from "react";
import type { ProductMarketingContent } from "../../types/marketing";

interface FragranceProfileGridProps {
  marketing: ProductMarketingContent | null;
}

export const FragranceProfileGrid: React.FC<FragranceProfileGridProps> = ({ marketing }) => {
  const notes = marketing?.notes || [];

  if (notes.length === 0) return null;

  return (
    <section id="notas" className="w-full bg-background-dark text-charcoal font-display py-16 md:py-24 border-t border-charcoal/5">
      <div className="w-full max-w-[1200px] mx-auto px-4 md:px-10">
        
        {/* Cabecera */}
        <div className="text-center mb-12 md:mb-16">
          <p className="text-primary font-black text-[10px] uppercase tracking-[0.3em] mb-3">
            Composición Olfativa
          </p>
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-charcoal">
            Notas que Respiran Frescura
          </h2>
        </div>

        {/* Tarjetas de Notas Olfativas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {notes.map((note, i) => (
            <div
              key={i}
              className="bg-surface-dark border border-border-dark rounded-3xl p-8 shadow-lg hover:border-primary/40 hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-start text-left"
            >
              {/* Círculo de Icono */}
              <div className="size-12 rounded-2xl bg-surface-lighter flex items-center justify-center text-2xl mb-6 border border-border-gold/30">
                {note.icon}
              </div>

              {/* Label de la Nota */}
              <span className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">
                {note.label}
              </span>

              {/* Título de la Nota */}
              <h3 className="text-lg font-black text-white mb-3 uppercase tracking-tight">
                {note.title}
              </h3>

              {/* Descripción */}
              <p className="text-xs text-text-muted font-light leading-relaxed">
                {note.desc}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
