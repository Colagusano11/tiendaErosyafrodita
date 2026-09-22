declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
    fbq: ((...args: unknown[]) => void) & {
      queue?: unknown[];
      loaded?: boolean;
      version?: string;
      push?: Window["fbq"];
      callMethod?: (...args: unknown[]) => void;
    };
    _fbq?: Window["fbq"];
  }
}

let gaLoaded = false;
let pixelLoaded = false;

function loadGoogleAnalytics(): void {
  const gaId = import.meta.env.VITE_GA_ID;
  if (!gaId || gaId === "G-XXXXXXXXXX" || gaLoaded) return;
  gaLoaded = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", gaId);

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(script);
}

function loadMetaPixel(): void {
  const pixelId = import.meta.env.VITE_META_PIXEL_ID;
  if (!pixelId || pixelLoaded) return;
  pixelLoaded = true;

  // Snippet oficial de Meta (fbevents.js) — replicado literal, incluido el
  // detalle de que la cola se rellena con queue.push(arguments) (un único
  // elemento = los argumentos de esa llamada), NO queue.push.apply(n, args):
  // esto último llama a Array.prototype.push con `this` apuntando a la
  // propia función `n`, y en un bundle ES module (siempre en modo strict)
  // intentar reescribir Function.prototype.length (no editable) petaba con
  // "Cannot assign to read only property 'length'" — reventaba React entero
  // en cuanto se cargaba el píxel (pantalla en blanco, sin ningún 404 detrás).
  (function (f: Window, b: Document, e: string, v: string) {
    if (f.fbq) return;
    const n: Window["fbq"] = function () {
      // eslint-disable-next-line prefer-rest-params
      if (n.callMethod) n.callMethod.apply(n, arguments as unknown as unknown[]);
      // eslint-disable-next-line prefer-rest-params
      else n.queue!.push(arguments as unknown as unknown[]);
    } as Window["fbq"];
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    const t = b.createElement(e) as HTMLScriptElement;
    t.async = true;
    t.src = v;
    const s = b.getElementsByTagName(e)[0];
    s.parentNode!.insertBefore(t, s);
    f.fbq = n;
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

  window.fbq("init", pixelId);
  window.fbq("track", "PageView");
}

/** Carga GA4 y Meta Pixel solo si el usuario ya dio su consentimiento. Idempotente. */
export function loadAnalyticsIfConsented(): void {
  if (localStorage.getItem("cookie-consent") !== "accepted") return;
  loadGoogleAnalytics();
  loadMetaPixel();
}
