import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { getHistorial, PedidoSalida } from "../api/order";
import { useAuth } from "../context/AuthContext";
import { useAlert } from "../context/AlertContext";
import { userService, UserProfile as UserProfileType } from "../api/userService";
import { paymentService } from "../api/paymentService";


type Tab = "datos" | "direcciones" | "pedidos" | "pagos" | "wishlist";

const Profile: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("datos");
  const { showAlert } = useAlert();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab") as Tab;
    if (tabParam && ["datos", "direcciones", "pedidos", "wishlist"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  const [isEditingAddress, setIsEditingAddress] = useState(false);

  // estados para Mis pedidos
  const [pedidos, setPedidos] = useState<PedidoSalida[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // auth
  const { user: userEmail, logout: logoutAuth, name, apellidos } = useAuth();
  const [profile, setProfile] = useState<UserProfileType | null>(null);

  // Form states for "Datos Personales"
  const [formData, setFormData] = useState({
    name: "",
    apellidos: "",
    email: "",
    phone: "",
    pais: "",
    provincia: "",
    codigoPostal: "",
    direccionPrimaria: "",
    direccionSecundaria: "",
    numeroSecundario: "",
    escaleraSecundaria: "",
    pisoSecundario: "",
    puertaSecundaria: "",
    poblacionSecundaria: "",
    provinciaSecundaria: "",
    codigoPostalSecundario: "",
    paisSecundario: "",
    avatarUrl: "",
    fechaNacimiento: "",
    numero: "",
    escalera: "",
    piso: "",
    puerta: "",
    poblacion: ""
  });

  // Estados para el Modal de Detalle de Dirección
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressType, setEditingAddressType] = useState<"primaria" | "secundaria">("primaria");

  // Estados para Cambio de Contraseña Seguridad
  const [currentPassword, setCurrentPassword] = useState("");
  const [showPassChangeModal, setShowPassChangeModal] = useState(false);
  const [passData, setPassData] = useState({ newPass: "", confirmPass: "" });
  const [passError, setPassError] = useState<string | null>(null);
  const [passLoading, setPassLoading] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!userEmail) {
      navigate("/");
    }
  }, [userEmail, navigate]);

  // empezamos en Direcciones


  useEffect(() => {
    if (activeTab !== "pedidos") return;

    const fetchHistorial = async () => {
      try {
        setLoading(true);
        const data = await getHistorial();
        setPedidos(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err: any) {
        setError(
          err.message ?? "No se pudo cargar el historial de pedidos.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchHistorial();
  }, [activeTab]);


  // Fetch profile data
  useEffect(() => {
    if (!userEmail) return;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await userService.getUserProfile(userEmail);
        setProfile(data);
        
        // Parse secondary address if JSON
        let sec: any = {};
        try { sec = JSON.parse(data.direccionSecundaria || "{}"); } 
        catch { sec = { calle: data.direccionSecundaria || "" }; }

        setFormData({
          name: data.name || "",
          apellidos: data.apellidos || "",
          email: data.email || "",
          phone: data.phone || "",
          pais: data.pais || "",
          provincia: data.provincia || "",
          codigoPostal: data.codigoPostal || "",
          direccionPrimaria: data.direccionPrimaria || "",
          direccionSecundaria: sec.calle || "",
          numeroSecundario: sec.numero || "",
          escaleraSecundaria: sec.escalera || "",
          pisoSecundario: sec.piso || "",
          puertaSecundaria: sec.puerta || "",
          poblacionSecundaria: sec.poblacion || "",
          provinciaSecundaria: sec.provincia || "",
          codigoPostalSecundario: sec.codigoPostal || "",
          paisSecundario: sec.pais || "",
          avatarUrl: data.avatarUrl || "",
          fechaNacimiento: data.fechaNacimiento || "",
          numero: data.numero || "",
          escalera: data.escalera || "",
          piso: data.piso || "",
          puerta: data.puerta || "",
          poblacion: data.poblacion || ""
        });
      } catch (err: any) {
        setError(err.message ?? "No se pudo cargar el perfil.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userEmail]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail || !profile) return;

    try {
      setLoading(true);
      const updated = await userService.updateUserProfile(userEmail, {
        ...profile,
        ...formData
      });
      setProfile(updated);
      showAlert("Perfil Actualizado", "Tus datos han sido guardados con éxito en el Olimpo.", "success");
    } catch (err: any) {
      setError(err.message ?? "Error al actualizar el perfil.");
    } finally {
      setLoading(false);
    }
  };


  const handleOpenPassModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setError("Por favor, introduce tu contraseña actual para continuar.");
      return;
    }
    setError(null);
    setShowPassChangeModal(true);
  };

  const handleConfirmPassChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail) return;
    if (passData.newPass.length < 6) {
      setPassError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (passData.newPass !== passData.confirmPass) {
      setPassError("Las nuevas contraseñas no coinciden.");
      return;
    }

    try {
      setPassLoading(true);
      setPassError(null);
      await userService.changePassword(userEmail, currentPassword.trim(), passData.newPass.trim());
      setShowPassChangeModal(false);
      showAlert("Llave Cambiada", "Tu contraseña ha sido actualizada correctamente.", "success");
      setCurrentPassword("");
      setPassData({ newPass: "", confirmPass: "" });
    } catch (err: any) {
      setPassError(err.response?.data?.message || "La contraseña actual es incorrecta o hubo un error en el servidor.");
    } finally {
      setPassLoading(false);
    }
  };


  return (
    <div className="bg-background-dark font-display text-white min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow w-full max-w-7xl mx-auto px-4 md:px-10 py-8">
        {/* Migas de pan */}
        <nav className="mb-8 flex items-center text-sm font-medium text-yellow-300/70">
          <Link to="/" className="hover:text-primary transition-colors">
            Inicio
          </Link>
          <span className="mx-2 text-yellow-900">/</span>
          <span className="hover:text-primary transition-colors">
            Mi Perfil
          </span>
          <span className="mx-2 text-yellow-900">/</span>
          <span className="text-primary font-semibold uppercase tracking-wider text-xs">
            {activeTab === "datos" && "Datos Personales"}
            {activeTab === "direcciones" && "Direcciones"}
            {activeTab === "pedidos" && "Mis Pedidos"}
            {activeTab === "pagos" && "Métodos de Pago"}
            {activeTab === "wishlist" && "Lista de Deseos"}
          </span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
          {/* Sidebar / Navigation Tabs */}
          <aside className="w-full lg:w-64 shrink-0 overflow-x-auto no-scrollbar lg:overflow-visible">
            <div className="flex lg:flex-col gap-2 min-w-max lg:min-w-0 lg:sticky lg:top-24 rounded-xl bg-surface-dark p-2 sm:p-4 lg:p-6 border border-[#493f22]">
              {/* User - Hidden on mobile nav to save space */}
              <div className="hidden lg:flex mb-8 items-center gap-4 border-b border-[#493f22] pb-6">
                <div
                  className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-primary/20"
                  style={{
                    backgroundImage: profile?.avatarUrl
                      ? `url("${profile.avatarUrl}")`
                      : 'url("https://ui-avatars.com/api/?name=' + (profile?.name || 'User') + '&background=f2b90d&color=000")',
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white truncate max-w-[140px]">
                    {profile ? `${profile.name} ${profile.apellidos}` : (name ? `${name} ${apellidos || ""}` : "Cargando...")}
                  </span>
                  <span className="text-xs text-yellow-300/80 truncate max-w-[140px]">
                    {profile?.email || userEmail}
                  </span>
                </div>
              </div>

              {/* Menú lateral */}
              <nav className="flex flex-col gap-2">
                <button
                  onClick={() => setActiveTab("datos")}
                  className={`flex items-center gap-2 sm:gap-3 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-sm text-left transition-all whitespace-nowrap ${activeTab === "datos"
                      ? "bg-primary text-background-dark font-black"
                      : "font-medium text-white/80 hover:bg-[#493f22] hover:text-white"
                    }`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    person
                  </span>
                  Datos Personales
                </button>

                <button
                  onClick={() => setActiveTab("direcciones")}
                  className={`flex items-center gap-2 sm:gap-3 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-sm text-left transition-all whitespace-nowrap ${activeTab === "direcciones"
                      ? "bg-primary text-background-dark font-black"
                      : "font-medium text-white/80 hover:bg-[#493f22] hover:text-white"
                    }`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    location_on
                  </span>
                  Direcciones
                </button>

                <button
                  onClick={() => setActiveTab("pedidos")}
                  className={`flex items-center gap-2 sm:gap-3 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-sm text-left transition-all whitespace-nowrap ${activeTab === "pedidos"
                      ? "bg-primary text-background-dark font-black"
                      : "font-medium text-white/80 hover:bg-[#493f22] hover:text-white"
                    }`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    shopping_bag
                  </span>
                  Mis Pedidos
                </button>


                <button
                  onClick={() => setActiveTab("wishlist")}
                  className={`flex items-center gap-2 sm:gap-3 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-sm text-left transition-all whitespace-nowrap ${activeTab === "wishlist"
                      ? "bg-primary text-background-dark font-black"
                      : "font-medium text-white/80 hover:bg-[#493f22] hover:text-white"
                    }`}
                >
                  <span className="material-symbols-outlined text-[18px] sm:text-[20px]">
                    favorite
                  </span>
                  Favoritos
                </button>

                <button
                  onClick={logoutAuth}
                  className="flex items-center gap-2 sm:gap-3 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-sm font-medium text-red-400 hover:bg-red-500/20 transition-all text-left whitespace-nowrap lg:mt-4 lg:border-t lg:border-[#493f22] lg:pt-4"
                >
                  <span className="material-symbols-outlined text-[18px] sm:text-[20px]">
                    logout
                  </span>
                  Cerrar Sesión
                </button>
              </nav>
            </div>
          </aside>

          {/* Contenido principal */}
          <section className="flex-1 min-h-[600px]">
            {/* TAB: Direcciones de envío */}
            {activeTab === "direcciones" && (
              <div className="animate-fadeIn">
                {/* Cabecera */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                      Direcciones de Envío
                    </h1>
                    <p className="mt-1 text-xs sm:text-sm text-yellow-300/80">
                      {isEditingAddress ? (editingAddressType === "primaria" ? "Edita los detalles de tu dirección principal." : "Edita tu dirección secundaria.") : "Gestiona dónde recibirás tus tesoros."}
                    </p>
                  </div>
                </div>

                {isEditingAddress ? (
                  <div className="bg-surface-dark border border-[#493f22] rounded-2xl p-8 animate-fadeIn">
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      if (!userEmail || !profile) return;
                      try {
                        setLoading(true);
                        
                        const secondaryAddressPayload = JSON.stringify({
                          calle: formData.direccionSecundaria,
                          numero: formData.numeroSecundario,
                          escalera: formData.escaleraSecundaria,
                          piso: formData.pisoSecundario,
                          puerta: formData.puertaSecundaria,
                          poblacion: formData.poblacionSecundaria,
                          provincia: formData.provinciaSecundaria,
                          codigoPostal: formData.codigoPostalSecundario,
                          pais: formData.paisSecundario
                        });

                        const payload = {
                           ...profile,
                           ...formData,
                           direccionSecundaria: secondaryAddressPayload
                        };

                        const updated = await userService.updateUserProfile(userEmail, payload);
                        setProfile(updated);
                        showAlert("Dirección Guardada", "Tu santiamén de entrega ha sido configurado.", "success");
                        setIsEditingAddress(false);
                      } catch (err: any) {
                        setError(err.message ?? "Error al actualizar la dirección.");
                      } finally {
                        setLoading(false);
                      }
                    }} className="flex flex-col gap-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <label className="flex flex-col gap-2 md:col-span-2">
                          <span className="text-white text-sm font-medium">Calle / Avenida</span>
                          <input
                            className="form-input flex w-full rounded-lg text-white border border-border-gold bg-background-dark h-12 md:h-14 px-4 text-base focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-text-gold/50"
                            type="text"
                            value={editingAddressType === "primaria" ? formData.direccionPrimaria : formData.direccionSecundaria}
                            onChange={(e) => setFormData({
                              ...formData,
                              [editingAddressType === "primaria" ? "direccionPrimaria" : "direccionSecundaria"]: e.target.value
                            })}
                            placeholder={editingAddressType === "primaria" ? "Calle Principal" : "Calle Secundaria"}
                          />
                        </label>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:col-span-2">
                          <label className="flex flex-col gap-2">
                            <span className="text-white text-sm font-medium">Nº</span>
                            <input
                              className="form-input flex w-full rounded-lg text-white border border-border-gold bg-background-dark h-12 md:h-14 px-4 text-base focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                              type="text"
                              value={editingAddressType === "primaria" ? formData.numero : formData.numeroSecundario}
                              onChange={(e) => setFormData({ ...formData, [editingAddressType === "primaria" ? "numero" : "numeroSecundario"]: e.target.value })}
                              placeholder="Nº"
                            />
                          </label>
                          <label className="flex flex-col gap-2">
                            <span className="text-white text-sm font-medium">Escalera</span>
                            <input
                              className="form-input flex w-full rounded-lg text-white border border-border-gold bg-background-dark h-12 md:h-14 px-4 text-base focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                              type="text"
                              value={editingAddressType === "primaria" ? formData.escalera : formData.escaleraSecundaria}
                              onChange={(e) => setFormData({ ...formData, [editingAddressType === "primaria" ? "escalera" : "escaleraSecundaria"]: e.target.value })}
                              placeholder="Escalera"
                            />
                          </label>
                          <label className="flex flex-col gap-2">
                            <span className="text-white text-sm font-medium">Piso</span>
                            <input
                              className="form-input flex w-full rounded-lg text-white border border-border-gold bg-background-dark h-12 md:h-14 px-4 text-base focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                              type="text"
                              value={editingAddressType === "primaria" ? formData.piso : formData.pisoSecundario}
                              onChange={(e) => setFormData({ ...formData, [editingAddressType === "primaria" ? "piso" : "pisoSecundario"]: e.target.value })}
                              placeholder="Piso"
                            />
                          </label>
                          <label className="flex flex-col gap-2">
                            <span className="text-white text-sm font-medium">Puerta</span>
                            <input
                              className="form-input flex w-full rounded-lg text-white border border-border-gold bg-background-dark h-12 md:h-14 px-4 text-base focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                              type="text"
                              value={editingAddressType === "primaria" ? formData.puerta : formData.puertaSecundaria}
                              onChange={(e) => setFormData({ ...formData, [editingAddressType === "primaria" ? "puerta" : "puertaSecundaria"]: e.target.value })}
                              placeholder="Puerta"
                            />
                          </label>
                        </div>

                        <label className="flex flex-col gap-2">
                          <span className="text-white text-sm font-medium">Población</span>
                          <input
                            className="form-input flex w-full rounded-lg text-white border border-border-gold bg-background-dark h-12 md:h-14 px-4 text-base focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                            type="text"
                            value={editingAddressType === "primaria" ? formData.poblacion : formData.poblacionSecundaria}
                            onChange={(e) => setFormData({ ...formData, [editingAddressType === "primaria" ? "poblacion" : "poblacionSecundaria"]: e.target.value })}
                            placeholder="Población"
                          />
                        </label>

                        <label className="flex flex-col gap-2">
                          <span className="text-white text-sm font-medium">Provincia</span>
                          <input
                            className="form-input flex w-full rounded-lg text-white border border-border-gold bg-background-dark h-12 md:h-14 px-4 text-base focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                            type="text"
                            value={editingAddressType === "primaria" ? formData.provincia : formData.provinciaSecundaria}
                            onChange={(e) => setFormData({ ...formData, [editingAddressType === "primaria" ? "provincia" : "provinciaSecundaria"]: e.target.value })}
                            placeholder="Provincia"
                          />
                        </label>

                        <label className="flex flex-col gap-2">
                          <span className="text-white text-sm font-medium">Código Postal</span>
                          <input
                            className="form-input flex w-full rounded-lg text-white border border-border-gold bg-background-dark h-12 md:h-14 px-4 text-base focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                            type="text"
                            value={editingAddressType === "primaria" ? formData.codigoPostal : formData.codigoPostalSecundario}
                            onChange={(e) => setFormData({ ...formData, [editingAddressType === "primaria" ? "codigoPostal" : "codigoPostalSecundario"]: e.target.value })}
                            placeholder="Código Postal"
                          />
                        </label>

                        <label className="flex flex-col gap-2">
                          <span className="text-white text-sm font-medium">País</span>
                          <input
                            className="form-input flex w-full rounded-lg text-white border border-border-gold bg-background-dark h-12 md:h-14 px-4 text-base focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                            type="text"
                            value={editingAddressType === "primaria" ? formData.pais : formData.paisSecundario}
                            onChange={(e) => setFormData({ ...formData, [editingAddressType === "primaria" ? "pais" : "paisSecundario"]: e.target.value })}
                            placeholder="País"
                          />
                        </label>
                      </div>

                      <div className="flex gap-4 pt-4 mt-4 border-t border-[#493f22]">
                        <button
                          type="button"
                          onClick={() => setIsEditingAddress(false)}
                          className="px-8 py-3 rounded-xl border border-border-gold/30 text-white font-bold hover:bg-white/5 transition-all"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="flex-1 px-8 py-3 rounded-xl bg-primary text-background-dark font-black uppercase text-xs tracking-widest hover:bg-yellow-400 transition-all shadow-xl shadow-primary/20"
                        >
                          Guardar Dirección
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <>
                    {/* Grid de direcciones */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      {/* Dirección Primaria */}
                      {(profile?.direccionPrimaria || profile?.pais) ? (
                        <div
                          className="group relative flex flex-col justify-between rounded-xl border border-primary bg-surface-dark p-6 shadow-lg shadow-black/20 transition-all hover:shadow-primary/20 hover:scale-[1.02]"
                        >
                          <div className="absolute right-4 top-4 rounded-full bg-primary/20 px-3 py-1 text-xs font-bold text-primary ring-1 ring-primary/50">
                            Principal
                          </div>

                          <div className="flex items-start gap-4 mb-4">
                            <div className="rounded-full bg-[#493f22] p-2 text-white group-hover:bg-primary group-hover:text-black transition-colors">
                              <span className="material-symbols-outlined text-[24px]">
                                home
                              </span>
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-white">
                                Mi Dirección Principal
                              </h3>
                              <p className="text-sm font-medium text-yellow-300/80 mt-1">
                                {profile.name} {profile.apellidos}
                              </p>
                            </div>
                          </div>

                          <div className="mb-6 space-y-1 text-sm text-gray-300">
                            <p className="line-clamp-1">
                              {profile.direccionPrimaria} {profile.numero ? `nº ${profile.numero}` : ""}
                            </p>
                            <p>{profile.poblacion || profile.provincia}{profile.codigoPostal ? `, ${profile.codigoPostal}` : ""}</p>
                            <p>{profile.pais}</p>
                          </div>

                          <div className="flex items-center gap-3 border-t border-[#493f22] pt-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingAddressType("primaria");
                                setIsEditingAddress(true);
                              }}
                              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#493f22] px-3 py-2 text-sm font-medium text-white hover:bg-[#5a4d2b] transition-colors"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                              Modificar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-surface-dark/50 p-10 text-center gap-4">
                          <span className="material-symbols-outlined text-4xl text-white/20">location_off</span>
                          <p className="text-sm text-gray-400">Aún no has configurado tu dirección principal.</p>
                          <button
                            onClick={() => {
                              setEditingAddressType("primaria");
                              setIsEditingAddress(true);
                            }}
                            className="text-primary text-sm font-bold hover:underline"
                          >
                            Configurar ahora
                          </button>
                        </div>
                      )}

                      {/* Dirección Secundaria */}
                      {profile?.direccionSecundaria ? (
                        <div
                          className="group relative flex flex-col justify-between rounded-xl border border-white/10 bg-surface-dark p-6 shadow-lg transition-all hover:border-primary/50 hover:shadow-primary/5 hover:scale-[1.02]"
                        >
                          <div className="flex items-start gap-4 mb-4">
                            <div className="rounded-full bg-[#493f22] p-2 text-white group-hover:bg-primary group-hover:text-black transition-colors">
                              <span className="material-symbols-outlined text-[24px]">
                                apartment
                              </span>
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-white">
                                Dirección Secundaria
                              </h3>
                              <p className="text-sm font-medium text-yellow-300/80 mt-1">
                                {profile.name} {profile.apellidos}
                              </p>
                            </div>
                          </div>

                          <div className="mb-6 space-y-1 text-sm text-gray-300">
                            {(() => {
                              let sec: any = {};
                              try { sec = JSON.parse(profile.direccionSecundaria); } 
                              catch { sec = { calle: profile.direccionSecundaria }; }
                              return (
                                <>
                                  <p className="line-clamp-1">
                                    {sec.calle} {sec.numero ? `nº ${sec.numero}` : ""}
                                  </p>
                                  <p>{sec.poblacion || sec.provincia}{sec.codigoPostal ? `, ${sec.codigoPostal}` : ""}</p>
                                  <p>{sec.pais}</p>
                                </>
                              );
                            })()}
                          </div>

                          <div className="flex items-center gap-3 border-t border-[#493f22] pt-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingAddressType("secundaria");
                                setIsEditingAddress(true);
                              }}
                              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#493f22] px-3 py-2 text-sm font-medium text-white hover:bg-[#5a4d2b] transition-colors"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                              Modificar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingAddressType("secundaria");
                            setIsEditingAddress(true);
                          }}
                          className="group flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[#493f22] bg-transparent p-6 transition-all hover:border-primary hover:bg-[#493f22]/30"
                        >
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#493f22] text-yellow-300 transition-colors group-hover:bg-primary group-hover:text-black">
                            <span className="material-symbols-outlined text-[24px]">
                              add_location_alt
                            </span>
                          </div>
                          <span className="font-bold text-white group-hover:text-primary">
                            Añadir dirección secundaria
                          </span>
                        </button>
                      )}
                    </div>

                    {/* Info extra */}
                    <div className="mt-10 rounded-lg bg-blue-900/20 border border-blue-900/50 p-4 flex gap-3">
                      <span className="material-symbols-outlined text-blue-400 shrink-0">
                        info
                      </span>
                      <div className="text-sm text-blue-100">
                        <p className="font-bold mb-1">
                          Información de envíos internacionales
                        </p>
                        <p className="opacity-80">
                          Los envíos a las Islas Canarias y fuera de la UE pueden
                          estar sujetos a impuestos adicionales.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === "datos" && (
              <div className="animate-fadeIn">
                <div className="max-w-4xl">
                  {/* Cabecera */}
                  <div className="flex flex-col gap-2 sm:gap-3 mb-6 sm:mb-10">
                    <h1 className="text-white tracking-tight text-2xl sm:text-3xl md:text-4xl font-bold">
                      Mis Datos Personales
                    </h1>
                    <p className="text-text-gold text-sm sm:text-base font-normal max-w-2xl">
                      Actualiza tu información personal para una experiencia premium.
                    </p>
                  </div>

                  {/* Formulario */}
                  <form id="form-datos" onSubmit={handleUpdateProfile} className="flex flex-col gap-8">
                    {/* Información personal */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <label className="flex flex-col gap-2">
                        <span className="text-white text-sm font-medium">Nombre</span>
                        <div className="relative group">
                          <input
                            className="form-input flex w-full rounded-lg text-white border border-border-gold bg-surface-dark h-12 md:h-14 px-4 text-base focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-text-gold/50"
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          />
                        </div>
                      </label>

                      <label className="flex flex-col gap-2">
                        <span className="text-white text-sm font-medium">Apellidos</span>
                        <div className="relative group">
                          <input
                            className="form-input flex w-full rounded-lg text-white border border-border-gold bg-surface-dark h-12 md:h-14 px-4 text-base focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-text-gold/50"
                            type="text"
                            value={formData.apellidos}
                            onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                          />
                        </div>
                      </label>

                      <label className="flex flex-col gap-2 md:col-span-2">
                        <span className="text-white text-sm font-medium">
                          Correo Electrónico
                        </span>
                        <div className="relative flex items-center">
                          <span className="absolute left-4 text-text-gold material-symbols-outlined">
                            mail
                          </span>
                          <input
                            className="form-input flex w-full rounded-lg opacity-60 text-white border border-border-gold bg-surface-dark h-12 md:h-14 pl-12 pr-12 text-base focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-text-gold/50"
                            type="email"
                            value={formData.email}
                            disabled
                          />
                          <div
                            className="absolute right-4 text-green-500 material-symbols-outlined"
                            title="Email verificado"
                          >
                            check_circle
                          </div>
                        </div>
                      </label>

                      <label className="flex flex-col gap-2">
                        <span className="text-white text-sm font-medium">
                          Fecha de Nacimiento{" "}
                          <span className="text-text-gold/60 font-normal">
                            (Opcional)
                          </span>
                        </span>
                        <div className="relative flex items-center">
                          <input
                            className="form-input flex w-full rounded-lg text-white border border-border-gold bg-surface-dark h-12 md:h-14 px-4 text-base focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-text-gold/50 [color-scheme:dark]"
                            type="date"
                            value={formData.fechaNacimiento}
                            onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                          />
                        </div>
                      </label>

                      <label className="flex flex-col gap-2">
                        <span className="text-white text-sm font-medium">
                          Teléfono Móvil
                        </span>
                        <div className="relative flex items-center">
                          <span className="absolute left-4 text-text-gold material-symbols-outlined">
                            smartphone
                          </span>
                          <input
                            className="form-input flex w-full rounded-lg text-white border border-border-gold bg-surface-dark h-12 md:h-14 pl-12 px-4 text-base focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-text-gold/50"
                            placeholder="+34 600 000 000"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          />
                        </div>
                      </label>

                    </div>

                    <div className="border-t border-[#493f22] pt-8 mt-2">
                      <h3 className="text-white text-lg font-bold mb-4">Seguridad</h3>
                      <div className="bg-[#493f22]/30 rounded-xl p-6 border border-border-gold/30 flex flex-col md:flex-row justify-between items-end gap-6">
                        <div className="flex flex-col gap-4 w-full">
                          <div className="flex flex-col gap-1">
                            <span className="text-white font-medium">Cambiar Contraseña</span>
                            <span className="text-text-gold text-xs leading-relaxed">
                              Por tu seguridad, introduce tu contraseña actual antes de establecer una nueva.
                            </span>
                          </div>
                          <div className="relative group max-w-md">
                            <input
                              type="password"
                              className="w-full h-12 bg-background-dark border border-border-gold/30 rounded-lg px-4 text-white placeholder:text-white/20 focus:border-primary outline-none transition-all"
                              placeholder="Introduce tu contraseña actual"
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleOpenPassModal}
                          className="w-full md:w-auto px-8 h-12 rounded-lg bg-surface-dark border border-border-gold text-white text-xs font-bold uppercase tracking-widest hover:bg-primary hover:text-charcoal hover:border-primary transition-all whitespace-nowrap shadow-lg active:scale-95"
                        >
                          Siguiente Paso
                        </button>
                      </div>
                    </div>

                    {/* Botones */}
                    <div className="flex flex-col-reverse sm:flex-row gap-4 pt-4 mt-4">
                      <button
                        type="button"
                        onClick={() => setActiveTab("direcciones")}
                        className="px-8 py-3 rounded-lg border border-transparent text-text-gold text-sm font-bold hover:text-white transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="flex-1 sm:flex-none px-10 py-3 rounded-lg bg-primary text-[#231e10] text-sm font-bold hover:bg-yellow-400 hover:shadow-[0_0_20px_rgba(242,185,13,0.3)] transition-all transform active:scale-95 flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined">save</span>
                        Guardar Cambios
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {activeTab === "pedidos" && (
              <div className="animate-fadeIn">
                <div className="w-full max-w-5xl">
                  <h1 className="text-2xl sm:text-3xl font-black mb-6 uppercase tracking-tighter">Mis pedidos</h1>

                  {loading && (
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      Cargando pedidos...
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm mb-6">
                      {error}
                    </div>
                  )}

                  {!loading && !error && pedidos.length === 0 && (
                    <div className="bg-surface-dark border border-[#493f22] rounded-xl p-10 text-center flex flex-col items-center gap-4">
                      <span className="material-symbols-outlined text-5xl text-white/10">shopping_cart_off</span>
                      <p className="text-gray-400">Aún no tienes pedidos realizados.</p>
                      <Link to="/" className="text-primary font-bold hover:underline">Ir a la tienda</Link>
                    </div>
                  )}

                  <div className="flex flex-col gap-6">
                    {(pedidos || []).map((pedido) => (
                      <Link
                        key={pedido.idPedido}
                        to={`/orders/${pedido.idPedido}`}
                        className="group relative block bg-surface-dark border border-white/5 rounded-2xl p-6 transition-all hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 active:scale-[0.98]"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors"></div>

                        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">Pedido #{pedido.idPedido}</span>
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${pedido.estado === 'ENTREGADO'
                                  ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                  : pedido.estado === 'CANCELADO'
                                    ? 'bg-red-400/10 text-red-400 border-red-400/20'
                                    : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                }`}>
                                {pedido.estado}
                              </span>
                            </div>
                            <p className="text-sm text-gray-400 font-light">
                              Realizado el {new Date(pedido.fechaCreacion + (pedido.fechaCreacion.endsWith('Z') ? '' : 'Z')).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                          </div>

                          <div className="flex items-center gap-8">
                            <div className="text-right">
                              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Total</p>
                              <p className="text-2xl font-black text-white">
                                {pedido.total.toFixed(2)}<span className="text-primary text-sm ml-1">€</span>
                              </p>
                            </div>
                            <div className="size-12 rounded-full border border-white/10 flex items-center justify-center text-white/40 group-hover:bg-primary group-hover:text-background-dark group-hover:border-primary transition-all shadow-xl">
                              <span className="material-symbols-outlined text-[20px]">arrow_forward_ios</span>
                            </div>
                          </div>
                        </div>

                        {pedido.productos && pedido.productos.length > 0 && (
                          <div className="relative z-10 mt-6 pt-6 border-t border-white/5">
                            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-2">
                              {(pedido.productos || []).map((prod, idx) => (
                                <div key={idx} className="flex items-center gap-3 bg-background-dark/50 rounded-xl p-2 pr-4 border border-white/5 shrink-0">
                                  {prod.imagen && (
                                    <div className="size-10 rounded-lg overflow-hidden bg-white/5 p-1">
                                      <img
                                        src={prod.imagen}
                                        alt={prod.nombreProducto}
                                        className="w-full h-full object-contain"
                                      />
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-[10px] font-bold text-white truncate max-w-[120px]">{prod.nombreProducto}</p>
                                    <p className="text-[9px] text-gray-500 uppercase tracking-widest">Cant: {prod.cantidad}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}



            {activeTab === "wishlist" && (
              <div className="animate-fadeIn p-10 bg-surface-dark rounded-xl border border-[#493f22] text-center">
                <span className="material-symbols-outlined text-5xl text-primary/20 mb-4">favorite</span>
                <p className="text-gray-400">
                  Tu lista de deseos está vacía. Guarda tus tesoros favoritos para verlos aquí más tarde.
                </p>
                <Link to="/" className="inline-block mt-4 text-primary font-bold hover:underline">Explorar productos</Link>
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />



      {/* MODAL CAMBIO DE CONTRASEÑA */}
      {showPassChangeModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 animate-fadeIn">
          <div className="absolute inset-0 bg-charcoal/95 backdrop-blur-md" onClick={() => setShowPassChangeModal(false)}></div>
          <div className="relative bg-surface-dark border border-primary/30 rounded-[3rem] p-10 max-w-md w-full shadow-2xl animate-scaleIn">
            <div className="text-center mb-8">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4 border border-primary/20">
                <span className="material-symbols-outlined text-3xl">lock_open</span>
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Nueva Contraseña</h2>
              <p className="text-gray-400 text-xs mt-2 uppercase tracking-widest font-bold">Establece tu nuevo acceso VIP</p>
            </div>

            {passError && (
              <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-[10px] font-bold text-center uppercase tracking-wider">
                {passError}
              </div>
            )}

            <form onSubmit={handleConfirmPassChange} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary ml-2">Nueva Contraseña</span>
                  <input
                    type="password"
                    required
                    className="w-full h-14 bg-background-dark border border-white/10 rounded-2xl px-6 text-white text-sm focus:border-primary outline-none transition-all placeholder:text-white/10"
                    placeholder="••••••••"
                    value={passData.newPass}
                    onChange={(e) => setPassData({ ...passData, newPass: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary ml-2">Confirmar Nueva Contraseña</span>
                  <input
                    type="password"
                    required
                    className={`w-full h-14 bg-background-dark border ${passData.confirmPass && passData.newPass !== passData.confirmPass ? 'border-red-500/50' : 'border-white/10'} rounded-2xl px-6 text-white text-sm focus:border-primary outline-none transition-all placeholder:text-white/10`}
                    placeholder="••••••••"
                    value={passData.confirmPass}
                    onChange={(e) => setPassData({ ...passData, confirmPass: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <button
                  type="submit"
                  disabled={passLoading}
                  className="w-full h-14 bg-primary text-charcoal rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-yellow-400 transition-all shadow-xl shadow-primary/20"
                >
                  {passLoading ? "Validando..." : "Actualizar Contraseña"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPassChangeModal(false)}
                  className="w-full h-14 rounded-2xl border border-white/5 text-gray-500 text-[10px] font-black uppercase tracking-widest hover:text-white hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Modal Detalle de Dirección */}
      {showAddressModal && selectedAddress && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface-dark border border-primary/30 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-scaleUp">
            <div className="relative p-8">
              <button
                onClick={() => setShowAddressModal(false)}
                className="absolute right-4 top-4 text-white/50 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>

              <div className="flex items-center gap-4 mb-8">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-3xl">location_on</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white uppercase tracking-tighter">Detalle de Dirección</h2>
                  <p className="text-primary text-xs font-black uppercase tracking-widest">{selectedAddress.titulo}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-6">
                  <div className="col-span-2 space-y-1">
                    <p className="text-xs text-yellow-300/50 uppercase font-bold tracking-widest">Calle / Dirección</p>
                    <p className="text-lg text-white font-medium">{selectedAddress.calle || "No especificada"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-yellow-300/50 uppercase font-bold tracking-widest">Nº</p>
                    <p className="text-lg text-white font-medium">{profile?.numero || "-"}</p>
                  </div>
                </div>

                {(profile?.escalera || profile?.piso || profile?.puerta) && (
                  <div className="grid grid-cols-3 gap-4 bg-primary/5 p-4 rounded-xl border border-primary/10">
                    <div className="space-y-1 text-center">
                      <p className="text-[10px] text-yellow-300/50 uppercase font-bold">Escalera</p>
                      <p className="text-white text-sm font-bold">{profile.escalera || "-"}</p>
                    </div>
                    <div className="space-y-1 text-center border-x border-primary/10">
                      <p className="text-[10px] text-yellow-300/50 uppercase font-bold">Piso</p>
                      <p className="text-white text-sm font-bold">{profile.piso || "-"}</p>
                    </div>
                    <div className="space-y-1 text-center">
                      <p className="text-[10px] text-yellow-300/50 uppercase font-bold">Puerta</p>
                      <p className="text-white text-sm font-bold">{profile.puerta || "-"}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-xs text-yellow-300/50 uppercase font-bold tracking-widest">Población</p>
                    <p className="text-white font-medium">{selectedAddress.poblacion || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-yellow-300/50 uppercase font-bold tracking-widest">C.P.</p>
                    <p className="text-white font-medium">{selectedAddress.cp || "-"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-xs text-yellow-300/50 uppercase font-bold tracking-widest">Provincia</p>
                    <p className="text-white font-medium">{selectedAddress.provincia || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-yellow-300/50 uppercase font-bold tracking-widest">País</p>
                    <p className="text-white font-medium">{selectedAddress.pais || "-"}</p>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex gap-4">
                <button
                  onClick={() => setShowAddressModal(false)}
                  className="flex-1 py-3 bg-primary text-background-dark font-black uppercase text-xs tracking-widest hover:bg-yellow-400 transition-all rounded-xl"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    setShowAddressModal(false);
                    setEditingAddressType(selectedAddress.tipo);
                    setIsEditingAddress(true);
                  }}
                  className="px-6 py-3 border border-primary/20 text-white font-bold text-xs uppercase tracking-widest hover:bg-white/5 transition-all rounded-xl"
                >
                  Editar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estilos para animaciones */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
        .animate-scaleUp { animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};

export default Profile;
