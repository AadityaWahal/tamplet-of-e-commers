export interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  stock: number;
  category?: string;
  shippingCost?: number;
}

export interface User {
  id: string;
  email: string;
  role: "admin" | "customer";
  address?: string;
  pinCode?: string;
  phone?: string;
  appliedCouponCode?: string;
  cart?: CartItem[];
}

export interface ConfigStatus {
  mongooseConnected: boolean;
  mongoError?: string | null;
  hasMongoUri: boolean;
  hasJwtSecret: boolean;
  hasRazorpay: boolean;
  razorpayKeyId: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  shippingCost?: number;
}

export interface Order {
  _id: string;
  email: string;
  items: OrderItem[];
  address: string;
  pinCode: string;
  phone: string;
  deliveryCharge: number;
  totalAmount: number;
  paymentStatus: string;
  orderDate: string;
  remark?: string;
  customerInstructions?: string;
}

export interface Coupon {
  _id: string;
  code: string;
  discountPercent: number;
  appliesToDelivery: boolean;
  isActive: boolean;
}

export interface StoreConfig {
  siteName: string;
  logoUrl: string;
  banners: string[];
  supportPhone?: string;
}

