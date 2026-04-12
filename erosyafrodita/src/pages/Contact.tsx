import React from 'react';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Contact: React.FC = () => {
  const [formData, setFormData] = React.useState({ nombre: '', email: '', mensaje: '' });
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await axios.post('/api/contacto', formData);
      setStatus('success');
      setFormData({ nombre: '', email: '', mensaje: '' });
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <div className="bg-background-dark font-display text-white min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex justify-center py-10 px-4">
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <h1 className="text-4xl font-bold mb-4">Contáctanos</h1>
            <p className="text-gray-400 mb-8">¿Tienes dudas? Escríbenos y nuestros expertos te responderán con la atención que mereces.</p>
            <div className="space-y-4">
              <div className="flex gap-4 p-4 bg-surface-dark rounded-xl border border-white/5">
                <span className="material-symbols-outlined text-primary">mail</span>
                <div>
                  <h3 className="font-bold">Email</h3>
                  <p className="text-sm text-gray-400">erosyafrodita.com@gmail.com</p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-surface-dark p-8 rounded-2xl border border-white/5 flex flex-col gap-4 shadow-xl">
            <input 
              className="bg-background-dark border border-border-dark rounded-lg p-3 text-white focus:ring-2 focus:ring-primary/50 outline-none" 
              placeholder="Nombre" 
              value={formData.nombre}
              required
              onChange={e => setFormData({ ...formData, nombre: e.target.value })}
            />
            <input 
              className="bg-background-dark border border-border-dark rounded-lg p-3 text-white focus:ring-2 focus:ring-primary/50 outline-none" 
              placeholder="Email" 
              type="email" 
              value={formData.email}
              required
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
            <textarea 
              className="bg-background-dark border border-border-dark rounded-lg p-3 text-white h-32 focus:ring-2 focus:ring-primary/50 outline-none" 
              placeholder="Mensaje"
              value={formData.mensaje}
              required
              onChange={e => setFormData({ ...formData, mensaje: e.target.value })}
            ></textarea>
            
            <button 
              disabled={status === 'loading'}
              className="bg-primary text-black font-bold py-3 rounded-lg hover:bg-white transition-colors shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {status === 'loading' ? 'Enviando...' : 'Enviar Mensaje'}
            </button>

            {status === 'success' && (
              <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest text-center animate-fade-in">
                ¡Mensaje enviado con éxito! Te responderemos pronto.
              </p>
            )}
            {status === 'error' && (
              <p className="text-red-400 text-xs font-bold uppercase tracking-widest text-center">
                Hubo un error al enviar. Por favor, inténtalo de nuevo.
              </p>
            )}
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
