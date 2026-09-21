import React from "react";
import type { Producto } from "../../api/products";
import type { ProductMarketingContent } from "../../types/marketing";

interface ProductVideoSectionProps {
  product: Producto;
  marketing: ProductMarketingContent | null;
}

function getYoutubeEmbedId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([\w-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export const ProductVideoSection: React.FC<ProductVideoSectionProps> = ({ product, marketing }) => {
  const youtubeId = marketing?.youtubeUrl ? getYoutubeEmbedId(marketing.youtubeUrl) : null;

  if (!youtubeId && !marketing?.videoUrl) return null;

  return (
    <section className="w-full bg-background-dark text-white font-display py-16 md:py-24 border-t border-white/5">
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-10">

        {/* Contenedor de Video Centrado y Simplificado */}
        <div className="bg-surface-dark border border-border-dark rounded-[2.5rem] p-4 md:p-6 shadow-2xl overflow-hidden relative aspect-video w-full max-w-[960px] mx-auto">
          {/* Contenedor de recorte para el video */}
          <div className="w-full h-full overflow-hidden relative rounded-[1.8rem]">
            {youtubeId ? (
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${youtubeId}`}
                title={`Vídeo de ${product.nombre}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                autoPlay
                loop
                muted
                playsInline
                poster={marketing?.videoPoster}
                className="w-full h-full object-cover"
                aria-label={`Vídeo de ${product.nombre}`}
              >
                <source src={marketing!.videoUrl} type="video/mp4" />
              </video>
            )}
          </div>
          {/* Sombra interna decorativa */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none rounded-[2.5rem]" />
        </div>

      </div>
    </section>
  );
};
