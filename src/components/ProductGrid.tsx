import React, { useEffect, useState } from "react";
import { Product, User } from "../types";
import { ShoppingBag, Flame, Sparkles, Check, AlertCircle, ShieldAlert, Heart } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ProductGridProps {
  user: User | null;
  onNavigate: (path: string) => void;
  onAddToCart: (product: Product) => void;
  storeConfig?: {
    siteName: string;
    logoUrl: string;
    banners: string[];
  };
}

export default function ProductGrid({ user, onNavigate, onAddToCart, storeConfig }: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [currentSlide, setCurrentSlide] = useState(0);

  const banners = storeConfig?.banners || [];

  // Load candle list and categories on mount
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    setCurrentSlide(0);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % banners.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [banners.length]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (res.ok && data.categories) {
        setCategories(data.categories);
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/products");
      const data = await res.json();
      if (res.ok && data.products) {
        setProducts(data.products);
      } else {
        setErrorMsg("Failed to retrieve organic candle listing.");
      }
    } catch {
      setErrorMsg("Unable to contact server API. Please make sure server is online.");
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
    const cleanQuery = searchQuery.toLowerCase().trim();
    const matchesSearch = !cleanQuery || 
      product.title.toLowerCase().includes(cleanQuery) || 
      product.description.toLowerCase().includes(cleanQuery) ||
      (product.category && product.category.toLowerCase().includes(cleanQuery));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" id="product-grid-view">
      
      {/* Banner Carousel slideshow on top if templates/banners exist */}
      {banners.length > 0 && (
        <div className="w-full rounded-3xl overflow-hidden shadow-md border border-stone-200/60 relative h-[180px] sm:h-[300px] mb-8 bg-stone-100" id="homepage-scrolling-carousel">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -80 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="w-full h-full absolute inset-0"
            >
              <img
                src={banners[currentSlide]}
                referrerPolicy="no-referrer"
                alt={`Offer campaign slide ${currentSlide + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as any).src = "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&q=80&w=1200";
                }}
              />
              {/* Soft overlay */}
              <div className="absolute inset-0 bg-stone-900/15 flex flex-col justify-end p-5 sm:p-10 text-white select-none">
                <span className="text-[9px] sm:text-[10px] uppercase font-mono tracking-widest bg-amber-800/80 text-white/95 border border-amber-700/50 px-3 py-1 rounded-full w-fit mb-2 max-w-full truncate block" title={storeConfig?.siteName || "AURA"}>
                  Campaign Announcement from {storeConfig?.siteName || "AURA"}
                </span>
                <p className="text-xl sm:text-2.5xl font-serif tracking-tight text-white font-bold drop-shadow-md leading-tight">
                  Hand-Poured Soy Wax Magic
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Bullet Indicators */}
          {banners.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1.5 z-10 bg-black/20 px-3 py-1.5 rounded-full backdrop-blur-xs select-none">
              {banners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all ${idx === currentSlide ? 'bg-amber-100 w-4' : 'bg-white/45 hover:bg-white/70'}`}
                  title={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 12-Column Responsive Layout Grid */}
      <div className="grid grid-cols-12 gap-8" id="frosted-glass-main-layout">
        
        {/* MAIN COLUMN: Products Grid and Lists spanning full width */}
        <main className="col-span-12 flex flex-col gap-6" id="shop-catalog-main">
          {errorMsg && (
            <div className="bg-red-50/70 backdrop-blur-md border border-red-200 text-red-900 p-4 rounded-2xl flex items-center text-sm" id="shop-error-alert">
              <AlertCircle className="w-5 h-5 shrink-0 mr-2.5 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Search Bar & Category filter tab selection bar */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-stone-100/50 p-4 rounded-2xl border border-stone-200/40" id="search-category-controls">
            {/* Elegant Search Input */}
            <div className="relative w-full md:w-80">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search candle by title, detail or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-stone-800 placeholder-stone-400 text-xs focus:ring-1 focus:ring-stone-500 focus:border-stone-500 focus:outline-none transition-all shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category tabs */}
            <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto pb-1.5 md:pb-0 scrollbar-none" id="category-scroller">
              <button
                onClick={() => setSelectedCategory("All")}
                className={`px-3 py-1.5 rounded-xl text-xs font-serif font-bold transition-all cursor-pointer ${
                  selectedCategory === "All"
                    ? "bg-stone-900 text-white shadow-xs"
                    : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
                }`}
              >
                All Scents
              </button>
              {(categories.length > 0 ? categories : ["Classic", "Warm", "Floral", "Woody"]).map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-serif font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat
                      ? "bg-stone-900 text-white shadow-xs"
                      : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Catalog items load states check */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 glass-panel rounded-3xl" id="shop-loading-spinner">
              <div className="w-12 h-12 border-2 border-stone-300 border-t-amber-800 rounded-full animate-spin"></div>
              <p className="text-xs text-stone-600 font-mono mt-4">Forminating premium soy formulations...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 px-6 glass-panel rounded-3xl border border-white/40" id="shop-empty-alert">
              <Flame className="w-12 h-12 mx-auto text-amber-700/80 mb-4 animate-pulse" />
              <h3 className="font-serif text-2xl font-semibold text-stone-800">No Active Burners</h3>
              <p className="text-xs text-stone-500 mt-2 max-w-sm mx-auto leading-relaxed">
                Our candle laboratory is currently formulating. Register or sign in with an Admin account credentials to instantly publish new aromatic products.
              </p>
              {user && user.role === "admin" && (
                <button
                  onClick={() => onNavigate("/admin/dashboard")}
                  className="mt-6 inline-flex items-center space-x-2 text-xs font-mono bg-stone-900 text-white hover:bg-stone-800 px-5 py-2.5 rounded-full transition-colors font-bold shadow-sm"
                  id="empty-redirect-admin"
                >
                  Manage Atelier ➜
                </button>
              )}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 px-6 glass-panel rounded-3xl border border-stone-200/40 bg-stone-50/50" id="shop-search-empty">
              <Sparkles className="w-10 h-10 mx-auto text-stone-400 mb-3 animate-pulse" />
              <h3 className="font-serif text-lg font-bold text-stone-700">No Scents Found</h3>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                No candles matched "{searchQuery}" under {selectedCategory} tab category. Please try a different search or filter.
              </p>
              <button
                onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }}
                className="mt-4 inline-block text-xs font-mono text-amber-800 underline font-semibold"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="candley-items-grid">
              {filteredProducts.map((product) => {
                const isLiked = favorites.includes(product._id);
                return (
                  <motion.article 
                    key={product._id}
                    className="glass-card rounded-3xl p-4 flex flex-col justify-between"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    id={`candle-card-${product._id}`}
                  >
                    {/* Media wrap container */}
                    <div className="relative aspect-square overflow-hidden rounded-2xl bg-stone-100 shrink-0 shadow-sm border border-white/50">
                      <img 
                        src={product.imageUrl} 
                        alt={product.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        id={`candle-image-${product._id}`}
                      />
                      
                      {/* Subtle Wishlist Indicator */}
                      <button
                        onClick={(e) => toggleFavorite(product._id, e)}
                        className="absolute top-2.5 right-2.5 p-1.5 bg-white/70 hover:bg-white backdrop-blur-md rounded-full shadow-sm text-stone-700 transition-all border border-white/40"
                        id={`like-candle-btn-${product._id}`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-red-500 text-red-500 scale-110" : "text-stone-600"}`} />
                      </button>

                      {product.stock <= 5 && (
                        <span 
                          className="absolute bottom-2.5 left-2.5 bg-amber-800/85 backdrop-blur-md text-white font-mono text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border border-white/20 shadow-sm"
                          id={`low-stock-pill-${product._id}`}
                        >
                          Only {product.stock} units left
                        </span>
                      )}
                    </div>

                    {/* Metadata Section with custom spacing */}
                    <div className="pt-4 pb-1 h-full flex flex-col justify-between" id={`details-section-${product._id}`}>
                      <div className="mb-4">
                        <h3 className="font-serif text-lg text-stone-900 font-bold tracking-tight line-clamp-1">
                          {product.title}
                        </h3>
                        <p className="text-xs text-stone-500 line-clamp-2 mt-1.5 italic font-light leading-relaxed">
                          {product.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-white/40 flex items-center justify-between">
                        <div>
                          <p className="text-[9px] text-stone-400 font-mono uppercase tracking-widest">Pricing</p>
                          <p className="font-mono text-base font-bold text-amber-950">
                            ₹{product.price.toLocaleString("en-IN")}
                          </p>
                        </div>

                        <div className="flex items-center">
                          {/* Add to Cart button only */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddToCart(product);
                            }}
                            className="inline-flex items-center space-x-2 text-xs font-serif font-bold text-white bg-stone-900 hover:bg-stone-800 py-2 py-3 px-4 rounded-xl shadow-sm transition-all cursor-pointer whitespace-nowrap"
                            id={`add-to-cart-btn-${product._id}`}
                            title="Add Scent to Cart"
                          >
                            <ShoppingBag className="w-3.5 h-3.5 text-amber-200" />
                            <span>Add to Cart</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
