import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoEros from '../assets/logo-eros.png';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, register, verify, forgotPassword, resetPassword } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [showVerify, setShowVerify] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState<'email' | 'reset'>('email');
  
  const [verificationCode, setVerificationCode] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    apellidos: '',
  });

  const parseError = (err: any) => {
    const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Error inesperado';
    if (msg.includes('verificar tu cuenta')) return 'Tu cuenta aún no está activada. Introduce el código que te enviamos.';
    if (msg.includes('invalid credentials') || msg.includes('inválidas')) return 'Email o contraseña incorrectos.';
    if (msg.includes('already registered') || msg.includes('ya está registrado')) return 'Este email ya tiene una cuenta asociada.';
    if (msg.includes('not found') || msg.includes('no encontrado')) return 'No existe ninguna cuenta con este email.';
    return msg;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
    setSuccess(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ email: formData.email.trim(), password: formData.password });
      navigate('/');
    } catch (err: any) {
      const msg = parseError(err);
      if (msg.includes('activada')) {
        setShowVerify(true);
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    try {
      await register({
        email: formData.email.trim(),
        password: formData.password,
        name: formData.name.trim(),
        apellidos: formData.apellidos.trim(),
      });
      setShowVerify(true);
      setSuccess('¡Cuenta creada! Revisa tu email para el código de activación.');
    } catch (err: any) {
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await verify(formData.email.trim(), verificationCode.trim());
      setSuccess('Cuenta verificada con éxito. Ya puedes entrar.');
      setShowVerify(false);
      setActiveTab('login');
    } catch (err: any) {
      setError('Código incorrecto o ha expirado. Prueba a reenviarlo.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!formData.email) {
      setError('Introduce un email para reenviar el código.');
      return;
    }
    setLoading(true);
    try {
      const { authService } = await import('../api/authService');
      await authService.resendCode(formData.email.trim());
      setSuccess('Te hemos enviado un nuevo código.');
      setError(null);
    } catch (err: any) {
      setError('No se pudo reenviar. Inténtalo en unos minutos.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await forgotPassword(formData.email.trim());
      setForgotStep('reset');
      setSuccess('Código de recuperación enviado.');
    } catch (err: any) {
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await resetPassword(formData.email.trim(), resetCode.trim(), newPassword);
      setSuccess('Contraseña restablecida correctamente.');
      setShowForgot(false);
      setForgotStep('email');
      setActiveTab('login');
    } catch (err: any) {
      setError('Error al cambiar la contraseña. Revisa el código.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display min-h-screen flex flex-col antialiased selection:bg-primary selection:text-black">
      <header className="flex items-center justify-between whitespace-nowrap px-6 py-4 lg:px-10 lg:py-6 w-full absolute top-0 left-0 z-20">
        <div className="flex items-center gap-3 text-white cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/')}>
          <img src={logoEros} alt="Eros & Afrodita" className="size-8 rounded-full object-cover" />
          <h2 className="text-white text-xl font-bold tracking-tight">Erosyafrodita</h2>
        </div>
        <Link to="/" className="text-white/70 hover:text-primary text-sm font-medium transition-colors hidden sm:block">Volver a la tienda</Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 lg:p-8 relative overflow-hidden min-h-screen">
        <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="w-full max-w-[1100px] bg-surface-darker/90 backdrop-blur-xl border border-border-gold rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row min-h-[650px]">
          <div className="relative hidden lg:flex w-full lg:w-1/2 bg-surface-dark items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-[20s] ease-linear group-hover:scale-110" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuC6wxGixQtU2utnCurP9NAMCX_QMCCHPlJYLMpzkMHGP4qjdHPh3Gdq_CPRqaYiHL_het1GXGa06XhVcKF5Lwy-5p4edZFrbPjsuYNk9OJVjdEdqWkCFTaej7JFdx1z3g09AxAUWiWmhvNphSKKErG6HWPLhh9GOJBn6IJUX6hUcZOtd2mcSp526s4IF0s0yJxNzxe5zalA3hZiFNtmyjPIJNlOOG5BC6_BQZSWutrJM_PZG3w9XD3ICtr_7f1CqcbMvCnh7BnPec_p')" }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="relative z-10 p-12 text-center max-w-md">
              <h3 className="text-3xl font-bold text-white mb-4">La esencia del lujo eterno.</h3>
              <p className="text-gray-300 text-lg font-light leading-relaxed">Fragancias que despiertan los sentidos y realzan tu belleza natural.</p>
            </div>
          </div>

          <div className="w-full lg:w-1/2 p-6 md:p-12 flex flex-col justify-center bg-surface-darker/50">
            {/* Feedback Global */}
            {error && <div className="mb-6 p-4 rounded-xl text-xs font-bold bg-red-500/10 border border-red-500/30 text-red-400 animate-in fade-in slide-in-from-top-2">{error}</div>}
            {success && <div className="mb-6 p-4 rounded-xl text-xs font-bold bg-green-500/10 border border-green-500/30 text-green-400 animate-in fade-in slide-in-from-top-2">{success}</div>}

            {!showVerify && !showForgot ? (
              <>
                <div className="mb-8">
                  <div className="flex p-1 bg-surface-dark rounded-full border border-border-gold/30 relative">
                    <div className={`absolute inset-y-1 w-[calc(50%-4px)] bg-primary rounded-full transition-all duration-300 shadow-md ${activeTab === 'login' ? 'left-1' : 'left-[50%]'}`} />
                    <button onClick={() => { setActiveTab('login'); setError(null); setSuccess(null); }} className={`flex-1 text-center py-2 z-10 font-bold text-xs tracking-wide transition-colors ${activeTab === 'login' ? 'text-black' : 'text-white/60'}`}>INICIAR SESIÓN</button>
                    <button onClick={() => { setActiveTab('register'); setError(null); setSuccess(null); }} className={`flex-1 text-center py-2 z-10 font-bold text-xs tracking-wide transition-colors ${activeTab === 'register' ? 'text-black' : 'text-white/60'}`}>REGISTRARSE</button>
                  </div>
                </div>

                <div className="flex flex-col gap-6">
                  <div className="mb-2">
                    <h1 className="text-2xl font-bold text-white mb-2">{activeTab === 'login' ? 'Bienvenido de nuevo' : 'Crea tu cuenta VIP'}</h1>
                    <p className="text-white/50 text-sm">{activeTab === 'login' ? 'Ingresa tus credenciales para acceder.' : 'Únete a Erosyafrodita y disfruta del lujo.'}</p>
                  </div>

                  <form className="space-y-4" onSubmit={activeTab === 'login' ? handleLogin : handleRegister}>
                    {activeTab === 'register' && (
                      <div className="grid grid-cols-2 gap-4">
                        <label className="block group">
                          <span className="text-white text-xs font-semibold mb-1.5 block ml-1 text-white/70">Nombre</span>
                          <input name="name" value={formData.name} onChange={handleChange} required className="w-full h-11 bg-surface-dark border border-border-gold/50 rounded-full px-5 text-white placeholder-white/20 focus:outline-none focus:border-primary text-sm transition-all" placeholder="Juan" />
                        </label>
                        <label className="block group">
                          <span className="text-white text-xs font-semibold mb-1.5 block ml-1 text-white/70">Apellidos</span>
                          <input name="apellidos" value={formData.apellidos} onChange={handleChange} required className="w-full h-11 bg-surface-dark border border-border-gold/50 rounded-full px-5 text-white placeholder-white/20 focus:outline-none focus:border-primary text-sm transition-all" placeholder="Pérez" />
                        </label>
                      </div>
                    )}

                    <label className="block group">
                      <span className="text-white text-xs font-semibold mb-1.5 block ml-1 text-white/70">Email</span>
                      <input name="email" type="email" value={formData.email} onChange={handleChange} required className="w-full h-11 bg-surface-dark border border-border-gold/50 rounded-full px-5 text-white placeholder-white/20 focus:outline-none focus:border-primary text-sm transition-all" placeholder="ejemplo@erosyafrodita.com" />
                    </label>

                    <label className="block group relative">
                      <span className="text-white text-xs font-semibold mb-1.5 block ml-1 text-white/70">Contraseña</span>
                      <div className="relative">
                        <input name="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={handleChange} required className="w-full h-11 bg-surface-dark border border-border-gold/50 rounded-full px-5 pr-12 text-white placeholder-white/20 focus:outline-none focus:border-primary text-sm transition-all" placeholder="••••••••" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-primary transition-colors focus:outline-none">
                          <span className="material-symbols-outlined text-xl">{showPassword ? 'visibility_off' : 'visibility'}</span>
                        </button>
                      </div>
                    </label>

                    {activeTab === 'register' && (
                      <label className="block group relative">
                        <span className="text-white text-xs font-semibold mb-1.5 block ml-1 text-white/70">Confirmar Contraseña</span>
                        <div className="relative">
                          <input name="confirmPassword" type={showPassword ? "text" : "password"} value={formData.confirmPassword} onChange={handleChange} required className={`w-full h-11 bg-surface-dark border ${formData.confirmPassword && formData.password !== formData.confirmPassword ? 'border-red-500/50' : 'border-border-gold/50'} rounded-full px-5 pr-12 text-white placeholder-white/20 focus:outline-none focus:border-primary text-sm transition-all`} placeholder="••••••••" />
                        </div>
                      </label>
                    )}

                    {activeTab === 'login' && (
                      <div className="flex justify-between items-center text-xs">
                        <button type="button" onClick={() => { setShowVerify(true); setError(null); }} className="text-white/40 hover:text-primary transition-colors">¿Código pendiente?</button>
                        <button type="button" onClick={() => { setShowForgot(true); setError(null); setForgotStep('email'); }} className="text-primary hover:text-white transition-colors underline decoration-primary/30 underline-offset-4">¿Olvidaste tu contraseña?</button>
                      </div>
                    )}

                    <button disabled={loading} type="submit" className="w-full h-12 mt-4 bg-primary hover:bg-primary-hover disabled:grayscale text-black font-bold text-sm uppercase tracking-widest rounded-full shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0">
                      {loading ? 'Procesando...' : (activeTab === 'login' ? 'ENTRAR' : 'REGISTRARME')}
                    </button>
                    
                    {activeTab === 'register' && (
                       <div className="text-center mt-2">
                        <button type="button" onClick={() => { setShowVerify(true); setError(null); }} className="text-white/40 hover:text-primary text-xs transition-colors">¿Ya tienes un código? Verifica aquí</button>
                      </div>
                    )}
                  </form>
                </div>
              </>
            ) : showForgot ? (
                <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="text-center mb-4">
                        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/50">
                            <span className="material-symbols-outlined text-primary text-3xl">lock_reset</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Recuperar cuenta</h2>
                        <p className="text-white/50 text-sm">
                            {forgotStep === 'email' 
                                ? 'Introduce tu email y te enviaremos un código para restablecer tu contraseña.' 
                                : `Introduce el código enviado a ${formData.email}`}
                        </p>
                    </div>

                    <form className="space-y-4" onSubmit={forgotStep === 'email' ? handleForgot : handleReset}>
                        <label className="block group">
                            <span className="text-white text-xs font-semibold mb-1.5 block ml-1 text-white/70">Email de recuperación</span>
                            <input name="email" type="email" value={formData.email} onChange={handleChange} required disabled={forgotStep === 'reset'} className="w-full h-11 bg-surface-dark border border-border-gold/50 rounded-full px-5 text-white placeholder-white/20 focus:outline-none focus:border-primary disabled:opacity-50 text-sm transition-all" />
                        </label>

                        {forgotStep === 'reset' && (
                            <>
                                <label className="block group">
                                    <span className="text-white text-xs font-semibold mb-1.5 block ml-1 text-white/70">Código de 6 dígitos</span>
                                    <input value={resetCode} onChange={(e) => setResetCode(e.target.value)} required maxLength={6} className="w-full h-11 bg-surface-dark border border-border-gold/50 rounded-full px-5 text-white focus:outline-none focus:border-primary text-center text-xl font-bold tracking-widest" placeholder="000000" />
                                </label>
                                <label className="block group relative">
                                    <span className="text-white text-xs font-semibold mb-1.5 block ml-1 text-white/70">Nueva Contraseña</span>
                                    <div className="relative">
                                        <input type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="w-full h-11 bg-surface-dark border border-border-gold/50 rounded-full px-5 pr-12 text-white placeholder-•••••••• focus:outline-none focus:border-primary text-sm" placeholder="••••••••" />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-primary transition-colors">
                                            <span className="material-symbols-outlined text-xl">{showPassword ? 'visibility_off' : 'visibility'}</span>
                                        </button>
                                    </div>
                                </label>
                            </>
                        )}
                        
                        <button disabled={loading} type="submit" className="w-full h-12 mt-4 bg-primary hover:bg-primary-hover disabled:grayscale text-black font-bold text-sm uppercase tracking-widest rounded-full shadow-lg transition-all">
                            {loading ? 'Procesando...' : (forgotStep === 'email' ? 'ENVIAR CÓDIGO' : 'RESTABLECER CONTRASEÑA')}
                        </button>
                        <button type="button" onClick={() => { setShowForgot(false); setForgotStep('email'); setError(null); setSuccess(null); }} className="w-full text-white/40 hover:text-white text-xs transition-colors flex items-center justify-center gap-2">
                           <span className="material-symbols-outlined text-sm">arrow_back</span> Volver
                        </button>
                    </form>
                </div>
            ) : (
              <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/50">
                    <span className="material-symbols-outlined text-primary text-3xl">verified_user</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Verifica tu email</h2>
                  <p className="text-white/50 text-sm">Código enviado a <span className="text-primary font-bold">{formData.email}</span></p>
                </div>

                <form className="space-y-6" onSubmit={handleVerify}>
                  <div className="space-y-2">
                    <label className="text-white text-xs font-semibold mb-1.5 block ml-1 text-white/70">Introduce tu código</label>
                    <input value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} maxLength={6} required className="w-full h-14 bg-surface-dark border border-border-gold/50 rounded-xl text-center text-3xl font-bold tracking-[0.5em] text-white focus:outline-none focus:border-primary transition-all" placeholder="000000" />
                  </div>
                  
                  <button disabled={loading} type="submit" className="w-full h-12 bg-primary hover:bg-primary-hover disabled:grayscale text-black font-bold text-sm uppercase tracking-widest rounded-full shadow-lg transition-all">
                    {loading ? 'Verificando...' : 'ACTIVAR CUENTA'}
                  </button>
                  
                  <div className="flex flex-col gap-4 items-center">
                    <button type="button" disabled={loading} onClick={handleResendCode} className="text-primary hover:text-white text-xs transition-colors font-bold uppercase tracking-wider flex items-center gap-2">
                       <span className="material-symbols-outlined text-sm">forward_to_inbox</span> Reenviar código
                    </button>
                    <button type="button" onClick={() => { setShowVerify(false); setError(null); setSuccess(null); }} className="text-white/40 hover:text-white text-xs transition-colors flex items-center justify-center gap-2">
                       <span className="material-symbols-outlined text-sm">edit_note</span> Cambiar email / Volver
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
