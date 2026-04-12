// src/context/CartContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAlert } from "./AlertContext";
import { useAuth } from "./AuthContext";
import type { Producto } from "../api/products";
import {
  apiAgregarAlCarrito,
  apiEliminarProducto,
  apiGetCarrito,
  apiVaciarCarrito,
} from "../api/cart";
import { LAUNCH_PROMO_ACTIVE, LAUNCH_DISCOUNT } from "../config/promo";

export interface CartItem {
  product: Producto;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Producto, showModal?: boolean) => Promise<void>;
  removeItem: (productId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  total: number;
  loading: boolean;
  isModalOpen: boolean;
  lastAddedProduct: Producto | null;
  closeModal: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [lastAddedProduct, setLastAddedProduct] = useState<Producto | null>(null);

  const { showAlert } = useAlert();
  const { isAuthenticated } = useAuth();

  const closeModal = () => setIsModalOpen(false);

  // Cargar carrito inicial desde el backend o limpiar si no está autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      setItems([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        const data = await apiGetCarrito();
        if (!data || !data.items) {
          setItems([]);
          setTotal(0);
          return;
        }

        const mapped: CartItem[] = data.items.map((i) => ({
          product: {
            id: i.idProducto,
            nombre: i.nombreProducto,
            imagen: i.imagen ?? "",
            precio: i.precioUnitario,
            precioPVP: i.precioUnitario,
            manufacturer: "",
            categoria: "",
          } as Producto,
          quantity: i.cantidad,
        }));

        setItems(mapped);
        const rawTotal = Number(data.total);
        setTotal(LAUNCH_PROMO_ACTIVE ? Math.round(rawTotal * (1 - LAUNCH_DISCOUNT) * 100) / 100 : rawTotal);
      } catch (e) {
        setItems([]);
        setTotal(0);
        console.warn("Carrito vacío o no inicializado", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthenticated]);

  // Añadir 1 unidad de un producto
  const addItem = async (product: Producto, showModal: boolean = true) => {
    setLoading(true);
    try {
      const data = await apiAgregarAlCarrito({
        idProducto: Number(product.id),
        cantidad: 1,
      });

      const mapped: CartItem[] = data.items.map((i) => ({
        product: {
          id: i.idProducto,
          nombre: i.nombreProducto,
          imagen: i.imagen ?? "",
          precio: i.precioUnitario,
          precioPVP: i.precioUnitario,
          manufacturer: "",
          categoria: "",
        } as Producto,
        quantity: i.cantidad,
      }));

      setItems(mapped);
      const addRaw = Number(data.total);
      setTotal(LAUNCH_PROMO_ACTIVE ? Math.round(addRaw * (1 - LAUNCH_DISCOUNT) * 100) / 100 : addRaw);

      // Mostrar modal solo si se solicita
      if (showModal) {
        setLastAddedProduct(product);
        setIsModalOpen(true);
      }

      console.log("Producto añadido:", product.nombre);
    } catch (e: any) {
      console.error("Error al añadir al carrito:", e);
      showAlert(
        "Acción requerida",
        "Debes iniciar sesión para añadir productos al carrito.",
        "warning"
      );
    } finally {
      setLoading(false);
    }
  };

  // Eliminar un producto completo del carrito (todas sus unidades)
  const removeItem = async (productId: number) => {
    setLoading(true);
    try {
      await apiEliminarProducto(productId);
      const data = await apiGetCarrito();

      const mapped: CartItem[] = data.items.map((i) => ({
        product: {
          id: i.idProducto,
          nombre: i.nombreProducto,
          imagen: i.imagen ?? "",
          precio: i.precioUnitario,
          precioPVP: i.precioUnitario,
          manufacturer: "",
          categoria: "",
        } as Producto,
        quantity: i.cantidad,
      }));

      setItems(mapped);
      const removeRaw = Number(data.total);
      setTotal(LAUNCH_PROMO_ACTIVE ? Math.round(removeRaw * (1 - LAUNCH_DISCOUNT) * 100) / 100 : removeRaw);
    } finally {
      setLoading(false);
    }
  };

  // Vaciar carrito completo
  const clearCart = async () => {
    setLoading(true);
    try {
      await apiVaciarCarrito();
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        clearCart,
        total,
        loading,
        isModalOpen,
        lastAddedProduct,
        closeModal
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart debe usarse dentro de CartProvider");
  }
  return ctx;
};
