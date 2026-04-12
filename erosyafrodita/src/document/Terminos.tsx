import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

const Terminos: React.FC = () => {
  return (
    <div className="bg-background-dark font-display text-white min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow w-full max-w-4xl mx-auto px-4 md:px-10 py-12">
        {/* Título */}
        <div className="mb-10 border-b border-[#493f22] pb-8">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white uppercase">
            Términos y Condiciones
          </h1>
          <p className="mt-3 text-sm text-[#cbbc90]">
            Última actualización: abril de 2025. Por favor, lee atentamente estos Términos y Condiciones antes de utilizar el sitio web{" "}
            <span className="text-primary font-medium">www.erosyafrodita.com</span> o realizar cualquier compra.
          </p>
        </div>

        <div className="flex flex-col gap-10">

          {/* 1. Información general */}
          <section>
            <h2 className="text-white text-lg font-black uppercase tracking-wide mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-black shrink-0">1</span>
              Información General
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-3">
              El presente sitio web es propiedad de <span className="text-white font-semibold">CELEGOR, S.L.</span> (en adelante, "la Empresa"), con NIF/CIF <span className="text-white">ESB81267163</span> y domicilio en AVDA. SANTA EUGENIA N. 29 – 28031 MADRID.
            </p>
            <p className="text-gray-400 text-sm leading-relaxed">
              El acceso y uso de este sitio web, así como la compra de productos en él ofrecidos, implica la aceptación plena y sin reservas de los presentes Términos y Condiciones. Si no estás de acuerdo con alguno de estos términos, te rogamos que no utilices este sitio web.
            </p>
          </section>

          {/* 2. Proceso de compra */}
          <section>
            <h2 className="text-white text-lg font-black uppercase tracking-wide mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-black shrink-0">2</span>
              Proceso de Compra
            </h2>
            <div className="flex flex-col gap-3">
              {[
                {
                  titulo: "Registro",
                  texto: "Para realizar una compra es necesario registrarse en la web proporcionando un nombre de usuario, correo electrónico y contraseña. El usuario es responsable de mantener la confidencialidad de sus credenciales de acceso.",
                },
                {
                  titulo: "Selección y pedido",
                  texto: "El usuario podrá añadir productos al carrito y finalizar su compra mediante el proceso de pago habilitado. Antes de confirmar el pedido se mostrará un resumen detallado con los productos, precios e impuestos aplicables.",
                },
                {
                  titulo: "Confirmación del pedido",
                  texto: "Una vez procesado el pago, el usuario recibirá un correo electrónico de confirmación con el número de pedido y el resumen de la compra. El contrato de compraventa se perfecciona en el momento en que CELEGOR, S.L. acepta y confirma el pedido.",
                },
                {
                  titulo: "Disponibilidad",
                  texto: "Todos los pedidos están sujetos a la disponibilidad de stock. En caso de que un producto no esté disponible tras la confirmación del pedido, la Empresa se pondrá en contacto con el cliente para ofrecerle una alternativa o proceder al reembolso íntegro del importe pagado.",
                },
              ].map((item) => (
                <div key={item.titulo} className="flex gap-3 text-sm text-gray-400">
                  <span className="text-primary shrink-0 mt-0.5">·</span>
                  <span><span className="text-white font-semibold">{item.titulo}:</span> {item.texto}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 3. Precios y pagos */}
          <section>
            <h2 className="text-white text-lg font-black uppercase tracking-wide mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-black shrink-0">3</span>
              Precios y Métodos de Pago
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-5">
              Todos los precios mostrados en el sitio web están expresados en euros (€) e incluyen el IVA aplicable. Los gastos de envío se mostrarán de forma diferenciada antes de finalizar la compra.
            </p>
            <div className="bg-[#1a170d] border border-[#493f22]/50 rounded-2xl p-6">
              <p className="text-primary text-xs font-black uppercase tracking-widest mb-4">Métodos de pago aceptados</p>
              <ul className="flex flex-col gap-3 text-sm text-gray-400">
                {[
                  "Tarjeta de crédito / débito (Visa, Mastercard, American Express)",
                  "Pago seguro a través de pasarela de pago Revolut",
                  "Otros métodos disponibles que se indiquen en el momento del pago",
                ].map((metodo) => (
                  <li key={metodo} className="flex gap-3">
                    <span className="text-primary shrink-0">·</span>
                    <span>{metodo}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-[#cbbc90] leading-relaxed">
                Todas las transacciones se realizan a través de sistemas de pago seguros con cifrado SSL. CELEGOR, S.L. no almacena datos de tarjetas bancarias.
              </p>
            </div>
          </section>

          {/* 4. Envíos */}
          <section>
            <h2 className="text-white text-lg font-black uppercase tracking-wide mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-black shrink-0">4</span>
              Envíos y Plazos de Entrega
            </h2>
            <div className="flex flex-col gap-3">
              {[
                {
                  titulo: "Zona de envío",
                  texto: "Realizamos envíos a toda España peninsular, Islas Baleares, Islas Canarias, Ceuta y Melilla, así como a determinados países de la Unión Europea.",
                },
                {
                  titulo: "Plazo de entrega",
                  texto: "El plazo habitual de entrega en España peninsular es de 2 a 5 días hábiles desde la confirmación del pago. Para Canarias, Ceuta, Melilla y envíos internacionales el plazo puede ser mayor.",
                },
                {
                  titulo: "Seguimiento",
                  texto: "Una vez enviado el pedido, el cliente recibirá un correo electrónico con el número de seguimiento para poder rastrear su envío.",
                },
                {
                  titulo: "Responsabilidad",
                  texto: "CELEGOR, S.L. no se hace responsable de los retrasos ocasionados por causas ajenas a la Empresa, como huelgas, incidencias del transportista o situaciones de fuerza mayor.",
                },
              ].map((item) => (
                <div key={item.titulo} className="flex gap-3 text-sm text-gray-400">
                  <span className="text-primary shrink-0 mt-0.5">·</span>
                  <span><span className="text-white font-semibold">{item.titulo}:</span> {item.texto}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 5. Devoluciones */}
          <section>
            <h2 className="text-white text-lg font-black uppercase tracking-wide mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-black shrink-0">5</span>
              Política de Devoluciones y Desistimiento
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-5">
              De acuerdo con la normativa vigente en materia de consumidores y usuarios, el cliente dispone de un plazo de <span className="text-white font-semibold">14 días naturales</span> desde la recepción del pedido para ejercer su derecho de desistimiento sin necesidad de justificación.
            </p>
            <div className="flex flex-col gap-3">
              {[
                {
                  titulo: "Cómo solicitarlo",
                  texto: "El cliente deberá comunicarlo por correo electrónico a erosyafrodita.com@gmail.com indicando el número de pedido y el motivo de la devolución.",
                },
                {
                  titulo: "Estado del producto",
                  texto: "Los productos devueltos deben estar en perfecto estado, sin usar, con su embalaje original y todos los accesorios incluidos.",
                },
                {
                  titulo: "Reembolso",
                  texto: "Una vez recibido y verificado el producto, se procederá al reembolso del importe mediante el mismo método de pago utilizado en un plazo máximo de 14 días.",
                },
                {
                  titulo: "Gastos de devolución",
                  texto: "Los gastos de envío de la devolución corren a cargo del cliente, salvo que el producto esté defectuoso o se haya producido un error en el pedido.",
                },
                {
                  titulo: "Excepciones",
                  texto: "Quedan excluidos del derecho de desistimiento los productos que por razones de higiene o salud hayan sido desprecintados, así como los productos personalizados o perecederos.",
                },
              ].map((item) => (
                <div key={item.titulo} className="flex gap-3 text-sm text-gray-400">
                  <span className="text-primary shrink-0 mt-0.5">·</span>
                  <span><span className="text-white font-semibold">{item.titulo}:</span> {item.texto}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 6. Garantías */}
          <section>
            <h2 className="text-white text-lg font-black uppercase tracking-wide mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-black shrink-0">6</span>
              Garantías del Producto
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Todos los productos vendidos en <span className="text-white font-semibold">www.erosyafrodita.com</span> cuentan con la garantía legal de conformidad establecida en la normativa española y europea vigente (2 años para productos nuevos). En caso de detectar un defecto de fabricación, el cliente deberá contactar con nosotros en{" "}
              <a href="mailto:erosyafrodita.com@gmail.com" className="text-primary hover:underline">
                erosyafrodita.com@gmail.com
              </a>{" "}
              adjuntando fotografías del producto y el número de pedido.
            </p>
          </section>

          {/* 7. Propiedad intelectual */}
          <section>
            <h2 className="text-white text-lg font-black uppercase tracking-wide mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-black shrink-0">7</span>
              Propiedad Intelectual
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Todos los contenidos de este sitio web (textos, imágenes, logotipos, diseños, código fuente, etc.) son propiedad de CELEGOR, S.L. o de sus licenciantes, y están protegidos por las leyes de propiedad intelectual e industrial. Queda prohibida su reproducción, distribución o uso no autorizado sin el consentimiento expreso y por escrito de CELEGOR, S.L.
            </p>
          </section>

          {/* 8. Responsabilidad */}
          <section>
            <h2 className="text-white text-lg font-black uppercase tracking-wide mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-black shrink-0">8</span>
              Limitación de Responsabilidad
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              CELEGOR, S.L. no será responsable de los daños directos o indirectos que pudieran derivarse del uso o imposibilidad de uso de este sitio web, de errores u omisiones en los contenidos, ni de la interrupción del servicio por causas ajenas a su voluntad. La Empresa tampoco se responsabiliza de los contenidos de sitios web de terceros enlazados desde este portal.
            </p>
          </section>

          {/* 9. Protección de datos */}
          <section>
            <h2 className="text-white text-lg font-black uppercase tracking-wide mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-black shrink-0">9</span>
              Protección de Datos
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              El tratamiento de los datos personales de los usuarios se rige por nuestra{" "}
              <a href="/privacidad" className="text-primary hover:underline font-semibold">
                Política de Privacidad
              </a>
              , que forma parte integrante de estos Términos y Condiciones. Te recomendamos leerla detenidamente.
            </p>
          </section>

          {/* 10. Cookies */}
          <section>
            <h2 className="text-white text-lg font-black uppercase tracking-wide mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-black shrink-0">10</span>
              Política de Cookies
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Este sitio web utiliza cookies propias y de terceros para mejorar la experiencia de navegación y analizar el uso del sitio. Al navegar por esta web, el usuario acepta el uso de cookies conforme a nuestra política. Puedes configurar tu navegador para rechazar las cookies, aunque esto puede afectar al correcto funcionamiento del sitio.
            </p>
          </section>

          {/* 11. Modificaciones */}
          <section>
            <h2 className="text-white text-lg font-black uppercase tracking-wide mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-black shrink-0">11</span>
              Modificaciones de los Términos
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              CELEGOR, S.L. se reserva el derecho de modificar los presentes Términos y Condiciones en cualquier momento y sin previo aviso. Los cambios serán efectivos desde el momento de su publicación en este sitio web. El uso continuado del sitio tras la publicación de los cambios implica la aceptación de los nuevos términos.
            </p>
          </section>

          {/* 12. Legislación */}
          <section>
            <h2 className="text-white text-lg font-black uppercase tracking-wide mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-black shrink-0">12</span>
              Legislación Aplicable y Jurisdicción
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Los presentes Términos y Condiciones se rigen por la legislación española. Para la resolución de cualquier controversia derivada del acceso, uso o compra en este sitio web, las partes se someten a los Juzgados y Tribunales de la ciudad de <span className="text-white font-semibold">Madrid</span>, salvo que la ley establezca otra cosa.
            </p>
          </section>

          {/* Contacto */}
          <div className="bg-[#1a170d] border border-[#493f22]/50 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <span className="material-symbols-outlined text-primary text-3xl shrink-0">support_agent</span>
            <div>
              <p className="text-white font-bold text-sm mb-1">¿Tienes alguna duda?</p>
              <p className="text-gray-400 text-sm">
                Puedes contactarnos en{" "}
                <a href="mailto:erosyafrodita.com@gmail.com" className="text-primary hover:underline">
                  erosyafrodita.com@gmail.com
                </a>{" "}
                o llamarnos al{" "}
                <a href="tel:+34685611801" className="text-primary hover:underline">
                  +34 685 611 801
                </a>
                . Estaremos encantados de ayudarte.
              </p>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Terminos;
