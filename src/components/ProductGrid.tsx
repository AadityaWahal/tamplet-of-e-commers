import React, { useEffect, useState } from "react";
import { Product, User } from "../types";
import { ShoppingBag, Flame, Sparkles, Check, AlertCircle, ShieldAlert, Heart } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import EnlightLogo from "./EnlightLogo";

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

const testimonials = [
  {
    id: "rev_1",
    name: "Sarah Jenkins",
    role: "Verified Collector",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
    text: "The Santal Violet candle completely transformed my study space. The throw is subtle yet luxurious, burning smoothly for hours.",
    rating: 5
  },
  {
    id: "rev_2",
    name: "David Thorne",
    role: "Aromatherapy Enthusiast",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    text: "Madagascar Vanilla blended with charred oak is pure genius. It has a warm, mysterious scent that is incredibly comforting.",
    rating: 5
  },
  {
    id: "rev_3",
    name: "Elena Rostova",
    role: "Interior Designer",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
    text: "I specify Enlight Candles for all my styling projects. The scalloped branding and glass jar look like sculptural pieces themselves.",
    rating: 5
  }
];

export default function ProductGrid({ user, onNavigate, onAddToCart, storeConfig }: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const banners = storeConfig?.banners || [];

  // Load candle list and categories on mount
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

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

  const renderProductCard = (product: Product) => {
    const isLiked = favorites.includes(product._id);
    return (
      <motion.article 
        key={product._id}
        className="glass-card rounded-2xl p-3 flex flex-col justify-between h-full group bg-white/40 border border-white/50 shadow-xs hover:bg-white/60 transition-all duration-350"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        id={`candle-card-${product._id}`}
      >
        {/* Media Container */}
        <div className="relative aspect-square overflow-hidden rounded-xl bg-stone-100 shrink-0 border border-white/35">
          <img 
            src={product.imageUrl} 
            alt={product.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
            id={`candle-image-${product._id}`}
            onError={(e) => {
              (e.target as any).src = "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&q=80&w=600";
            }}
          />
          
          {/* Heart button */}
          <button
            onClick={(e) => toggleFavorite(product._id, e)}
            className="absolute top-2 right-2 p-1.5 bg-white/70 hover:bg-white backdrop-blur-md rounded-full shadow-xs text-stone-705 transition-all border border-white/30 cursor-pointer z-10"
            id={`like-candle-btn-${product._id}`}
          >
            <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-red-500 text-red-500 scale-110" : "text-stone-600"}`} />
          </button>

          {product.stock <= 5 && (
            <span 
              className="absolute bottom-2 left-2 bg-amber-800/85 backdrop-blur-xs text-white font-mono text-[8px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border border-white/10"
              id={`low-stock-pill-${product._id}`}
            >
              Only {product.stock} left
            </span>
          )}
        </div>

        {/* Content details below image */}
        <div className="pt-3 flex flex-col justify-between flex-grow" id={`details-section-${product._id}`}>
          <div className="text-left">
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#8C6D58] block mb-0.5">
              {product.category || "General"}
            </span>
            <h3 className="font-serif text-[14px] sm:text-[15px] text-stone-900 font-bold tracking-tight line-clamp-1 group-hover:text-[#8C6D58] transition-colors leading-tight">
              {product.title}
            </h3>
            <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5 italic font-light">
              {product.description}
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-white/30 flex items-center justify-between">
            <div className="text-left">
              <p className="font-mono text-xs sm:text-sm font-bold text-amber-950">
                ₹{product.price.toLocaleString("en-IN")}
              </p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(product);
              }}
              className="inline-flex items-center space-x-1 text-[11px] font-serif font-bold text-white bg-stone-950 hover:bg-stone-850 px-3 py-1.5 rounded-lg shadow-xs transition-all cursor-pointer whitespace-nowrap"
              id={`add-to-cart-btn-${product._id}`}
              title="Add Scent to Cart"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-amber-200" />
              <span>Add</span>
            </button>
          </div>
        </div>
      </motion.article>
    );
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto animate-[fade-in_0.5s_ease-out]" id="product-grid-view">
      
      {/* Dynamic Brand Intro Header Panel - EXACT UNTOUCHED LOGO IN THE MIDDLE & JUMPING EMBLEM FLAME */}
      <div className="flex flex-col items-center justify-center text-center py-4 sm:py-6 mb-4 max-w-3xl mx-auto space-y-3" id="enlight-brand-introduction">
        <EnlightLogo size="lg" showText={false} className="animate-[fade-in_0.8s_ease-out] drop-shadow-md hover:scale-105 transition-transform duration-500 ease-out" />
        <div className="flex flex-col items-center mt-2">
          <span className="font-serif italic text-stone-500 text-xs sm:text-sm tracking-wide">Where Fragrance Meets Luxury</span>
          <h1 className="font-serif text-lg sm:text-2xl tracking-[0.2em] text-amber-955 font-bold uppercase mt-1">ENLIGHT CANDLES</h1>
          <div className="w-12 h-[1px] bg-amber-800/20 mt-2"></div>
        </div>
      </div>

      {/* Editorial Luxury Hero Banner styled off the photo's warm-cream/brown aesthetic */}
      <section className="w-full rounded-2xl overflow-hidden border border-[#E9DFD3] bg-[#FAF5EE] shadow-[0_4px_24px_rgba(130,110,95,0.03)] mb-12 grid grid-cols-1 md:grid-cols-12 items-center" id="homepage-luxury-banner">
        {/* Left Editorial Column with Handcrafted Premium text */}
        <div className="col-span-12 md:col-span-5 p-8 sm:p-12 md:p-16 flex flex-col justify-center text-left space-y-6">
          <span className="font-sans text-[10px] sm:text-xs uppercase tracking-[0.25em] text-[#8C6D58] font-bold">
            The Atelier Collection
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium text-[#3A2B20] leading-[1.08] tracking-tight">
            Handcrafted <br />
            <span className="italic font-light">Luxury Candles</span>
          </h2>
          <p className="font-sans text-xs sm:text-sm text-[#615143] leading-relaxed max-w-sm">
            Elevate your space with natural, artlainah scents. Hand-poured with all-natural organic soy wax.
          </p>
          <div className="pt-2">
            <button 
              onClick={() => {
                const el = document.getElementById("search-category-controls");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-8 py-3.5 bg-[#B19379] hover:bg-[#977C63] text-white font-serif tracking-[0.15em] font-medium text-xs sm:text-sm rounded-lg shadow-sm transition-all duration-300 uppercase cursor-pointer"
            >
              SHOP NOW
            </button>
          </div>
        </div>
        
        {/* Right Product Collage Column: Warm amber jars next to flowers */}
        <div className="col-span-12 md:col-span-7 h-[250px] sm:h-[400px] md:h-[450px] relative overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1596435764253-6535f2d74bb3?auto=format&fit=crop&q=80&w=1200"
            alt="Handcrafted luxury amber candles"
            className="w-full h-full object-cover transition-transform duration-[6000ms] ease-out hover:scale-[1.04]"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as any).src = "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&q=80&w=1200";
            }}
          />
          {/* Subtle light overlay to match aesthetic */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#FAF5EE]/30 via-transparent to-transparent h-1/4" />
        </div>
      </section>

      {/* Best Sellers Section - Clean 4-column smaller grids just like the photo */}
      <section className="mb-16" id="homepage-best-sellers">
        <div className="text-center mb-10">
          <span className="font-sans text-[10px] uppercase tracking-[0.25em] text-[#8C6D58] font-bold block mb-1">
            Highly Requested Formulations
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#3A2B20] font-bold tracking-widest uppercase">
            Best Sellers
          </h2>
          <div className="w-10 h-[1.5px] bg-[#B19379]/45 mx-auto mt-2"></div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 bg-white/20 rounded-2xl border border-white/30" id="best-sellers-loading">
            <div className="w-8 h-8 border-2 border-stone-300 border-t-amber-800 rounded-full animate-spin"></div>
          </div>
        ) : products.length === 0 ? (
          <p className="text-xs text-center text-[#615143] italic font-serif">Our candle artisans are compiling active inventory formulation databases.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6" id="best-sellers-grid">
            {products.slice(0, 4).map(product => renderProductCard(product))}
          </div>
        )}
      </section>

      {/* Scents Inspired by Nature dual columns split panel - Perfectly captures the middle banner in the photo */}
      <section className="w-full rounded-2xl overflow-hidden bg-white border border-[#E9DFD3] grid grid-cols-1 md:grid-cols-2 items-center mb-16 shadow-[0_4px_24px_rgba(130,110,95,0.02)]" id="scents-inspired-by-nature-split">
        {/* Left Column: Cozy elegant image with orange citrus slices and candle */}
        <div className="h-[250px] sm:h-[350px] relative">
          <img 
            src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800" 
            alt="Scents inspired by nature"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as any).src = "https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&q=80&w=800";
            }}
          />
        </div>
        
        {/* Right Column: Narrative content */}
        <div className="p-8 sm:p-12 md:p-16 space-y-4 text-left">
          <h3 className="font-serif text-2xl sm:text-3xl text-[#3A2B20] font-medium leading-tight">
            Scents Inspired by <span className="italic">Nature</span>
          </h3>
          <p className="font-sans text-xs sm:text-sm text-[#615143] leading-relaxed">
            Every Enlight candle is poured by hand using 100% natural, slow-poured soy wax, pure organic cotton wicks, and botanically-infused essential oils. Inspired by the natural, simple luxury of botanical gardens, our proprietary scent profiles are meticulously clean, non-toxic, and slow-burning.
          </p>
          <div className="pt-2">
            <button 
              onClick={() => {
                const el = document.getElementById("search-category-controls");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-6 py-3 border border-[#B19379] hover:bg-[#FAF5EE] text-[#B19379] font-serif tracking-[0.14em] text-xs font-bold rounded-lg transition-all duration-300 uppercase cursor-pointer"
            >
              Explore Collection
            </button>
          </div>
        </div>
      </section>

      {/* Catalog items search tools, categories & general inventory grid */}
      <section className="mb-16" id="all-collections-section">
        <div className="text-center mb-8">
          <span className="font-sans text-[10px] uppercase tracking-[0.25em] text-[#8C6D58] font-bold block mb-1">
            Complete Scent Library
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#3A2B20] font-bold tracking-widest uppercase">
            Our Collection
          </h2>
          <div className="w-10 h-[1.5px] bg-[#B19379]/45 mx-auto mt-2"></div>
        </div>

        <div className="flex flex-col gap-6" id="all-collections-library-viewport">
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
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600 text-xs cursor-pointer"
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
            <div className="flex flex-col items-center justify-center py-24 bg-white/20 border border-white/30 rounded-2xl animate-pulse" id="shop-loading-spinner">
              <div className="w-12 h-12 border-2 border-stone-300 border-t-amber-800 rounded-full animate-spin"></div>
              <p className="text-xs text-stone-600 font-mono mt-4">Formating premium soy formulations...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 px-6 bg-white/20 border border-stone-100 rounded-2xl" id="shop-empty-alert">
              <Flame className="w-12 h-12 mx-auto text-amber-700/80 mb-4 animate-pulse" />
              <h3 className="font-serif text-2xl font-semibold text-stone-800">No Active Burners</h3>
              <p className="text-xs text-stone-500 mt-2 max-w-sm mx-auto leading-relaxed">
                Our candle laboratory is currently formulating. Register or sign in with an Admin account credentials to instantly publish new aromatic products.
              </p>
              {user && user.role === "admin" && (
                <button
                  onClick={() => onNavigate("/admin/dashboard")}
                  className="mt-6 inline-flex items-center space-x-2 text-xs font-mono bg-stone-900 text-white hover:bg-stone-800 px-5 py-2.5 rounded-full transition-colors font-bold shadow-sm cursor-pointer"
                  id="empty-redirect-admin"
                >
                  Manage Atelier ➜
                </button>
              )}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 px-6 bg-stone-50/50 border border-stone-200/40 rounded-2xl" id="shop-search-empty">
              <Sparkles className="w-10 h-10 mx-auto text-stone-400 mb-3 animate-pulse" />
              <h3 className="font-serif text-lg font-bold text-stone-700">No Scents Found</h3>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                No candles matched "{searchQuery}" under {selectedCategory} tab category. Please try a different search or filter.
              </p>
              <button
                onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }}
                className="mt-4 inline-block text-xs font-mono text-amber-800 underline font-semibold cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 animate-[fade-in_0.4s_ease-out]" id="candley-items-grid">
              {filteredProducts.map(product => renderProductCard(product))}
            </div>
          )}
        </div>
      </section>

      {/* Custom Comments Section - High contrast critiques grid exactly matching the "Custom" section in the photo */}
      <section className="mt-16 mb-8 border-t border-[#E9DFD3]/65 pt-16" id="customer-opinions-block">
        <div className="text-center mb-12">
          <span className="font-sans text-[10px] uppercase tracking-[0.25em] text-[#8C6D58] font-bold block mb-1 animate-pulse">
            Atelier Critiques
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#3A2B20] font-bold tracking-widest uppercase">
            Custom
          </h2>
          <div className="w-10 h-[1.5px] bg-[#B19379]/45 mx-auto mt-2"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map(item => (
            <div key={item.id} className="bg-white/40 backdrop-blur-md p-6 rounded-2xl border border-white/50 shadow-xs flex flex-col justify-between" id={`review-card-${item.id}`}>
              <div>
                {/* Stars rating */}
                <div className="flex space-x-0.5 text-amber-600 mb-3.5 justify-start">
                  {[...Array(item.rating)].map((_, i) => (
                    <svg key={i} className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                
                {/* Review quote */}
                <p className="font-sans text-xs text-[#615143] leading-relaxed italic mb-6 text-left">
                  "{item.text}"
                </p>
              </div>
              
              {/* Author info */}
              <div className="flex items-center space-x-3 pt-4 border-t border-stone-200/20">
                <img 
                  src={item.avatar} 
                  alt={item.name} 
                  className="w-9 h-9 rounded-full object-cover shadow-xs border border-white shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="text-left">
                  <p className="font-serif text-xs text-[#3A2B20] font-bold leading-tight">
                    {item.name}
                  </p>
                  <p className="text-[9px] font-mono text-[#8C6D58] uppercase tracking-wider mt-0.5">
                    {item.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
