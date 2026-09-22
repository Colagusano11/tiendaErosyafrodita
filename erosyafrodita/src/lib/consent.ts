export type ConsentStatus = "accepted" | "rejected";

const STORAGE_KEY = "cookie-consent";
const CHANGE_EVENT = "cookie-consent-change";

export function getConsent(): ConsentStatus | null {
  const value = localStorage.getItem(STORAGE_KEY);
  return value === "accepted" || value === "rejected" ? value : null;
}

export function setConsent(status: ConsentStatus): void {
  localStorage.setItem(STORAGE_KEY, status);
  window.dispatchEvent(new CustomEvent<ConsentStatus>(CHANGE_EVENT, { detail: status }));
}

export function onConsentChange(callback: (status: ConsentStatus) => void): () => void {
  const handler = (e: Event) => callback((e as CustomEvent<ConsentStatus>).detail);
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}
