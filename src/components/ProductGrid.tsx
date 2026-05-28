import React, { useEffect, useState } from "react";
import { Product, User } from "../types";
import { ShoppingBag, Flame, Sparkles, Check, AlertCircle, ShieldAlert, Heart, Star, X, Compass, Info } from "lucide-react";
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

export default function ProductGrid({ user, onNavigate, onAddToCart, storeConfig }: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showLearnMoreModal, setShowLearnMoreModal] = useState(false);

  const siteName = storeConfig?.siteName || "Enlight Candles";
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

  const handleScrollToGrid = () => {
    const target = document.getElementById("search-category-controls");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16" id="product-grid-view">
      
      {/* 🌟 LUXURIOUS EDITORIAL SPLIT-HERO SECTION (Mirrors User's Uploaded Image Layout Exactly) */}
      <div 
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#FAF6F0] rounded-[32px] p-6 sm:p-8 lg:p-10 border border-[#B58E71]/15 shadow-sm transition-all relative overflow-hidden" 
        id="luxury-editorial-split-hero"
      >
        {/* Soft background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#B58E71]/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-[#EADCC9]/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Left Side: Elegant typography & Call to Action */}
        <div className="lg:col-span-6 space-y-4 sm:space-y-6 max-w-xl z-10">
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-[#B58E71] font-bold block">
              Pure Soy Wax • Hand-Poured Artistry
            </span>
            <h1 className="font-serif xl:text-5xl lg:text-4xl text-3xl text-[#2E2219] leading-[1.1] font-normal tracking-wide">
              Handcrafted <br className="hidden sm:inline" /> Luxury Candles
            </h1>
            <p className="text-[#5C4D40] text-xs sm:text-sm leading-relaxed font-sans max-w-md">
              Elevate your space with natural, artisanal scents. Expertly created in local studios, designed to restore daily calm and serene focus.
            </p>
          </div>

          <div className="pt-1">
            <button
              onClick={handleScrollToGrid}
              className="inline-flex items-center justify-center bg-[#C39F85] text-white font-serif font-semibold tracking-[0.16em] text-[11px] sm:text-xs px-8 py-3.5 border border-[#B58E71]/20 hover:bg-[#2E2219] transition-all duration-300 shadow-sm uppercase cursor-pointer group"
              id="hero-shop-now-cta"
            >
              <span>Shop Now</span>
              <motion.span 
                className="ml-2"
                animate={{ x: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              >
                ➜
              </motion.span>
            </button>
          </div>
        </div>

        {/* Right Side: Showcase visual (with dynamic administrative Carousel backup) */}
        <div className="lg:col-span-6 z-10">
          <div className="w-full rounded-[24px] overflow-hidden shadow-lg border border-[#B58E71]/20 relative h-[180px] sm:h-[250px] lg:h-[300px] bg-[#FAF7F2]">
            {banners.length > 0 ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.5 }}
                  className="w-full h-full absolute inset-0"
                >
                  <img
                    src={banners[currentSlide]}
                    referrerPolicy="no-referrer"
                    alt={`${siteName} campaign slide ${currentSlide + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as any).src = "https://images.unsplash.com/photo-1596435764253-6535f2d74bb3?auto=format&fit=crop&q=80&w=1200";
                    }}
                  />
                  {/* Subtle dynamic slider indicators inside display */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#2E2219]/35 via-transparent to-transparent flex flex-col justify-end p-6 text-white select-none">
                    <span className="text-[9px] uppercase font-mono tracking-widest bg-[#C39F85] text-white px-2.5 py-1 rounded-full w-fit mb-1.5 font-bold">
                      {siteName} Campaign
                    </span>
                    <p className="text-sm sm:text-lg font-serif tracking-wide text-white font-bold drop-shadow-sm">
                      Hand-Poured Soy Wax Magic
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            ) : (
              // Stunning fallback photo representation exactly matching the look of 3 cozy jar candles and delicate flowers
              <img
                src="https://images.unsplash.com/photo-1596435764253-6535f2d74bb3?auto=format&fit=crop&q=80&w=1200"
                referrerPolicy="no-referrer"
                alt="Handcrafted luxury amber glass soy candles"
                className="w-full h-full object-cover transition-transform duration-1000 ease-out hover:scale-105"
              />
            )}

            {/* Bullet Indicators for multiple uploaded slides */}
            {banners.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1.5 z-10 bg-[#2E2219]/40 px-3 py-1.5 rounded-full backdrop-blur-md select-none">
                {banners.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all ${idx === currentSlide ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/80'}`}
                    title={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 👑 BEST SELLERS HEADER */}
      <div className="text-center space-y-2 pt-4" id="best-sellers-anchor">
        <span className="text-[10px] uppercase font-mono tracking-[0.3em] text-[#B58E71] font-bold block">
          Curated Scent Collection
        </span>
        <h2 className="font-serif text-3xl sm:text-4xl text-[#2E2219] font-normal tracking-wide">
          Best Sellers
        </h2>
        <div className="w-16 h-[1.5px] bg-[#C39F85]/40 mx-auto mt-2"></div>
      </div>

      {/* 12-Column Layout holding catalogues, category tabs, and search fields */}
      <div className="grid grid-cols-12 gap-8" id="frosted-glass-main-layout">
        <main className="col-span-12 flex flex-col gap-8" id="shop-catalog-main">
          {errorMsg && (
            <div className="bg-red-50/70 backdrop-blur-md border border-red-200 text-red-900 p-4 rounded-2xl flex items-center text-sm" id="shop-error-alert">
              <AlertCircle className="w-5 h-5 shrink-0 mr-2.5 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Search Bar & Category filter tab selection bar */}
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-center bg-white p-4 rounded-[20px] border border-[#B58E71]/15 shadow-2xs" id="search-category-controls">
            {/* Elegant Search Input */}
            <div className="relative w-full lg:w-96 select-text">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#B58E71]">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search candle by title, fragrance profile..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-[#FAF7F2] border border-[#B58E71]/15 rounded-xl text-[#2E2219] placeholder-stone-400 text-xs focus:ring-1 focus:ring-[#C39F85] focus:border-[#C39F85] focus:outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-[#2E2219] text-xs cursor-pointer font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category tabs */}
            <div className="flex items-center space-x-1 overflow-x-auto w-full lg:w-auto pb-1.5 lg:pb-0 scrollbar-none" id="category-scroller">
              <button
                onClick={() => setSelectedCategory("All")}
                className={`px-4.5 py-2 rounded-xl text-xs font-serif font-bold transition-all duration-200 cursor-pointer ${
                  selectedCategory === "All"
                    ? "bg-[#2E2219] text-[#FAF7F2] shadow-xs"
                    : "bg-white border border-stone-200 text-[#5C4D40] hover:bg-[#FAF6F0] hover:text-[#2E2219]"
                }`}
              >
                All Scents
              </button>
              {(categories.length > 0 ? categories : ["Classic", "Warm", "Floral", "Woody", "Best Seller"]).map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4.5 py-2 rounded-xl text-xs font-serif font-bold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat
                      ? "bg-[#2E2219] text-[#FAF7F2] shadow-xs"
                      : "bg-white border border-stone-200 text-[#5C4D40] hover:bg-[#FAF6F0] hover:text-[#2E2219]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Catalog items load states check */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white/50 rounded-[28px] border border-[#B58E71]/10" id="shop-loading-spinner">
              <div className="w-10 h-10 border-2 border-[#EADCC9] border-t-[#C39F85] rounded-full animate-spin"></div>
              <p className="text-xs text-[#5C4D40] font-mono mt-4 tracking-wider">Formulating hand-poured botanical blends...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 px-6 bg-white rounded-[28px] border border-[#B58E71]/15" id="shop-empty-alert">
              <Flame className="w-10 h-10 mx-auto text-[#C39F85] mb-4 animate-pulse" />
              <h3 className="font-serif text-xl font-normal text-[#2E2219]">No Candles Active</h3>
              <p className="text-xs text-[#5C4D40] mt-2 max-w-sm mx-auto leading-relaxed font-sans">
                Our candle laboratory is currently preparing dynamic inventory. Click Admin inside navigation header block to instantly release luxurious aromatic candles using your store administrator panel!
              </p>
              {user && user.role === "admin" && (
                <button
                  onClick={() => onNavigate("/admin/dashboard")}
                  className="mt-6 inline-flex items-center space-x-2 text-xs font-serif font-bold bg-[#2E2219] hover:bg-[#C39F85] text-white px-6 py-3 rounded-none transition-colors duration-300 shadow-sm uppercase cursor-pointer"
                  id="empty-redirect-admin"
                >
                  Manage Atelier ➜
                </button>
              )}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16 px-6 bg-[#FAF6F0] rounded-[28px] border border-[#B58E71]/10" id="shop-search-empty">
              <Sparkles className="w-8 h-8 mx-auto text-stone-400 mb-3" />
              <h3 className="font-serif text-lg text-[#2E2219] font-normal">No Scents Match Filter</h3>
              <p className="text-xs text-[#5C4D40] mt-1 max-w-sm mx-auto font-sans">
                No candles matched "{searchQuery}" under the selected {selectedCategory} scented taxonomy. Explore alternative fragrance tabs!
              </p>
              <button
                onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }}
                className="mt-4 inline-block text-xs font-mono text-[#C39F85] hover:text-[#2E2219] underline font-bold cursor-pointer"
              >
                Reset Filter Settings
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" id="candley-items-grid">
              {filteredProducts.map((product) => {
                const isLiked = favorites.includes(product._id);
                const isBestSeller = product.category === "Best Seller" || product.title === "Calm Lavender" || product.title === "Warilla & Clozy";
                return (
                  <motion.article 
                    key={product._id}
                    className="glass-card rounded-[20px] p-2 flex flex-col justify-between group"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    id={`candle-card-${product._id}`}
                  >
                    {/* Media wrap container with subtle beige canvas structure */}
                    <div className="relative aspect-square overflow-hidden rounded-[14px] bg-[#FAF7F2] shrink-0 border border-[#B58E71]/10">
                      <img 
                        src={product.imageUrl || "https://images.unsplash.com/photo-1596435764253-6535f2d74bb3?auto=format&fit=crop&q=80&w=600"} 
                        alt={product.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        id={`candle-image-${product._id}`}
                        onError={(e) => {
                          (e.target as any).src = "https://images.unsplash.com/photo-1596435764253-6535f2d74bb3?auto=format&fit=crop&q=80&w=600";
                        }}
                      />
                      
                      {/* Best Seller Badge */}
                      {isBestSeller && (
                        <div className="absolute top-2 left-2 bg-[#C39F85] text-[#FAF7F2] font-mono text-[7px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md border border-white/20 shadow-xs z-10">
                          Best Seller
                        </div>
                      )}

                      {/* Cozy Heart Scent Wishlist Toggle button */}
                      <button
                        onClick={(e) => toggleFavorite(product._id, e)}
                        className="absolute top-2 right-2 p-1.5 bg-white/95 hover:bg-white backdrop-blur-md rounded-full shadow-2xs text-stone-700 hover:text-red-500 transition-all border border-[#B58E71]/10 cursor-pointer"
                        id={`like-candle-btn-${product._id}`}
                      >
                        <Heart className={`w-3 h-3 transition-transform ${isLiked ? "fill-red-500 text-red-500 scale-110" : "text-stone-500 hover:scale-105"}`} />
                      </button>

                      {product.stock <= 5 && (
                        <span 
                          className="absolute bottom-2 left-2 bg-red-650 backdrop-blur-md text-white font-mono text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border border-white/10 shadow-sm"
                          id={`low-stock-pill-${product._id}`}
                        >
                          {product.stock} Left
                        </span>
                      )}
                    </div>

                    {/* Minimalist details content below mimicking Best Sellers alignment of picture */}
                    <div className="pt-3 pb-1 px-1 h-full flex flex-col justify-between" id={`details-section-${product._id}`}>
                      <div className="text-center mb-3 space-y-1">
                        <h3 className="font-serif text-xs sm:text-sm text-[#2E2219] font-bold tracking-wide line-clamp-1 group-hover:text-[#B58E71] transition-colors">
                          {product.title}
                        </h3>
                        {/* Rating stars */}
                        <div className="flex items-center justify-center space-x-0.5 text-amber-500 text-[8px] leading-none mb-1">
                          <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                          <span className="text-stone-400 font-mono text-[8px] pl-1 font-bold">
                            {isBestSeller ? "5.0" : "4.9"}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#5C4D40] line-clamp-2 italic font-light font-serif leading-relaxed px-0.5">
                          {product.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#B58E71]/10 flex flex-col sm:flex-row gap-1.5 items-center justify-between">
                        <div className="text-center sm:text-left">
                          <p className="text-[7px] text-stone-400 font-mono uppercase tracking-widest font-black leading-none">Price</p>
                          <p className="font-mono text-xs sm:text-sm font-bold text-[#2E2219]">
                            ₹{product.price.toLocaleString("en-IN")}
                          </p>
                        </div>

                        {/* Solid brown "Add to Cart" button mimicking aesthetic of "SHOP NOW" */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddToCart(product);
                          }}
                          className="inline-flex items-center space-x-1 text-[8.5px] sm:text-[9.5px] font-mono tracking-wider text-[#FAF7F2] bg-[#2E2219] hover:bg-[#C39F85] text-white py-2 px-3 rounded-lg shadow-2xs transition-all duration-300 cursor-pointer uppercase font-bold"
                          id={`add-to-cart-btn-${product._id}`}
                          title="Add Scent to Cart"
                        >
                          <ShoppingBag className="w-2.5 h-2.5 text-amber-100" />
                          <span className="hidden sm:inline">Add to Cart</span>
                        </button>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* 🍁 BEAUTIFUL "SCENTS INSPIRED BY NATURE" SECTION */}
      <div 
        className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center bg-[#FAF6F0] rounded-[32px] p-6 sm:p-10 lg:p-14 border border-[#B58E71]/15 shadow-2xs relative overflow-hidden"
        id="scents-inspired-by-nature-block"
      >
        <div className="absolute top-0 left-0 w-80 h-80 bg-[#C39F85]/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Left media representing beautifully citrus infused organic lit candle */}
        <div className="relative aspect-[4/3] md:aspect-[1.15] lg:aspect-[1.3] rounded-[24px] overflow-hidden shadow-sm border border-[#B58E71]/10">
          <img 
            src="https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&q=80&w=800"
            referrerPolicy="no-referrer"
            alt="Hand-poured organic candles with scent flowers and oranges"
            className="w-full h-full object-cover transition-all duration-700 ease-out hover:scale-105"
          />
          <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-[8.5px] font-mono uppercase tracking-widest font-bold text-[#2E2219] border border-[#B58E71]/5">
            Active Laboratory Formulation
          </div>
        </div>

        {/* Right textual info content plus discovery modal CTA */}
        <div className="space-y-5 lg:space-y-6">
          <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-[#B58E71] font-bold block">
            Natural Infusions
          </span>
          <h3 className="font-serif text-2xl lg:text-3.5xl text-[#2E2219] font-normal leading-tight tracking-wide">
            Scents Inspired by Nature
          </h3>
          <p className="text-stone-600 text-xs sm:text-sm font-sans leading-relaxed">
            Deeply inspired by the botanical bounty of the earth, our slow-burning luxury candles are carefully infused with pristine therapeutic essential oils, clean-burning wooden wicks, and hand-selected handpressed botanicals.
          </p>
          <p className="text-stone-600 text-xs sm:text-sm font-sans leading-relaxed hidden lg:block">
            Every batch undergoes precise multi-step curing to ensure perfect aromatic cold and hot scent throws, transforming your workspace or home library into a haven of peace.
          </p>
          
          <div className="pt-2">
            <button
              onClick={() => setShowLearnMoreModal(true)}
              className="inline-flex items-center justify-center bg-transparent text-[#2E2219] hover:text-[#C39F85] font-serif font-semibold tracking-[0.16em] text-xs px-6 py-3 border border-[#2E2219] hover:border-[#C39F85] rounded-none transition-all duration-300 uppercase cursor-pointer"
            >
              <span>Learn More</span>
            </button>
          </div>
        </div>
      </div>

      {/* ⭐ ELEGANT TESTIMONIALS SECTIONS (Our Customers review bento cards) */}
      <div className="space-y-8 pt-4" id="testimonials-block">
        <div className="text-center space-y-2">
          <span className="text-[10px] uppercase font-mono tracking-[0.3em] text-[#B58E71] font-bold block">
            Real Experiences
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#2E2219] font-normal tracking-wide">
            Loved by Scent Lovers
          </h2>
          <div className="w-12 h-[1px] bg-[#C39F85]/40 mx-auto mt-2"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-[#FAF6F0] border border-[#B58E71]/15 p-6 rounded-[24px] space-y-4 shadow-2xs flex flex-col justify-between">
            <p className="text-xs text-stone-600 font-sans italic leading-relaxed">
              "The French Lavender infused candle has converted my living room into a masterclass massage spa. The wooden wick crackles delightfully, and the burning time is phenomenal. Highly recommend Enlight!"
            </p>
            <div className="flex items-center gap-3 pt-2 border-t border-[#B58E71]/10">
              <img 
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150" 
                alt="Eleanor Thorne" 
                referrerPolicy="no-referrer"
                className="w-9 h-9 object-cover rounded-full border border-[#B58E71]/15"
              />
              <div>
                <h4 className="font-serif text-xs font-bold text-[#2E2219]">Eleanor Thorne</h4>
                <div className="flex items-center gap-0.5 mt-0.5 select-none">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-2.5 h-2.5 fill-[#C39F85] text-[#C39F85]" />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-[#FAF6F0] border border-[#B58E71]/15 p-6 rounded-[24px] space-y-4 shadow-2xs flex flex-col justify-between">
            <p className="text-xs text-stone-600 font-sans italic leading-relaxed">
              "Madagascar Vanilla Beans combined with Charcoal Oak has is such a cozy warm scent. It is sweet yet beautifully deep and masculine. Ordering my fourth batch now, the coupon FIRST50 was a sweet save!"
            </p>
            <div className="flex items-center gap-3 pt-2 border-t border-[#B58E71]/10">
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150" 
                alt="Amelia Vance" 
                referrerPolicy="no-referrer"
                className="w-9 h-9 object-cover rounded-full border border-[#B58E71]/15"
              />
              <div>
                <h4 className="font-serif text-xs font-bold text-[#2E2219]">Amelia Vance</h4>
                <div className="flex items-center gap-0.5 mt-0.5 select-none">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-2.5 h-2.5 fill-[#C39F85] text-[#C39F85]" />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-[#FAF6F0] border border-[#B58E71]/15 p-6 rounded-[24px] space-y-4 shadow-2xs flex flex-col justify-between">
            <p className="text-xs text-stone-600 font-sans italic leading-relaxed">
              "Phenomenal delivery and high-class customer support. The Cove Cedar card arrived beautifully sealed inside custom beeswax kraft papers. Their attention to luxury detail is unmatched in standard candles."
            </p>
            <div className="flex items-center gap-3 pt-2 border-t border-[#B58E71]/10">
              <img 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150" 
                alt="Julian Hayes" 
                referrerPolicy="no-referrer"
                className="w-9 h-9 object-cover rounded-full border border-[#B58E71]/15"
              />
              <div>
                <h4 className="font-serif text-xs font-bold text-[#2E2219]">Julian Hayes</h4>
                <div className="flex items-center gap-0.5 mt-0.5 select-none">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-2.5 h-2.5 fill-[#C39F85] text-[#C39F85]" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🔮 INTERACTIVE DISCOVERY MODAL (SECRET PATHWAY OF SCENTS) */}
      <AnimatePresence>
        {showLearnMoreModal && (
          <div className="fixed inset-0 bg-[#2E2219]/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" id="scent-discovery-modal-mask">
            <motion.div 
              className="bg-[#FAF7F2] border border-[#B58E71]/25 rounded-[32px] w-full max-w-lg overflow-hidden relative shadow-2xl p-6 md:p-8 space-y-5"
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              id="scent-discovery-dialog"
            >
              {/* Close pin */}
              <button 
                onClick={() => setShowLearnMoreModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-[#B58E71]/10 text-[#2E2219] transition-colors cursor-pointer"
                id="close-discovery-btn"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-2">
                <span className="text-[9px] uppercase font-mono tracking-[0.2em] text-[#B58E71] font-bold block">
                  Atelier Formulation Secrets
                </span>
                <h3 className="font-serif text-2xl text-[#2E2219] font-normal tracking-wide">
                  The Soy Wax Science
                </h3>
                <div className="w-10 h-[1.5px] bg-[#C39F85]/40 mt-1"></div>
              </div>

              <div className="space-y-4 text-stone-600 text-xs sm:text-sm leading-relaxed overflow-y-auto max-h-[300px] pr-2 scrollbar-thin">
                <p>
                  At <strong className="font-serif font-black">{siteName}</strong>, each luxury candle is crafted as a functional artwork of slow-burning restoration. We adhere to three clean botanical laws:
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#FAF6F0] border border-[#B58E71]/30 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-mono text-[#2E2219] font-black">1</span>
                    </div>
                    <div>
                      <h5 className="font-serif font-bold text-[#2E2219] text-xs">Pristine Soy Wax</h5>
                      <p className="text-[11px] text-stone-500">100% organic, non-gmo soybean oil sourced locally. Burns up to 50% longer than paraffin, entirely soot-free.</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#FAF6F0] border border-[#B58E71]/30 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-mono text-[#2E2219] font-black">2</span>
                    </div>
                    <div>
                      <h5 className="font-serif font-bold text-[#2E2219] text-xs">Aromatherapy Extracts</h5>
                      <p className="text-[11px] text-stone-500">Therapeutic grade pure essential oils extracted from petals, resin, and roots. Zero synthetic fragrances.</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#FAF6F0] border border-[#B58E71]/30 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-mono text-[#2E2219] font-black">3</span>
                    </div>
                    <div>
                      <h5 className="font-serif font-bold text-[#2E2219] text-xs">Delicate Wooden Wicks</h5>
                      <p className="text-[11px] text-stone-500">Naturally treated wooden wicks that emit a soothing, calming campfire fireplace crackle as they burn.</p>
                    </div>
                  </div>
                </div>

                <p className="pt-2">
                  Our candles cure for exactly 14 days under light-controlled cellars to allow the fragrance binding matrix to seal before shipping. Thank you for supporting true handbuilt craft!
                </p>
              </div>

              <div className="pt-4 border-t border-[#B58E71]/10 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowLearnMoreModal(false)}
                  className="px-6 py-2.5 bg-[#2E2219] hover:bg-[#C39F85] text-white text-xs font-serif font-bold tracking-wider transition-colors duration-300 uppercase cursor-pointer"
                >
                  Close secrets
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
