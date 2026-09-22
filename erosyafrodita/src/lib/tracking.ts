import "./analyticsLoader";

interface TrackedItem {
  id: string;
  name: string;
  price: number;
  quantity?: number;
  brand?: string;
}

function ga(name: string, params: Record<string, unknown>): void {
  if (typeof window.gtag === "function") window.gtag("event", name, params);
}

function fb(name: string, params: Record<string, unknown>): void {
  if (typeof window.fbq === "function") window.fbq("track", name, params);
}

export function trackViewItem(item: TrackedItem): void {
  ga("view_item", {
    currency: "EUR",
    value: item.price,
    items: [{ item_id: item.id, item_name: item.name, price: item.price, item_brand: item.brand }],
  });
  fb("ViewContent", {
    content_ids: [item.id],
    content_name: item.name,
    content_type: "product",
    value: item.price,
    currency: "EUR",
  });
}

export function trackAddToCart(item: TrackedItem): void {
  const qty = item.quantity ?? 1;
  const value = item.price * qty;
  ga("add_to_cart", {
    currency: "EUR",
    value,
    items: [{ item_id: item.id, item_name: item.name, price: item.price, quantity: qty }],
  });
  fb("AddToCart", {
    content_ids: [item.id],
    content_name: item.name,
    content_type: "product",
    value,
    currency: "EUR",
  });
}

export function trackRemoveFromCart(item: TrackedItem): void {
  const qty = item.quantity ?? 1;
  ga("remove_from_cart", {
    currency: "EUR",
    value: item.price * qty,
    items: [{ item_id: item.id, item_name: item.name, price: item.price, quantity: qty }],
  });
  // Sin equivalente estándar en Meta — no se envía CustomizeProduct sin más contexto.
}

export function trackBeginCheckout(items: TrackedItem[], value: number): void {
  ga("begin_checkout", {
    currency: "EUR",
    value,
    items: items.map((i) => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity ?? 1 })),
  });
  fb("InitiateCheckout", {
    content_ids: items.map((i) => i.id),
    contents: items.map((i) => ({ id: i.id, quantity: i.quantity ?? 1 })),
    value,
    currency: "EUR",
    num_items: items.reduce((n, i) => n + (i.quantity ?? 1), 0),
  });
}

export function trackPurchase(orderId: string, items: TrackedItem[], value: number): void {
  ga("purchase", {
    transaction_id: orderId,
    value,
    currency: "EUR",
    items: items.map((i) => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity ?? 1 })),
  });
  fb("Purchase", {
    content_ids: items.map((i) => i.id),
    contents: items.map((i) => ({ id: i.id, quantity: i.quantity ?? 1 })),
    value,
    currency: "EUR",
    num_items: items.reduce((n, i) => n + (i.quantity ?? 1), 0),
  });
}
