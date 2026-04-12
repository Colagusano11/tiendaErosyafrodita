
import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Faq: React.FC = () => {
  return (
    <div className="bg-background-dark font-display text-white min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-16">
        <h1 className="text-4xl font-bold text-center mb-10">Preguntas Frecuentes</h1>
        <div className="space-y-4">
          <details className="bg-surface-dark border border-border-dark rounded-xl p-4 cursor-pointer group">
            <summary className="font-bold flex justify-between items-center list-none outline-none">
              ¿Donde realizamos nuestros pedidos? 
              <span className="material-symbols-outlined group-open:rotate-180 transition-transform">expand_more</span>
            </summary>
            <p className="mt-4 text-gray-400">Realizamos nuestros pedidos a toda España (excepto Canarias, Ceuta y Melilla), y a todos los países de Europa (exceptuando Reino unido e Islas Portuguesas).</p>
          </details>
          <details className="bg-surface-dark border border-border-dark rounded-xl p-4 cursor-pointer group">
            <summary className="font-bold flex justify-between items-center list-none outline-none">
              ¿Cuál es la política de devoluciones? 
              <span className="material-symbols-outlined group-open:rotate-180 transition-transform">expand_more</span>
            </summary>
            <p className="mt-4 text-gray-400">Aceptamos devoluciones gratuitas dentro de los 30 días posteriores a la compra, siempre que el producto esté en su embalaje original y con el sello de seguridad intacto.</p>
          </details>
          <details className="bg-surface-dark border border-border-dark rounded-xl p-4 cursor-pointer group">
            <summary className="font-bold flex justify-between items-center list-none outline-none">
              ¿Son originales los perfumes? 
              <span className="material-symbols-outlined group-open:rotate-180 transition-transform">expand_more</span>
            </summary>
            <p className="mt-4 text-gray-400">Absolutamente. En Erosyafrodita solo trabajamos directamente con las casas de moda y distribuidores oficiales. Garantizamos la autenticidad de cada frasco.</p>
          </details>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Faq;
