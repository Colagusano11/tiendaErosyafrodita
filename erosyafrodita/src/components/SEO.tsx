import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  // Datos extra para páginas de producto
  type?: 'website' | 'product';
  price?: string;
  availability?: 'in stock' | 'out of stock' | 'preorder';
  brand?: string;
  ean?: string;
}

const SITE_NAME  = 'AGE Parfums';
const SITE_URL   = 'https://erosyafrodita.com';
const OG_DEFAULT = `${SITE_URL}/og-image.png`;

const SEO: React.FC<SEOProps> = ({
  title,
  description = 'Boutique exclusiva de perfumes de lujo. Descubre la esencia de los dioses en AGE Parfums.',
  keywords    = 'perfumes, lujo, belleza, AGE Parfums, fragancias',
  image       = OG_DEFAULT,
  url,
  type        = 'website',
  price,
  availability,
  brand,
  ean,
}) => {
  const pageTitle = title
    ? (title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`)
    : `${SITE_NAME} — Perfumes y Fragancias de Lujo`;

  // Canonical: siempre sin el hash — apunta a la URL limpia
  // Las SPAs con hash-routing tienen el mismo dominio para todos los productos;
  // el canonical correcto es la URL sin fragmento para evitar contenido duplicado.
  const canonical = url ?? `${SITE_URL}${window.location.pathname}`;

  // Imagen absoluta
  const ogImage = image.startsWith('http') ? image : `${SITE_URL}${image}`;

  return (
    <Helmet>
      {/* ── Básicos ───────────────────────────────────────────────────────── */}
      <title>{pageTitle}</title>
      <meta name="description"  content={description} />
      <meta name="keywords"     content={keywords} />
      <link rel="canonical"     href={canonical} />

      {/* ── Open Graph ────────────────────────────────────────────────────── */}
      <meta property="og:site_name"   content={SITE_NAME} />
      <meta property="og:url"         content={canonical} />
      <meta property="og:type"        content={type === 'product' ? 'og:product' : 'website'} />
      <meta property="og:title"       content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image"       content={ogImage} />
      <meta property="og:image:width"  content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale"      content="es_ES" />

      {/* ── OG Producto (solo en páginas de producto) ─────────────────────── */}
      {type === 'product' && price && (
        <meta property="product:price:amount"   content={price} />
      )}
      {type === 'product' && (
        <meta property="product:price:currency" content="EUR" />
      )}
      {type === 'product' && availability && (
        <meta property="product:availability"   content={availability} />
      )}
      {type === 'product' && brand && (
        <meta property="product:brand"          content={brand} />
      )}
      {type === 'product' && ean && (
        <meta property="product:retailer_item_id" content={ean} />
      )}

      {/* ── Twitter / X Cards ─────────────────────────────────────────────── */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:site"        content="@erosyafrodita" />
      <meta name="twitter:title"       content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image"       content={ogImage} />

      {/* ── Google / Structured-data helpers ─────────────────────────────── */}
      <meta itemProp="name"        content={pageTitle} />
      <meta itemProp="description" content={description} />
      <meta itemProp="image"       content={ogImage} />
    </Helmet>
  );
};

export default SEO;
