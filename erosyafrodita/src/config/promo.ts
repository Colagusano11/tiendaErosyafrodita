// ============================================================
//  CONFIGURACIÓN DE PROMOCIÓN DE LANZAMIENTO
//  Para desactivar la promo: cambiar LAUNCH_PROMO_ACTIVE a false
//  Para cambiar el descuento: modificar LAUNCH_DISCOUNT (0.10 = 10%)
// ============================================================

export const LAUNCH_PROMO_ACTIVE = true;
export const LAUNCH_DISCOUNT = 0.10; // 10%

/** Devuelve el precio final aplicando la promo si está activa */
export function applyPromo(price: number): number {
  if (!LAUNCH_PROMO_ACTIVE || price <= 0) return price;
  return Math.round(price * (1 - LAUNCH_DISCOUNT) * 100) / 100;
}
