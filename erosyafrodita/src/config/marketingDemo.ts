import { ProductMarketingContent } from "../types/marketing";

// Contenido de landing por producto: un archivo JSON por EAN en src/content/landing/.
// Precio y stock NUNCA viven aquí — siempre vienen en vivo del objeto Producto
// que devuelve la API (alimentada por SellerKing). Este contenido es solo
// texto/SEO/notas editoriales para la ficha de producto.
const LANDING_MODULES = import.meta.glob<{ default: ProductMarketingContent }>(
  "../content/landing/*.json",
  { eager: true }
);

const LANDING_BY_EAN: Record<string, ProductMarketingContent> = {};
for (const path in LANDING_MODULES) {
  const ean = path.match(/([^/]+)\.json$/)?.[1];
  if (ean) LANDING_BY_EAN[ean] = LANDING_MODULES[path].default;
}

/**
 * Devuelve el contenido de landing de un producto por su EAN, o null si
 * todavía no se ha creado su archivo en src/content/landing/.
 */
export function getMarketingContent(ean?: string | null): ProductMarketingContent | null {
  if (!ean) return null;
  return LANDING_BY_EAN[ean] ?? null;
}
