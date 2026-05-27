import React, { useState, useEffect } from "react";
import { Product, CartItem, User, ConfigStatus, Order } from "../types";
import { ShoppingBag, Trash2, Plus, Minus, MapPin, Phone, CreditCard, ChevronLeft, Sparkles, Check, Home, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CartViewProps {
  user: User | null;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, qty: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onNavigate: (path: string) => void;
  config: ConfigStatus | null;
}

export default function CartView({
  user,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onNavigate,
  config
}: CartViewProps) {
  const [deliveryCharge, setDeliveryCharge] = useState<number>(120);
  const [address, setAddress] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [phone, setPhone] = useState("");
  const [customerInstructions, setCustomerInstructions] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Real Razorpay dynamic loader state

  // Coupon configuration states
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // Success state handler after checkout
  const [orderedDetails, setOrderedDetails] = useState<Order | null>(null);

  // Load backend delivery charge
  useEffect(() => {
    fetchDeliveryCharge();
    // Prefill user details if available
    if (user) {
      if (user.address) setAddress(user.address);
      if (user.pinCode) setPinCode(user.pinCode);
      if (user.phone) setPhone(user.phone);
      if (user.appliedCouponCode) {
        setCouponCode(user.appliedCouponCode);
        fetchAndApplyUserCoupon(user.appliedCouponCode);
      }
    } else {
      const lastAddr = localStorage.getItem("aura_last_address");
      const lastPin = localStorage.getItem("aura_last_pincode");
      const lastPh = localStorage.getItem("aura_last_phone");
      if (lastAddr) setAddress(lastAddr);
      if (lastPin) setPinCode(lastPin);
      if (lastPh) setPhone(lastPh);
    }
  }, [user]);

  const fetchAndApplyUserCoupon = async (code: string) => {
    try {
      const res = await fetch("/api/apply-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() })
      });
      const data = await res.json();
      if (res.ok && data.coupon) {
        setAppliedCoupon(data.coupon);
      }
    } catch (err) {
      console.warn("Could not retrieve active coupon on mount:", err);
    }
  };

  const handlePersistFieldToDB = async (field: "address" | "pinCode" | "phone", val: string) => {
    if (user) {
      try {
        await fetch("/api/auth/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [field]: val })
        });
      } catch (err) {
        console.error(`Failed to save ${field} to database profile:`, err);
      }
    }
  };

  const fetchDeliveryCharge = async () => {
    try {
      const res = await fetch("/api/delivery-config");
      const data = await res.json();
      if (res.ok && data.deliveryCharge !== undefined) {
        setDeliveryCharge(data.deliveryCharge);
      }
    } catch (err) {
      console.warn("Could not retrieve dynamic delivery charges:", err);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    setCouponError(null);
    setCouponSuccess(null);
    try {
      const res = await fetch("/api/apply-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "The coupon entered is not valid in our records.");
      }
      setAppliedCoupon(data.coupon);
      setCouponSuccess(`Successfully applied coupon '${data.coupon.code}'!`);

      // If logged in, save applied coupon in user profile database document
      if (user) {
        await fetch("/api/auth/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appliedCouponCode: data.coupon.code })
        });
      }
    } catch (err: any) {
      setCouponError(err.message);
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = async () => {
    setAppliedCoupon(null);
    setCouponSuccess(null);
    setCouponError(null);
    setCouponCode("");

    // If logged in, clear applied coupon from user profile database document
    if (user) {
      try {
        await fetch("/api/auth/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appliedCouponCode: "" })
        });
      } catch (err) {
        console.error("Failed to clear coupon from DB user profile:", err);
      }
    }
  };

  // Compute subtotal of items
  const itemsSubtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  // Computed per-item individual shipping total
  const computedShipping = cart.reduce((acc, item) => acc + (item.product.shippingCost || 0) * item.quantity, 0);

  // Apply Coupon Computations
  let discountAmt = 0;
  let adjustedSubtotal = itemsSubtotal;
  let adjustedDelivery = computedShipping;

  if (appliedCoupon) {
    if (appliedCoupon.appliesToDelivery) {
      // Free order applies to BOTH product value and delivery surcharge
      discountAmt = itemsSubtotal + computedShipping;
      adjustedSubtotal = 0;
      adjustedDelivery = 0;
    } else {
      // Gives discount purely on products but NOT on delivery charges
      discountAmt = Math.round((itemsSubtotal * appliedCoupon.discountPercent) / 100);
      adjustedSubtotal = Math.max(0, itemsSubtotal - discountAmt);
    }
  }

  const grandTotal = itemsSubtotal > 0 ? adjustedSubtotal + adjustedDelivery : 0;

  const handleUpdateQty = (pId: string, currentQty: number, change: number, stock: number) => {
    const target = currentQty + change;
    if (target < 1) return;
    if (target > stock) {
      setErrorMsg(`We only have ${stock} units of this candle available in stock.`);
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }
    onUpdateQuantity(pId, target);
  };

  const handleExecuteCheckoutPost = async (payload: any) => {
    try {
      setCheckingOut(true);
      setErrorMsg(null);
      
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "An error occurred during booking.");
      }

      // Persist delivery address info locally for future checks
      localStorage.setItem("aura_last_address", address.trim());
      localStorage.setItem("aura_last_pincode", payload.pinCode);
      localStorage.setItem("aura_last_phone", payload.phone);

      setOrderedDetails(data.order);
      onClearCart(); // Reset local shopping cart state

      // Clear the applied coupon from state and database user profile
      setAppliedCoupon(null);
      setCouponCode("");
      if (user) {
        try {
          await fetch("/api/auth/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ appliedCouponCode: "" })
          });
        } catch (err) {
          console.warn("Could not clear coupon profile value postcheckout:", err);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong during checkout.");
    } finally {
      setCheckingOut(false);
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMsg("Please sign in to complete your checkout and track your order.");
      setTimeout(() => {
        onNavigate("/login");
      }, 2000);
      return;
    }

    if (cart.length === 0) {
      setErrorMsg("Your cart is empty.");
      return;
    }

    if (!address.trim()) {
      setErrorMsg("Please provide a valid delivery address.");
      return;
    }

    const cleanPin = pinCode.trim();
    if (!/^\d{6}$/.test(cleanPin)) {
      setErrorMsg("Please enter a valid 6-digit PIN code.");
      return;
    }

    const cleanPhone = phone.trim();
    if (!/^\d{10,13}$/.test(cleanPhone)) {
      setErrorMsg("Please enter a valid phone number (10-12 digits).");
      return;
    }

    setErrorMsg(null);

    const payload: any = {
      items: cart.map(item => ({
        productId: item.product._id,
        title: item.product.title,
        price: item.product.price,
        quantity: item.quantity
      })),
      address: address.trim(),
      pinCode: cleanPin,
      phone: cleanPhone,
      couponCode: appliedCoupon ? appliedCoupon.code : undefined,
      customerInstructions: customerInstructions.trim() || undefined
    };

    // If there is an active grand total, open real Razorpay checkout pop-up session
    if (grandTotal > 0) {
      setCheckingOut(true);
      setErrorMsg(null);
      try {
        const intentRes = await fetch("/api/orders/checkout-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ totalAmount: grandTotal })
        });

        const intentData = await intentRes.json();
        if (!intentRes.ok) {
          throw new Error(intentData.error || "Failed to initialize Razorpay payment session.");
        }

        const { order_id, amount, currency, keyId } = intentData;

        const options = {
          key: keyId,
          amount: amount,
          currency: currency,
          name: "Enlight Candles",
          description: "Atelier Handcrafted Luxury Soy Candles",
          image: "/images/logo.png",
          order_id: order_id,
          handler: async function (response: any) {
            const finalPayload = {
              ...payload,
              paymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
              paymentStatus: "Paid"
            };
            await handleExecuteCheckoutPost(finalPayload);
          },
          prefill: {
            name: user.email ? user.email.split("@")[0] : "Luxury Patron",
            email: user?.email,
            contact: cleanPhone
          },
          theme: {
            color: "#1C120C"
          },
          modal: {
            ondismiss: function () {
              setCheckingOut(false);
            }
          }
        };

        const rzpWindow = new (window as any).Razorpay(options);
        rzpWindow.on("payment.failed", function (response: any) {
          setErrorMsg(`Payment failed: ${response.error.description || "Authorization canceled or declined by bank."}`);
          setCheckingOut(false);
        });

        rzpWindow.open();

      } catch (err: any) {
        setErrorMsg(err.message || "Something went wrong initializing Checkout payment.");
        setCheckingOut(false);
      }
    } else {
      // Free order checkout immediately (fully covered by first order coupons, etc.)
      await handleExecuteCheckoutPost(payload);
    }
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" id="cart-workspace-root">
      
      <div className="flex items-center space-x-2 text-stone-500 mb-8">
        <button 
          onClick={() => onNavigate("/")} 
          className="hover:text-stone-900 transition-colors flex items-center space-x-1 font-mono text-[11px] uppercase tracking-wider"
          id="cart-back-to-shop"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Back to Laboratory</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {orderedDetails ? (
          // Success checkout screen state
          <motion.div
            key="success-receipt"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-2xl mx-auto bg-white rounded-3xl p-8 border border-stone-200/65 shadow-xl text-center space-y-6"
            id="order-success-panel"
          >
            <div className="w-16 h-16 bg-amber-50 text-amber-800 rounded-full flex items-center justify-center mx-auto shadow-sm border border-amber-200/50">
              <Check className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold tracking-widest text-emerald-800 uppercase bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full font-mono">
                Order Switched Paid & Confirmed
              </span>
              <h2 className="font-serif text-3xl font-semibold text-stone-900">Thank you for your patronage!</h2>
              <p className="text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
                Your order has been recorded successfully. Our alchemists are already formulating your aromatic soy candles.
              </p>
            </div>

            <div className="bg-stone-50 rounded-2xl p-6 border border-stone-200 text-left space-y-3.5 text-xs">
              <div className="flex justify-between items-center border-b border-stone-200/60 pb-3">
                <span className="font-mono text-stone-500 uppercase tracking-wide">Receipt Reference</span>
                <span className="font-mono text-stone-800 font-bold">{orderedDetails._id}</span>
              </div>

              <div>
                <span className="font-mono text-stone-500 uppercase tracking-wide block mb-1.5">Shipping Destination</span>
                <div className="text-stone-800 space-y-0.5">
                  <p className="font-medium">{orderedDetails.address}</p>
                  <p className="font-mono text-[11px] text-stone-500">PIN Code: {orderedDetails.pinCode} | Contact: {orderedDetails.phone}</p>
                </div>
              </div>

              <div className="border-t border-stone-250 border-dashed pt-3">
                <span className="font-mono text-stone-500 uppercase tracking-wide block mb-2">Items Ordered</span>
                <div className="space-y-1.5">
                  {orderedDetails.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-stone-800">
                      <span>{item.title} <span className="font-mono text-stone-400">x{item.quantity}</span></span>
                      <span className="font-mono font-medium">₹{(item.price * item.quantity).toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-stone-500 pt-1.5">
                    <span>Atelier Delivery Surcharge</span>
                    <span className="font-mono">₹{orderedDetails.deliveryCharge.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between border-t border-stone-200 pt-2 text-sm font-bold text-stone-900">
                    <span>Grand Paid Sum</span>
                    <span className="font-mono text-amber-950">₹{orderedDetails.totalAmount.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => onNavigate("/my-orders")}
                className="bg-stone-950 hover:bg-stone-800 text-stone-100 px-6 py-3 rounded-xl text-xs uppercase font-mono tracking-wider font-bold transition-all cursor-pointer shadow"
                id="btn-view-order-history"
              >
                Track Scent Delivery
              </button>
              <button
                onClick={() => onNavigate("/")}
                className="border border-stone-300 hover:bg-stone-50 text-stone-700 px-6 py-3 rounded-xl text-xs uppercase font-mono tracking-wider font-bold transition-all cursor-pointer"
                id="btn-return-shop"
              >
                Go back to Shop
              </button>
            </div>
          </motion.div>
        ) : (
          // Main Shopping Cart Layout
          <div className="grid grid-cols-12 gap-8" id="cart-main-grid">
            
            {/* Left Column: Basket list (8 columns) */}
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-6" id="cart-items-section">
              <div className="glass-panel-heavy rounded-3xl p-6 md:p-8 space-y-6">
                <div className="border-b border-stone-200 pb-4 flex justify-between items-center">
                  <div>
                    <h1 className="font-serif text-2xl font-bold text-stone-900">Atelier Shopping Cart</h1>
                    <p className="text-xs text-stone-500 mt-1">Review items to be poured and cataloged for dispatch</p>
                  </div>
                  <span className="bg-stone-900 text-white font-mono text-[11px] font-semibold px-3 py-1 rounded-full">
                    {cart.reduce((s, i) => s + i.quantity, 0)} Items
                  </span>
                </div>

                {errorMsg && (
                  <div className="bg-rose-50 border border-rose-250 text-rose-900 rounded-2xl p-4 text-xs font-sans" id="cart-validation-error">
                    {errorMsg}
                  </div>
                )}

                {cart.length === 0 ? (
                  <div className="text-center py-16 space-y-4" id="cart-empty-panel">
                    <ShoppingBag className="w-12 h-12 mx-auto text-stone-300" />
                    <h3 className="font-serif text-lg text-stone-700 font-semibold">Your Cart is Currently Vacated</h3>
                    <p className="text-xs text-stone-500 max-w-xs mx-auto">
                      Fill your basket with clean-burning organic lavender, vanilla, cedarwood or tuscan fig home fragrances!
                    </p>
                    <button
                      onClick={() => onNavigate("/")}
                      className="mt-4 bg-stone-900 hover:bg-stone-800 text-white font-serif font-bold text-xs uppercase tracking-wider py-2.5 px-6 rounded-xl transition-colors cursor-pointer"
                      id="cart-redirect-btn"
                    >
                      Browse Candles
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-stone-200/60" id="cart-items-block">
                    {cart.map((item) => (
                      <div 
                        key={item.product._id} 
                        className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0"
                        id={`cart-row-${item.product._id}`}
                      >
                        {/* Media and description */}
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0 shadow-sm">
                            <img 
                              src={item.product.imageUrl || "https://images.unsplash.com/photo-1601924582970-9238bcb49d18?auto=format&fit=crop&q=80&w=150"} 
                              alt={item.product.title} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <h4 className="font-serif text-sm font-bold text-stone-900">{item.product.title}</h4>
                            <p className="text-[11px] text-stone-500 italic mt-0.5 max-w-sm line-clamp-1">{item.product.description}</p>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[11px] font-mono">
                              <span className="text-amber-950 font-bold">₹{item.product.price.toLocaleString("en-IN")} ea</span>
                              <span className="text-stone-300">|</span>
                              <span className="text-stone-550 text-stone-500 font-medium bg-stone-100 px-1.5 py-0.5 rounded">
                                Shipping: ₹{(item.product.shippingCost || 0).toLocaleString("en-IN")} ea
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Adjust qty column */}
                        <div className="flex items-center justify-between sm:justify-end gap-6">
                          <div className="flex items-center space-x-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item.product._id, item.quantity, -1, item.product.stock)}
                              className="p-1 px-1.5 hover:bg-white rounded-lg transition-colors text-stone-600 cursor-pointer"
                              id={`qty-minus-${item.product._id}`}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-3 text-xs font-mono font-bold text-stone-800">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item.product._id, item.quantity, 1, item.product.stock)}
                              className="p-1 px-1.5 hover:bg-white rounded-lg transition-colors text-stone-600 cursor-pointer"
                              id={`qty-plus-${item.product._id}`}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="text-right min-w-[70px]">
                            <p className="text-[10px] uppercase font-mono text-stone-400">Total</p>
                            <span className="font-mono text-sm font-bold text-stone-900">
                              ₹{(item.product.price * item.quantity).toLocaleString("en-IN")}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => onRemoveItem(item.product._id)}
                            className="p-2 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                            title="Remove candle from cart"
                            id={`remove-item-${item.product._id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Checkout panel with Shipping details & Total Summary (4 columns) */}
            <div className="col-span-12 lg:col-span-4" id="cart-summary-section">
              <div className="glass-panel-heavy rounded-3xl p-6 space-y-6 shadow-xl sticky top-28">
                <h3 className="font-serif text-lg font-bold text-stone-900 border-b border-stone-200/40 pb-3">
                  Summary & Dispatch
                </h3>

                {/* Coupon Code Section */}
                <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/50 space-y-2">
                  <span className="text-[10px] font-mono uppercase text-stone-400 block tracking-wider font-bold">Have an Atelier coupon code?</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. FIRST50"
                      value={couponCode}
                      disabled={!!appliedCoupon}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="w-full bg-white border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-480 focus:border-stone-500 text-xs text-stone-800 rounded-lg px-2.5 py-1.5 uppercase font-mono"
                      id="coupon-code-input-field"
                    />
                    {appliedCoupon ? (
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="bg-red-50 hover:bg-red-100 text-red-700 text-[10px] font-mono px-3 py-1.5 rounded-lg border border-red-200 transition-colors cursor-pointer"
                        id="coupon-remove-btn"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={applyingCoupon || !couponCode.trim()}
                        className="bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-stone-100 text-[10px] font-mono px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                        id="coupon-apply-btn"
                      >
                        {applyingCoupon ? "..." : "Apply Code"}
                      </button>
                    )}
                  </div>
                  {couponError && <p className="text-[10px] text-red-600 font-sans">{couponError}</p>}
                  {couponSuccess && <p className="text-[10px] text-emerald-800 font-sans font-semibold">✓ {couponSuccess}</p>}
                </div>

                {/* Shipping Input Form */}
                <form onSubmit={handleCheckoutSubmit} className="space-y-4" id="checkout-form-details">
                  <div className="flex items-center space-x-1.5 mb-2">
                    <MapPin className="w-3.5 h-3.5 text-stone-800" />
                    <span className="text-[10px] font-mono text-stone-800 uppercase tracking-widest font-semibold">Delivery address credentials</span>
                  </div>

                  {/* Complete Street Address */}
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-stone-400 mb-1 tracking-wider">
                      Complete Street Address *
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder="e.g. House No. 42B, Scented Gardens, Sector 9"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      onBlur={(e) => handlePersistFieldToDB("address", e.target.value)}
                      className="w-full bg-white/60 border border-stone-300/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-700 text-xs text-stone-900 rounded-xl py-2 px-3 placeholder:text-stone-400 font-sans transition-all resize-none"
                      id="checkout-field-address"
                    />
                  </div>

                  {/* 6 Digit Post Code */}
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-stone-400 mb-1 tracking-wider">
                      6-Digit PIN Code *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 110001"
                      maxLength={6}
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ""))}
                      onBlur={(e) => handlePersistFieldToDB("pinCode", e.target.value)}
                      className="w-full bg-white/60 border border-stone-300/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-700 text-xs font-mono text-stone-900 rounded-xl py-2 px-3 placeholder:text-stone-400 transition-all"
                      id="checkout-field-pincode"
                    />
                  </div>

                  {/* Telephone / Phone number */}
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-stone-400 mb-1 tracking-wider">
                      Contact Phone *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-2.5 w-3.5 h-3.5 text-stone-400" />
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 9876543210"
                        maxLength={13}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, ""))}
                        onBlur={(e) => handlePersistFieldToDB("phone", e.target.value)}
                        className="w-full bg-white/60 pl-9 border border-stone-300/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-700 text-xs font-mono text-stone-900 rounded-xl py-2 px-3 placeholder:text-stone-400 transition-all"
                        id="checkout-field-phone"
                      />
                    </div>
                  </div>

                  {/* Customer Instructions */}
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-stone-400 mb-1 tracking-wider">
                      Special Delivery Instructions (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Ring bell only once, leave at door, call before delivery"
                      value={customerInstructions}
                      onChange={(e) => setCustomerInstructions(e.target.value)}
                      className="w-full bg-white/60 border border-stone-300/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-700 text-xs text-stone-900 rounded-xl py-2 px-3 placeholder:text-stone-400 font-sans transition-all resize-none"
                      id="checkout-field-instructions"
                    />
                  </div>

                  {/* Bill computations list */}
                  <div className="border-t border-stone-200/60 pt-4 space-y-2.5 text-xs">
                    <div className="flex justify-between text-stone-600">
                      <span>Candles Value Sum:</span>
                      <span className="font-mono font-medium">₹{itemsSubtotal.toLocaleString("en-IN")}</span>
                    </div>
                    {appliedCoupon && (
                      <div className="flex justify-between text-emerald-800 font-semibold bg-emerald-50/50 p-2 rounded-lg">
                        <span>Coupon Discount ({appliedCoupon.discountPercent}% off{appliedCoupon.appliesToDelivery ? " & free delivery" : ""}):</span>
                        <span className="font-mono">-₹{discountAmt.toLocaleString("en-IN")}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-stone-600">
                      <span>Atelier Shipping Charge:</span>
                      <span className="font-mono font-medium">
                        {appliedCoupon && appliedCoupon.appliesToDelivery ? (
                          <span className="line-through text-stone-400 mr-1">₹{computedShipping.toLocaleString("en-IN")}</span>
                        ) : (
                          `₹${computedShipping.toLocaleString("en-IN")}`
                        )}
                        {appliedCoupon && appliedCoupon.appliesToDelivery && <span className="text-emerald-700 font-bold ml-1">Free!</span>}
                      </span>
                    </div>
                    <div className="flex justify-between text-stone-900 font-bold border-t border-stone-200 pt-2 text-sm">
                      <span>Grand Checkout Sum:</span>
                      <span className="font-mono text-amber-950">₹{grandTotal.toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  {/* Authorization CTA */}
                  {!user ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[10px] text-amber-800 leading-normal font-sans space-y-2">
                      <p>🔒 <strong>Authentication Required:</strong> Please register or log in before booking so your purchases can be tracked and retrieved from the database.</p>
                      <button
                        type="button"
                        onClick={() => onNavigate("/login")}
                        className="w-full bg-stone-900 hover:bg-stone-800 text-white font-mono text-[10px] font-bold uppercase py-2 rounded-lg transition-colors cursor-pointer"
                        id="checkout-auth-redirect-btn"
                      >
                        Sign In Now
                      </button>
                    </div>
                  ) : (
                    <button
                      type="submit"
                      disabled={checkingOut || cart.length === 0}
                      className="w-full bg-stone-900 hover:bg-stone-800 text-stone-50 font-serif font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2 shadow-md hover:translate-y-[-1px]"
                      id="checkout-submit-btn"
                    >
                      {checkingOut ? (
                        <>
                          <div className="w-4 h-4 border-2 border-stone-400 border-t-white rounded-full animate-spin"></div>
                          <span>Pouring Order...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 text-amber-200" />
                          <span>Submit & Complete Payment</span>
                        </>
                      )}
                    </button>
                  )}
                </form>

                <div className="text-[10px] text-stone-550 text-stone-500 font-sans leading-relaxed text-center" id="cart-simulation-disclaimer">
                  ☘️ Aura Soy Candles are formulated and poured organically. Complete your checkout to trigger transaction booking and instant stock dispatch.
                </div>
              </div>
            </div>

          </div>
        )}
      </AnimatePresence>



    </div>
  );
}
