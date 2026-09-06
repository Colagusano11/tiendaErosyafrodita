import React from "react";

export const ProductGalleryGrid: React.FC = () => {
  return (
    <section className="w-full bg-background-dark text-charcoal font-display py-16 md:py-24 border-t border-charcoal/5">
      <div className="w-full max-w-[1200px] mx-auto px-4 md:px-10">
        
        {/* Cabecera decorativa opcional */}
        <div className="text-center mb-12">
          <p className="text-primary font-black text-[10px] uppercase tracking-[0.3em] mb-3">
            Galería del Producto
          </p>
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-charcoal">
            Elegancia en cada ángulo
          </h2>
        </div>

        {/* Grilla de Imágenes en fondo oscuro */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Imagen Principal (Izquierda) */}
          <div className="lg:col-span-7 rounded-3xl overflow-hidden border border-border-dark bg-surface-dark shadow-2xl hover:border-primary/30 transition-all duration-300">
            <img
              src="/uploads/lacoste.jpg"
              alt="Lacoste L.12.12 Blanc"
              className="w-full h-full object-cover aspect-video lg:aspect-auto min-h-[300px] lg:min-h-[500px]"
            />
          </div>

          {/* Dos imágenes secundarias a la derecha */}
          <div className="lg:col-span-5 flex flex-col gap-6 justify-between">
            <div className="rounded-2xl overflow-hidden border border-border-dark bg-surface-dark shadow-xl hover:border-primary/30 transition-all duration-300">
              <img
                src="/uploads/lacoste1.jpg"
                alt="Detalle de fragancia"
                className="w-full object-cover aspect-[4/3]"
              />
            </div>
            <div className="rounded-2xl overflow-hidden border border-border-dark bg-surface-dark shadow-xl hover:border-primary/30 transition-all duration-300">
              <img
                src="/uploads/lacoste2.jpg"
                alt="Ambiente Lacoste"
                className="w-full object-cover aspect-[4/3]"
              />
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
