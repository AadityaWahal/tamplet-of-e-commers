import React, { useEffect, useState } from "react";
import { User, ConfigStatus, CartItem, Product } from "./types";
import SetupBanner from "./components/SetupBanner";
import Navbar from "./components/Navbar";
import ProductGrid from "./components/ProductGrid";
import AuthForm from "./components/AuthForm";
import AdminForm from "./components/AdminForm";
import CartView from "./components/CartView";
import MyOrdersView from "./components/MyOrdersView";
import { Sparkles, Heart, RefreshCw, Flame, Mail, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [config, setConfig] = useState<ConfigStatus | null>(null);
  const [storeConfig, setStoreConfig] = useState<{ siteName: string; logoUrl: string; banners: string[] } | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [currentPath, setCurrentPath] = useState("/");
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Cart listings state management
  const [cart, setCart] = useState<CartItem[]>([]);

  // Track if initial load from user profile has been performed
  const [loadedCartForUser, setLoadedCartForUser] = useState<string | null>(null);

  // Retrieve user session or initialize empty cart
  useEffect(() => {
    if (user) {
      // If user profile is loaded, prioritize their database cart
      if (loadedCartForUser !== user.email) {
        setCart(user.cart || []);
        setLoadedCartForUser(user.email);
      }
    } else {
      // Guest cart starts completely clean upon reload
      setCart([]);
      setLoadedCartForUser(null);
    }
  }, [user]);

  // Save cart back to database on updates
  useEffect(() => {
    const persistCart = async () => {
      if (user && loadedCartForUser === user.email) {
        try {
          await fetch("/api/auth/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cart })
          });
        } catch (err) {
          console.error("Failed to persist user cart state to database:", err);
        }
      }
    };
    persistCart();
  }, [cart, user, loadedCartForUser]);

  // Synchronize dynamic routing paths
  useEffect(() => {
    const path = window.location.pathname;
    const recognizedPaths = ["/login", "/admin/dashboard", "/cart", "/my-orders"];
    if (recognizedPaths.includes(path)) {
      setCurrentPath(path);
    } else {
      setCurrentPath("/");
    }

    // Monitor back/forward actions in browser page
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener("popstate", handlePopState);

    fetchStoreConfig();
    fetchConfigStatus();
    fetchCurrentUserSession();

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, "", path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const fetchStoreConfig = async () => {
    try {
      const res = await fetch("/api/store-config");
      if (res.ok) {
        const data = await res.json();
        setStoreConfig(data);
      }
    } catch (err) {
      console.warn("Unable to fetch dynamic storefront config.");
    }
  };

  const fetchConfigStatus = async () => {
    try {
      const res = await fetch("/api/config-status");
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (err) {
      console.warn("Unable to connect to configuration status endpoint.");
    } finally {
      setLoadingConfig(false);
    }
  };

  const fetchCurrentUserSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
        } else {
          localStorage.removeItem("aura_jwt_token");
          setUser(null);
        }
      }
    } catch {
      setUser(null);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        localStorage.removeItem("aura_jwt_token");
        setUser(null);
        navigateTo("/");
      }
    } catch (err) {
      console.error("Logout process exception:", err);
    }
  };

  const handleAddToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product._id === product._id);
      if (existing) {
        return prev.map(item => 
          item.product._id === product._id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateCartQty = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => item.product._id !== productId));
    } else {
      setCart(prev => 
        prev.map(item => 
          item.product._id === productId 
            ? { ...item, quantity } 
            : item
        )
      );
    }
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product._id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 select-text" id="aura-candles-application-root">
      
      {/* Main sticky header navigation menu */}
      <Navbar 
        user={user} 
        currentPath={currentPath} 
        onNavigate={navigateTo} 
        onLogout={handleLogout} 
        cartCount={cart.reduce((acc, it) => acc + it.quantity, 0)}
        storeConfig={storeConfig || undefined}
      />

      {/* Dynamic Main Body content views */}
      <main className="flex-grow max-w-7xl w-full mx-auto" id="aura-candle-main-viewport">
        <AnimatePresence mode="wait">
          {currentPath === "/" && (
            <motion.div
              key="shop"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              id="view-shop-container"
            >
              <ProductGrid 
                user={user} 
                onNavigate={navigateTo} 
                onAddToCart={handleAddToCart} 
                storeConfig={storeConfig || undefined}
              />
            </motion.div>
          )}

          {currentPath === "/login" && (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              id="view-login-container"
            >
              <AuthForm 
                onAuthSuccess={(u) => setUser(u)} 
                onNavigate={navigateTo} 
              />
            </motion.div>
          )}

          {currentPath === "/admin/dashboard" && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              id="view-admin-container"
            >
              <AdminForm 
                user={user} 
                onNavigate={navigateTo} 
                storeConfig={storeConfig || undefined}
                onRefreshStoreConfig={fetchStoreConfig}
              />
            </motion.div>
          )}

          {currentPath === "/cart" && (
            <motion.div
              key="cart"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              id="view-cart-container"
            >
              <CartView 
                user={user} 
                cart={cart} 
                onUpdateQuantity={handleUpdateCartQty} 
                onRemoveItem={handleRemoveFromCart} 
                onClearCart={handleClearCart} 
                onNavigate={navigateTo} 
                config={config}
              />
            </motion.div>
          )}

          {currentPath === "/my-orders" && (
            <motion.div
              key="my-orders"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              id="view-my-orders-container"
            >
              <MyOrdersView 
                user={user} 
                onNavigate={navigateTo} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer layout */}
      <footer className="bg-stone-900 border-t border-stone-800 text-stone-500 py-16" id="app-brand-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center space-x-2.5 text-stone-100 min-w-0">
              <div className="p-1.5 bg-stone-800 text-amber-500 rounded shrink-0">
                <Flame className="w-4 h-4" />
              </div>
              <span className="font-serif text-base sm:text-lg tracking-widest text-white uppercase font-bold truncate max-w-[250px] sm:max-w-[400px]" title={storeConfig?.siteName || "AURA CANDLES"}>
                {storeConfig?.siteName ? `${storeConfig.siteName} CANDLES` : "AURA CANDLES"}
              </span>
            </div>
            <p className="text-xs text-stone-400 font-serif leading-relaxed max-w-sm">
              Luxury hand-crafted soy candles. Biodegradable, vegan, toxin-free wax poured meticulously to deliver maximum fragrance dispersion and clean candle burn profiles.
            </p>
            <p className="text-[10px] text-stone-600 font-mono break-words max-w-sm">
              © {new Date().getFullYear()} {storeConfig?.siteName || "Aura"} Candle Atelier Co. All sovereign rights reserved.
            </p>
          </div>

          {/* Scent Categories info */}
          <div className="space-y-3">
            <h5 className="font-serif text-sm text-stone-300 tracking-wide font-medium">Scent Classifications</h5>
            <ul className="text-xs space-y-2 font-sans font-normal text-stone-400">
              <li className="hover:text-amber-500 transition-colors cursor-pointer">Earth & Oud Roots</li>
              <li className="hover:text-amber-500 transition-colors cursor-pointer">Citrus Peel & Herbal Moss</li>
              <li className="hover:text-amber-500 transition-colors cursor-pointer">Madagascar Vanilla Beans</li>
              <li className="hover:text-amber-500 transition-colors cursor-pointer">French Saffron & Cedar Wood</li>
            </ul>
          </div>

          {/* Secure transactions info */}
          <div className="space-y-3">
            <h5 className="font-serif text-sm text-stone-300 tracking-wide font-medium">Safe Processing</h5>
            <div className="space-y-2 text-xs text-stone-400">
              <p className="leading-relaxed">
                Checkouts verified securely via <strong>Razorpay Web SDK</strong>. Direct authorization.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1.5" id="safe-badges-row">
                <span className="text-[10px] font-mono border border-stone-800 bg-stone-950 text-stone-500 px-2 py-0.5 rounded">
                  SSL Certified
                </span>
                <span className="text-[10px] font-mono border border-stone-800 bg-stone-950 text-stone-500 px-2 py-0.5 rounded">
                  JWT Cookie Guard
                </span>
              </div>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}
