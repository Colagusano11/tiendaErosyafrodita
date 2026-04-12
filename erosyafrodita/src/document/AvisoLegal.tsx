import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

const AvisoLegal: React.FC = () => {
  return (
    <div className="bg-background-dark font-display text-white min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow w-full max-w-4xl mx-auto px-4 md:px-10 py-12">
        {/* Título */}
        <div className="mb-10 border-b border-[#493f22] pb-8">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white uppercase">
            Aviso Legal
          </h1>
          <p className="mt-3 text-sm text-[#cbbc90]">
            En cumplimiento con el deber de información dispuesto en la Ley 34/2002 de Servicios de la Sociedad de la Información y el Comercio Electrónico (LSSI-CE) de 11 de julio, se facilitan a continuación los siguientes datos de información general de este sitio web:
          </p>
        </div>

        {/* Datos de la empresa */}
        <div className="bg-[#1a170d] border border-[#493f22]/50 rounded-2xl p-6 md:p-8 mb-10">
          <h2 className="text-primary text-xs font-black uppercase tracking-widest mb-5">
            Datos Identificativos
          </h2>
          <ul className="flex flex-col gap-3 text-sm text-gray-300">
            <li className="flex gap-3">
              <span className="text-primary shrink-0">·</span>
              <span><span className="text-white font-semibold">Denominación Social:</span> CELEGOR SL</span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary shrink-0">·</span>
              <span><span className="text-white font-semibold">NIF/CIF:</span> ESB81267163</span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary shrink-0">·</span>
              <span><span className="text-white font-semibold">Domicilio Social:</span> AVDA. SANTA EUGENIA N. 29 – 28031 MADRID</span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary shrink-0">·</span>
              <span>
                <span className="text-white font-semibold">Correo Electrónico de Contacto:</span>{" "}
                <a href="mailto:erosyafrodita.com@gmail.com" className="text-primary hover:underline">
                  erosyafrodita.com@gmail.com
                </a>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary shrink-0">·</span>
              <span>
                <span className="text-white font-semibold">Teléfono de Contacto:</span>{" "}
                <a href="tel:+34685611801" className="text-primary hover:underline">
                  +34 685 611 801
                </a>
              </span>
            </li>
          </ul>
          <div className="mt-6 pt-6 border-t border-[#493f22]/50">
            <p className="text-xs text-[#cbbc90] leading-relaxed">
              INSCRITA EN EL REGISTRO MERCANTIL DE MADRID. TOMO 9881. LIBRO 0. FOLIO 90. SECCIÓN 8. HOJA M-158397. INSCRIP. 1ª
            </p>
          </div>
        </div>

        {/* Secciones legales */}
        <div className="flex flex-col gap-8">

          <section>
            <h2 className="text-white text-lg font-black uppercase tracking-wide mb-3 flex items-center gap-3">
              <span className="w-1 h-5 bg-primary rounded-full inline-block"></span>
              Objeto
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              El presente Aviso Legal regula el acceso y el uso del sitio web{" "}
              <span className="text-primary font-medium">www.erosyafrodita.com</span>, incluyendo los contenidos y servicios puestos a disposición de los usuarios en y/o a través de él.
            </p>
          </section>

          <section>
            <h2 className="text-white text-lg font-black uppercase tracking-wide mb-3 flex items-center gap-3">
              <span className="w-1 h-5 bg-primary rounded-full inline-block"></span>
              Condiciones de Uso
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              El acceso a este sitio web atribuye la condición de usuario e implica la aceptación plena y sin reservas de todas y cada una de las disposiciones incluidas en este Aviso Legal. El usuario se compromete a utilizar el sitio web, sus servicios y contenidos sin contravenir la legislación vigente, la buena fe y el orden público.
            </p>
          </section>

          <section>
            <h2 className="text-white text-lg font-black uppercase tracking-wide mb-3 flex items-center gap-3">
              <span className="w-1 h-5 bg-primary rounded-full inline-block"></span>
              Propiedad Intelectual e Industrial
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Todos los derechos de propiedad intelectual e industrial del sitio web{" "}
              <span className="text-primary font-medium">www.erosyafrodita.com</span> y de sus contenidos (imágenes, textos, diseños, logotipos, etc.) son propiedad de CELEGOR, S.L. o de terceros que han autorizado su uso. Queda expresamente prohibida la reproducción, distribución, comunicación pública y transformación, total o parcial, de los contenidos de este sitio web, sin la autorización previa y expresa de CELEGOR, S.L.
            </p>
          </section>

          <section>
            <h2 className="text-white text-lg font-black uppercase tracking-wide mb-3 flex items-center gap-3">
              <span className="w-1 h-5 bg-primary rounded-full inline-block"></span>
              Exclusión de Garantías y Responsabilidad
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              CELEGOR, S.L. no se hace responsable de los daños y perjuicios que pudieran derivarse de la utilización de este sitio web o de sus contenidos, ni garantiza la ausencia de virus u otros elementos lesivos que pudieran causar daños o alteraciones en el sistema informático del usuario.
            </p>
          </section>

          <section>
            <h2 className="text-white text-lg font-black uppercase tracking-wide mb-3 flex items-center gap-3">
              <span className="w-1 h-5 bg-primary rounded-full inline-block"></span>
              Modificaciones
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              CELEGOR, S.L. se reserva el derecho de efectuar sin previo aviso las modificaciones que considere oportunas en su sitio web, pudiendo cambiar, suprimir o añadir tanto los contenidos y servicios que se presten a través de la misma como la forma en la que éstos aparezcan presentados o localizados en su sitio web.
            </p>
          </section>

          <section>
            <h2 className="text-white text-lg font-black uppercase tracking-wide mb-3 flex items-center gap-3">
              <span className="w-1 h-5 bg-primary rounded-full inline-block"></span>
              Legislación Aplicable y Jurisdicción
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              El presente Aviso Legal se rige por la legislación española. Para la resolución de cualquier controversia que pudiera surgir con motivo del acceso o uso de este sitio web, las partes se someten a los Juzgados y Tribunales de la ciudad de Madrid, salvo que la ley establezca otra cosa.
            </p>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AvisoLegal;