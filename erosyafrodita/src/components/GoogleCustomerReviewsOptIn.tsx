import { useEffect } from "react";
import { getConsent, onConsentChange } from "../lib/consent";

declare global {
  interface Window {
    renderOptIn?: () => void;
    gapi?: {
      load: (api: string, callback: () => void) => void;
      surveyoptin: {
        render: (opts: {
          merchant_id: number;
          order_id: string;
          email: string;
          delivery_country: string;
          estimated_delivery_date: string;
          products?: { gtin: string }[];
        }) => void;
      };
    };
  }
}

// Google exige AAAA-MM-DD y solo admite un país por pedido, así que se
// calcula sobre el plazo real publicado en /legal/terminos: 5 días hábiles
// en España peninsular (el máximo del rango 2-5, para no prometer de menos).
function estimatedDeliveryDate(fromISO: string): string {
  const date = new Date(fromISO);
  let added = 0;
  while (added < 5) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return date.toISOString().slice(0, 10);
}

const MERCHANT_ID = 5857486407;

interface Props {
  orderId: string;
  email: string;
  orderDateISO: string;
  gtins: string[];
}

let scriptRequested = false;

function loadPlatformScript(): void {
  if (scriptRequested) return;
  scriptRequested = true;
  const script = document.createElement("script");
  script.src = "https://apis.google.com/js/platform.js?onload=renderOptIn";
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

/** Encuesta de opinión de Reseñas de Clientes de Google tras la compra (Merchant Center). Respeta el consentimiento de cookies. */
const GoogleCustomerReviewsOptIn: React.FC<Props> = ({ orderId, email, orderDateISO, gtins }) => {
  useEffect(() => {
    if (!email) return;

    const render = () => {
      window.renderOptIn = () => {
        window.gapi?.load("surveyoptin", () => {
          window.gapi?.surveyoptin.render({
            merchant_id: MERCHANT_ID,
            order_id: orderId,
            email,
            delivery_country: "ES",
            estimated_delivery_date: estimatedDeliveryDate(orderDateISO),
            ...(gtins.length > 0 ? { products: gtins.map((gtin) => ({ gtin })) } : {}),
          });
        });
      };
      loadPlatformScript();
      // Si el script ya estaba cargado de una visita/render anterior, el
      // onload no se dispara de nuevo: llamamos al callback nosotros mismos.
      if (window.gapi) window.renderOptIn();
    };

    if (getConsent() === "accepted") render();
    return onConsentChange((status) => {
      if (status === "accepted") render();
    });
  }, [orderId, email, orderDateISO, gtins]);

  return null;
};

export default GoogleCustomerReviewsOptIn;
