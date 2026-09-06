import React from "react";
import type { ProductMarketingContent } from "../../types/marketing";

interface FragranceProfileProps {
  marketing: ProductMarketingContent | null;
}

export const FragranceProfile: React.FC<FragranceProfileProps> = ({ marketing }) => {
  // Si no hay datos olfativos, no renderizamos el bloque
  if (
    !marketing ||
    (!marketing.fragranceFamily &&
      !marketing.topNotes?.length &&
      !marketing.heartNotes?.length &&
      !marketing.baseNotes?.length)
  ) {
    return null;
  }

  const sections = [
    {
      label: "Notas de Salida",
      time: "Primeros 15 minutos",
      notes: marketing.topNotes || [],
      description: "El primer saludo aromático, notas frescas y volátiles que despiertan el sentido."
    },
    {
      label: "Notas de Corazón",
      time: "Siguientes 2 - 4 horas",
      notes: marketing.heartNotes || [],
      description: "El alma verdadera de la fragancia, que define su personalidad y carácter floral o aromático."
    },
    {
      label: "Notas de Fondo",
      time: "Permanencia final en piel",
      notes: marketing.baseNotes || [],
      description: "La fijación profunda que proporciona calidez, persistencia y profundidad amaderada."
    }
  ];

  return (
    <section className="w-full bg-perfume-sand-dark text-perfume-green font-display py-16 md:py-24 border-b border-perfume-sand-dark/60">
      <div className="w-full max-w-[1100px] mx-auto px-4 md:px-10">
        
        {/* Cabecera de Sección */}
        <div className="text-center mb-12 md:mb-16">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-perfume-green/60 block mb-2">
            Estructura Aromática
          </span>
          <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-perfume-green">
            Perfil de la Fragancia
          </h3>
          {marketing.fragranceFamily && (
            <p className="text-xs font-bold text-perfume-green/70 mt-2 uppercase tracking-widest bg-white border border-perfume-sand-dark inline-block px-4 py-1.5 rounded-full">
              Familia: <span className="text-perfume-green font-black">{marketing.fragranceFamily}</span>
            </p>
          )}
        </div>

        {/* Estructura Olfativa */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {sections.map((sec, idx) => (
            <div 
              key={idx} 
              className="bg-white rounded-3xl p-8 border border-perfume-sand-dark flex flex-col justify-between shadow-sm hover:border-perfume-green/30 transition-all duration-300"
            >
              <div>
                {/* Cabecera de la Nota */}
                <div className="flex justify-between items-baseline mb-4 pb-4 border-b border-perfume-sand-dark">
                  <h4 className="text-xs font-black uppercase tracking-widest text-perfume-green">
                    {sec.label}
                  </h4>
                  <span className="text-[9px] font-bold text-perfume-green/50 uppercase tracking-wider">
                    {sec.time}
                  </span>
                </div>

                {/* Explicación de la Nota */}
                <p className="text-[10px] text-perfume-green/60 leading-relaxed mb-6">
                  {sec.description}
                </p>
              </div>

              {/* Lista de Notas concretas */}
              <div className="flex flex-wrap gap-2">
                {sec.notes.length > 0 ? (
                  sec.notes.map((note, nIdx) => (
                    <span 
                      key={nIdx}
                      className="px-3.5 py-1.5 rounded-xl bg-perfume-sand text-perfume-green text-[9px] font-black uppercase border border-perfume-sand-dark/60 tracking-wider"
                    >
                      {note}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-perfume-green/30 italic">No especificadas</span>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
