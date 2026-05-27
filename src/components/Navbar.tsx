import React from "react";
import { User } from "../types";
import { LogIn, LogOut, ShieldAlert, ShoppingBag, Terminal } from "lucide-react";
import EnlightLogo from "./EnlightLogo";

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
  const siteName = storeConfig?.siteName || "Enlight Candles";
  const logoUrl = storeConfig?.logoUrl || "";

  return (
    <header className="sticky top-4 mx-4 xl:mx-auto max-w-7xl bg-white/40 backdrop-blur-xl border border-white/40 shadow-sm rounded-2xl z-40 transition-all duration-300" id="navbar-header">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center h-16 sm:h-20">
          
          {/* Logo Brand Brand */}
          <div 
            onClick={() => onNavigate("/")}
            className="flex items-center space-x-2 sm:space-x-3 cursor-pointer group select-none min-w-0 max-w-[30%] sm:max-w-[45%] md:max-w-[50%] shrink"
            id="nav-brand-logo"
            title={siteName}
          >
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border border-stone-200/50 p-0.5 bg-white/90 shrink-0 flex items-center justify-center overflow-hidden">
              <img 
                src={logoUrl || "/uploads/logo_1779874885414.png"} 
                referrerPolicy="no-referrer"
                alt={siteName} 
                className="h-full w-full object-cover rounded-full"
                onError={(e) => {
                  (e.target as any).src = "/uploads/logo_1779874885414.png";
                }}
              />
            </div>
            <span className="font-serif text-[11px] sm:text-xs md:text-sm lg:text-base tracking-widest text-amber-950 font-bold uppercase transition-colors group-hover:text-stone-700 truncate">
              {siteName}
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-0.5 sm:space-x-1.5 md:space-x-2 text-xs sm:text-sm select-none">
            <button
              onClick={() => onNavigate("/")}
              className={`font-serif px-2 sm:px-3 py-1.5 text-xs sm:text-sm tracking-wide transition-all rounded-lg select-none whitespace-nowrap ${
                currentPath === "/" 
                  ? "text-stone-900 font-bold bg-stone-100/60" 
                  : "text-stone-600 hover:text-stone-950 hover:bg-stone-50"
              }`}
              id="nav-shop-link"
            >
              Shop
            </button>

            {/* Your Orders past log (Visible to anyone who signed in) */}
            {user && (
              <button
                onClick={() => onNavigate("/my-orders")}
                className={`font-serif px-2 sm:px-3 py-1.5 text-xs sm:text-sm tracking-wide transition-all rounded-lg select-none whitespace-nowrap ${
                  currentPath === "/my-orders"
                    ? "text-stone-900 font-bold bg-stone-100/60"
                    : "text-stone-600 hover:text-stone-950 hover:bg-stone-50"
                }`}
                id="nav-my-orders-link"
              >
                Orders
              </button>
            )}

            {/* Cart basket trigger with badge */}
            <button
              onClick={() => onNavigate("/cart")}
              className={`font-serif px-2 sm:px-3 py-1.5 text-xs sm:text-sm tracking-wide transition-all rounded-lg flex items-center space-x-1 whitespace-nowrap select-none ${
                currentPath === "/cart"
                  ? "text-stone-900 font-bold bg-stone-100/60"
                  : "text-stone-600 hover:text-stone-950 hover:bg-stone-50"
              }`}
              id="nav-cart-link"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-amber-800 shrink-0" />
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="bg-stone-900 text-stone-50 font-mono text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Admin Dashboard Protected View Button */}
            {user && user.role === "admin" && (
              <button
                onClick={() => onNavigate("/admin/dashboard")}
                className={`font-serif px-1.5 sm:px-2.5 py-1.5 text-xs sm:text-sm tracking-wide transition-all rounded-lg flex items-center space-x-1 whitespace-nowrap select-none ${
                  currentPath === "/admin/dashboard"
                    ? "text-amber-800 font-bold bg-amber-50/70"
                    : "text-amber-700 hover:text-amber-900 hover:bg-amber-50/40"
                }`}
                id="nav-admin-dashboard-link"
              >
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>Admin</span>
              </button>
            )}

            {/* Profile Status details / logout */}
            {user ? (
              <div className="flex items-center space-x-1 sm:space-x-2 pl-1.5 sm:pl-2.5 border-l border-stone-200" id="user-nav-profile">
                <div className="hidden lg:block text-right min-w-0">
                  <p className="text-[10px] font-mono text-stone-400 capitalize leading-none">{user.role}</p>
                  <p className="text-[11px] font-medium text-stone-700 max-w-[100px] truncate leading-normal">{user.email}</p>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1 px-1.5 sm:px-2.5 sm:py-1.5 text-[10px] sm:text-xs font-mono text-stone-600 hover:text-red-700 hover:bg-red-50 hover:border-red-100 border border-transparent rounded-lg transition-all flex items-center space-x-1"
                  id="nav-logout-btn"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => onNavigate("/login")}
                className={`flex items-center space-x-1 font-serif text-[11px] sm:text-xs tracking-wide transition-all px-2.5 sm:px-3.5 py-1.5 rounded-full border whitespace-nowrap ${
                  currentPath === "/login"
                    ? "bg-stone-900 text-stone-50 border-stone-900 shadow-sm"
                    : "border-stone-300 text-stone-700 hover:bg-stone-100"
                }`}
                id="nav-login-btn"
              >
                <LogIn className="w-3.5 h-3.5 shrink-0" />
                <span>Sign In</span>
              </button>
            )}
          </nav>

        </div>
      </div>
    </header>
  );
}
