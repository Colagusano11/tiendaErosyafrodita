import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
}

const SEO: React.FC<SEOProps> = ({ 
  title = "Eros & Afrodita - Lujo y Belleza", 
  description = "Boutique exclusiva de rituales de belleza y lujo. Descubre la esencia de los dioses.",
  keywords = "lujo, belleza, cosmética premium, Eros y Afrodita",
  image = "/og-image.png",
  url = "https://erosyafrodita.com"
}) => {
  const siteTitle = title.includes("Eros & Afrodita") ? title : `${title} | Eros & Afrodita`;
  const canonicalUrl = window.location.origin + window.location.pathname;

  return (
    <Helmet>
      <link rel="canonical" href={canonicalUrl} />
      {/* HTML Meta Tags */}
      <title>{siteTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Google / Search Engine Tags */}
      <meta itemProp="name" content={siteTitle} />
      <meta itemProp="description" content={description} />
      <meta itemProp="image" content={image} />

      {/* Facebook Meta Tags */}
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
};

export default SEO;
