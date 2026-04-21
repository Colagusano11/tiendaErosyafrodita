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
  addItem: (product: Producto, quantity?: number, showModal?: boolean) => Promise<void>;
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
  const LOCAL_CART_KEY = "eros_guest_cart";

  const { showAlert } = useAlert();
  const { isAuthenticated } = useAuth();

  const closeModal = () => setIsModalOpen(false);

  // Calcular total para invitados
  const calculateGuestTotal = (cartItems: CartItem[]) => {
    const rawTotal = cartItems.reduce((sum, item) => {
        const price = item.product.precioUnitario || item.product.precioPVP || item.product.precio;
        return sum + (price * item.quantity);
    }, 0);
    setTotal(LAUNCH_PROMO_ACTIVE ? Math.round(rawTotal * (1 - LAUNCH_DISCOUNT) * 100) / 100 : rawTotal);
  };

  // Cargar carrito inicial
  useEffect(() => {
    if (!isAuthenticated) {
      // Cargar de localStorage si es invitado
      const savedCart = localStorage.getItem(LOCAL_CART_KEY);
      if (savedCart) {
        try {
          const parsed = JSON.parse(savedCart) as CartItem[];
          setItems(parsed);
          calculateGuestTotal(parsed);
        } catch (e) {
          setItems([]);
        }
      }
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

        const mapped: CartItem[] = (data?.items || []).map((i) => ({
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

  // Añadir unidades de un producto
  const addItem = async (product: Producto, quantity: number = 1, showModal: boolean = true) => {
    setLoading(true);
    
    // --- MODO INVITADO ---
    if (!isAuthenticated) {
      const newItems = [...items];
      const existing = newItems.find(i => i.product.id === product.id);
      if (existing) {
        existing.quantity += quantity;
      } else {
        newItems.push({ product, quantity });
      }
      setItems(newItems);
      localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(newItems));
      calculateGuestTotal(newItems);
      if (showModal) {
        setLastAddedProduct(product);
        setIsModalOpen(true);
      }
      setLoading(false);
      return;
    }

    // --- MODO REGISTRADO ---
    try {
      const data = await apiAgregarAlCarrito({
        idProducto: Number(product.id),
        cantidad: quantity,
      });

      const mapped: CartItem[] = (data?.items || []).map((i) => ({
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

      if (showModal) {
        setLastAddedProduct(product);
        setIsModalOpen(true);
      }
    } catch (e: any) {
      console.error("Error al añadir al carrito:", e);
    } finally {
      setLoading(false);
    }
  };

  // Eliminar un producto completo del carrito (todas sus unidades)
  const removeItem = async (productId: number) => {
    setLoading(true);

    // --- MODO INVITADO ---
    if (!isAuthenticated) {
      const newItems = items.filter(i => i.product.id !== productId);
      setItems(newItems);
      localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(newItems));
      calculateGuestTotal(newItems);
      setLoading(false);
      return;
    }

    // --- MODO REGISTRADO ---
    try {
      await apiEliminarProducto(productId);
      const data = await apiGetCarrito();
      const mapped: CartItem[] = (data?.items || []).map((i) => ({
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

    if (!isAuthenticated) {
        setItems([]);
        setTotal(0);
        localStorage.removeItem(LOCAL_CART_KEY);
        setLoading(false);
        return;
    }

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
