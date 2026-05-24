import React from "react";
import { User } from "../types";
import { Flame, LogIn, LogOut, ShieldAlert, ShoppingBag, Terminal } from "lucide-react";

interface NavbarProps {
  user: User | null;
  currentPath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  cartCount: number;
  storeConfig?: {
    siteName: string;
    logoUrl: string;
    banners: string[];
  };
}

export default function Navbar({ user, currentPath, onNavigate, onLogout, cartCount, storeConfig }: NavbarProps) {
  const siteName = storeConfig?.siteName || "AURA";
  const logoUrl = storeConfig?.logoUrl || "";

  return (
    <header className="sticky top-4 mx-4 xl:mx-auto max-w-7xl bg-white/40 backdrop-blur-xl border border-white/40 shadow-sm rounded-2xl z-40 transition-all duration-300" id="navbar-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          
          {/* Logo Brand Brand */}
          <div 
            onClick={() => onNavigate("/")}
            className="flex items-center space-x-2.5 cursor-pointer group select-none min-w-0 max-w-[35%] sm:max-w-[45%] md:max-w-[50%] shrink-0 sm:shrink"
            id="nav-brand-logo"
            title={siteName}
          >
            {logoUrl ? (
              <img 
                src={logoUrl} 
                referrerPolicy="no-referrer"
                alt={siteName} 
                className="h-8 sm:h-10 w-auto object-contain rounded-lg border border-stone-200/50 p-0.5 bg-white/80 shrink-0"
                onError={(e) => {
                  // Fallback in case of invalid URL or load failure
                  (e.target as any).style.display = 'none';
                }}
              />
            ) : (
              <div className="p-1.5 sm:p-2 bg-stone-900 text-amber-100 rounded-full group-hover:bg-amber-800 transition-colors duration-300 shrink-0">
                <Flame className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
              </div>
            )}
            <span className="font-serif text-xs sm:text-sm md:text-lg lg:text-xl tracking-widest text-stone-900 font-bold uppercase transition-colors group-hover:text-stone-700 truncate">
              {siteName}
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-4">
            <button
              onClick={() => onNavigate("/")}
              className={`font-serif px-3 sm:px-4 py-2 text-sm tracking-wide transition-all rounded ${
                currentPath === "/" 
                  ? "text-stone-900 font-semibold underline underline-offset-8" 
                  : "text-stone-600 hover:text-stone-900"
              }`}
              id="nav-shop-link"
            >
              The Shop
            </button>

            {/* Your Orders past log (Visible to anyone who signed in) */}
            {user && (
              <button
                onClick={() => onNavigate("/my-orders")}
                className={`font-serif px-3 sm:px-4 py-2 text-sm tracking-wide transition-all rounded ${
                  currentPath === "/my-orders"
                    ? "text-stone-900 font-semibold underline underline-offset-8"
                    : "text-stone-600 hover:text-stone-900"
                }`}
                id="nav-my-orders-link"
              >
                Your Orders
              </button>
            )}

            {/* Cart basket trigger with badge */}
            <button
              onClick={() => onNavigate("/cart")}
              className={`font-serif px-3 sm:px-4 py-2 text-sm tracking-wide transition-all rounded flex items-center space-x-1.5 ${
                currentPath === "/cart"
                  ? "text-stone-900 font-bold underline underline-offset-8"
                  : "text-stone-600 hover:text-stone-900"
              }`}
              id="nav-cart-link"
            >
              <ShoppingBag className="w-4 h-4 text-amber-800" />
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="bg-stone-900 text-stone-50 font-mono text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Admin Dashboard Protected View Button */}
            {user && user.role === "admin" && (
              <button
                onClick={() => onNavigate("/admin/dashboard")}
                className={`font-serif px-3 sm:px-4 py-2 text-sm tracking-wide transition-all rounded flex items-center space-x-1.5 ${
                  currentPath === "/admin/dashboard"
                    ? "text-amber-800 font-semibold underline underline-offset-8"
                    : "text-amber-700 hover:text-amber-900"
                }`}
                id="nav-admin-dashboard-link"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Admin Portal</span>
              </button>
            )}

            {/* Profile Status details / logout */}
            {user ? (
              <div className="flex items-center space-x-1 sm:space-x-3 pl-2 sm:pl-3 border-l border-stone-200" id="user-nav-profile">
                <div className="hidden md:block text-right">
                  <p className="text-xs font-mono text-stone-400 capitalize">{user.role}</p>
                  <p className="text-xs font-medium text-stone-700 max-w-[120px] truncate">{user.email}</p>
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 sm:px-3 sm:py-2 text-xs font-mono text-stone-600 hover:text-red-700 hover:bg-red-50 hover:border-red-100 border border-transparent rounded transition-all flex items-center space-x-1"
                  id="nav-logout-btn"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => onNavigate("/login")}
                className={`flex items-center space-x-1.5 font-serif text-xs sm:text-sm tracking-wide transition-all px-3.5 py-2 rounded-full border ${
                  currentPath === "/login"
                    ? "bg-stone-900 text-stone-50 border-stone-900 shadow-sm"
                    : "border-stone-300 text-stone-700 hover:bg-stone-100"
                }`}
                id="nav-login-btn"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </nav>

        </div>
      </div>
    </header>
  );
}
