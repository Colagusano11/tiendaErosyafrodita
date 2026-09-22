import React from "react";
import { useLocation } from "react-router-dom";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Red de seguridad estructural: sin esto, CUALQUIER error sin capturar en
 * cualquier página (un .toFixed() sobre undefined, un SDK de terceros que
 * peta, lo que sea) desmonta React entero y deja la página en blanco — el
 * patrón real detrás tanto del bug del Píxel de Meta como del bug del
 * carrito, ya arreglados ambos por separado. Esto no evita que existan esos
 * bugs, pero evita que UNO cualquiera tumbe la web entera sin aviso: en vez
 * de blanco, muestra un mensaje y deja recargar o volver al inicio.
 *
 * Se usa en DOS capas en App.tsx: RawErrorBoundary (esta clase, exportada
 * suelta) envuelve TODO, incluidos los providers (Cart/Wishlist/Auth/Alert)
 * — si uno de ellos falla al arrancar, esta es la única red que puede
 * atraparlo. El wrapper por defecto de abajo (con useLocation) va más
 * adentro, alrededor de las Routes, y se remonta solo al cambiar de página.
 */
export class RawErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("Error no capturado, atrapado por ErrorBoundary:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-background-dark text-charcoal min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center">
          <span className="material-symbols-outlined text-primary text-[56px]">error</span>
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-black">Algo ha fallado al cargar esta página</h1>
            <p className="text-sm text-charcoal/50 max-w-sm">
              No es culpa tuya — ha ocurrido un error inesperado. Prueba a recargar o vuelve al inicio.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-primary text-charcoal rounded-full font-black text-xs uppercase tracking-widest"
            >
              Recargar
            </button>
            <a
              href="/"
              className="px-6 py-3 border border-charcoal/20 rounded-full font-black text-xs uppercase tracking-widest"
            >
              Volver al inicio
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Envoltorio funcional que remonta el ErrorBoundary al cambiar de ruta
 * (key=pathname) — así, si una página falla, navegar a otra (con el botón
 * "Volver al inicio" o el menú) no se queda bloqueada en el mensaje de
 * error de la página anterior.
 */
const ErrorBoundary: React.FC<Props> = ({ children }) => {
  const location = useLocation();
  return <RawErrorBoundary key={location.pathname}>{children}</RawErrorBoundary>;
};

export default ErrorBoundary;
