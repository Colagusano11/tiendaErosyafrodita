import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

const Privacidad: React.FC = () => {
  return (
    <div className="bg-background-dark font-display text-white min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow w-full max-w-4xl mx-auto px-4 md:px-10 py-12">
        {/* Título */}
        <div className="mb-10 border-b border-[#493f22] pb-8">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white uppercase">
            Política de Privacidad
          </h1>
          <p className="mt-3 text-sm text-[#cbbc90]">
            En CELEGOR, S.L., nos tomamos muy en serio la protección de tus datos personales. Por eso, queremos ser transparentes sobre cómo los recogemos, usamos y protegemos.
          </p>
        </div>

        <div className="flex flex-col gap-10">

          {/* 1. Responsable */}
          <section>
            <h2 className="text-white text-lg font-black uppercase tracking-wide mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-black shrink-0">1</span>
              ¿Quién es el Responsable del Tratamiento de tus Datos?
            </h2>
            <div className="bg-[#1a170d] border border-[#493f22]/50 rounded-2xl p-6">
              <ul className="flex flex-col gap-3 text-sm text-gray-300">
                <li className="flex gap-3">
                  <span className="text-primary shrink-0">·</span>
                  <span><span className="text-white font-semibold">Identidad:</span> CELEGOR, S.L.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary shrink-0">·</span>
                  <span><span className="text-white font-semibold">NIF/CIF:</span> ESB81267163</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary shrink-0">·</span>
                  <span><span className="text-white font-semibold">Dirección Postal:</span> AVDA. SANTA EUGENIA N. 29 – 28031 MADRID</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary shrink-0">·</span>
                  <span>
                    <span className="text-white font-semibold">Correo Electrónico:</span>{" "}
                    <a href="mailto:erosyafrodita.com@gmail.com" className="text-primary hover:underline">
                      erosyafrodita.com@gmail.com
                    </a>
                  </span>
                </li>
              </ul>
            </div>
          </section>

          {/* 2. Qué datos recogemos */}
          <section>
            <h2 className="text-white text-lg font-black uppercase tracking-wide mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-black shrink-0">2</span>
              ¿Qué Datos Personales Recogemos y Para Qué los Usamos?
            </h2>
            <p className="text-gray-400 text-sm mb-5 leading-relaxed">
              Recogemos y tratamos los datos personales que nos proporcionas cuando:
            </p>
            <div className="flex flex-col gap-4">
              {[
                {
                  titulo: "Realizas una compra",
                  datos: "Nombre, apellidos, dirección de envío, email, teléfono, datos de pago.",
                  finalidad: "Gestionar tu pedido, procesar el pago, enviar los productos y gestionar posibles devoluciones o incidencias.",
                  base: "Ejecución de un contrato (la compra que realizas) y cumplimiento de obligaciones legales (facturación).",
                },
                {
                  titulo: "Te registras en nuestra web",
                  datos: "Nombre, apellidos, email.",
                  finalidad: "Crear y gestionar tu cuenta de usuario, facilitar futuras compras y ofrecerte una experiencia personalizada.",
                  base: "Consentimiento del interesado.",
                },
                {
                  titulo: "Te suscribes a nuestra newsletter",
                  datos: "Email.",
                  finalidad: "Enviarte información sobre nuestros productos, ofertas y novedades.",
                  base: "Consentimiento del interesado.",
                },
                {
                  titulo: "Nos contactas a través de formularios o email",
                  datos: "Nombre, email, contenido del mensaje.",
                  finalidad: "Responder a tus consultas, dudas o sugerencias.",
                  base: "Interés legítimo del responsable en atender las comunicaciones y, en su caso, consentimiento del interesado.",
                },
              ].map((item) => (
                <div key={item.titulo} className="bg-[#1a170d] border border-[#493f22]/50 rounded-xl p-5">
                  <p className="text-primary text-xs font-black uppercase tracking-widest mb-3">{item.titulo}</p>
                  <div className="flex flex-col gap-2 text-sm text-gray-400">
                    <p><span className="text-white font-semibold">Datos:</span> {item.datos}</p>
                    <p><span className="text-white font-semibold">Finalidad:</span> {item.finalidad}</p>
                    <p><span className="text-white font-semibold">Base Legal:</span> {item.base}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 3. Conservación */}
          <section>
            <h2 className="text-white text-lg font-black uppercase tracking-wide mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-black shrink-0">3</span>
              ¿Durante Cuánto Tiempo Conservamos tus Datos?
            </h2>
            <p className="text-gray-400 text-sm mb-5 leading-relaxed">
              Conservaremos tus datos personales durante el tiempo necesario para cumplir con la finalidad para la que fueron recogidos, así como para cumplir con las obligaciones legales que se deriven de dicho tratamiento.
            </p>
            <ul className="flex flex-col gap-3">
              {[
                { label: "Datos de compra", texto: "Se conservarán mientras dure la relación contractual y, posteriormente, durante los plazos legalmente exigidos (por ejemplo, 6 años a efectos fiscales)." },
                { label: "Datos de cuenta de usuario", texto: "Se conservarán mientras mantengas tu cuenta activa." },
                { label: "Datos de newsletter", texto: "Se conservarán hasta que te des de baja de la suscripción." },
                { label: "Datos de contacto", texto: "Se conservarán durante el tiempo necesario para gestionar tu consulta." },
              ].map((item) => (
                <li key={item.label} className="flex gap-3 text-sm text-gray-400">
                  <span className="text-primary shrink-0 mt-0.5">·</span>
                  <span><span className="text-white font-semibold">{item.label}:</span> {item.texto}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* 4. Compartir datos */}
          <section>
            <h2 className="text-white text-lg font-black uppercase tracking-wide mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-black shrink-0">4</span>
              ¿Compartimos tus Datos con Terceros?
            </h2>
            <p className="text-gray-400 text-sm mb-5 leading-relaxed">
              Solo compartiremos tus datos personales con terceros en los siguientes casos:
            </p>
            <ul className="flex flex-col gap-3">
              <li className="flex gap-3 text-sm text-gray-400">
                <span className="text-primary shrink-0 mt-0.5">·</span>
                <span>
                  <span className="text-white font-semibold">Proveedores de servicios:</span> Empresas de transporte para la entrega de tus pedidos, pasarelas de pago para procesar tus compras, empresas de hosting o mantenimiento web. Estos proveedores actúan como encargados del tratamiento y tienen contratos con nosotros que garantizan la seguridad y confidencialidad de tus datos.
                </span>
              </li>
              <li className="flex gap-3 text-sm text-gray-400">
                <span className="text-primary shrink-0 mt-0.5">·</span>
                <span>
                  <span className="text-white font-semibold">Obligación legal:</span> Cuando estemos legalmente obligados a hacerlo (por ejemplo, a autoridades fiscales o judiciales).
                </span>
              </li>
            </ul>
          </section>

          {/* 5. Derechos */}
          <section>
            <h2 className="text-white text-lg font-black uppercase tracking-wide mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-black shrink-0">5</span>
              ¿Cuáles son tus Derechos?
            </h2>
            <p className="text-gray-400 text-sm mb-5 leading-relaxed">
              Como titular de tus datos personales, tienes derecho a:
            </p>
            <ul className="flex flex-col gap-2 mb-6">
              {[
                "Acceder a tus datos para saber cuáles estamos tratando.",
                "Rectificar cualquier dato inexacto o incompleto.",
                "Suprimir tus datos cuando ya no sean necesarios para los fines que fueron recogidos.",
                "Oponerte al tratamiento de tus datos en determinadas circunstancias.",
                "Solicitar la limitación del tratamiento de tus datos.",
                "Solicitar la portabilidad de tus datos a otro responsable.",
                "Retirar tu consentimiento en cualquier momento, sin que ello afecte a la licitud del tratamiento basado en el consentimiento previo a su retirada.",
              ].map((derecho) => (
                <li key={derecho} className="flex gap-3 text-sm text-gray-400">
                  <span className="text-primary shrink-0 mt-0.5">·</span>
                  <span>{derecho}</span>
                </li>
              ))}
            </ul>
            <div className="bg-[#1a170d] border border-[#493f22]/50 rounded-xl p-5 text-sm text-gray-400 leading-relaxed">
              <p>
                Puedes ejercer estos derechos enviando un correo electrónico a{" "}
                <a href="mailto:erosyafrodita.com@gmail.com" className="text-primary hover:underline">
                  erosyafrodita.com@gmail.com
                </a>{" "}
                o una carta a <span className="text-white">CELEGOR SL – AVDA. SANTA EUGENIA, N. 29 – 28031 MADRID</span>, adjuntando una copia de tu DNI o documento identificativo.
              </p>
              <p className="mt-3">
                También tienes derecho a presentar una reclamación ante la{" "}
                <span className="text-white font-semibold">Agencia Española de Protección de Datos (AEPD)</span> si consideras que el tratamiento de tus datos no cumple con la normativa.
              </p>
            </div>
          </section>

          {/* 6. Seguridad */}
          <section>
            <h2 className="text-white text-lg font-black uppercase tracking-wide mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-black shrink-0">6</span>
              Seguridad de tus Datos
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Hemos implementado las medidas técnicas y organizativas necesarias para garantizar la seguridad de tus datos personales y evitar su alteración, pérdida, tratamiento o acceso no autorizado, teniendo en cuenta el estado de la tecnología, la naturaleza de los datos almacenados y los riesgos a los que están expuestos.
            </p>
          </section>

          {/* 7. Cambios */}
          <section>
            <h2 className="text-white text-lg font-black uppercase tracking-wide mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-black shrink-0">7</span>
              Cambios en la Política de Privacidad
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Podemos modificar esta Política de Privacidad en cualquier momento. Cualquier cambio será publicado en esta sección de la web.
            </p>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Privacidad;
