import React, { useState, useEffect } from 'react';
import { useIdealo, ProductoErosAfrodita } from '../services/idealo';

interface Producto {
  sku: string;
  nombre: string;
  precio: number;
  marca?: string;
}

export const IdealoSync: React.FC = () => {
  const { sincronizarProducto, verificarConexion, loading, error } = useIdealo();
  const [status, setStatus] = useState<string>('');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [conectado, setConectado] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);
  const [progreso, setProgreso] = useState({ actual: 0, total: 0 });

  // Cargar productos al montar
  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const response = await fetch('/api/productos');
        if (response.ok) {
          const data = await response.json();
          // Tomar solo los primeros 100 para no saturar
          setProductos(data.slice(0, 100));
        }
      } catch (err) {
        console.error('Error cargando productos:', err);
      }
    };
    cargarProductos();
  }, []);

  const handleVerificar = async () => {
    try {
      setStatus('Verificando conexión...');
      const conectado = await verificarConexion();
      setConectado(conectado);
      setStatus(conectado ? '✅ Conectado a Idealo (Shop ID: 337535)' : '❌ No conectado');
    } catch (err) {
      setStatus(`❌ Error: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  };

  const handleSincronizarTodos = async () => {
    if (!conectado) {
      setStatus('❌ Primero verifica la conexión');
      return;
    }

    setSincronizando(true);
    setStatus('🚀 Iniciando sincronización...');
    setProgreso({ actual: 0, total: productos.length });

    let exitosos = 0;
    let fallidos = 0;

    for (let i = 0; i < productos.length; i++) {
      const producto = productos[i];
      try {
        const productoData: ProductoErosAfrodita = {
          id: producto.sku,
          nombre: producto.nombre,
          precio: producto.precio,
          iva: 21,
          descripcion: producto.nombre,
          imagenes: [`https://erosyafrodita.com/img/${producto.sku}.jpg`],
          categoria: 'Belleza > Perfumes',
          marca: producto.marca || 'Eros y Afrodita',
          stock: 10,
          disponible: true,
          url: `https://erosyafrodita.com/producto/${producto.sku}`,
          ean: producto.sku,
        };

        await sincronizarProducto(productoData);
        exitosos++;
      } catch (err) {
        console.error(`Error sincronizando ${producto.sku}:`, err);
        fallidos++;
      }

      setProgreso({ actual: i + 1, total: productos.length });

      // Delay entre requests para no saturar
      if ((i + 1) % 10 === 0) {
        setStatus(`📊 Progreso: ${i + 1}/${productos.length} - ✅ ${exitosos} ❌ ${fallidos}`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Pausa cada 10 productos
      }

      // Delay entre requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setSincronizando(false);
    setStatus(`✅ Sincronización completada - ✅ ${exitosos} ❌ ${fallidos}`);
  };

  const handleSincronizarUno = async (producto: Producto) => {
    try {
      setStatus(`Sincronizando ${producto.sku}...`);
      
      const productoData: ProductoErosAfrodita = {
        id: producto.sku,
        nombre: producto.nombre,
        precio: producto.precio,
        iva: 21,
        descripcion: producto.nombre,
        imagenes: [`https://erosyafrodita.com/img/${producto.sku}.jpg`],
        categoria: 'Belleza > Perfumes',
        marca: producto.marca || 'Eros y Afrodita',
        stock: 10,
        disponible: true,
        url: `https://erosyafrodita.com/producto/${producto.sku}`,
        ean: producto.sku,
      };

      await sincronizarProducto(productoData);
      setStatus(`✅ ${producto.sku} sincronizado`);
    } catch (err) {
      setStatus(`❌ Error ${producto.sku}: ${err instanceof Error ? err.message : 'Error'}`);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Sincronización con Idealo</h2>
      
      <div className="space-y-4">
        <div className="flex gap-4">
          <button
            onClick={handleVerificar}
            disabled={loading || sincronizando}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Verificar Conexión
          </button>
          
          <button
            onClick={handleSincronizarTodos}
            disabled={loading || sincronizando || productos.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            Sincronizar {productos.length} Productos
          </button>
        </div>

        {loading && <p className="text-gray-600">Cargando...</p>}
        {error && <p className="text-red-600">Error: {error}</p>}
        {status && <p className="text-gray-800 font-medium">{status}</p>}

        {sincronizando && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${(progreso.actual / progreso.total) * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {progreso.actual} / {progreso.total} ({((progreso.actual / progreso.total) * 100).toFixed(1)}%)
            </p>
          </div>
        )}

        <div className="mt-6">
          <h3 className="font-semibold mb-2">Productos ({productos.length} cargados):</h3>
          <div className="max-h-96 overflow-y-auto border rounded">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {productos.slice(0, 20).map((producto) => (
                  <tr key={producto.sku}>
                    <td className="px-4 py-2 text-sm text-gray-900">{producto.sku}</td>
                    <td className="px-4 py-2 text-sm text-gray-500 truncate max-w-xs">{producto.nombre}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{producto.precio?.toFixed(2)}€</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleSincronizarUno(producto)}
                        disabled={sincronizando}
                        className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 disabled:opacity-50"
                      >
                        Sincronizar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {productos.length > 20 && (
              <p className="px-4 py-2 text-sm text-gray-500 text-center">
                ... y {productos.length - 20} productos más
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};