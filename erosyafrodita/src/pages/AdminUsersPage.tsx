import React, { useEffect, useState } from "react";
import { userService, UserProfile } from "../api/userService";
import AdminLayout from "../components/AdminLayout";
import { useAlert } from "../context/AlertContext";
import { useTranslation } from "../i18n";

const AdminUsersPage: React.FC = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"TODOS" | "ADMIN" | "CLIENTE">("TODOS");
  const [countryFilter, setCountryFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showAlert, showConfirm } = useAlert();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (error) {
      showAlert("Error", "No se pudieron cargar los usuarios", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleAdmin = (user: UserProfile) => {
    const newStatus = !user.admin;
    showConfirm(
      "Cambiar Rol",
      `¿Estás seguro de ${newStatus ? 'hacer Administrador' : 'quitar permisos de Admin'} a ${user.email}?`,
      async () => {
        try {
          await userService.updateUserProfile(user.email, { ...user, admin: newStatus });
          showAlert("Éxito", "Rol actualizado correctamente", "success");
          fetchUsers();
        } catch (error) {
          showAlert("Error", "No se pudo actualizar el rol", "error");
        }
      }
    );
  };

  const handleDeleteUser = (email: string) => {
    showConfirm(
      "Eliminar Usuario",
      `¿Estás seguro de eliminar permanentemente a ${email}? Esta acción no se puede deshacer.`,
      async () => {
        try {
          await userService.deleteUser(email);
          showAlert("Éxito", "Usuario eliminado correctamente", "success");
          fetchUsers();
        } catch (error) {
          showAlert("Error", "No se pudo eliminar el usuario", "error");
        }
      }
    );
  };

  const openUserDetails = (user: UserProfile) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;
    try {
      await userService.updateUserProfile(selectedUser.email, selectedUser);
      showAlert("Éxito", "Información de usuario guardada", "success");
      setIsModalOpen(false);
      fetchUsers();
    } catch (error) {
      showAlert("Error", "No se pudo guardar el usuario", "error");
    }
  };

  const filteredUsers = users.filter(u => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      u.email.toLowerCase().includes(search) ||
      u.name?.toLowerCase().includes(search) ||
      u.apellidos?.toLowerCase().includes(search) ||
      u.poblacion?.toLowerCase().includes(search) ||
      u.pais?.toLowerCase().includes(search);

    const matchesRole =
      roleFilter === "TODOS" ||
      (roleFilter === "ADMIN" && u.admin) ||
      (roleFilter === "CLIENTE" && !u.admin);

    const matchesCountry =
      countryFilter === "" || (u.pais || "").toLowerCase() === countryFilter.toLowerCase();

    return matchesSearch && matchesRole && matchesCountry;
  });

  return (
    <AdminLayout>
      <div className="flex flex-col gap-8">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">
              {t('adminUsers.title').split(' ').slice(0, 1).join(' ')} <span className="text-primary not-italic">{t('adminUsers.title').split(' ').slice(1).join(' ')}</span>
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.4em] mt-1">{t('adminUsers.subtitle')}</p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg group-focus-within:text-primary transition-colors">search</span>
              <input
                type="text"
                placeholder="BUSCAR POR EMAIL, NOMBRE, PAÍS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12 pl-12 pr-6 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white placeholder:text-slate-600 focus:border-primary/50 focus:bg-white/10 outline-none transition-all w-80"
              />
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rol</span>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as "TODOS" | "ADMIN" | "CLIENTE")}
                  className="h-10 bg-background-dark border border-white/10 rounded-xl px-3 text-[10px] font-black uppercase tracking-widest text-white outline-none"
                >
                  <option value="TODOS">Todos</option>
                  <option value="ADMIN">Admins</option>
                  <option value="CLIENTE">Clientes</option>
                </select>
              </div>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">País</span>
                <select
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  className="h-10 bg-background-dark border border-white/10 rounded-xl px-3 text-[10px] font-black uppercase tracking-widest text-white outline-none"
                >
                  <option value="">Todos</option>
                  {[...new Set(users.map(u => u.pais).filter(Boolean))].map((pais) => (
                    <option key={pais} value={pais}>{pais}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 bg-white/5 border border-white/10 rounded-[2rem]">
            <p className="text-[9px] uppercase tracking-[0.35em] text-slate-400 font-bold">Total de usuarios</p>
            <p className="mt-3 text-4xl font-black text-white">{users.length}</p>
          </div>
          <div className="p-5 bg-white/5 border border-white/10 rounded-[2rem]">
            <p className="text-[9px] uppercase tracking-[0.35em] text-slate-400 font-bold">Administradores</p>
            <p className="mt-3 text-4xl font-black text-primary">{users.filter(u => u.admin).length}</p>
          </div>
          <div className="p-5 bg-white/5 border border-white/10 rounded-[2rem]">
            <p className="text-[9px] uppercase tracking-[0.35em] text-slate-400 font-bold">Clientes</p>
            <p className="mt-3 text-4xl font-black text-slate-100">{users.filter(u => !u.admin).length}</p>
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="glass-panel rounded-[2.5rem] overflow-hidden border border-white/10 bg-white/5 shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuario</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contacto</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Localización</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rol</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-white/2 transition-colors group">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="size-10 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center text-white/50 font-black text-xs italic">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            (user.name?.charAt(0) || user.email.charAt(0)).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-white uppercase italic leading-tight">{user.name} {user.apellidos}</p>
                          <p className="text-[9px] font-bold text-slate-500 lowercase tracking-wider">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user.phone || 'No disponible'}</p>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-white/80 uppercase italic">{user.poblacion || 'N/A'}</span>
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{user.pais || 'No reg.'}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${user.admin
                        ? 'bg-primary/10 text-primary border-primary/20'
                        : 'bg-slate-500/10 text-slate-500 border-white/5'
                        }`}>
                        {user.admin ? 'Administrador' : 'Cliente'}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openUserDetails(user)}
                          className="size-9 rounded-xl bg-white/5 text-slate-200 border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center shadow-lg shadow-slate-900/10"
                          title="Ver Detalles"
                        >
                          <span className="material-symbols-outlined text-lg">visibility</span>
                        </button>
                        <button
                          onClick={() => handleToggleAdmin(user)}
                          className={`size-9 rounded-xl transition-all flex items-center justify-center shadow-lg ${user.admin
                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500 hover:text-white shadow-orange-500/10'
                            : 'bg-primary/20 text-primary border border-primary/30 hover:bg-primary hover:text-background-dark shadow-primary/10'
                            }`}
                          title={user.admin ? "Quitar Admin" : "Hacer Admin"}
                        >
                          <span className="material-symbols-outlined text-lg">
                            {user.admin ? 'person_remove' : 'verified_user'}
                          </span>
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.email)}
                          className="size-9 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-lg shadow-red-500/10"
                          title="Eliminar Usuario"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {isModalOpen && selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background-dark/80 backdrop-blur-xl">
            <div className="w-full max-w-3xl bg-charcoal border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl animate-fade-in-up">
              <div className="p-8 border-b border-white/10 flex flex-col gap-3 bg-white/5">
                <div>
                  <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Detalle de usuario</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.4em] mt-1">Edición y control completo del perfil</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="size-10 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400 transition-colors self-end">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="size-16 rounded-full bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center text-white/70 font-black text-2xl">
                      {selectedUser.avatarUrl ? (
                        <img src={selectedUser.avatarUrl} alt={selectedUser.name} className="w-full h-full object-cover" />
                      ) : (
                        (selectedUser.name?.charAt(0) || selectedUser.email.charAt(0)).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-slate-400 uppercase tracking-widest">{selectedUser.admin ? 'Administrador' : 'Cliente'}</p>
                      <p className="text-2xl font-black text-white uppercase tracking-tighter">{selectedUser.name} {selectedUser.apellidos}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em]">{selectedUser.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase tracking-[0.35em] text-slate-400 font-bold">Nombre</label>
                      <input
                        value={selectedUser.name || ''}
                        onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                        className="w-full h-14 px-6 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white focus:border-primary/50 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase tracking-[0.35em] text-slate-400 font-bold">Apellidos</label>
                      <input
                        value={selectedUser.apellidos || ''}
                        onChange={(e) => setSelectedUser({ ...selectedUser, apellidos: e.target.value })}
                        className="w-full h-14 px-6 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white focus:border-primary/50 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase tracking-[0.35em] text-slate-400 font-bold">Teléfono</label>
                      <input
                        value={selectedUser.phone || ''}
                        onChange={(e) => setSelectedUser({ ...selectedUser, phone: e.target.value })}
                        className="w-full h-14 px-6 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white focus:border-primary/50 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase tracking-[0.35em] text-slate-400 font-bold">País</label>
                      <input
                        value={selectedUser.pais || ''}
                        onChange={(e) => setSelectedUser({ ...selectedUser, pais: e.target.value })}
                        className="w-full h-14 px-6 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white focus:border-primary/50 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase tracking-[0.35em] text-slate-400 font-bold">Provincia</label>
                      <input
                        value={selectedUser.provincia || ''}
                        onChange={(e) => setSelectedUser({ ...selectedUser, provincia: e.target.value })}
                        className="w-full h-14 px-6 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white focus:border-primary/50 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase tracking-[0.35em] text-slate-400 font-bold">Código Postal</label>
                      <input
                        value={selectedUser.codigoPostal || ''}
                        onChange={(e) => setSelectedUser({ ...selectedUser, codigoPostal: e.target.value })}
                        className="w-full h-14 px-6 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white focus:border-primary/50 outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase tracking-[0.35em] text-slate-400 font-bold">Dirección primaria</label>
                    <input
                      value={selectedUser.direccionPrimaria || ''}
                      onChange={(e) => setSelectedUser({ ...selectedUser, direccionPrimaria: e.target.value })}
                      className="w-full h-14 px-6 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white focus:border-primary/50 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase tracking-[0.35em] text-slate-400 font-bold">Dirección secundaria</label>
                    <input
                      value={selectedUser.direccionSecundaria || ''}
                      onChange={(e) => setSelectedUser({ ...selectedUser, direccionSecundaria: e.target.value })}
                      className="w-full h-14 px-6 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white focus:border-primary/50 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase tracking-[0.35em] text-slate-400 font-bold">Población</label>
                      <input
                        value={selectedUser.poblacion || ''}
                        onChange={(e) => setSelectedUser({ ...selectedUser, poblacion: e.target.value })}
                        className="w-full h-14 px-6 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white focus:border-primary/50 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase tracking-[0.35em] text-slate-400 font-bold">Cumpleaños</label>
                      <input
                        type="date"
                        value={selectedUser.fechaNacimiento || ''}
                        onChange={(e) => setSelectedUser({ ...selectedUser, fechaNacimiento: e.target.value })}
                        className="w-full h-14 px-6 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white focus:border-primary/50 outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase tracking-[0.35em] text-slate-400 font-bold">Rol</label>
                    <select
                      value={selectedUser.admin ? 'ADMIN' : 'CLIENTE'}
                      onChange={(e) => setSelectedUser({ ...selectedUser, admin: e.target.value === 'ADMIN' })}
                      className="w-full h-14 px-6 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white outline-none"
                    >
                      <option value="CLIENTE">Cliente</option>
                      <option value="ADMIN">Administrador</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="p-8 border-t border-white/10 bg-white/5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-full md:w-auto h-14 rounded-2xl border border-white/10 bg-white/5 text-[11px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all"
                >
                  Cerrar
                </button>
                <button
                  onClick={handleSaveUser}
                  className="w-full md:w-auto h-14 rounded-2xl bg-primary text-background-dark text-[11px] font-black uppercase tracking-widest hover:bg-yellow-500 transition-all"
                >
                  Guardar usuario
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsersPage;
