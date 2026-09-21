import React, { useMemo, useState } from "react";
import type { Producto } from "../../api/products";
import type { ProductMarketingContent } from "../../types/marketing";

interface ProductInfoTabsProps {
  product: Producto;
  marketing: ProductMarketingContent | null;
}

interface Tab {
  key: string;
  label: string;
  content: string;
}

export const ProductInfoTabs: React.FC<ProductInfoTabsProps> = ({ product, marketing }) => {
  const tabs = useMemo<Tab[]>(() => {
    const candidates: Tab[] = [
      { key: "descripcion", label: "Descripción", content: marketing?.shortDescription || product.descripcion || "" },
      { key: "info", label: "Información del producto", content: marketing?.productInfo || "" },
      { key: "aplicacion", label: "Aplicación", content: marketing?.application || "" },
      { key: "ingredientes", label: "Ingredientes", content: marketing?.ingredients || "" },
      { key: "fabricante", label: "Fabricante", content: marketing?.manufacturerInfo || "" },
    ];
    return candidates.filter((t) => t.content.trim().length > 0);
  }, [product.descripcion, marketing]);

  const [activeKey, setActiveKey] = useState(tabs[0]?.key);
  const active = tabs.find((t) => t.key === activeKey) ?? tabs[0];

  if (tabs.length === 0) return null;

  return (
    <section className="w-full bg-perfume-sand text-perfume-green font-display py-12 md:py-16 border-b border-perfume-sand-dark">
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-10">

        {/* Barra de pestañas */}
        <div className="flex flex-wrap gap-x-8 gap-y-3 border-b border-perfume-sand-dark mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveKey(tab.key)}
              className={`pb-3 text-sm font-black uppercase tracking-wide transition-colors border-b-2 -mb-px
                ${active?.key === tab.key
                  ? "text-perfume-green border-perfume-green"
                  : "text-perfume-green/40 border-transparent hover:text-perfume-green/70"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenido de la pestaña activa */}
        <div className="text-xl text-perfume-green/80 font-light leading-relaxed max-w-[900px] whitespace-pre-line">
          {active?.content}
        </div>

      </div>
    </section>
  );
};
