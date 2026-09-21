import React from "react";

interface SecondaryImage {
  src: string;
  alt: string;
}

interface GalleryVideo {
  url: string;
  poster?: string;
  youtubeUrl?: string;
}

interface ProductGalleryGridProps {
  mainImage: string;
  mainAlt: string;
  secondaryImages?: SecondaryImage[];
  video?: GalleryVideo;
}

function getYoutubeEmbedId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([\w-]{11})/);
  return match ? match[1] : null;
}

export const ProductGalleryGrid: React.FC<ProductGalleryGridProps> = ({
  mainImage,
  mainAlt,
  secondaryImages = [],
  video,
}) => {
  const youtubeId = video?.youtubeUrl ? getYoutubeEmbedId(video.youtubeUrl) : null;
  const hasVideo = !!(youtubeId || video?.url);

  // El vídeo ocupa una tarjeta secundaria; el resto se rellena con fotos (máx. 2 tarjetas en total)
  const imageSlots = secondaryImages.slice(0, hasVideo ? 1 : 2);
  const totalSecondary = imageSlots.length + (hasVideo ? 1 : 0);

  return (
    <section className="w-full bg-background-dark text-charcoal font-display py-16 md:py-24 border-t border-charcoal/5">
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-10">

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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Imagen Principal (Izquierda) — proporción fija propia, independiente de lo alto que salga la columna del vídeo */}
          <div className={`rounded-3xl overflow-hidden border border-border-dark bg-surface-dark shadow-2xl hover:border-primary/30 transition-all duration-300 flex items-center justify-center aspect-square ${totalSecondary > 0 ? "lg:col-span-7" : "lg:col-span-12"}`}>
            <img
              src={mainImage}
              alt={mainAlt}
              className="w-full h-full object-contain p-6 lg:p-10"
            />
          </div>

          {/* Tarjetas secundarias a la derecha (fotos + vídeo, máx. 2 en total) */}
          {totalSecondary > 0 && (
            <div className="lg:col-span-5 flex flex-col gap-6 justify-between">
              {hasVideo && (
                <div className="rounded-2xl overflow-hidden border border-border-dark bg-surface-dark shadow-xl hover:border-primary/30 transition-all duration-300 aspect-[4/3]">
                  {youtubeId ? (
                    <iframe
                      className="w-full h-full"
                      src={`https://www.youtube.com/embed/${youtubeId}`}
                      title={mainAlt}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      poster={video?.poster}
                      className="w-full h-full object-cover"
                      aria-label={mainAlt}
                    >
                      <source src={video!.url} type="video/mp4" />
                    </video>
                  )}
                </div>
              )}
              {imageSlots.map((img, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-border-dark bg-surface-dark shadow-xl hover:border-primary/30 transition-all duration-300 flex items-center justify-center aspect-[4/3]">
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="w-full h-full object-contain p-4"
                  />
                </div>
              ))}
            </div>
          )}

        </div>

      </div>
    </section>
  );
};
