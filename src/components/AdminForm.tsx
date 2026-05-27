import React, { useState, useEffect } from "react";
import { Product, User } from "../types";
import { PlusCircle, Sliders, LogIn, Key, Sparkles, Image, ShieldAlert, Package, Check, Trash2, Edit3, Upload, X, RefreshCw, Settings } from "lucide-react";
import { motion } from "motion/react";

interface AdminFormProps {
  user: User | null;
  onNavigate: (path: string) => void;
  storeConfig?: any;
  onRefreshStoreConfig?: () => void;
}

export default function AdminForm({ user, onNavigate, storeConfig, onRefreshStoreConfig }: AdminFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [stock, setStock] = useState("10");
  const [shippingCost, setShippingCost] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New states for delivery charges and consumer orders history validation
  const [orders, setOrders] = useState<any[]>([]);
  const [deliveryCharge, setDeliveryCharge] = useState("");
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [savingDelivery, setSavingDelivery] = useState(false);
  const [activeTab, setActiveTab] = useState<"products" | "orders" | "coupons" | "categories" | "customize">("products");

  // Store Custom Configuration states
  const [siteNameInput, setSiteNameInput] = useState(storeConfig?.siteName || "Enlight Candles");
  const [logoUrlInput, setLogoUrlInput] = useState(storeConfig?.logoUrl || "");
  const [supportPhoneInput, setSupportPhoneInput] = useState(storeConfig?.supportPhone || "+91 98765 43210");
  const [newBannerInput, setNewBannerInput] = useState("");
  const [bannersList, setBannersList] = useState<string[]>(storeConfig?.banners || []);
  const [savingConfig, setSavingConfig] = useState(false);

  useEffect(() => {
    if (storeConfig) {
      setSiteNameInput(storeConfig.siteName || "Enlight Candles");
      setLogoUrlInput(storeConfig.logoUrl || "");
      if (storeConfig.supportPhone) {
        setSupportPhoneInput(storeConfig.supportPhone);
      }
      setBannersList(storeConfig.banners || []);
    }
  }, [storeConfig]);

  const handleSaveStoreConfigImmediate = async (name: string, logo: string, banners: string[]) => {
    try {
      const res = await fetch("/api/admin/store-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteName: name,
          logoUrl: logo,
          banners: banners,
          supportPhone: supportPhoneInput
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to synchronize storefront branding config.");
      }
      if (onRefreshStoreConfig) {
        onRefreshStoreConfig();
      }
    } catch (err: any) {
      console.error("Auto-sync store config failed:", err);
    }
  };

  const handleSaveStoreConfig = async (e?: React.FormEvent, customBanners?: string[]) => {
    if (e) e.preventDefault();
    setSavingConfig(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const targetBanners = customBanners !== undefined ? customBanners : bannersList;

    try {
      const res = await fetch("/api/admin/store-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteName: siteNameInput,
          logoUrl: logoUrlInput,
          banners: targetBanners,
          supportPhone: supportPhoneInput
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update custom configuration.");
      }
      setSuccessMsg("Store configuration and promotional banners saved successfully.");
      if (onRefreshStoreConfig) {
        onRefreshStoreConfig();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save customizable store settings.");
    } finally {
      setSavingConfig(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/jpg", "image/gif", "image/webp"].includes(file.type)) {
      setErrorMsg("Please select a valid image file shape (JPG or PNG) for the logo.");
      return;
    }

    setSavingConfig(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64Data = reader.result as string;

        setLogoUrlInput(base64Data);
        localStorage.setItem("aura_logo_storage", base64Data);
        setSuccessMsg("Brand logo file uploaded and stored on site successfully.");
        await handleSaveStoreConfigImmediate(siteNameInput, base64Data, bannersList);
      } catch (err: any) {
        setErrorMsg("Failed to upload store logo file: " + err.message);
      } finally {
        setSavingConfig(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = async () => {
    if (!logoUrlInput) return;
    setSavingConfig(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (logoUrlInput.startsWith("/uploads/")) {
        await fetch("/api/admin/delete-file", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: logoUrlInput })
        });
      }
      setLogoUrlInput("");
      localStorage.removeItem("aura_logo_storage");
      setSuccessMsg("Store logo removed and erased from site storage.");
      await handleSaveStoreConfigImmediate(siteNameInput, "", bannersList);
    } catch (err: any) {
      setErrorMsg("Failed to remove store logo: " + err.message);
    } finally {
      setSavingConfig(false);
    }
  };

  const handleBannerUploadSubmit = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/jpg", "image/gif", "image/webp"].includes(file.type)) {
      setErrorMsg("Please select a valid image file (JPG or PNG) for banners.");
      return;
    }

    setSavingConfig(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64Data = reader.result as string;
        const res = await fetch("/api/admin/upload-file", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64Data, prefix: "banner" })
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Banner file disk upload failed.");
        }

        const newList = [...bannersList, data.url];
        setBannersList(newList);
        setSuccessMsg("Banner slide file uploaded and added to promotional slate successfully.");
        await handleSaveStoreConfigImmediate(siteNameInput, logoUrlInput, newList);
      } catch (err: any) {
        setErrorMsg("Failed to upload promotional banner slide: " + err.message);
      } finally {
        setSavingConfig(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddBanner = (url: string) => {
    if (!url.trim()) return;
    const newList = [...bannersList, url.trim()];
    setBannersList(newList);
    setNewBannerInput("");
    handleSaveStoreConfig(undefined, newList);
  };

  const handleRemoveBanner = async (idx: number) => {
    const targetUrl = bannersList[idx];
    setSavingConfig(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (targetUrl && targetUrl.startsWith("/uploads/")) {
        await fetch("/api/admin/delete-file", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: targetUrl })
        });
      }
      const newList = bannersList.filter((_, i) => i !== idx);
      setBannersList(newList);
      setSuccessMsg("Promotional slide banner deleted and erased from site storage.");
      await handleSaveStoreConfigImmediate(siteNameInput, logoUrlInput, newList);
    } catch (err: any) {
      setErrorMsg("Failed to remove banner slide: " + err.message);
    } finally {
      setSavingConfig(false);
    }
  };

  // Category state variables
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [category, setCategory] = useState("");

  // Coupon state variables
  const [coupons, setCoupons] = useState<any[]>([]);
  const [couponCodeIn, setCouponCodeIn] = useState("");
  const [discountPercentIn, setDiscountPercentIn] = useState("50");
  const [appliesToDeliveryIn, setAppliesToDeliveryIn] = useState(false);
  const [creatingCoupon, setCreatingCoupon] = useState(false);

  // Preset Unsplash imagery for rapid demo candle creations
  const presetImages = [
    { name: "Nordic Amber Glass", url: "https://images.unsplash.com/photo-1596435764265-7281c7e145ae?auto=format&fit=crop&q=80&w=600" },
    { name: "Minimalist Cream Jar", url: "https://images.unsplash.com/photo-1601924582970-9238bcb49d18?auto=format&fit=crop&q=80&w=600" },
    { name: "Aromatherapy Lavender", url: "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&q=80&w=600" },
    { name: "Forest Cedar Wick", url: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=600" }
  ];

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchAdminProductsList();
      fetchDeliveryCharge();
      fetchAdminOrdersList();
      fetchCategories();
      fetchCoupons();
    }
  }, [user]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (res.ok && data.categories) {
        setCategories(data.categories);
      }
    } catch (err) {
      console.error("Failed to fetch admin categories:", err);
    }
  };

  const fetchCoupons = async () => {
    try {
      const res = await fetch("/api/admin/coupons");
      const data = await res.json();
      if (res.ok && data.coupons) {
        setCoupons(data.coupons);
      }
    } catch (err) {
      console.error("Failed to fetch admin coupons:", err);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setCreatingCategory(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create category");
      }
      setSuccessMsg(`Category "${newCategoryName.trim()}" created!`);
      setNewCategoryName("");
      fetchCategories();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeIn.trim() || !discountPercentIn) return;
    setCreatingCoupon(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCodeIn.toUpperCase().trim(),
          discountPercent: Number(discountPercentIn),
          appliesToDelivery: appliesToDeliveryIn
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save coupon.");
      }
      setSuccessMsg(`Coupon "${couponCodeIn.toUpperCase().trim()}" created!`);
      setCouponCodeIn("");
      setDiscountPercentIn("50");
      setAppliesToDeliveryIn(false);
      fetchCoupons();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setCreatingCoupon(false);
    }
  };

  const handleDeleteCoupon = async (id: string, code: string) => {
    if (!window.confirm(`Are you sure you want to delete the promo code "${code}"?`)) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete coupon.");
      }
      setSuccessMsg(`Promo code "${code}" has been deleted.`);
      fetchCoupons();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const fetchDeliveryCharge = async () => {
    try {
      const res = await fetch("/api/delivery-config");
      const data = await res.json();
      if (res.ok && data.deliveryCharge !== undefined) {
        setDeliveryCharge(data.deliveryCharge.toString());
      }
    } catch (err) {
      console.error("Failed to fetch delivery charge config:", err);
    }
  };

  const fetchAdminOrdersList = async () => {
    try {
      setLoadingOrders(true);
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      if (res.ok && data.orders) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error("Failed to load customer orders registry:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleUpdateRemark = async (orderId: string, currentRemark: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/remark`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remark: currentRemark })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update order remark.");
      }
      setSuccessMsg(`Order #${orderId} remarks changed to "${currentRemark}"`);
      fetchAdminOrdersList();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleUpdateDeliveryCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDelivery(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const chargeNum = Number(deliveryCharge);
    if (isNaN(chargeNum) || chargeNum < 0) {
      setErrorMsg("Delivery charge must be a positive number or zero.");
      setSavingDelivery(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/delivery-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryCharge: chargeNum })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update dynamic shipping charge.");
      }
      setSuccessMsg(`Delivery charge successfully amended to ₹${chargeNum}!`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "An exception occurred saving shipping cost settings.");
    } finally {
      setSavingDelivery(false);
    }
  };

  const fetchAdminProductsList = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (res.ok && data.products) {
        setProducts(data.products);
      }
    } catch {
      console.error("Unable to refresh admin catalog views.");
    }
  };

  const handleImageUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Only image files (JPEG, PNG, WEBP, etc.) are supported.");
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setImageUrl(reader.result);
      }
      setUploading(false);
    };
    reader.onerror = () => {
      setErrorMsg("Failed to read local image file");
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  // Guard access if not admin
  if (!user || user.role !== "admin") {
    return (
      <div className="py-20 px-4 max-w-md mx-auto text-center" id="admin-unauthorized-view">
        <motion.div 
          className="bg-stone-50 border border-stone-200 rounded-lg p-8 shadow-xl space-y-6"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-16 h-16 bg-red-50 text-red-700 rounded-full flex items-center justify-center mx-auto border border-red-200 shadow-sm">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="font-serif text-2xl font-bold text-stone-900">Access Denied</h2>
            <p className="text-xs text-stone-500 leading-relaxed font-sans">
              The requested admin route is fully protected by JSON Web Token HTTP-only cookie layers. Sign In with an <strong>Atelier Admin</strong> profile first.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => onNavigate("/")}
              className="text-stone-700 hover:text-stone-900 hover:bg-stone-100 border border-stone-300 rounded py-2 text-xs font-mono transition-colors"
              id="unauth-home-btn"
            >
              Back to Catalog
            </button>
            <button
              onClick={() => onNavigate("/login")}
              className="bg-stone-900 text-stone-50 hover:bg-stone-800 rounded py-2 text-xs font-serif font-bold transition-colors"
              id="unauth-login-btn"
            >
              Sign In Admin ➜
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!title || !description || !price || !imageUrl) {
      setErrorMsg("Please complete all required candle setup parameters.");
      return;
    }

    const priceNum = Number(price);
    const stockNum = Number(stock || "10");

    if (isNaN(priceNum) || priceNum <= 0) {
      setErrorMsg("Price must be a valid positive number.");
      return;
    }

    setLoading(true);

    try {
      const endpoint = editingProduct 
        ? `/api/admin/products/${editingProduct._id}`
        : "/api/admin/products";
      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          price: priceNum,
          imageUrl,
          stock: stockNum,
          category: category || "",
          shippingCost: Number(shippingCost || "0")
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save product.");
      }

      setSuccessMsg(editingProduct 
        ? `"${title}" has been updated successfully!`
        : "Organic Soy Candle cataloged successfully!"
      );
      
      handleCancelEdit();
      fetchAdminProductsList(); // Refresh admin listing display
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred creating the product asset.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (p: Product) => {
    setEditingProduct(p);
    setTitle(p.title);
    setDescription(p.description);
    setPrice(p.price.toString());
    setImageUrl(p.imageUrl);
    setStock(p.stock.toString());
    setCategory((p as any).category || "");
    setShippingCost(p.shippingCost !== undefined ? p.shippingCost.toString() : "0");
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setTitle("");
    setDescription("");
    setPrice("");
    setImageUrl("");
    setStock("10");
    setCategory("");
    setShippingCost("");
  };

  const handleDelete = async (productId: string, titleName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${titleName}" from the laboratory offerings?`)) {
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete product from database catalog.");
      }

      setSuccessMsg(`"${titleName}" was deleted successfully from the catalog.`);
      fetchAdminProductsList();
      if (editingProduct && editingProduct._id === productId) {
        handleCancelEdit();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while deleting the asset.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 min-h-[85vh]" id="admin-dashboard-root">
      
      {/* Dynamic Success and Error Alert Top Banners */}
      {(errorMsg || successMsg) && (
        <div className="mb-6 space-y-2" id="admin-notifications-row">
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-850 rounded-2xl p-4 text-xs font-sans flex items-center justify-between shadow-sm">
              <p className="flex items-center gap-1.5 font-bold">⚠️ {errorMsg}</p>
              <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-700 font-bold px-1.5 text-base">×</button>
            </div>
          )}
          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-250 text-emerald-900 rounded-2xl p-4 text-xs font-sans flex items-center justify-between shadow-sm">
              <p className="flex items-center gap-1.5 font-bold">✓ {successMsg}</p>
              <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-700 font-bold px-1.5 text-base">×</button>
            </div>
          )}
        </div>
      )}

      {/* Header section admin */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white border border-stone-200/60 p-6 rounded-3xl shadow-sm mb-6 gap-4" id="admin-header-row">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-stone-900 flex items-center space-x-2.5">
            <Sliders className="w-6 h-6 text-stone-800 shrink-0" />
            <span>Candle Atelier Portal</span>
          </h1>
          <p className="text-xs text-stone-500 font-sans mt-1">
            Publish custom candles, alter pricing lists, and audit in-memory/MongoDB inventories. Protected securely by JWT.
          </p>
        </div>
        <div className="bg-stone-900 text-stone-100 rounded-full px-4 py-2 font-mono text-[9px] uppercase tracking-wider shadow-sm flex items-center space-x-2 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>ADMIN AUTHENTICATED</span>
        </div>
      </div>

      {/* Admin Side Tab Navigation Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8" id="admin-dashboard-layout-grid border border-stone-200 rounded-3xl p-2 bg-stone-50/20">
        
        {/* Left Sidebar Menu */}
        <div className="lg:col-span-1 space-y-4" id="admin-sidebar-navigation-column">
          <div className="bg-white border border-stone-200 p-4.5 rounded-3xl shadow-sm space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 font-black block px-3 mb-2.5">Control Panel</span>
            
            <button
              onClick={() => { setActiveTab("products"); setErrorMsg(null); setSuccessMsg(null); }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center space-x-2.5 transition-all outline-none ${
                activeTab === "products"
                  ? "bg-stone-900 text-stone-100 font-bold shadow-md"
                  : "text-stone-600 hover:bg-stone-50"
              }`}
              id="sidebar-tab-products-btn"
            >
              <Package className="w-4 h-4 shrink-0" />
              <span>Products ({products.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab("orders"); setErrorMsg(null); setSuccessMsg(null); }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center space-x-2.5 transition-all outline-none ${
                activeTab === "orders"
                  ? "bg-stone-900 text-stone-100 font-bold shadow-md"
                  : "text-stone-600 hover:bg-stone-50"
              }`}
              id="sidebar-tab-orders-btn"
            >
              <Sliders className="w-4 h-4 shrink-0" />
              <span>Orders ({orders.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab("coupons"); setErrorMsg(null); setSuccessMsg(null); }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center space-x-2.5 transition-all outline-none ${
                activeTab === "coupons"
                  ? "bg-stone-900 text-stone-100 font-bold shadow-md"
                  : "text-stone-600 hover:bg-stone-50"
              }`}
              id="sidebar-tab-coupons-btn"
            >
              <Key className="w-4 h-4 shrink-0" />
              <span>Coupons ({coupons.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab("categories"); setErrorMsg(null); setSuccessMsg(null); }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center space-x-2.5 transition-all outline-none ${
                activeTab === "categories"
                  ? "bg-stone-900 text-stone-100 font-bold shadow-md"
                  : "text-stone-600 hover:bg-stone-50"
              }`}
              id="sidebar-tab-categories-btn"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span>Categories ({categories.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab("customize"); setErrorMsg(null); setSuccessMsg(null); }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center space-x-2.5 transition-all outline-none ${
                activeTab === "customize"
                  ? "bg-stone-900 text-stone-100 font-bold shadow-md"
                  : "text-stone-600 hover:bg-stone-50"
              }`}
              id="sidebar-tab-customize-btn"
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span>Customize Site</span>
            </button>
          </div>

          <div className="bg-stone-100/50 border border-stone-200/50 p-4 rounded-2xl text-[10px] text-stone-500 font-sans space-y-1.5 leading-relaxed">
            <span className="font-mono uppercase text-[9px] text-stone-400 block font-bold tracking-wider">Atelier Operational Rules</span>
            <p>📦 Assigning categories enables smooth filtering on the shop page.</p>
            <p>🏷️ Coupons can reduce cart items or make the entire checkout free.</p>
          </div>
        </div>

        {/* Right Tabpanel Contents Area */}
        <div className="lg:col-span-3 space-y-6" id="admin-tab-panels-workspace">
          
          {/* TAB 1: PRODUCTS INVENTORY */}
          {activeTab === "products" && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6" id="tab-products-panel-grid">
              
              {/* Product Edit/Create form */}
              <div className="xl:col-span-5 space-y-6" id="add-candle-form-column">
                <div className="bg-white border border-stone-200 rounded-3xl p-6 space-y-5 shadow-sm">
                  <h3 className="font-serif text-[15px] font-bold text-stone-900 border-b border-stone-200/40 pb-2.5 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {editingProduct ? <Edit3 className="w-4 h-4 text-stone-800" /> : <PlusCircle className="w-4 h-4 text-stone-850" />}
                      <span>{editingProduct ? "Edit Scented Candle" : "Add Scented Candle"}</span>
                    </div>
                    {editingProduct && (
                      <button 
                        type="button" 
                        onClick={handleCancelEdit}
                        className="text-stone-400 hover:text-stone-700 text-[10px] uppercase font-mono tracking-wider flex items-center gap-1 font-bold"
                      >
                        <X className="w-3 h-3" />
                        <span>Cancel</span>
                      </button>
                    )}
                  </h3>

                  <form onSubmit={handleSubmit} className="space-y-4" id="admin-candle-submit-form">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-stone-500 tracking-wider mb-1">
                        Candle Title / Scent Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-400 focus:border-stone-500 text-xs text-stone-900 rounded-lg py-2 px-3 transition-colors"
                        placeholder="e.g. Cardamom & Spiced Vanilla"
                        id="field-candle-title"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-stone-500 tracking-wider mb-1">
                        Scent Profile Description *
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-400 focus:border-stone-500 text-xs text-stone-900 rounded-lg py-2 px-3 transition-colors leading-relaxed"
                        placeholder="Detail scent notes, pour techniques, and continuous burning duration..."
                        id="field-candle-description"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-stone-500 tracking-wider mb-1">
                        Candle Category Setup *
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-400 focus:border-stone-500 text-xs text-stone-900 rounded-lg py-2 px-3 tracking-wide"
                        id="field-candle-category-select"
                      >
                        <option value="">-- No Category / Custom --</option>
                        {categories.map((cat, idx) => (
                          <option key={idx} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-3" id="admin-metrics-fields">
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-stone-500 tracking-wider mb-1">
                          Price *
                        </label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-400 focus:border-stone-500 text-xs text-stone-900 rounded-lg py-2 px-3 font-mono"
                          placeholder="₹"
                          id="field-candle-price"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-stone-500 tracking-wider mb-1">
                          Live Stock *
                        </label>
                        <input
                          type="number"
                          required
                          min={0}
                          value={stock}
                          onChange={(e) => setStock(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-400 focus:border-stone-500 text-xs text-stone-900 rounded-lg py-2 px-3 font-mono"
                          id="field-candle-stock"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-stone-500 tracking-wider mb-1" title="Individual shipping cost multiplied per quantity in order">
                          Unit Shipping
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={shippingCost}
                          onChange={(e) => setShippingCost(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-400 focus:border-stone-500 text-xs text-stone-900 rounded-lg py-2 px-3 font-mono"
                          placeholder="₹"
                          id="field-candle-shipping"
                          title="Shipping cost per item (will multiply dynamically on checkout)"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-stone-500 tracking-wider mb-1">
                        Candle Image URL *
                      </label>
                      <input
                        type="url"
                        required
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-400 focus:border-stone-500 text-xs text-stone-900 rounded-lg py-2 px-3 transition-colors font-mono"
                        placeholder="https://images.unsplash.com/..."
                        id="field-candle-image-url"
                      />
                    </div>

                    {/* Image Preset suggestions */}
                    <div className="pt-1 select-none" id="presets-container">
                      <span className="block text-[9px] font-mono uppercase text-stone-400 tracking-wider mb-1.5">Preset Imagery Selection</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {presetImages.map((img, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setImageUrl(img.url)}
                            className="bg-stone-50 hover:bg-stone-100 border border-stone-200 text-[10px] text-stone-700 font-sans p-1 rounded-lg text-left truncate transition-colors cursor-pointer"
                          >
                            📷 {img.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Local file custom uploader base64 converter hook */}
                    <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-1.5" id="drag-drop-base64-box">
                      <span className="block text-[10px] font-mono uppercase text-stone-500 font-bold">Upload Custom File:</span>
                      <div className="flex items-center space-x-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUploadChange}
                          className="hidden"
                          id="admin-image-file-selector"
                          disabled={uploading}
                        />
                        <label
                          htmlFor="admin-image-file-selector"
                          className="bg-white hover:bg-stone-50 border border-stone-300 rounded-lg py-1 px-2.5 text-[9px] font-mono text-stone-800 transition-colors cursor-pointer inline-flex items-center space-x-1 uppercase font-bold"
                        >
                          <Upload className="w-3 h-3" />
                          <span>{uploading ? "Analyzing..." : "Load file"}</span>
                        </label>
                        {imageUrl && (
                          <span className="text-[9px] font-mono text-emerald-800 font-bold inline-block">✓ Image Loaded</span>
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-stone-900 hover:bg-stone-850 text-stone-50 font-serif font-black text-xs uppercase tracking-wider py-2.5 rounded-xl transition-all cursor-pointer shadow-md text-center"
                      id="admin-submit-btn"
                    >
                      {loading ? "Saving Scent Model..." : editingProduct ? "Enact Edit Corrections" : "Add Model Scent to Catalog"}
                    </button>
                  </form>
                </div>
              </div>

              {/* Product list table */}
              <div className="xl:col-span-7 space-y-6" id="products-catalog-audit">
                <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm">
                  <h3 className="font-serif text-[15px] font-bold text-stone-900 border-b border-stone-200/40 pb-2.5 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Package className="w-4 h-4 text-stone-850" />
                      <span>Laboratory Offerings ({products.length} Products)</span>
                    </div>
                  </h3>

                  {products.length === 0 ? (
                    <div className="text-center py-16 text-stone-400" id="admin-products-empty">
                      <p className="font-serif italic text-base">No active candles located.</p>
                      <p className="text-xs text-stone-500 mt-1">Publish candle parameters in the left panel list to populate catalog.</p>
                    </div>
                  ) : (
                    <div className="mt-4 overflow-x-auto" id="admin-products-table-box">
                      <table className="min-w-full divide-y divide-stone-200 select-text">
                        <thead className="bg-stone-50 font-mono text-[9px] uppercase tracking-wider text-stone-500 text-left">
                          <tr>
                            <th className="px-3 py-2.5 rounded-l-lg">Scent name</th>
                            <th className="px-3 py-2.5">Category</th>
                            <th className="px-3 py-2.5">Price</th>
                            <th className="px-3 py-2.5">Unit Shipping</th>
                            <th className="px-3 py-2.5">Stock</th>
                            <th className="px-3 py-2.5 rounded-r-lg">Manage</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 text-xs font-sans text-stone-600">
                          {products.map((p) => (
                            <tr key={p._id} className="hover:bg-stone-50/50 transition-colors" id={`admin-product-row-${p._id}`}>
                              <td className="px-3 py-2 flex items-center space-x-2.5 max-w-xs">
                                <img 
                                  src={p.imageUrl} 
                                  alt={p.title} 
                                  referrerPolicy="no-referrer"
                                  className="w-8 h-8 object-cover rounded-lg border border-stone-200 shrink-0 shadow-sm"
                                />
                                <div className="truncate">
                                  <p className="font-serif font-bold text-stone-900 truncate">{p.title}</p>
                                  <p className="text-[10px] text-stone-400 font-mono tracking-tighter truncate">{p._id}</p>
                                </div>
                              </td>
                              <td className="px-3 py-2 font-mono text-stone-500 text-[10px]">
                                {p.category || "General"}
                              </td>
                              <td className="px-3 py-2 font-mono font-bold text-stone-900">
                                ₹{p.price.toLocaleString("en-IN")}
                              </td>
                              <td className="px-3 py-2 font-mono text-stone-500 font-medium">
                                ₹{(p.shippingCost || 0).toLocaleString("en-IN")}
                              </td>
                              <td className="px-3 py-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                  p.stock === 0 ? "bg-red-50 text-red-700" :
                                  p.stock <= 4 ? "bg-amber-50 text-amber-700 font-bold" : "bg-emerald-50 text-emerald-850"
                                }`}>
                                  {p.stock} units
                                </span>
                              </td>
                              <td className="px-3 py-2">
                                <div className="flex items-center space-x-1.5">
                                  <button
                                    onClick={() => handleStartEdit(p)}
                                    className="bg-stone-100 hover:bg-stone-200 text-stone-850 p-1 rounded-md border border-stone-200 transition-colors cursor-pointer"
                                    title="Edit candle parameters"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(p._id, p.title)}
                                    className="bg-red-50 hover:bg-red-100 text-red-700 p-1 rounded-md border border-red-100 transition-colors cursor-pointer"
                                    title="Delete product"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: REGISTERED CLIENT ORDERS AND SURCHARGE CONFIG */}
          {activeTab === "orders" && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6" id="tab-orders-panel-grid">
              
              {/* Left: configure delivery rate charge */}
              <div className="xl:col-span-4" id="orders-surcharge-column">
                <div className="bg-white border border-stone-200 rounded-3xl p-6 space-y-4 shadow-sm">
                  <h3 className="font-serif text-[15px] font-bold text-stone-900 border-b border-stone-200/40 pb-2.5 flex items-center space-x-1.5">
                    <Sliders className="w-4 h-4 text-stone-800" />
                    <span>Flat Delivery Rate Setup</span>
                  </h3>
                  <p className="text-xs text-stone-500 leading-relaxed font-sans">
                    Establish a base shipping charge associated with orders dynamically. This cost calculates automatically during test checkouts.
                  </p>
                  <form onSubmit={handleUpdateDeliveryCharge} className="space-y-4" id="delivery-charge-adjustment-form">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-stone-500 tracking-wider mb-1">
                        Surcharge Rate Fee (₹) *
                      </label>
                      <input
                        type="number"
                        required
                        min={0}
                        value={deliveryCharge}
                        onChange={(e) => setDeliveryCharge(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-400 focus:border-stone-500 text-xs text-stone-950 rounded-lg py-2 px-3 font-mono"
                        placeholder="e.g. 120"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={savingDelivery || !deliveryCharge}
                      className="w-full bg-stone-900 hover:bg-stone-850 text-stone-50 font-serif font-black text-xs uppercase tracking-wider py-2.5 rounded-xl transition-all cursor-pointer shadow-md text-center"
                    >
                      {savingDelivery ? "Saving Surcharge..." : "Amend Shipping cost"}
                    </button>
                  </form>
                </div>
              </div>

              {/* Right: client orders database registry list */}
              <div className="xl:col-span-8 space-y-6" id="orders-history-column">
                <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm">
                  <h5 className="font-serif text-[15px] font-bold text-stone-900 border-b border-stone-200/40 pb-2.5 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Sliders className="w-4 h-4 text-stone-800" />
                      <span>Consumer Purchases Log ({orders.length} orders)</span>
                    </div>
                    <button 
                      onClick={fetchAdminOrdersList} 
                      disabled={loadingOrders}
                      className="text-stone-400 hover:text-stone-900 cursor-pointer"
                      title="Reload transactions"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? "animate-spin" : ""}`} />
                    </button>
                  </h5>

                  {loadingOrders ? (
                    <div className="text-center py-16 flex items-center justify-center space-x-2">
                      <span className="animate-spin text-stone-400">⚓</span>
                      <span className="text-xs text-stone-500">Retrieving active purchase logs...</span>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-16 text-stone-400">
                      <p className="font-serif italic text-base">No orders registered on the server.</p>
                      <p className="text-[11px] text-stone-500 mt-0.5">Wait for consumers to register test checkouts in their viewports.</p>
                    </div>
                  ) : (
                    <div className="mt-4 overflow-x-auto" id="admin-orders-table-box">
                      <table className="min-w-full divide-y divide-stone-200 select-text">
                        <thead className="bg-stone-50 font-mono text-[9px] uppercase tracking-wider text-stone-500 text-left">
                          <tr>
                            <th className="py-2.5 px-3 rounded-l-lg">Client Detail</th>
                            <th className="py-2.5 px-3">Products Ordered</th>
                            <th className="py-2.5 px-3">Address</th>
                            <th className="py-2.5 px-3 text-center">Update Dispatch Status</th>
                            <th className="py-2.5 px-3 text-right rounded-r-lg font-bold">Paid Sum</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 text-xs font-sans text-stone-600">
                          {orders.map((ord: any) => {
                            const formattedDate = new Date(ord.orderDate || Date.now()).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit"
                            });

                            return (
                              <tr key={ord._id} className="hover:bg-stone-50/40 transition-colors">
                                <td className="py-3 px-3">
                                  <p className="font-mono font-bold text-stone-950 text-[10px] truncate max-w-[100px]">{ord._id}</p>
                                  <p className="text-[11px] text-stone-600 font-sans mt-0.5">{ord.email}</p>
                                  <p className="text-[9px] text-stone-400 font-mono italic">{formattedDate}</p>
                                </td>
                                <td className="py-3 px-3 text-stone-600 max-w-xs font-sans">
                                  <div className="space-y-0.5 font-sans text-[11px]">
                                    {ord.items.map((it: any, i: number) => (
                                      <div key={i} className="text-[10px] leading-relaxed font-sans truncate">
                                        • {it.title} <span className="font-mono text-stone-500 font-bold">x{it.quantity}</span>
                                        {it.shippingCost !== undefined && it.shippingCost > 0 && (
                                          <span className="text-[9px] font-mono text-stone-450 text-stone-400 ml-1 bg-stone-100 px-1 rounded">
                                            sh: ₹{it.shippingCost * it.quantity}
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </td>
                                <td className="py-3 px-3 text-stone-600 text-[10px] leading-relaxed max-w-xs">
                                  <p className="font-semibold text-stone-850 truncate">{ord.address}</p>
                                  <p className="text-[9px] text-stone-400 font-mono mt-0.5">PIN: {ord.pinCode} | Tel: {ord.phone}</p>
                                  {ord.customerInstructions && (
                                    <div className="mt-1 text-[10px] text-amber-900 bg-amber-50 border border-amber-250 rounded px-1.5 py-0.5 break-words max-w-xs font-serif leading-tight">
                                      <span className="font-bold font-sans text-[8px] uppercase tracking-wider text-amber-800 block mb-0.5">Customer Instructions:</span>
                                      {ord.customerInstructions}
                                    </div>
                                  )}
                                </td>
                                <td className="py-3 px-3 text-center">
                                  <select
                                    value={ord.remark || "Yet to Confirm"}
                                    onChange={(e) => handleUpdateRemark(ord._id, e.target.value)}
                                    className="bg-stone-50 border border-stone-250 hover:border-stone-400 rounded-lg px-2 py-1 text-[11px] text-stone-800 font-bold focus:outline-none focus:ring-1 focus:ring-stone-400 transition-all cursor-pointer select-none mx-auto block"
                                    id={`select-remark-${ord._id}`}
                                  >
                                    <option value="Yet to Confirm">Yet to Confirm</option>
                                    <option value="Confirmed">Confirmed</option>
                                    <option value="Shipped">Shipped</option>
                                    <option value="Delivered">Delivered</option>
                                    <option value="Failed">Failed</option>
                                  </select>
                                </td>
                                <td className="py-3 px-3 text-right font-mono font-bold text-amber-950 text-[11px]">
                                  ₹{ord.totalAmount.toLocaleString("en-IN")}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: COUPONS MANAGEMENT */}
          {activeTab === "coupons" && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6" id="tab-coupons-panel">
              
              {/* Left Column: Create Coupons */}
              <div className="xl:col-span-5" id="coupon-management-panel">
                <div className="bg-white border border-stone-200 rounded-3xl p-6 space-y-4 shadow-sm">
                  <h3 className="font-serif text-[15px] font-bold text-stone-900 border-b border-stone-200/40 pb-2.5 flex items-center space-x-2">
                    <Sliders className="w-4 h-4 text-stone-800" />
                    <span>Create Promo Coupon</span>
                  </h3>
                  <form onSubmit={handleCreateCoupon} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-stone-500 tracking-wider mb-1">
                        Coupon Code *
                      </label>
                      <input
                        type="text"
                        required
                        value={couponCodeIn}
                        onChange={(e) => setCouponCodeIn(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-400 focus:border-stone-500 text-xs text-stone-900 rounded-lg py-2 px-3 uppercase font-mono transition-colors"
                        placeholder="e.g. EXTRA50"
                        id="admin-coupon-code-field"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-stone-500 tracking-wider mb-1">
                        Discount Percent (%) *
                      </label>
                      <input
                        type="number"
                        required
                        min={1}
                        max={100}
                        value={discountPercentIn}
                        onChange={(e) => setDiscountPercentIn(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-400 focus:border-stone-500 text-xs text-stone-950 rounded-lg py-2 px-3 font-mono"
                        placeholder="e.g. 50"
                        id="admin-coupon-percent-field"
                      />
                    </div>

                    <div className="flex items-start space-x-2 pt-1 select-none">
                      <input
                        type="checkbox"
                        checked={appliesToDeliveryIn}
                        onChange={(e) => setAppliesToDeliveryIn(e.target.checked)}
                        className="w-4 h-4 rounded border-stone-300 focus:ring-0 cursor-pointer mt-0.5"
                        id="admin-coupon-delivery-checkbox"
                      />
                      <label htmlFor="admin-coupon-delivery-checkbox" className="text-[10px] text-stone-600 font-sans cursor-pointer select-none leading-relaxed">
                        Free Order Option (Makes entire shopping cart invoice ₹0!)
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={creatingCoupon || !couponCodeIn.trim()}
                      className="w-full bg-stone-900 hover:bg-stone-850 text-stone-50 font-serif font-black text-xs uppercase tracking-wider py-2.5 rounded-xl transition-all cursor-pointer shadow-md text-center"
                      id="admin-create-coupon-btn"
                    >
                      {creatingCoupon ? "Creating coupon..." : "Publish Promo Coupon"}
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Column: Active Coupons Table list */}
              <div className="xl:col-span-12" id="coupon-register-panel">
                <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm">
                  <h3 className="font-serif text-[15px] font-bold text-stone-900 border-b border-stone-200/40 pb-2.5 flex items-center space-x-2">
                    <Key className="w-4 h-4 text-stone-800" />
                    <span>Active Scent Promo Codes ({coupons.length})</span>
                  </h3>

                  {coupons.length === 0 ? (
                    <div className="text-center py-12 text-stone-400">
                      <p className="font-serif italic text-sm">No active promo codes present.</p>
                      <p className="text-[10px] text-stone-500 mt-0.5">Add coupon configurations in the form viewport above.</p>
                    </div>
                  ) : (
                    <div className="mt-4 overflow-x-auto">
                      <table className="min-w-full divide-y divide-stone-200 select-all">
                        <thead className="bg-stone-50 font-mono text-[9px] uppercase tracking-wider text-stone-500 text-left">
                          <tr>
                            <th className="py-2.5 px-3 rounded-l-lg">Promo Code Name</th>
                            <th className="py-2.5 px-3">Marked Percent Discount</th>
                            <th className="py-2.5 px-3">Applies For Surcharges</th>
                            <th className="py-2.5 px-3 rounded-r-lg text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 text-xs font-mono text-stone-600">
                          {coupons.map((c, i) => (
                            <tr key={c._id || i} className="hover:bg-stone-50/40 transition-colors">
                              <td className="py-3 px-3">
                                <span className="bg-amber-100 text-amber-950 px-2 py-0.5 rounded font-mono font-bold">{c.code}</span>
                              </td>
                              <td className="py-3 px-3 font-semibold text-stone-800 pl-4 font-mono">
                                {c.discountPercent}% OFF Scented candles
                              </td>
                              <td className="py-3 px-3 text-[11px] font-sans">
                                {c.appliesToDelivery ? (
                                  <span className="text-emerald-700 font-bold">&#10003; Yes (Free billing)</span>
                                ) : (
                                  <span className="text-stone-400">No (Delivery surcharge applies)</span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCoupon(c._id, c.code)}
                                  className="text-stone-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors inline-flex items-center justify-center"
                                  title={`Delete coupon code ${c.code}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: CATEGORIES MANAGEMENT */}
          {activeTab === "categories" && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6" id="tab-categories-panel">
              
              {/* Left Column: Create Categories */}
              <div className="xl:col-span-5" id="category-creation-panel">
                <div className="bg-white border border-stone-200 rounded-3xl p-6 space-y-4 shadow-sm">
                  <h3 className="font-serif text-[15px] font-bold text-stone-900 border-b border-stone-200/40 pb-2.5 flex items-center space-x-2">
                    <PlusCircle className="w-4 h-4 text-stone-800" />
                    <span>Create Category Scent</span>
                  </h3>
                  <form onSubmit={handleCreateCategory} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-stone-500 tracking-wider mb-1">
                        Category Tag Scent *
                      </label>
                      <input
                        type="text"
                        required
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-400 focus:border-stone-500 text-xs text-stone-900 rounded-lg py-2 px-3 placeholder:text-stone-400 transition-colors"
                        placeholder="e.g. Soy Jars, Signature, Gift Sets"
                        id="admin-category-input-field"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={creatingCategory || !newCategoryName.trim()}
                      className="w-full bg-stone-900 hover:bg-stone-850 text-stone-50 font-serif font-black text-xs uppercase tracking-wider py-2.5 rounded-xl transition-all cursor-pointer shadow-md text-center"
                      id="admin-create-category-btn"
                    >
                      {creatingCategory ? "Creating tag Category..." : "Add Category Tag"}
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Column: Active Categories List */}
              <div className="xl:col-span-7" id="category-register-panel">
                <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm">
                  <h3 className="font-serif text-[15px] font-bold text-stone-900 border-b border-stone-200/40 pb-2.5 flex items-center space-x-2">
                    <PlusCircle className="w-4 h-4 text-stone-850" />
                    <span>Active Categories Tag ({categories.length})</span>
                  </h3>

                  {categories.length === 0 ? (
                    <div className="text-center py-12 text-stone-400">
                      <p className="font-serif italic text-sm">No active scent categories established.</p>
                      <p className="text-[10px] text-stone-500 mt-0.5">Input scent variables in the left form viewport.</p>
                    </div>
                  ) : (
                    <div className="mt-4 flex flex-wrap gap-2.5">
                      {categories.map((cat, i) => (
                        <span key={i} className="text-[11px] bg-stone-50 border border-stone-200 hover:border-stone-450 text-stone-700 font-mono font-bold px-3 py-1.5 rounded-xl shadow-sm transition-all select-none">
                          🏷️ {cat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: SITE CUSTOMIZATION SERVICE */}
          {activeTab === "customize" && (
            <div className="space-y-6" id="tab-customize-panel">
              <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-6">
                <div className="border-b border-stone-100 pb-4">
                  <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center space-x-2">
                    <Settings className="w-5 h-5 text-amber-800" />
                    <span>Store Branding & Customization Services</span>
                  </h3>
                  <p className="text-xs text-stone-500 font-sans mt-1">
                    Redesign your e-commerce storefront. Dynamically adjust site names, swap your corporate logo, or configure rotating carousel banners.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Form controls */}
                  <div className="space-y-6">
                    {/* Site Information */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-mono uppercase tracking-wider text-stone-400 font-bold">1. Brand Information</h4>
                      
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-stone-500 tracking-wider mb-1">
                          Website & Brand Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={siteNameInput}
                          onChange={(e) => setSiteNameInput(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-400 focus:border-stone-500 text-xs text-stone-900 rounded-lg py-2 px-3 placeholder:text-stone-400 transition-colors"
                          placeholder="e.g. Enlight Candles, L'or, Lumina"
                        />
                        <p className="text-[10px] text-stone-400 mt-1">This dynamically replaces all occurrences of brand headers and footer copyright notices.</p>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono uppercase text-stone-500 tracking-wider mb-1">
                          Customer Support Number *
                        </label>
                        <input
                          type="text"
                          required
                          value={supportPhoneInput}
                          onChange={(e) => setSupportPhoneInput(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-400 focus:border-stone-500 text-xs text-stone-900 rounded-lg py-2 px-3 placeholder:text-stone-400 transition-colors"
                          placeholder="e.g. +91 98765 43210"
                        />
                        <p className="text-[10px] text-stone-400 mt-1">Used for customer helpline links and fallback iOS dialer triggers when an order fails.</p>
                      </div>

                      <div className="space-y-3">
                        <label className="block text-[10px] font-mono uppercase text-stone-500 tracking-wider font-bold">
                          Custom Logo (JPG/PNG Upload or Link URL)
                        </label>
                        
                        {/* File selector zone */}
                        <div className="border border-dashed border-stone-200 hover:border-stone-400 rounded-2xl p-4 bg-stone-50/60 text-center relative transition-all">
                          <input
                            type="file"
                            accept="image/png, image/jpeg, image/jpg"
                            onChange={handleLogoUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            id="logo-file-input-selector"
                          />
                          <div className="space-y-1 select-none">
                            <span className="text-xl block">📁</span>
                            <p className="text-xs font-serif font-bold text-stone-800">Upload Logo Image File</p>
                            <p className="text-[9px] text-stone-400 font-sans">Supports JPG, PNG (Saves on Server Disk)</p>
                          </div>
                        </div>

                        {logoUrlInput && (
                          <div className="text-[10px] text-stone-500 font-mono flex items-center justify-between bg-stone-100/50 p-2.5 rounded-xl border border-stone-200">
                            <span className="truncate max-w-[80%] font-bold">Active: {logoUrlInput}</span>
                            <button
                              type="button"
                              onClick={handleRemoveLogo}
                              className="text-rose-700 hover:text-rose-900 font-bold transition-all cursor-pointer underline text-[10px]"
                              title="Delete active logo from site disk"
                            >
                              Erase
                            </button>
                          </div>
                        )}

                        <div className="pt-1">
                          <span className="block text-[9px] font-mono uppercase text-stone-400 tracking-wider mb-1">Or paste custom image web link</span>
                          <input
                            type="text"
                            value={logoUrlInput}
                            onChange={(e) => setLogoUrlInput(e.target.value)}
                            className="w-full bg-stone-50 border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-400 focus:border-stone-500 text-xs text-stone-900 rounded-lg py-2 px-3 placeholder:text-stone-400 transition-colors"
                            placeholder="e.g. https://domain.com/logo.png"
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <span className="block text-[10px] font-mono uppercase text-stone-400 tracking-wider mb-1.5">Preset Logo Templates</span>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { name: "Sleek Flame Logo", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=200" },
                            { name: "Gold Botanical Shield", url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=200" },
                            { name: "Silver Leaf Crest", url: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=200" }
                          ].map((preset, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setLogoUrlInput(preset.url)}
                              className="text-[10px] bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 font-sans px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                            >
                              ✨ {preset.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Banner Image URL builder */}
                    <div className="border-t border-stone-100 pt-6 space-y-4">
                      <h4 className="text-xs font-mono uppercase tracking-wider text-stone-400 font-bold">2. Promotional Banners Setup</h4>
                      
                      <div className="space-y-3">
                        <label className="block text-[10px] font-mono uppercase text-stone-500 tracking-wider font-bold">
                          Add Slide (JPG/PNG Upload or Link URL)
                        </label>

                        {/* File selector zone for banner */}
                        <div className="border border-dashed border-stone-200 hover:border-stone-400 rounded-2xl p-4 bg-stone-50/60 text-center relative transition-all">
                          <input
                            type="file"
                            accept="image/png, image/jpeg, image/jpg"
                            onChange={handleBannerUploadSubmit}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            id="banner-file-input-selector"
                          />
                          <div className="space-y-1 select-none">
                            <span className="text-xl block">🖼️</span>
                            <p className="text-xs font-serif font-bold text-stone-800">Upload Banner Image File</p>
                            <p className="text-[9px] text-stone-400 font-sans">Wide landscape graphics work best (Saved on Server Disk)</p>
                          </div>
                        </div>
                        
                        <div className="pt-2 flex gap-2">
                          <input
                            type="text"
                            value={newBannerInput}
                            onChange={(e) => setNewBannerInput(e.target.value)}
                            className="flex-grow bg-stone-50 border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-400 focus:border-stone-500 text-xs text-stone-900 rounded-lg py-2 px-3 placeholder:text-stone-400 transition-colors"
                            placeholder="e.g. https://domain.com/banner-summer.jpg"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddBanner(newBannerInput)}
                            className="bg-stone-900 hover:bg-stone-850 text-white font-serif px-4 text-xs rounded-lg transition-colors cursor-pointer shrink-0"
                          >
                            Add URL
                          </button>
                        </div>
                        <p className="text-[10px] text-stone-400 mt-1">Provide wide landscape graphic image links (approx 1200x400 or similar).</p>
                      </div>

                      <div>
                        <span className="block text-[10px] font-mono uppercase text-stone-400 tracking-wider mb-1.5">Preset Promo Campaign Banners</span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {[
                            { name: "Luxury Golden Sale", url: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&q=80&w=1200" },
                            { name: "New Season Botanical", url: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=1200" },
                            { name: "Organic Soy Vibe", url: "https://images.unsplash.com/photo-1596435764253-6535f2d74bb3?auto=format&fit=crop&q=80&w=1200" }
                          ].map((preset, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleAddBanner(preset.url)}
                              className="text-[9px] bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 font-serif p-2 rounded-lg transition-all cursor-pointer text-left line-clamp-1"
                              title={preset.name}
                            >
                              🎁 {preset.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-stone-100 pt-6">
                      <button
                        type="button"
                        onClick={(e) => handleSaveStoreConfig(e)}
                        disabled={savingConfig || !siteNameInput.trim()}
                        className="w-full bg-stone-900 hover:bg-stone-850 text-stone-50 font-serif font-black text-xs uppercase tracking-wider py-3 rounded-xl transition-all cursor-pointer shadow-md text-center"
                      >
                        {savingConfig ? "Saving Dynamic branding..." : "Save Branding Configuration"}
                      </button>
                    </div>
                  </div>

                  {/* Right Preview Panel */}
                  <div className="space-y-6 bg-stone-50 p-5 rounded-2xl border border-stone-200/40">
                    <h4 className="text-xs font-mono uppercase tracking-wider text-stone-400 font-bold">Live Branding Preview</h4>

                    {/* Logo/Header Preview */}
                    <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex flex-col items-center justify-center space-y-3 min-h-[140px]">
                      <span className="text-[9px] font-mono uppercase text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full select-none">Navbar branding section</span>
                      
                      <div className="flex items-center space-x-2 min-w-0 max-w-full justify-center">
                        {logoUrlInput ? (
                          <img
                            src={logoUrlInput}
                            referrerPolicy="no-referrer; same-origin"
                            alt="Logo preview"
                            className="h-10 w-10 object-cover rounded-full border border-stone-200/60 p-0.5 shrink-0"
                            onError={(e) => {
                              (e.target as any).src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=200";
                            }}
                          />
                        ) : (
                          <div className="p-2 bg-stone-900 text-amber-100 rounded-full shrink-0">
                            <PlusCircle className="w-5 h-5" />
                          </div>
                        )}
                        <span className="font-serif text-sm sm:text-base tracking-widest text-stone-900 font-bold uppercase truncate max-w-[120px] sm:max-w-[180px]" title={siteNameInput || "Enlight Candles"}>
                          {siteNameInput || "Enlight Candles"}
                        </span>
                      </div>
                    </div>

                    {/* Carousel slides list */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center pb-1">
                        <span className="text-[10px] font-mono uppercase text-stone-500 tracking-wider">Active Slides ({bannersList.length})</span>
                        <span className="text-[9px] text-stone-400 select-none italic">Click trash to remove slide</span>
                      </div>

                      {bannersList.length === 0 ? (
                        <div className="bg-stone-100 border border-dashed border-stone-300 rounded-xl p-8 text-center text-stone-400 select-none">
                          <p className="font-serif italic text-xs">No promotion slides added yet</p>
                          <p className="text-[9px] text-stone-400 mt-1">If empty, search/products layout renders directly at the top with no top gap banner.</p>
                        </div>
                      ) : (
                        <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1 select-text">
                          {bannersList.map((bannerUrl, index) => (
                            <div key={index} className="flex gap-2 p-2 bg-white border border-stone-200 rounded-xl shadow-xs hover:border-stone-300 transition-all items-center">
                              <img
                                src={bannerUrl}
                                referrerPolicy="no-referrer"
                                alt={`Banner ${index + 1}`}
                                className="w-16 h-10 object-cover rounded-lg border border-stone-100 shrink-0"
                                onError={(e) => {
                                  (e.target as any).src = "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&q=80&w=300";
                                }}
                              />
                              <div className="flex-grow min-w-0">
                                <p className="text-[10px] font-mono text-stone-500 font-bold">Slide #{index + 1}</p>
                                <p className="text-[9px] text-stone-400 truncate leading-tight mt-0.5">{bannerUrl}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveBanner(index)}
                                className="p-2 text-stone-400 hover:text-red-650 transition-colors cursor-pointer shrink-0"
                                title="Remove slide URL"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
