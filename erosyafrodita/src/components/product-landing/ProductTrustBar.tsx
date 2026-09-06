import React from "react";

export const ProductTrustBar: React.FC = () => {
  const phoneNumber = "34685611801"; 
  const message = encodeURIComponent("Hola AGE Parfums, tengo una consulta sobre un producto...");
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  const trustItems = [
    {
      icon: "verified",
      title: "Fragancia 100% Original",
      desc: "Garantizada. Adquirida solo de distribuidores y canales oficiales."
    },
    {
      icon: "local_shipping",
      title: "Envío 24 - 48 Horas",
      desc: "Entrega express en toda España peninsular. Gratis a partir de 49€."
    },
    {
      icon: "keyboard_return",
      title: "Devolución en 14 Días",
      desc: "Compra con total tranquilidad. Garantía de retorno simple."
    },
    {
      icon: "shield_lock",
      title: "Pago 100% Seguro",
      desc: "Transacciones encriptadas mediante tarjeta, PayPal y Revolut."
    }
  ];

  return (
    <section className="w-full bg-perfume-sand-dark text-perfume-green font-display py-10 border-b border-perfume-sand-dark/60">
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-10">
        
        {/* Grilla de Confianza */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {trustItems.map((item, idx) => (
            <div key={idx} className="flex gap-4 items-start">
              <div className="size-10 rounded-full bg-white flex items-center justify-center border border-perfume-sand-dark shrink-0 text-perfume-green">
                <span className="material-symbols-outlined !text-[20px]">{item.icon}</span>
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider mb-1 text-perfume-green">
                  {item.title}
                </h4>
                <p className="text-[10px] text-perfume-green/60 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Banner de Contacto WhatsApp */}
        <div className="mt-10 p-6 rounded-3xl bg-white border border-perfume-sand-dark/80 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
          <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
            <div className="size-12 rounded-full bg-[#25D366]/10 flex items-center justify-center text-[#25D366] shrink-0 border border-[#25D366]/20">
              <svg viewBox="0 0 24 24" className="size-6 fill-[#25D366]" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217s.231.004.332.009c.109.004.258-.041.405.314.159.386.541 1.32.588 1.417.047.097.079.21.014.339-.065.129-.098.21-.195.323-.097.113-.204.253-.292.341-.101.101-.206.211-.089.412.116.201.517.85 1.109 1.377.761.68 1.4.89 1.602.989.201.099.319.083.439-.054.12-.138.513-.598.65-.802.138-.204.275-.171.462-.101.188.07.1.58.54 1.324.013.023.026.046.039.068.125.195.039.638-.105 1.043zM12 2C6.477 2 2 6.477 2 12c0 1.891.526 3.66 1.438 5.17L2 22l4.981-1.309A9.948 9.948 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18c-1.724 0-3.334-.51-4.685-1.385l-.336-.216-2.79.734.746-2.726-.236-.376A7.954 7.954 0 014 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-wider text-perfume-green mb-1">
                ¿Tienes alguna consulta especial?
              </h4>
              <p className="text-[10px] text-perfume-green/60 max-w-md leading-relaxed">
                Contacta con nuestro equipo de asesores de belleza a través de WhatsApp. Te responderemos al instante.
              </p>
            </div>
          </div>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 h-12 rounded-full border border-perfume-green text-perfume-green hover:bg-perfume-green hover:text-perfume-sand text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shrink-0 shadow-sm"
          >
            <span>Preguntar por WhatsApp</span>
            <span className="material-symbols-outlined !text-[16px]">chat</span>
          </a>
        </div>

      </div>
    </section>
  );
};
