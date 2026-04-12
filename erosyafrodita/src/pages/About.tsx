
import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const About: React.FC = () => {
  return (
    <div className="bg-background-dark font-display text-white min-h-screen flex flex-col">
      <Header />
      <div className="relative min-h-[50vh] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center opacity-60" 
          style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuATNdr8Zkt9XbFuYM1lXYsWr7oSIKg2PXNGusY8wn1o8RM_xm2atSPb7pmViJi0CWdzfNVamkAeQvxLngmFgQjvzP-PxYG57j62ps0BOueEDZQl85XzPqCApLDZCVrAKNqMlC6YP_TmFIsweR41aqAY95ISqt2oMrMqcQjmVVuvIbefjoA-cSROP0ILooK1wByCXrVBhKwiq367-lPMkTVRysS1p2h5eILtXoduaaXBwAYq7D01W2TUObt9WE1kCP-zNPrfdbnfJsx3")' }}
        ></div>
        <div className="relative z-10 text-center px-4">
          <span className="text-primary font-bold tracking-[0.2em] uppercase text-sm">Nuestra Historia</span>
          <h1 className="text-5xl md:text-7xl font-bold mt-4 mb-6 italic">La Esencia de <span className="text-primary not-italic">los Dioses</span></h1>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-6 py-20 text-center text-lg text-gray-300 leading-relaxed">
        <p className="mb-6">En Erosyafrodita, creemos que el perfume no es solo un accesorio invisible, sino una extensión poderosa de tu personalidad. Es un arte líquido que evoca recuerdos, despierta emociones y narra historias sin palabras.</p>
        <p>Nuestra inspiración nace de la dualidad divina: la fuerza apasionada de Eros y la belleza sublime de Afrodita. Seleccionamos cuidadosamente cada fragancia para asegurar que cada gota sea una experiencia mística.</p>
      </div>
      <Footer />
    </div>
  );
};

export default About;
