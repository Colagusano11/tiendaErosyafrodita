import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const WhatsAppButton: React.FC = () => {
    // Reemplaza con el número real de la empresa
    const phoneNumber = "34685611801"; 
    const message = encodeURIComponent("Hola Eros & Afrodita, tengo una consulta sobre un producto...");
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

    return (
        <motion.a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, scale: 0.5, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            whileHover={{ scale: 1.1, y: -5 }}
            whileTap={{ scale: 0.9 }}
            className="fixed bottom-8 right-8 z-[90] size-16 bg-[#25D366] rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(37,211,102,0.4)] group overflow-hidden"
        >
            {/* Efecto de pulso radante */}
            <div className="absolute inset-0 bg-white/20 scale-0 group-hover:scale-150 transition-transform duration-700 rounded-full"></div>
            
            <svg 
                viewBox="0 0 24 24" 
                className="size-8 fill-white relative z-10"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217s.231.004.332.009c.109.004.258-.041.405.314.159.386.541 1.32.588 1.417.047.097.079.21.014.339-.065.129-.098.21-.195.323-.097.113-.204.253-.292.341-.101.101-.206.211-.089.412.116.201.517.85 1.109 1.377.761.68 1.4.89 1.602.989.201.099.319.083.439-.054.12-.138.513-.598.65-.802.138-.204.275-.171.462-.101.188.07.1.58.54 1.324.013.023.026.046.039.068.125.195.039.638-.105 1.043zM12 2C6.477 2 2 6.477 2 12c0 1.891.526 3.66 1.438 5.17L2 22l4.981-1.309A9.948 9.948 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18c-1.724 0-3.334-.51-4.685-1.385l-.336-.216-2.79.734.746-2.726-.236-.376A7.954 7.954 0 014 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z" />
            </svg>

            {/* Etiqueta flotante al hover */}
            <div className="absolute right-20 bg-charcoal text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-white/10 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all pointer-events-none whitespace-nowrap shadow-2xl">
                ¿Necesitas ayuda sagrada?
            </div>
        </motion.a>
    );
};

export default WhatsAppButton;
