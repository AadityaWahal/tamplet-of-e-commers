import React, { useEffect, useState } from "react";
import { User, Order } from "../types";
import { Package, Calendar, MapPin, Phone, RefreshCw, ChevronRight, Flame, Smile, ShoppingBag } from "lucide-react";
import { motion } from "motion/react";

interface MyOrdersViewProps {
  user: User | null;
  onNavigate: (path: string) => void;
}

export default function MyOrdersView({ user, onNavigate }: MyOrdersViewProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchMyOrdersList();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchMyOrdersList = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch("/api/orders/my-orders");
      const data = await res.json();
      if (res.ok && data.orders) {
        setOrders(data.orders);
      } else {
        setErrorMsg(data.error || "Failed to retrieve your order history.");
      }
    } catch {
      setErrorMsg("Network failure retrieving order history. Make sure server is reachable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto" id="orders-log-workspace">
      
      {/* Header section with brand detail */}
      <div className="border-b border-stone-200 pb-5 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-amber-800 uppercase font-bold">Patron Portal</span>
          <h1 className="font-serif text-3xl font-bold text-stone-900 mt-1">Your Fragrance Deliveries</h1>
          <p className="text-xs text-stone-500 mt-1">
            Track and audit active formulation pipelines booked with <strong>{user ? user.email : "your email"}</strong>
          </p>
        </div>

        {user && (
          <button
            onClick={fetchMyOrdersList}
            disabled={loading}
            className="inline-flex items-center space-x-1.5 p-2 px-4 border border-stone-200 bg-white hover:bg-stone-50 font-mono text-xs text-stone-700 rounded-xl transition-all cursor-pointer select-none"
            id="btn-refresh-orders"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-stone-500 ${loading ? "animate-spin" : ""}`} />
            <span>Update log</span>
          </button>
        )}
      </div>

      {!user ? (
        // Access restricted state
        <div className="text-center py-20 bg-white border border-stone-200 rounded-3xl p-8 space-y-4 max-w-md mx-auto" id="orders-unsigned-alert">
          <Flame className="w-10 h-10 mx-auto text-stone-400" />
          <h3 className="font-serif text-lg font-bold text-stone-800">History Vault Locked</h3>
          <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
            Please register an account or sign in to dynamically read and synchronize past organic orders from the secure database.
          </p>
          <button
            onClick={() => onNavigate("/login")}
            className="mt-4 inline-block bg-stone-900 hover:bg-stone-800 text-white font-serif font-bold text-xs uppercase tracking-wider py-2.5 px-6 rounded-xl transition-all cursor-pointer font-semibold shadow"
            id="orders-signin-redirect-btn"
          >
            Sign In Now
          </button>
        </div>
      ) : loading ? (
        // Loading state
        <div className="flex flex-col items-center justify-center py-24 bg-white/40 border border-stone-200/60 rounded-3xl" id="orders-loading-pulse">
          <div className="w-10 h-10 border-2 border-stone-300 border-t-amber-800 rounded-full animate-spin"></div>
          <p className="text-xs text-stone-500 font-mono mt-4">Connecting database tracking ledger...</p>
        </div>
      ) : errorMsg ? (
        <div className="bg-rose-50 border border-rose-250 text-rose-900 p-4 rounded-2xl text-xs" id="orders-loading-error">
          {errorMsg}
        </div>
      ) : orders.length === 0 ? (
        // No orders listed state
        <div className="text-center py-20 bg-white border border-stone-200 rounded-3xl p-8 space-y-4" id="orders-empty-state">
          <ShoppingBag className="w-12 h-12 mx-auto text-amber-700/60" />
          <h3 className="font-serif text-xl font-bold text-stone-800">No Aromas Ordered Yet</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
            You haven&apos;t commissioned any hand-poured soy wax candles from the laboratory yet. Visit the shop to add formulation arrays!
          </p>
          <button
            onClick={() => onNavigate("/")}
            className="mt-4 bg-stone-900 hover:bg-stone-800 text-white font-serif font-bold text-xs bg-stone-900 text-amber-50 hover:bg-stone-800 rounded-xl py-3 px-6 transition-all uppercase tracking-wider font-semibold cursor-pointer shadow"
            id="orders-grid-redirect-btn"
          >
            Discover Scents
          </button>
        </div>
      ) : (
        // List Orders Arrays
        <div className="space-y-6" id="my-past-orders-list">
          {orders.map((val) => {
            const dateStr = val.orderDate 
              ? new Date(val.orderDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })
              : "Ongoing Formulation";

            return (
              <motion.article
                key={val._id}
                className="bg-white border border-stone-200/80 hover:border-stone-400 rounded-3xl p-6 transition-all duration-300 shadow-sm hover:shadow"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                id={`customer-order-card-${val._id}`}
              >
                {/* Header layout */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-stone-100 pb-4 mb-4 gap-3">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-mono tracking-wider text-stone-400">Order ID Ledger</p>
                    <p className="text-xs font-mono font-bold text-stone-800">#{val._id}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center space-x-1 font-mono text-[9px] uppercase tracking-wider bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-100 font-bold">
                      ● Status: Paid & Direct
                    </span>
                    <span className="inline-flex items-center space-x-1 font-mono text-[9px] uppercase text-stone-500 tracking-wider bg-stone-100 px-2.5 py-1 rounded-full">
                      <Calendar className="w-2.5 h-2.5" />
                      <span>{dateStr}</span>
                    </span>
                  </div>
                </div>

                {/* Body content */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  
                  {/* Items Ordered detail */}
                  <div className="md:col-span-7 space-y-3">
                    <p className="text-[9px] uppercase font-mono tracking-widest text-stone-400 font-bold">Scent formulation array</p>
                    <div className="space-y-2">
                      {val.items.map((it, i) => (
                        <div key={i} className="flex justify-between text-xs text-stone-800 font-medium">
                          <span className="flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 bg-amber-700 rounded-full"></span>
                            <span>{it.title} <span className="font-mono text-stone-400">x{it.quantity}</span></span>
                          </span>
                          <span className="font-mono text-stone-900 font-semibold">₹{(it.price * it.quantity).toLocaleString("en-IN")}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-stone-100 pt-3 flex justify-between text-[11px] text-stone-500 font-mono">
                      <span>Delivery Surcharge:</span>
                      <span>₹{val.deliveryCharge.toLocaleString("en-IN")}</span>
                    </div>

                    <div className="border-t border-stone-200 border-dashed pt-3 flex justify-between text-sm font-bold text-stone-900">
                      <span>Total Value Invoiced:</span>
                      <span className="font-mono text-amber-950 text-base">₹{val.totalAmount.toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  {/* Shipping Credentials */}
                  <div className="md:col-span-5 bg-stone-50/70 rounded-2xl p-4 border border-stone-200/50 space-y-3 text-xs font-sans">
                    <p className="text-[9px] uppercase font-mono tracking-widest text-stone-500 font-bold">Dispatch Destination</p>
                    
                    <div className="space-y-2">
                      <div className="flex items-start space-x-2">
                        <MapPin className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-stone-800 font-medium leading-relaxed">{val.address}</p>
                          <p className="text-[10px] text-stone-400 font-mono mt-0.5">PIN Code: {val.pinCode}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 border-t border-stone-100 pt-2 text-[11px] text-stone-600">
                        <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>Contact Direct: <strong className="font-mono text-stone-800">{val.phone}</strong></span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Dispatch Status Progress & Remark displays (given by admin in 3) */}
                <div className="mt-6 pt-4 border-t border-stone-200/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-stone-50/70 p-4 rounded-2xl border border-stone-200/30">
                  <div className="flex items-center space-x-3">
                    <span className="relative flex h-3 w-3 shrink-0">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        val.remark === "Delivered" ? "bg-emerald-400" :
                        val.remark === "Shipped" ? "bg-blue-400" :
                        val.remark === "Confirmed" ? "bg-amber-400" : "bg-stone-400"
                      }`}></span>
                      <span className={`relative inline-flex rounded-full h-3 w-3 ${
                        val.remark === "Delivered" ? "bg-emerald-500" :
                        val.remark === "Shipped" ? "bg-blue-500" :
                        val.remark === "Confirmed" ? "bg-amber-500" : "bg-stone-500"
                      }`}></span>
                    </span>
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-widest text-stone-400 block font-bold">Atelier Remarks Status</span>
                      <span className="text-xs font-serif font-black text-stone-800">
                        {val.remark || "Yet to Confirm"}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-stone-500 italic font-sans max-w-md">
                    {val.remark === "Yet to Confirm" || !val.remark ? "🔮 Your purchase order list is logged in our database and currently pending admin verification." : ""}
                    {val.remark === "Confirmed" ? "✨ Approved! Our candle alchemists have verified payment details and started hand-pouring designs." : ""}
                    {val.remark === "Shipped" ? "🚚 Out for Delivery! Our premium soy wax product package has been boxed and dispatched to your address." : ""}
                    {val.remark === "Delivered" ? "🌿 Poured and Delivered! We hope our hand-selected soy candles light up and soothe your home atmosphere." : ""}
                  </p>
                </div>

              </motion.article>
            );
          })}
        </div>
      )}

    </div>
  );
}
