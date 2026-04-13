import React, { lazy, Suspense } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Loading Fallback
const PageLoader = () => (
  <div className="bg-background-dark min-h-screen flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="size-16 border-t-2 border-primary rounded-full animate-spin"></div>
      <p className="text-primary text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">
        Invocando Belleza...
      </p>
    </div>
  </div>
);

// Lazy Imports
const HomePage = lazy(() => import("./pages/HomePage"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Login = lazy(() => import("./pages/Login"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Profile = lazy(() => import("./pages/Profile"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Faq = lazy(() => import("./pages/Faq"));
const Catalog = lazy(() => import("./pages/Catalog"));
const SuccessPage = lazy(() => import("./pages/SuccessPage"));
const OrderDetailPage = lazy(() => import("./pages/OrderDetailPage"));
const AdminOrdersPage = lazy(() => import("./pages/AdminOrdersPage"));
const AdminProductsPage = lazy(() => import("./pages/AdminProductsPage"));
const AdminUsersPage = lazy(() => import("./pages/AdminUsersPage"));
const AvisoLegal = lazy(() => import("./document/AvisoLegal"));
const Terminos = lazy(() => import("./document/Terminos"));
const Privacidad = lazy(() => import("./document/Privacidad"));
const OrderTracking = lazy(() => import("./pages/OrderTracking")); // Guest tracking

// Component Imports
import AdminRoute from "./components/AdminRoute";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { AuthProvider } from "./context/AuthContext";
import { AlertProvider } from "./context/AlertContext";

import AddToCartModal from "./components/AddToCartModal";
import AlertModal from "./components/AlertModal";
import WhatsAppButton from "./components/WhatsAppButton";
import LaunchModal from "./components/LaunchModal";
import CookieBanner from "./components/CookieBanner";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AlertProvider>
        <CartProvider>
          <WishlistProvider>
            <Router>
              <AlertModal />
              <AddToCartModal />
              <WhatsAppButton />
              <LaunchModal />
              <CookieBanner />
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/success" element={<SuccessPage />} />
                  <Route path="/orders/:id" element={<OrderDetailPage />} />
                  <Route path="/catalog" element={<Catalog />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/faq" element={<Faq />} />
                  <Route path="/wishlist" element={<Wishlist />} />
                  <Route path="/legal/avisoLegal" element={<AvisoLegal />} />
                   <Route path="/legal/privacidad" element={<Privacidad />} />
                    <Route path="/legal/terminos" element={<Terminos />} />
                    <Route path="/track-order" element={<OrderTracking />} />


                  {/* Rutas ADMIN */}
                  <Route element={<AdminRoute />}>
                    <Route path="/admin" element={<Navigate to="/admin/orders" replace />} />
                    <Route path="/admin/orders" element={<AdminOrdersPage />} />
                    <Route path="/admin/products" element={<AdminProductsPage />} />
                    <Route path="/admin/users" element={<AdminUsersPage />} />
                  </Route>

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </Router>
          </WishlistProvider>
        </CartProvider>
      </AlertProvider>
    </AuthProvider>
  );
};

export default App;
