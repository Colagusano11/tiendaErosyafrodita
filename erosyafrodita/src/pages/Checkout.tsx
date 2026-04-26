import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { crearPedido } from "../api/order";
import { LAUNCH_PROMO_ACTIVE, LAUNCH_DISCOUNT } from "../config/promo";
import { userService, UserProfile } from "../api/userService";

import { useAlert } from "../context/AlertContext";
import RevolutCheckout from "@revolut/checkout";
import { PedidoSalida, iniciarPago } from "../api/order";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const Checkout: React.FC = () => {
  const { items, total, clearCart } = useCart();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user: userEmail } = useAuth();
  const { showAlert } = useAlert();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);


  const navigate = useNavigate();
  const [isUsingSavedAddress, setIsUsingSavedAddress] = useState(true);
  
  // Estados para Revolut Embedded Checkout
  const [showPayment, setShowPayment] = useState(false);
  const [rcInstance, setRcInstance] = useState<any>(null);
  const [cardField, setCardField] = useState<any>(null);
  const [publicId, setPublicId] = useState<string | null>(null);
  const [createdPedido, setCreatedPedido] = useState<PedidoSalida | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [cardholderName, setCardholderName] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'revolut_pay' | 'mobile_pay' | 'paypal'>('card');
  const [isMobilePaySupported, setIsMobilePaySupported] = useState(false);
  
  // Datos de dirección para el modal/nueva dirección
  const [tempAddress, setTempAddress] = useState({
    nombre: "",
    apellidos: "",
    calle: "",
    numero: "",
    escalera: "",
    piso: "",
    puerta: "",
    poblacion: "",
    provincia: "",
    codigoPostal: "",
    telefono: "",
    pais: "España",
    email: "",
    saveToProfile: false
  });

  // Refs para evitar problemas de clausura en los callbacks del SDK de Revolut
  const createdPedidoRef = React.useRef<PedidoSalida | null>(null);
  const tempAddressRef = React.useRef(tempAddress);
  
  React.useEffect(() => {
    createdPedidoRef.current = createdPedido;
  }, [createdPedido]);

  React.useEffect(() => {
    tempAddressRef.current = tempAddress;
  }, [tempAddress]);
  
  const validatePhone = (phone: string) => {
    if (!phone) return false;
    // Limpiamos espacios, guiones y el prefijo +34 o 0034 si existe
    const cleanPhone = phone.replace(/[\s\-]/g, "").replace(/^(\+34|0034)/, "");
    // Regex para España: Empieza por 6, 7, 8 o 9, seguido de 8 dígitos
    return /^[6789]\d{8}$/.test(cleanPhone);
  };

  const validateCP = (cp: string) => {
    // Regex para España: 5 dígitos
    return /^\d{5}$/.test(cp.trim());
  };
 

  // Cargar datos del usuario
  React.useEffect(() => {
    if (!userEmail) return;

    const fetchData = async () => {
      try {
        const profile = await userService.getUserProfile(userEmail);
        setUserProfile(profile);
        

      } catch (err) {
        console.warn("No se pudieron cargar datos del perfil", err);
      }
    };
    fetchData();
  }, [userEmail]);


  const handlePagar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Determinar qué dirección usar
    let finalDireccion = "";
    const addr = isUsingSavedAddress && userProfile ? {
      calle: userProfile.direccionPrimaria || "",
      numero: userProfile.numero || "",
      escalera: userProfile.escalera || "",
      piso: userProfile.piso || "",
      puerta: userProfile.puerta || "",
      poblacion: userProfile.poblacion || "",
      provincia: userProfile.provincia || "",
      codigoPostal: userProfile.codigoPostal || "",
      pais: userProfile.pais || "España"
    } : {
      calle: tempAddress.calle,
      numero: tempAddress.numero,
      escalera: tempAddress.escalera,
      piso: tempAddress.piso,
      puerta: tempAddress.puerta,
      poblacion: tempAddress.poblacion,
      provincia: tempAddress.provincia,
      codigoPostal: tempAddress.codigoPostal,
      pais: tempAddress.pais
    };

    if (!isUsingSavedAddress && (
      !tempAddress.nombre.trim() || 
      !tempAddress.apellidos.trim() || 
      !tempAddress.calle.trim() || 
      !tempAddress.poblacion.trim() || 
      !tempAddress.codigoPostal.trim() || 
      !tempAddress.provincia.trim() || 
      !tempAddress.telefono.trim() || 
      (!userEmail && !tempAddress.email.trim())
    )) {
      setError("Por favor, completa todos los campos de envío. Son necesarios para la entrega.");
      showAlert("Campos incompletos", "Todos los campos marcados son obligatorios para poder realizar el envío correctamente.", "warning");
      return;
    }

    const phoneToValidate = isUsingSavedAddress && userProfile 
      ? (userProfile.phone || (userProfile as any).telefono || "") 
      : tempAddress.telefono;

    const cpToValidate = isUsingSavedAddress && userProfile
      ? (userProfile.codigoPostal || "")
      : tempAddress.codigoPostal;

    if (!phoneToValidate) {
      setError("Tu perfil no tiene un número de teléfono asociado. Por favor, completa tu perfil o usa otra dirección.");
      showAlert("Teléfono necesario", "Necesitamos un teléfono de contacto para que la mensajería pueda entregarte el pedido.", "warning");
      if (isUsingSavedAddress) setIsUsingSavedAddress(false);
      return;
    }

    if (!validatePhone(phoneToValidate)) {
      setError(`El número de teléfono "${phoneToValidate}" no es válido. Debe tener 9 dígitos (ej: 600000000).`);
      showAlert("Teléfono no válido", "Por favor, introduce un número de teléfono válido de 9 dígitos.", "warning");
      if (isUsingSavedAddress) setIsUsingSavedAddress(false);
      return;
    }

    if (!validateCP(cpToValidate)) {
      setError("El Código Postal debe tener exactamente 5 dígitos.");
      showAlert("Código Postal no válido", "El Código Postal debe tener exactamente 5 dígitos.", "warning");
      return;
    }

    if (!isUsingSavedAddress && !userEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tempAddress.email)) {
      setError("Por favor, introduce un correo electrónico válido.");
      return;
    }

    const payload = isUsingSavedAddress && userProfile ? {
      nombre: userProfile.name || (userProfile as any).nombre || "Usuario",
      apellidos: userProfile.apellidos || "Eros",
      calle: `${userProfile.direccionPrimaria || ""} ${userProfile.numero || ""}${userProfile.escalera ? `, Esc. ${userProfile.escalera}` : ""}${userProfile.piso ? `, Piso ${userProfile.piso}` : ""}${userProfile.puerta ? `, Pta. ${userProfile.puerta}` : ""}`.trim(),
      ciudad: userProfile.poblacion || "",
      codigoPostal: userProfile.codigoPostal || "",
      provincia: userProfile.provincia || "",
      telefono: (userProfile.phone || (userProfile as any).telefono || "").replace(/\s/g, "").replace(/^\+34/, ""),
      pais: userProfile.pais || "España",
      email: userEmail || ""
    } : {
      nombre: tempAddress.nombre,
      apellidos: tempAddress.apellidos,
      calle: `${tempAddress.calle} ${tempAddress.numero}${tempAddress.escalera ? `, Esc. ${tempAddress.escalera}` : ""}${tempAddress.piso ? `, Piso ${tempAddress.piso}` : ""}${tempAddress.puerta ? `, Pta. ${tempAddress.puerta}` : ""}`.trim(),
      ciudad: tempAddress.poblacion,
      codigoPostal: tempAddress.codigoPostal,
      provincia: tempAddress.provincia,
      telefono: tempAddress.telefono.replace(/\s/g, "").replace(/^\+34/, ""),
      pais: tempAddress.pais,
      email: userEmail || tempAddress.email.trim()
    };

    if (items.length === 0) {
      setError("Tu carrito está vacío.");
      return;
    }

    try {
      setLoading(true);

      // 1. Guardar dirección en el perfil si se marcó en el modal
      if (!isUsingSavedAddress && tempAddress.saveToProfile && userProfile && userEmail) {
        await userService.updateUserProfile(userEmail, {
          ...userProfile,
          direccionPrimaria: addr.calle,
          numero: addr.numero,
          escalera: addr.escalera,
          piso: addr.piso,
          puerta: addr.puerta,
          poblacion: addr.poblacion,
          provincia: addr.provincia,
          codigoPostal: addr.codigoPostal,
          pais: addr.pais
        });
      }



      // 3. Crear el pedido
      const pedido = await crearPedido({
        ...payload,
        ...(LAUNCH_PROMO_ACTIVE ? { descuento: LAUNCH_DISCOUNT } : {}),
        items: items.map(i => ({ productoId: i.product.id, cantidad: i.quantity }))
      });
      setCreatedPedido(pedido);
      
      // 4. Iniciar el proceso de pago con Revolut (Obtener public_id)
      try {
        const paymentData = await iniciarPago(pedido.idPedido);
        
        if (paymentData && paymentData.paymentId) {
          // Guardamos el public_id y mostramos la sección de pago
          setPublicId(paymentData.paymentId);
          setShowPayment(true);
          
          // Inicializamos el SDK de Revolut
          const rc = await RevolutCheckout(paymentData.paymentId);
          setRcInstance(rc);
          
          // El montaje lo haremos en un useEffect separado para asegurar que el DOM existe
          return;
        } else {
          throw new Error("No se recibió una ID de pago válida de Revolut.");
        }
      } catch (payErr: any) {
        console.error("Error al iniciar el pago:", payErr);
        setError("Pedido creado, pero hubo un error al iniciar la pasarela de pago. Por favor, contacta con soporte. ID: " + pedido.idPedido);
        showAlert("Error en pasarela", "El pedido se ha creado pero no hemos podido conectar con Revolut. Inténtalo de nuevo o contacta con nosotros.", "error");
      }
    } catch (err: any) {
      setError(err.message ?? "No se pudo crear el pedido.");
      showAlert("Error", err.message ?? "No se pudo procesar el pago.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Efecto para montar el campo de tarjeta cuando Revolut esté listo
  React.useEffect(() => {
    if (showPayment && rcInstance && !cardField && selectedMethod === 'card') {
      const card = rcInstance.createCardField({
        target: document.getElementById("revolut-card-field"),
        styles: {
          default: {
            color: "#ffffff",
            placeholder: {
              color: "rgba(255, 255, 255, 0.3)"
            }
          }
        },
        onSuccess() {
          const guestEmail = userEmail || tempAddressRef.current.email.trim();
          clearCart().then(() => {
            navigate(`/success?pedidoId=${createdPedidoRef.current?.idPedido}&email=${encodeURIComponent(guestEmail)}`);
          });
        },
        onError(error: any) {
          setError(error?.message || "Hubo un problema al validar o procesar tu tarjeta.");
          showAlert("Error en tarjeta", error?.message || "Revisa los detalles introducidos y vuelve a intentarlo.", "error");
          setIsPaying(false);
        }
      });
      setCardField(card);
    }
  }, [showPayment, rcInstance, cardField, selectedMethod, userEmail, clearCart, navigate, showAlert]);

  // Efecto para verificar soporte de Apple/Google Pay e inicializar otros métodos
  React.useEffect(() => {
    if (showPayment && rcInstance) {
      const initOtherMethods = async () => {
        try {
          // 1. Revolut Pay
          if (selectedMethod === 'revolut_pay') {
             const revolutPayDiv = document.getElementById("revolut-pay-button");
             if (revolutPayDiv && !revolutPayDiv.hasChildNodes()) {
                rcInstance.revolutPay.mount(revolutPayDiv, {
                  onSuccess: () => {
                    const guestEmail = userEmail || tempAddressRef.current.email.trim();
                    clearCart().then(() => {
                      navigate(`/success?pedidoId=${createdPedidoRef.current?.idPedido}&email=${encodeURIComponent(guestEmail)}`);
                    });
                  },
                  onError: (err: any) => {
                    console.error("Error en Revolut Pay:", err);
                    setError("El pago con Revolut Pay no pudo completarse o fue cancelado.");
                  }
                });
             }
          }

          // 2. Mobile Pay (Apple/Google Pay)
          if (selectedMethod === 'mobile_pay') {
            const prDiv = document.getElementById("revolut-payment-request");
            if (prDiv && !prDiv.hasChildNodes()) {
              const pr = rcInstance.paymentRequest({
                target: prDiv,
                onSuccess: () => {
                  const guestEmail = userEmail || tempAddressRef.current.email.trim();
                  clearCart().then(() => {
                    navigate(`/success?pedidoId=${createdPedidoRef.current?.idPedido}&email=${encodeURIComponent(guestEmail)}`);
                  });
                },
                onError: (err: any) => {
                  console.error("Error en Apple/Google Pay:", err);
                  setError("El pago con dispositivo no pudo completarse.");
                }
              });

              const canPay = await pr.canMakePayment();
              if (canPay) {
                pr.render();
                setIsMobilePaySupported(true);
              } else {
                setIsMobilePaySupported(false);
                setError("Tu dispositivo o navegador no admite Apple Pay / Google Pay.");
              }
            }
          }
        } catch (err) {
          console.error("Error al inicializar métodos alternativos:", err);
        }
      };
      initOtherMethods();
    }
  }, [showPayment, rcInstance, selectedMethod, total, userEmail, clearCart, navigate]);

  const handleExecutePayment = async () => {
    if (!cardField || !createdPedidoRef.current) return;
    
    try {
      if (!cardholderName.trim()) {
        setError("Por favor, introduce el nombre del titular de la tarjeta.");
        showAlert("Campo obligatorio", "El nombre del titular es necesario para procesar el pago.", "warning");
        return;
      }

      setIsPaying(true);
      setError(null);

      // cardField.submit inicia el flujo. El resultado se maneja en los callbacks onSuccess y onError definidos arriba.
      await cardField.submit({
        name: cardholderName,
        email: userEmail ? userEmail.trim() : (createdPedidoRef.current?.email || tempAddressRef.current.email.trim() || "soporte@erosyafrodita.com")
      });
      
    } catch (err: any) {
      console.error("Error al invocar el pago:", err);
      setError(err.message || "El widget de pago no está preparado.");
      showAlert("Fallo interno", "Comprueba los datos y vuelve a pulsar el botón.", "error");
      setIsPaying(false);
    }
  };

  const handleCancelPayment = () => {
    setShowPayment(false);
    setPublicId(null);
    setRcInstance(null);
    setCardField(null);
  };



  // El total ya viene como PVP desde el backend a través del CartContext

    return (
      <PayPalScriptProvider options={{ 
        "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID || "",
        currency: "EUR",
        intent: "capture"
      }}>
        <div className="bg-background-dark text-white font-display antialiased min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow w-full max-w-[1440px] mx-auto py-6 sm:py-10 px-4 sm:px-10">
        <div className="w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 sm:mb-8 gap-4 border-b border-white/5 pb-6">
            <div>
              <h1 className="text-white text-2xl sm:text-3xl md:text-4xl font-black leading-tight tracking-tight mb-1 sm:mb-2">
                Finalizar Ritual
              </h1>
              <p className="text-primary text-[10px] sm:text-sm font-black uppercase tracking-widest opacity-60">
                Asegura tu adquisición divina
              </p>
            </div>
            <nav className="flex items-center gap-2 text-xs font-black uppercase tracking-widest">
              <span className="text-primary">Envío</span>
              <span className="text-white/20">/</span>
              <span className="text-white/40">Pago</span>
              <span className="text-white/20">/</span>
              <span className="text-white/40">Olimpo</span>
            </nav>
          </div>

          {error && (
            <p className="mb-4 text-sm text-red-400 font-bold bg-red-400/10 p-4 rounded-xl border border-red-400/20">{error}</p>
          )}

          <form onSubmit={handlePagar} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left Column */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-10">
              
              {/* Envío */}
              {!showPayment ? (
                <section className="animate-fade-in">
                  <h2 className="text-xl font-black mb-6 flex items-center gap-3">
                    <span className="size-8 bg-primary text-charcoal rounded-lg flex items-center justify-center text-sm">1</span>
                    Información de Envío
                  </h2>
                <div className="flex flex-col gap-6">
                  {userProfile && (userProfile.direccionPrimaria) && (
                    <div 
                      onClick={() => setIsUsingSavedAddress(true)}
                      className={`group p-6 rounded-2xl border transition-all cursor-pointer ${isUsingSavedAddress ? 'bg-primary/5 border-primary shadow-2xl shadow-primary/10' : 'bg-black/20 border-white/5 hover:border-white/10'}`}
                    >
                      <h3 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-sm">home</span>
                        Dirección Guardada
                      </h3>
                      <p className="text-sm text-white font-medium">{userProfile.direccionPrimaria} {userProfile.numero}</p>
                      <p className="text-xs text-white/40 font-light mt-1">{userProfile.codigoPostal} {userProfile.poblacion}, {userProfile.provincia}</p>
                    </div>
                  )}
                  
                    <div className="flex flex-col gap-4">
                      <h3 
                        onClick={() => setIsUsingSavedAddress(false)}
                        className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 cursor-pointer transition-colors ${!isUsingSavedAddress ? 'text-primary' : 'text-white/40 hover:text-white'}`}
                      >
                        <span className="material-symbols-outlined text-sm">{!isUsingSavedAddress ? 'edit_location' : 'add_location'}</span>
                        {userProfile && userProfile.direccionPrimaria ? 'Usar otra dirección' : 'Detalles de Envío'}
                      </h3>
                      
                      {(!isUsingSavedAddress || !userProfile?.direccionPrimaria) && (
                        <div className="grid grid-cols-1 gap-4 p-6 rounded-2xl border border-white/10 bg-white/5 animate-fade-in mt-2 mb-4">
                          <div className="grid grid-cols-2 gap-4">
                            <input required className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none text-white focus:bg-background-dark transition-all" placeholder="NOMBRE*" value={tempAddress.nombre} onChange={e => setTempAddress({...tempAddress, nombre: e.target.value})} />
                            <input required className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none text-white focus:bg-background-dark transition-all" placeholder="APELLIDOS*" value={tempAddress.apellidos} onChange={e => setTempAddress({...tempAddress, apellidos: e.target.value})} />
                          </div>
                          <div className="relative">
                             <input required className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none text-white focus:bg-background-dark transition-all pr-12" placeholder="CALLE / AVENIDA / NÚMERO*" value={tempAddress.calle} onChange={e => setTempAddress({...tempAddress, calle: e.target.value})} />
                             <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-primary opacity-30 text-base">location_on</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <input required className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none text-white focus:bg-background-dark transition-all" placeholder="POBLACIÓN*" value={tempAddress.poblacion} onChange={e => setTempAddress({...tempAddress, poblacion: e.target.value})} />
                            <input required className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none text-white focus:bg-background-dark transition-all" placeholder="CÓDIGO POSTAL*" value={tempAddress.codigoPostal} onChange={e => setTempAddress({...tempAddress, codigoPostal: e.target.value})} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <input required className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none text-white focus:bg-background-dark transition-all" placeholder="PROVINCIA*" value={tempAddress.provincia} onChange={e => setTempAddress({...tempAddress, provincia: e.target.value})} />
                            <input required className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none text-white focus:bg-background-dark transition-all" placeholder="TELÉFONO MÓVIL (9 dígitos)*" value={tempAddress.telefono} onChange={e => setTempAddress({...tempAddress, telefono: e.target.value})} />
                          </div>
                          {userEmail && (
                            <label className="flex items-center gap-2 cursor-pointer mt-2 group w-fit">
                              <input 
                                type="checkbox" 
                                checked={tempAddress.saveToProfile} 
                                onChange={e => setTempAddress({...tempAddress, saveToProfile: e.target.checked})}
                                className="size-4 rounded border-white/10 bg-black/40 checked:bg-primary checked:border-primary transition-all cursor-pointer"
                              />
                              <span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-primary transition-colors">Guardar esta dirección en mi perfil</span>
                            </label>
                          )}
                          {!userEmail && (
                            <input 
                              type="email"
                              className="w-full bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none text-white focus:bg-background-dark transition-all placeholder:text-primary/40 mt-2" 
                              placeholder="CORREO ELECTRÓNICO (OBLIGATORIO PARA PAGAR)*" 
                              value={tempAddress.email} 
                              onChange={e => setTempAddress({...tempAddress, email: e.target.value})} 
                              required
                            />
                          )}
                        </div>
                      )}
                    </div>

                  </div>
                </section>
              ) : (
                <section className="animate-fade-in">
                  <h2 className="text-xl font-black mb-6 flex items-center gap-3">
                    <span className="size-8 bg-emerald-400 text-charcoal rounded-lg flex items-center justify-center text-sm">
                      <span className="material-symbols-outlined text-sm">lock</span>
                    </span>
                    Pago Seguro
                  </h2>
                  
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col gap-8">
                    
                    {/* Selector de Método de Pago en el paso de pago */}
                    <div className="flex flex-col gap-4 pb-6 border-b border-white/5">
                        <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm">payments</span>
                          Elige tu Método de Pago
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div 
                            onClick={() => setSelectedMethod('card')}
                            className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col items-center gap-2 text-center ${selectedMethod === 'card' ? 'bg-primary/5 border-primary shadow-lg shadow-primary/10' : 'bg-black/20 border-white/5 hover:border-white/10'}`}
                          >
                            <span className="material-symbols-outlined text-xl">credit_card</span>
                            <span className="text-[10px] font-black uppercase tracking-widest">Tarjeta</span>
                          </div>
                          <div 
                            onClick={() => setSelectedMethod('revolut_pay')}
                            className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col items-center gap-2 text-center ${selectedMethod === 'revolut_pay' ? 'bg-primary/5 border-primary shadow-lg shadow-primary/10' : 'bg-black/20 border-white/5 hover:border-white/10'}`}
                          >
                            <div className="h-5 flex items-center justify-center">
                              <span className="font-black text-xs">Revolut <span className="text-primary italic">Pay</span></span>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest">Rápido</span>
                          </div>
                          <div 
                            onClick={() => setSelectedMethod('mobile_pay')}
                            className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col items-center gap-2 text-center ${selectedMethod === 'mobile_pay' ? 'bg-primary/5 border-primary shadow-lg shadow-primary/10' : 'bg-black/20 border-white/5 hover:border-white/10'}`}
                          >
                            <div className="flex gap-1 h-5 items-center justify-center text-white">
                              <span className="material-symbols-outlined text-xl">phone_iphone</span>
                              <span className="material-symbols-outlined text-sm">contactless</span>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest">Apple / G Pay</span>
                          </div>
                          <div 
                            onClick={() => setSelectedMethod('paypal')}
                            className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col items-center gap-2 text-center ${selectedMethod === 'paypal' ? 'bg-primary/5 border-primary shadow-lg shadow-primary/10' : 'bg-black/20 border-white/5 hover:border-white/10'}`}
                          >
                            <div className="h-5 flex items-center justify-center">
                               <img src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_v3.jpg" className="h-4 object-contain brightness-0 invert opacity-60" alt="PayPal" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest">PayPal</span>
                          </div>
                        </div>
                    </div>
                    <div className={`${selectedMethod === 'card' ? 'flex flex-col gap-6 animate-fade-in' : 'hidden'}`}>
                      <p className="text-sm font-bold text-white/60 uppercase tracking-widest">Información de la tarjeta</p>
                      
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black ml-1">Nombre del Titular</label>
                        <input 
                            className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-4 text-sm focus:border-primary outline-none text-white focus:bg-background-dark transition-all placeholder:text-white/10"
                            placeholder="Nombre del Titular"
                            value={cardholderName.toUpperCase()}
                            onChange={e => setCardholderName(e.target.value)}
                        />
                      </div>

                      <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-end ml-1">
                           <label className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black">Datos de Seguridad</label>
                           <div className="flex gap-12 text-[9px] text-white/20 uppercase font-bold pr-12 hidden sm:flex">
                              <span>Número Tarjeta</span>
                              <span>Cad.</span>
                              <span>CVV</span>
                           </div>
                        </div>
                        <div className="bg-black/40 border border-white/5 rounded-2xl p-6 min-h-[60px]">
                            <div id="revolut-card-field"></div>
                        </div>
                      </div>
                    </div>

                    <div className={`${selectedMethod === 'revolut_pay' ? 'flex flex-col items-center gap-6 py-10 animate-fade-in' : 'hidden'}`}>
                       <div className="text-center flex flex-col gap-2 mb-4">
                          <p className="text-primary font-black text-xl uppercase tracking-widest italic">Revolut Pay</p>
                          <p className="text-xs text-white/40 font-light">Confirma tu pago en un momento con tu cuenta Revolut</p>
                       </div>
                       <div id="revolut-pay-button" className="w-full max-w-[300px]"></div>
                    </div>

                    <div className={`${selectedMethod === 'mobile_pay' ? 'flex flex-col items-center gap-6 py-10 animate-fade-in' : 'hidden'}`}>
                       <div className="text-center flex flex-col gap-2 mb-4">
                          <p className="text-white font-black text-xl uppercase tracking-widest flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-2xl">phone_iphone</span>
                            Apple Pay / Google Pay
                          </p>
                          <p className="text-xs text-white/40 font-light">Pago seguro y rápido desde tu dispositivo</p>
                       </div>
                       <div id="revolut-payment-request" className="w-full max-w-[300px] min-h-[50px]"></div>
                       {!isMobilePaySupported && (
                         <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest">Verificando compatibilidad...</p>
                       )}
                    </div>

                    <div className={`${selectedMethod === 'paypal' ? 'flex flex-col items-center gap-6 py-10 animate-fade-in' : 'hidden'}`}>
                       <div className="text-center flex flex-col gap-2 mb-8">
                          <p className="text-[#0070ba] font-black text-xl uppercase tracking-widest flex items-center justify-center gap-2">
                            PayPal
                          </p>
                          <p className="text-xs text-white/40 font-light">Paga con tu saldo, cuenta bancaria o tarjeta a través de PayPal</p>
                       </div>
                       <div className="w-full max-w-[350px]">
                          <PayPalButtons 
                            style={{ layout: "vertical", color: "gold", shape: "pill", label: "pay" }}
                            createOrder={async () => {
                              if (!createdPedido) throw new Error("No hay pedido creado");
                              const data = await iniciarPago(createdPedido.idPedido, "paypal");
                              return data.paymentId;
                            }}
                            onApprove={async (data) => {
                              const guestEmail = userEmail || tempAddressRef.current.email.trim();
                              await clearCart();
                              navigate(`/success?pedidoId=${createdPedido?.idPedido}&email=${encodeURIComponent(guestEmail)}&paymentId=${data.orderID}`);
                            }}
                            onError={(err) => {
                              console.error("PayPal Error:", err);
                              setError("Hubo un error con PayPal. Por favor, inténtalo de nuevo.");
                            }}
                          />
                       </div>
                    </div>

                    <div className="flex justify-start mt-2">
                       <button
                        type="button"
                        onClick={handleCancelPayment}
                        disabled={isPaying}
                        className="text-[10px] text-white/40 uppercase tracking-widest font-bold hover:text-white transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined !text-[14px]">arrow_back</span>
                        Volver a envío
                      </button>
                    </div>

                  </div>
                </section>
              )}


            </div>

            {/* Right Column */}
            <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24">
              <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 flex flex-col gap-8">
                <h3 className="text-xl font-black">Tu Selección</h3>
                
                <div className="flex flex-col gap-6 max-h-[300px] overflow-y-auto no-scrollbar pr-2">
                  {items.map(item => (
                    <div key={item.product.id} className="flex gap-4 items-center">
                      <img src={item.product.imagen} className="size-16 rounded-2xl bg-white p-2 object-contain shadow-xl" alt="" />
                      <div className="flex-1">
                        <h4 className="text-xs font-bold leading-tight">{item.product.nombre}</h4>
                        <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1">{item.quantity} Unidad(es)</p>
                      </div>
                      <span className="font-black text-sm">{( (item.product.precioUnitario || item.product.precioPVP || item.product.precio) * item.quantity).toFixed(2)}€</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-3 border-t border-white/5 pt-8">
                  {LAUNCH_PROMO_ACTIVE && (
                    <div className="flex justify-between text-xs text-white/40 uppercase tracking-widest">
                      <span>Precio original</span>
                      <span className="font-bold text-white/40 line-through">
                        {(total / (1 - LAUNCH_DISCOUNT)).toFixed(2)}€
                      </span>
                    </div>
                  )}
                  {LAUNCH_PROMO_ACTIVE && (
                    <div className="flex justify-between text-xs uppercase tracking-widest">
                      <span className="text-primary font-black flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">rocket_launch</span>
                        Descuento Lanzamiento -{Math.round(LAUNCH_DISCOUNT * 100)}%
                      </span>
                      <span className="font-black text-primary">
                        -{(total / (1 - LAUNCH_DISCOUNT) * LAUNCH_DISCOUNT).toFixed(2)}€
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-white/40 uppercase tracking-widest">
                    <span>Gastos de Envío</span>
                    <span className="font-black text-emerald-400">GRATIS</span>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-lg font-black">Total</span>
                    <span className="text-3xl font-black text-primary">{total.toFixed(2)}€</span>
                  </div>
                </div>

                  {(!showPayment || selectedMethod === 'card') && (
                    <button
                      type={showPayment ? "button" : "submit"}
                      onClick={showPayment && selectedMethod === 'card' ? handleExecutePayment : undefined}
                      disabled={loading || isPaying || (showPayment && selectedMethod === 'card' && (!cardholderName.trim() || !cardField))}
                      className="w-full h-16 bg-primary text-charcoal rounded-full font-black text-xs uppercase tracking-widest hover:bg-white hover:scale-105 transition-all shadow-2xl shadow-primary/10 flex items-center justify-center gap-3 disabled:opacity-30 disabled:grayscale disabled:scale-100 disabled:cursor-not-allowed"
                    >
                      {!showPayment ? (loading ? "Conectando..." : "Continuar al Pago") : (isPaying ? "Procesando..." : (!cardField ? "Cargando Pasarela..." : "Confirmar Pago"))}
                      <span className="material-symbols-outlined !text-[18px]">
                        {showPayment ? 'payments' : 'arrow_forward'}
                      </span>
                    </button>
                  )}

                  {/* Trust Badges - Refuerzo de conversión */}
                  <div className="flex flex-col gap-4 mt-2">
                    <div className="h-px bg-white/5 w-full mb-2" />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col items-center text-center gap-1 p-3 rounded-2xl bg-black/20 border border-white/5">
                        <span className="material-symbols-outlined text-primary text-lg">verified_user</span>
                        <span className="text-[8px] font-black uppercase text-white/60 tracking-widest">Pago 100% Seguro</span>
                      </div>
                      <div className="flex flex-col items-center text-center gap-1 p-3 rounded-2xl bg-black/20 border border-white/5">
                        <span className="material-symbols-outlined text-primary text-lg">local_shipping</span>
                        <span className="text-[8px] font-black uppercase text-white/60 tracking-widest">Envíos VIP 24/48h</span>
                      </div>
                    </div>
                  </div>
              </div>
            </div>
          </form>
        </div>
      </main>

      <Footer />


      </div>
    </PayPalScriptProvider>
  );
};

export default Checkout;
