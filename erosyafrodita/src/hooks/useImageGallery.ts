import { useState, useEffect } from "react";

/**
 * Hook que recibe una lista de URLs de imágenes y devuelve solo aquellas que cargan correctamente.
 * Útil para filtrar imágenes rotas de proveedores como BTS.
 */
export function useImageGallery(urls: (string | null | undefined)[]) {
  const [validUrls, setValidUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const imagesToTest = urls.filter((url): url is string => !!url);
    
    if (imagesToTest.length === 0) {
      setValidUrls([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let completed = 0;
    const results: string[] = [];

    imagesToTest.forEach((url) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        results.push(url);
        checkFinished();
      };
      img.onerror = () => {
        checkFinished();
      };
    });

    const checkFinished = () => {
      completed++;
      if (completed === imagesToTest.length) {
        // Mantenemos el orden original de las URLs válidas
        const orderedValid = imagesToTest.filter(u => results.includes(u));
        setValidUrls(orderedValid);
        setLoading(false);
      }
    };
  }, [urls.join(",")]); // Re-ejecutar si la lista de URLs cambia

  return { validUrls, loading };
}
