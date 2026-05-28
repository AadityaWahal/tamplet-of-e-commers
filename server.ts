import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import Razorpay from "razorpay";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Ensure uploads folder exists in workspace
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded images statically
app.use("/uploads", express.static(uploadsDir));

app.use(express.json({ limit: "15mb" }));
app.use(cookieParser());

// Incoming request logging and path normalization middleware for serverless routing environments
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url} (originalUrl: ${req.originalUrl || req.url})`);
  next();
});

// Database Connection & Configuration
const MONGODB_URI = process.env.MONGODB_URI;
let mongooseConnected = false;
let mongoError: string | null = null;

// Clean, non-blocking connection function
async function ensureDbConnected(): Promise<boolean> {
  if (!MONGODB_URI) {
    return false;
  }

  const state = mongoose.connection.readyState;
  if (state === 1) {
    // Fully connected
    return true;
  }

  if (state === 2) {
    // Connection in progress, wait for it
    console.log("[DATABASE] Connection is currently establishing, waiting...");
    let retries = 0;
    while (mongoose.connection.readyState === 2 && retries < 25) {
      await new Promise(resolve => setTimeout(resolve, 200));
      retries++;
    }
    return mongoose.connection.readyState === 1;
  }

  // Disconnected (0) or disconnecting (3). Establish a fresh connection.
  try {
    console.log("[DATABASE] Establishing new MongoDB connection...");
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 8000
    });
    console.log("[DATABASE] Connected to MongoDB successfully.");
    await seedProductsIfEmpty();
    return true;
  } catch (err: any) {
    console.error("[DATABASE] MongoDB connection connection failed:", err.message);
    mongoError = err.message;
    return false;
  }
}

// Request-level database synchronization middleware
app.use(async (req, res, next) => {
  if (MONGODB_URI) {
    mongooseConnected = await ensureDbConnected();
  } else {
    mongooseConnected = false;
  }
  next();
});

// Fire off the connection in the background immediately on startup
if (MONGODB_URI) {
  ensureDbConnected().then((connected) => {
    mongooseConnected = connected;
  }).catch((err) => {
    console.error("[DATABASE] Background connection thread error:", err);
  });
} else {
  console.log("No MONGODB_URI configured. Running in high-fidelity 'Demo Mode' with in-memory database storage.");
}

// ----------------------------------------------------
// DATABASE SCHEMAS & MODELS
// ----------------------------------------------------

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "customer" },
  address: { type: String, default: "" },
  pinCode: { type: String, default: "" },
  phone: { type: String, default: "" },
  appliedCouponCode: { type: String, default: "" },
  cart: { type: Array, default: [] }
});

// Pre-save password hashing hook via bcryptjs
UserSchema.pre("save", async function (this: any) {
  if (!this.isModified("password")) return;
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (err: any) {
    throw err;
  }
});

const ProductSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  imageUrl: { type: String, required: true },
  stock: { type: Number, default: 10 },
  category: { type: String, default: "General" },
  shippingCost: { type: Number, default: 0 }
});

const OrderSchema = new mongoose.Schema({
  email: { type: String, required: true },
  items: [
    {
      productId: { type: String },
      title: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true },
      shippingCost: { type: Number, default: 0 }
    }
  ],
  address: { type: String, required: true },
  pinCode: { type: String, required: true },
  phone: { type: String, required: true },
  deliveryCharge: { type: Number, default: 120 },
  totalAmount: { type: Number, required: true },
  paymentStatus: { type: String, default: "Paid" },
  orderDate: { type: Date, default: Date.now },
  remark: { type: String, default: "Yet to Confirm" },
  customerInstructions: { type: String, default: "" },
  paymentId: { type: String, default: "" },
  razorpayOrderId: { type: String, default: "" },
  razorpaySignature: { type: String, default: "" }
});

const DeliveryConfigSchema = new mongoose.Schema({
  deliveryCharge: { type: Number, default: 120 }
});

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }
});

const CouponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  discountPercent: { type: Number, required: true },
  appliesToDelivery: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
});

const StoreConfigSchema = new mongoose.Schema({
  siteName: { type: String, default: "Enlight Candles" },
  logoUrl: { type: String, default: "" },
  banners: { type: [String], default: [] },
  supportPhone: { type: String, default: "+91 98765 43210" }
});

// Access existing compilation models or create new ones typed as any to bypass query strictness
const User: any = mongoose.models.User || mongoose.model("User", UserSchema);
const Product: any = mongoose.models.Product || mongoose.model("Product", ProductSchema);
const Order: any = mongoose.models.Order || mongoose.model("Order", OrderSchema);
const DeliveryConfig: any = mongoose.models.DeliveryConfig || mongoose.model("DeliveryConfig", DeliveryConfigSchema);
const Category: any = mongoose.models.Category || mongoose.model("Category", CategorySchema);
const Coupon: any = mongoose.models.Coupon || mongoose.model("Coupon", CouponSchema);
const StoreConfig: any = mongoose.models.StoreConfig || mongoose.model("StoreConfig", StoreConfigSchema);

// ----------------------------------------------------
// DEMO/MEMORY STORAGE FALLBACK
// ----------------------------------------------------

interface IDemoUser {
  _id: string;
  email: string;
  passwordHash: string;
  role: string;
  address?: string;
  pinCode?: string;
  phone?: string;
  appliedCouponCode?: string;
  cart?: any[];
}

interface IDemoProduct {
  _id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  stock: number;
  category?: string;
  shippingCost?: number;
}

interface IDemoOrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  shippingCost?: number;
}

interface IDemoOrder {
  _id: string;
  email: string;
  items: IDemoOrderItem[];
  address: string;
  pinCode: string;
  phone: string;
  deliveryCharge: number;
  totalAmount: number;
  paymentStatus: string;
  orderDate: Date;
  remark?: string;
}

interface IDemoCoupon {
  _id: string;
  code: string;
  discountPercent: number;
  appliesToDelivery: boolean;
  isActive: boolean;
}

const memoryUsers: IDemoUser[] = [];
const memoryOrders: IDemoOrder[] = [
  {
    _id: "order_demo_101",
    email: "somiwahal6287@gmail.com",
    items: [
      {
        productId: "prod_1",
        title: "Santal Violet & Sandalwood",
        price: 850,
        quantity: 1
      },
      {
        productId: "prod_3",
        title: "Tuscan Fig & Herbal Moss",
        price: 790,
        quantity: 2
      }
    ],
    address: "Atelier Court Boutique, Block 4C",
    pinCode: "110001",
    phone: "9876543210",
    deliveryCharge: 120,
    totalAmount: 2550, // (850*1) + (790*2) + 120 = 850 + 1580 + 120 = 2550
    paymentStatus: "Paid",
    orderDate: new Date(),
    remark: "Yet to Confirm"
  }
];
let memoryDeliveryCharge = 120;
const memoryProducts: IDemoProduct[] = [
  {
    _id: "prod_1",
    title: "Calm Lavender",
    description: "Relaxing blend of French lavender fields, organic wild chamomile, and pure essential extracts.",
    price: 620,
    imageUrl: "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&q=80&w=600",
    stock: 15,
    category: "Classic",
    shippingCost: 40
  },
  {
    _id: "prod_2",
    title: "Citrus Blossom",
    description: "Energizing citrus aromatherapy infused with fresh orange peel, sliced grapefruit, and natural botanical elements.",
    price: 920,
    imageUrl: "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&q=80&w=600",
    stock: 12,
    category: "Warm",
    shippingCost: 40
  },
  {
    _id: "prod_3",
    title: "Warilla & Clozy",
    description: "Madagascar vanilla pods infused with sweet warm cinnamon bark and rustic aromatic winter cloves.",
    price: 2380,
    imageUrl: "https://images.unsplash.com/photo-1596435764265-7281c7e145ae?auto=format&fit=crop&q=80&w=600",
    stock: 10,
    category: "Floral",
    shippingCost: 50
  },
  {
    _id: "prod_4",
    title: "Herbal & Best Woodley",
    description: "Clean fresh mountain foliage layered with handpressed sage leaves, golden forest bark, and wood musk.",
    price: 1450,
    imageUrl: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=600",
    stock: 8,
    category: "Woody",
    shippingCost: 50
  },
  {
    _id: "prod_5",
    title: "Amber Oud & Gold Resin",
    description: "Sophisticated golden resin combined with warm Baltic amber, premium organic oud chunks, and sweet sandalwood shavings.",
    price: 1890,
    imageUrl: "https://images.unsplash.com/photo-1572726729207-a78d6feb18d7?auto=format&fit=crop&q=80&w=600",
    stock: 14,
    category: "Best Seller",
    shippingCost: 40
  },
  {
    _id: "prod_6",
    title: "Eucalyptus & Wild Mint",
    description: "Invigorating therapy crafted with fresh handpicked eucalyptus branches, organic mint leaves, and therapeutic green crystal salts.",
    price: 1255,
    imageUrl: "https://images.unsplash.com/photo-1602872030219-cbf652901994?auto=format&fit=crop&q=80&w=600",
    stock: 20,
    category: "Best Seller",
    shippingCost: 40
  },
  {
    _id: "prod_7",
    title: "Sovereign Santal & Shea",
    description: "Elegant blend of rich creamy Santal oil paired wonderfully with lavender, soft shea, and golden incense resin.",
    price: 2150,
    imageUrl: "https://images.unsplash.com/photo-1605651202774-7d5731db8e75?auto=format&fit=crop&q=80&w=600",
    stock: 18,
    category: "Best Seller",
    shippingCost: 50
  },
  {
    _id: "prod_8",
    title: "Charcoal Oak & Vanilla Bean",
    description: "A premium rich, smoky Madagascar vanilla bean candle infused with charred oak logs and white birch bark flakes.",
    price: 1950,
    imageUrl: "https://images.unsplash.com/photo-1547849616-566fb4ec2718?auto=format&fit=crop&q=80&w=600",
    stock: 11,
    category: "Best Seller",
    shippingCost: 50
  }
];

const memoryCoupons: IDemoCoupon[] = [
  { _id: "coupon_1", code: "FIRST50", discountPercent: 50, appliesToDelivery: false, isActive: true }
];

const memoryCategories: string[] = ["Classic", "Warm", "Floral", "Woody", "Best Seller"];

let memoryStoreConfig = {
  siteName: "Enlight Candles",
  logoUrl: "/uploads/logo_1779874885414.png",
  banners: [
    "https://images.unsplash.com/photo-1596435764253-6535f2d74bb3?auto=format&fit=crop&q=80&w=1200",
    "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&q=80&w=1200",
    "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=1200"
  ],
  supportPhone: "+91 98765 43210"
};

// Seed products if MongoDB starts fresh
async function seedProductsIfEmpty() {
  try {
    const hasOldProducts = await Product.findOne({ title: "Santal Violet & Sandalwood" });
    const existCount = await Product.countDocuments();
    
    // Force drop/update if legacy products exist or count is not 8
    if (hasOldProducts || (existCount > 0 && existCount !== 8)) {
      console.log("Found outdated templates or incomplete product list. Re-seeding database catalog...");
      await Product.deleteMany({});
    }

    const count = await Product.countDocuments();
    if (count === 0) {
      const dbSeeded = memoryProducts.map(p => ({
        title: p.title,
        description: p.description,
        price: p.price,
        imageUrl: p.imageUrl,
        stock: p.stock,
        category: p.category || "Classic"
      }));
      await Product.insertMany(dbSeeded);
      console.log("Database seeded successfully with initial inventory.");
    }

    // Seed/Sync categories
    for (const catName of memoryCategories) {
      const exists = await Category.findOne({ name: catName });
      if (!exists) {
        await Category.create({ name: catName });
        console.log(`Seeded category ${catName} into MongoDB.`);
      }
    }

    // Seed FIRST50 coupon
    const couponCount = await Coupon.countDocuments();
    if (couponCount === 0) {
      await Coupon.create({
        code: "FIRST50",
        discountPercent: 50,
        appliesToDelivery: false,
        isActive: true
      });
      console.log("Database seeded with FIRST50 coupon.");
    }

    // Seed store configuration if empty
    const configCount = await StoreConfig.countDocuments();
    if (configCount === 0) {
      await StoreConfig.create(memoryStoreConfig);
      console.log("Database seeded with default store configuration.");
    } else {
      // Force update to clean banners if outdated banners loaded
      const existingConfig = await StoreConfig.findOne({});
      if (existingConfig && existingConfig.banners && existingConfig.banners.includes("https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&q=80&w=1200")) {
        console.log("Upgrading database StoreConfig to replace glitched banner slide.");
        existingConfig.banners = memoryStoreConfig.banners;
        await existingConfig.save();
      }
    }
  } catch (err: any) {
    console.error("Seeding process failed:", err.message);
  }
}

// JWT Secret Key (Safeguarded fallback)
const JWT_SECRET = process.env.JWT_SECRET || "default_aura_candle_super_secret_for_jwt";

// ----------------------------------------------------
// RAZORPAY SENSITIVE CLIENT
// ----------------------------------------------------
let razorpayClient: Razorpay | null = null;
function getRazorpay() {
  if (!razorpayClient) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      return null;
    }
    try {
      razorpayClient = new Razorpay({
        key_id: keyId,
        key_secret: keySecret
      });
    } catch (err) {
      console.error("Failed to initialize Razorpay SDK client:", err);
      return null;
    }
  }
  return razorpayClient;
}

// ----------------------------------------------------
// AUTH PROTECTION MIDDLEWARE
// ----------------------------------------------------
const extractToken = (req: express.Request): string | null => {
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return null;
};

const verifyAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: "Authentication required. Please login first." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string; email: string };
    if (decoded.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Administrative role required." });
    }
    // Attach decoded user info to the request profile
    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Authentication token is invalid or expired." });
  }
};

// Simple status authentication checker
const getCurrentUser = (req: express.Request) => {
  const token = extractToken(req);
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; role: string; email: string };
  } catch {
    return null;
  }
};

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// Heartbeat / health check endpoint to keep the server awake and responsive
app.get("/api/health", (req, res) => {
  console.log(`[HEARTBEAT] Ping received at ${new Date().toISOString()}`);
  res.json({ status: "alive", time: new Date().toISOString(), mongooseConnected });
});

// Server Environment Config details for UI Banner styling
app.get("/api/config-status", async (req, res) => {
  res.json({
    mongooseConnected,
    mongoError,
    hasMongoUri: !!process.env.MONGODB_URI,
    hasJwtSecret: !!process.env.JWT_SECRET,
    hasRazorpay: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || "rzp_test_demokey_12345"
  });
});

// 1. Get current login status
app.get("/api/auth/me", async (req, res) => {
  const sessionUser = getCurrentUser(req);
  if (!sessionUser) {
    return res.json({ user: null });
  }

  try {
    if (mongooseConnected) {
      const dbUser = await User.findById(sessionUser.userId).select("-password");
      if (dbUser) {
        return res.json({
          user: {
            id: dbUser._id.toString(),
            _id: dbUser._id.toString(),
            email: dbUser.email,
            role: dbUser.role,
            address: dbUser.address || "",
            pinCode: dbUser.pinCode || "",
            phone: dbUser.phone || "",
            appliedCouponCode: dbUser.appliedCouponCode || "",
            cart: dbUser.cart || []
          }
        });
      }
    } else {
      const memUser = memoryUsers.find(u => u._id === sessionUser.userId);
      if (memUser) {
        return res.json({
          user: {
            id: memUser._id,
            _id: memUser._id,
            email: memUser.email,
            role: memUser.role,
            address: memUser.address || "",
            pinCode: memUser.pinCode || "",
            phone: memUser.phone || "",
            appliedCouponCode: memUser.appliedCouponCode || "",
            cart: memUser.cart || []
          }
        });
      }
    }
  } catch (err) {
    console.error("Failed to fetch user session details from backend:", err);
  }

  res.json({ user: sessionUser });
});

// 2. User registration
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    if (role === "admin") {
      return res.status(400).json({ error: "Creating administrative accounts via the registration page is strictly forbidden. Administrators must be provisioned directly in the database." });
    }

    const assignedRole = "customer";

    if (mongooseConnected) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: "An account with this email already exists." });
      }

      const newUser = new User({ email, password, role: assignedRole });
      await newUser.save();

      // Sign automatic JWT login on register
      const token = jwt.sign(
        { userId: newUser._id.toString(), role: newUser.role, email: newUser.email },
        JWT_SECRET,
        { expiresIn: "30d" }
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000
      });

      return res.status(201).json({
        success: true,
        token: token,
        user: { 
          id: newUser._id.toString(), 
          _id: newUser._id.toString(), 
          email: newUser.email, 
          role: newUser.role,
          address: newUser.address || "",
          pinCode: newUser.pinCode || "",
          phone: newUser.phone || "",
          appliedCouponCode: newUser.appliedCouponCode || "",
          cart: newUser.cart || []
        }
      });
    } else {
      // Memory persistence
      const formatEmail = email.toLowerCase().trim();
      const userExists = memoryUsers.find(u => u.email.toLowerCase() === formatEmail);
      if (userExists) {
        return res.status(400).json({ error: "An account with this email already exists." });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const newMemUser: any = {
        _id: "user_" + Math.random().toString(36).substr(2, 9),
        email: email,
        passwordHash,
        role: assignedRole,
        address: "",
        pinCode: "",
        phone: "",
        appliedCouponCode: "",
        cart: []
      };

      memoryUsers.push(newMemUser);

      const token = jwt.sign(
        { userId: newMemUser._id, role: newMemUser.role, email: newMemUser.email },
        JWT_SECRET,
        { expiresIn: "30d" }
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000
      });

      return res.status(201).json({
        success: true,
        token: token,
        user: { 
          id: newMemUser._id, 
          _id: newMemUser._id, 
          email: newMemUser.email, 
          role: newMemUser.role,
          address: "",
          pinCode: "",
          phone: "",
          appliedCouponCode: "",
          cart: []
        }
      });
    }
  } catch (err: any) {
    console.error("Registration endpoint error:", err);
    return res.status(500).json({ error: "System error: " + err.message });
  }
});

// 3. User login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    if (mongooseConnected) {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password credentials." });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: "Invalid email or password credentials." });
      }

      const token = jwt.sign(
        { userId: user._id.toString(), role: user.role, email: user.email },
        JWT_SECRET,
        { expiresIn: "30d" }
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000
      });

      return res.json({
        success: true,
        token: token,
        user: { 
          id: user._id.toString(), 
          _id: user._id.toString(), 
          email: user.email, 
          role: user.role,
          address: user.address || "",
          pinCode: user.pinCode || "",
          phone: user.phone || "",
          appliedCouponCode: user.appliedCouponCode || "",
          cart: user.cart || []
        }
      });
    } else {
      // Memory check
      const lookupEmail = email.toLowerCase().trim();
      const user = memoryUsers.find(u => u.email.toLowerCase() === lookupEmail);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password credentials." });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ error: "Invalid email or password credentials." });
      }

      const token = jwt.sign(
        { userId: user._id, role: user.role, email: user.email },
        JWT_SECRET,
        { expiresIn: "30d" }
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000
      });

      return res.json({
        success: true,
        token: token,
        user: { 
          id: user._id, 
          _id: user._id, 
          email: user.email, 
          role: user.role,
          address: user.address || "",
          pinCode: user.pinCode || "",
          phone: user.phone || "",
          appliedCouponCode: user.appliedCouponCode || "",
          cart: user.cart || []
        }
      });
    }
  } catch (err: any) {
    console.error("Login endpoint error:", err);
    return res.status(500).json({ error: "System error during authentication." });
  }
});

// 4. Logout Session
app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ success: true, message: "Logged out successfully from session." });
});

// 4.1. Save or Update User profile (Address, pinCode, phone, and appliedCouponCode)
app.post("/api/auth/profile", async (req, res) => {
  const sessionUser = getCurrentUser(req);
  if (!sessionUser) {
    return res.status(401).json({ error: "Authentication required to update profile." });
  }

  const { address, pinCode, phone, appliedCouponCode } = req.body;

  try {
    if (mongooseConnected) {
      const updateData: any = {};
      if (address !== undefined) updateData.address = address;
      if (pinCode !== undefined) updateData.pinCode = pinCode;
      if (phone !== undefined) updateData.phone = phone;
      if (appliedCouponCode !== undefined) updateData.appliedCouponCode = appliedCouponCode;

      const dbUser = await User.findByIdAndUpdate(
        sessionUser.userId,
        { $set: updateData },
        { new: true }
      ).select("-password");

      return res.json({ success: true, user: dbUser });
    } else {
      const memUser = memoryUsers.find(u => u._id === sessionUser.userId);
      if (!memUser) {
        return res.status(404).json({ error: "User profile not found." });
      }

      if (address !== undefined) memUser.address = address;
      if (pinCode !== undefined) memUser.pinCode = pinCode;
      if (phone !== undefined) memUser.phone = phone;
      if (appliedCouponCode !== undefined) memUser.appliedCouponCode = appliedCouponCode;

      return res.json({ success: true, user: memUser });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to edit user profile details." });
  }
});

// 4.2. Synchronize user Cart Storage
app.post("/api/auth/cart", async (req, res) => {
  const sessionUser = getCurrentUser(req);
  if (!sessionUser) {
    return res.status(401).json({ error: "Authentication required to sync cart." });
  }

  const { cart } = req.body;
  if (!Array.isArray(cart)) {
    return res.status(400).json({ error: "Cart payload must be a list." });
  }

  try {
    if (mongooseConnected) {
      await User.findByIdAndUpdate(sessionUser.userId, { $set: { cart } });
    } else {
      const memUser = memoryUsers.find(u => u._id === sessionUser.userId);
      if (memUser) {
        memUser.cart = cart;
      }
    }
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to persist cart to database." });
  }
});

// 5. Product catalog GET lists
app.get("/api/products", async (req, res) => {
  try {
    if (mongooseConnected) {
      const dbProducts = await Product.find({});
      return res.json({ products: dbProducts });
    } else {
      return res.json({ products: memoryProducts });
    }
  } catch (err: any) {
    console.error("Product catalog retrieval failed:", err);
    return res.status(500).json({ error: "Unable to retrieve candle products listing." });
  }
});

// 6. Admin upload novel custom products
app.post("/api/admin/products", verifyAdmin, async (req, res) => {
  try {
    const { title, description, price, imageUrl, stock, category, shippingCost } = req.body;
    if (!title || !description || price === undefined || !imageUrl) {
      return res.status(400).json({ error: "Invalid product parameters. Complete all required fields." });
    }

    const priceNum = Number(price);
    const stockNum = stock !== undefined ? Number(stock) : 10;
    const catStr = category || "Classic";
    const shippingCostNum = shippingCost !== undefined ? Number(shippingCost) : 0;

    if (isNaN(priceNum) || priceNum <= 0) {
      return res.status(400).json({ error: "Price must be a positive number." });
    }

    if (mongooseConnected) {
      const newProd = new Product({
        title,
        description,
        price: priceNum,
        imageUrl,
        stock: stockNum,
        category: catStr,
        shippingCost: shippingCostNum
      });
      await newProd.save();
      return res.status(201).json({ success: true, product: newProd });
    } else {
      const newMemProd = {
        _id: "prod_" + Math.random().toString(36).substr(2, 9),
        title,
        description,
        price: priceNum,
        imageUrl,
        stock: stockNum,
        category: catStr,
        shippingCost: shippingCostNum
      };
      memoryProducts.push(newMemProd);
      return res.status(201).json({ success: true, product: newMemProd });
    }
  } catch (err: any) {
    console.error("Admin product addition endpoint failure:", err);
    return res.status(500).json({ error: "System failure saving product: " + err.message });
  }
});

// 6b. Admin update existing product
app.put("/api/admin/products/:id", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price, imageUrl, stock, category, shippingCost } = req.body;
    if (!title || !description || price === undefined || !imageUrl) {
      return res.status(400).json({ error: "Invalid product parameters. Complete all required fields." });
    }

    const priceNum = Number(price);
    const stockNum = stock !== undefined ? Number(stock) : 10;
    const catStr = category || "Classic";
    const shippingCostNum = shippingCost !== undefined ? Number(shippingCost) : 0;

    if (isNaN(priceNum) || priceNum <= 0) {
      return res.status(400).json({ error: "Price must be a positive number." });
    }

    if (mongooseConnected) {
      const updatedProd = await Product.findByIdAndUpdate(
        id,
        { title, description, price: priceNum, imageUrl, stock: stockNum, category: catStr, shippingCost: shippingCostNum },
        { new: true }
      );
      if (!updatedProd) {
        return res.status(404).json({ error: "Product not found." });
      }
      return res.json({ success: true, product: updatedProd });
    } else {
      const idx = memoryProducts.findIndex(p => p._id === id);
      if (idx === -1) {
        return res.status(404).json({ error: "Product not found in memory database." });
      }
      memoryProducts[idx] = {
        _id: id,
        title,
        description,
        price: priceNum,
        imageUrl,
        stock: stockNum,
        category: catStr,
        shippingCost: shippingCostNum
      };
      return res.json({ success: true, product: memoryProducts[idx] });
    }
  } catch (err: any) {
    console.error("Admin product update failure:", err);
    return res.status(500).json({ error: "System failure updating product: " + err.message });
  }
});

// 6c. Admin delete existing product from database
app.delete("/api/admin/products/:id", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (mongooseConnected) {
      const deletedProd = await Product.findByIdAndDelete(id);
      if (!deletedProd) {
        return res.status(404).json({ error: "Product not found." });
      }
      return res.json({ success: true, message: "Candle deleted successfully." });
    } else {
      const idx = memoryProducts.findIndex(p => p._id === id);
      if (idx === -1) {
        return res.status(404).json({ error: "Product not found in memory database." });
      }
      memoryProducts.splice(idx, 1);
      return res.json({ success: true, message: "Candle deleted successfully from memory." });
    }
  } catch (err: any) {
    console.error("Admin product deletion failure:", err);
    return res.status(500).json({ error: "System failure deleting product: " + err.message });
  }
});

// 7. Create Razorpay order intent for checkout processing
app.post("/api/create-order", async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ error: "The parameter productId is required." });
    }

    let searchProduct: any = null;

    if (mongooseConnected) {
      try {
        searchProduct = await Product.findById(productId);
      } catch {
        // Fallback for demo ID match query errors
      }
    }

    if (!searchProduct) {
      searchProduct = memoryProducts.find(p => p._id === productId);
    }

    if (!searchProduct) {
      return res.status(404).json({ error: "Product item was not found in catalog." });
    }

    const rzp = getRazorpay();
    const paiseAmount = searchProduct.price * 100;

    if (!rzp) {
      // Setup demo/sandbox verification details
      const simulatedOrderId = "order_sim_" + Math.random().toString(36).substring(2, 10).toUpperCase();
      console.log(`[PAYMENT SIMULATION] Initialized order ID ${simulatedOrderId} for ${searchProduct.title} (₹${searchProduct.price})`);
      return res.json({
        success: true,
        order_id: simulatedOrderId,
        amount: paiseAmount,
        currency: "INR",
        product: {
          title: searchProduct.title,
          price: searchProduct.price,
          _id: searchProduct._id
        },
        isDemo: true,
        keyId: "rzp_test_demokey_12345"
      });
    }

    const opt = {
      amount: paiseAmount,
      currency: "INR",
      receipt: `rec_candle_${Math.random().toString(36).substring(2, 7)}`
    };

    const externalOrder = await rzp.orders.create(opt);
    return res.json({
      success: true,
      order_id: externalOrder.id,
      amount: externalOrder.amount,
      currency: externalOrder.currency,
      product: {
        title: searchProduct.title,
        price: searchProduct.price,
        _id: searchProduct._id
      },
      isDemo: false,
      keyId: process.env.RAZORPAY_KEY_ID
    });

  } catch (err: any) {
    console.error("Razorpay order API process failure:", err);
    return res.status(500).json({ error: "Payment backend process failed: " + err.message });
  }
});

// 8. Dynamic retrieval of delivery/shipping charges
app.get("/api/delivery-config", async (req, res) => {
  try {
    if (mongooseConnected) {
      let conf = await DeliveryConfig.findOne({});
      if (!conf) {
        conf = new DeliveryConfig({ deliveryCharge: 120 });
        await conf.save();
      }
      return res.json({ deliveryCharge: conf.deliveryCharge });
    } else {
      return res.json({ deliveryCharge: memoryDeliveryCharge });
    }
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to read delivery charge configuration: " + err.message });
  }
});

// 9. Administrator edit of delivery/shipping charges (Administrative Only)
app.post("/api/admin/delivery-config", verifyAdmin, async (req, res) => {
  try {
    const { deliveryCharge } = req.body;
    const chargeNum = Number(deliveryCharge);
    if (isNaN(chargeNum) || chargeNum < 0) {
      return res.status(400).json({ error: "Delivery charge must be a non-negative number." });
    }

    if (mongooseConnected) {
      let conf = await DeliveryConfig.findOne({});
      if (!conf) {
        conf = new DeliveryConfig({ deliveryCharge: chargeNum });
      } else {
        conf.deliveryCharge = chargeNum;
      }
      await conf.save();
      return res.json({ success: true, deliveryCharge: conf.deliveryCharge });
    } else {
      memoryDeliveryCharge = chargeNum;
      return res.json({ success: true, deliveryCharge: memoryDeliveryCharge });
    }
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to update delivery charge configuration: " + err.message });
  }
});

// 9ab. Admin File Upload and Deletion Endpoints (Local disk storage)
app.post("/api/admin/upload-file", verifyAdmin, async (req, res) => {
  try {
    const { base64Data, prefix } = req.body;
    if (!base64Data) {
      return res.status(400).json({ error: "Missing uploaded image content payload." });
    }

    const matches = base64Data.match(/^data:image\/([A-Za-z-+]+);base64,(.+)$/) 
                 || base64Data.match(/^data:application\/octet-stream;base64,(.+)$/);
    
    let ext = "png";
    let base64String = "";
    if (matches) {
      if (matches.length === 3) {
        ext = matches[1];
        base64String = matches[2];
      } else {
        base64String = matches[1];
      }
    } else {
      // Direct raw base64 string
      base64String = base64Data;
    }

    // Sanitize extension to common and safe image forms
    if (!["png", "jpg", "jpeg", "gif", "webp"].includes(ext.toLowerCase())) {
      ext = "png";
    }

    const buffer = Buffer.from(base64String, "base64");
    const filename = `${prefix || "img"}_${Date.now()}.${ext}`;
    const filepath = path.join(uploadsDir, filename);

    fs.writeFileSync(filepath, buffer);
    const url = `/uploads/${filename}`;

    return res.json({ success: true, url });
  } catch (err: any) {
    console.error("Failed to write dynamic storefront media buffer:", err);
    return res.status(500).json({ error: "Disk storage failure during transaction: " + err.message });
  }
});

app.post("/api/admin/delete-file", verifyAdmin, async (req, res) => {
  try {
    const { url } = req.body;
    if (url && url.startsWith("/uploads/")) {
      const filename = url.replace("/uploads/", "");
      const safePath = path.resolve(path.join(uploadsDir, path.basename(filename)));
      if (safePath.startsWith(uploadsDir) && fs.existsSync(safePath)) {
        fs.unlinkSync(safePath);
        return res.json({ success: true, message: "File deleted successfully from disk." });
      }
    }
    return res.json({ success: true, message: "No local file needed deletion from disk storage." });
  } catch (err: any) {
    console.error("Error unlinking media file:", err);
    return res.status(500).json({ error: "Failed to erase image: " + err.message });
  }
});

// 9b. Public GET store Dynamic Branding and Banners Setup
app.get("/api/store-config", async (req, res) => {
  try {
    if (mongooseConnected) {
      let conf = await StoreConfig.findOne({});
      if (!conf) {
        conf = await StoreConfig.create(memoryStoreConfig);
      }
      return res.json({ 
        success: true, 
        siteName: conf.siteName, 
        logoUrl: conf.logoUrl, 
        banners: conf.banners,
        supportPhone: conf.supportPhone || "+91 98765 43210"
      });
    } else {
      return res.json({ 
        success: true, 
        siteName: memoryStoreConfig.siteName, 
        logoUrl: memoryStoreConfig.logoUrl, 
        banners: memoryStoreConfig.banners,
        supportPhone: memoryStoreConfig.supportPhone || "+91 98765 43210"
      });
    }
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to retrieve storefront settings: " + err.message });
  }
});

// 9c. Administrator POST to update dynamic branding and sliders (Administrative Only)
app.post("/api/admin/store-config", verifyAdmin, async (req, res) => {
  try {
    const { siteName, logoUrl, banners, supportPhone } = req.body;
    if (!siteName || !siteName.trim()) {
      return res.status(400).json({ error: "Website dynamic name cannot be blank." });
    }

    const cleanBanners = Array.isArray(banners) ? banners.map((b: string) => b.trim()).filter((b: string) => !!b) : [];
    const cleanSupportPhone = (supportPhone || "+91 98765 43210").trim();

    if (mongooseConnected) {
      let conf = await StoreConfig.findOne({});
      if (!conf) {
        conf = new StoreConfig({
          siteName: siteName.trim(),
          logoUrl: (logoUrl || "").trim(),
          banners: cleanBanners,
          supportPhone: cleanSupportPhone
        });
      } else {
        conf.siteName = siteName.trim();
        conf.logoUrl = (logoUrl || "").trim();
        conf.banners = cleanBanners;
        conf.supportPhone = cleanSupportPhone;
      }
      await conf.save();
      // Also sync back to memoryStoreConfig
      memoryStoreConfig = {
        siteName: conf.siteName,
        logoUrl: conf.logoUrl,
        banners: conf.banners,
        supportPhone: conf.supportPhone
      };
      return res.json({ 
        success: true, 
        siteName: conf.siteName, 
        logoUrl: conf.logoUrl, 
        banners: conf.banners,
        supportPhone: conf.supportPhone
      });
    } else {
      memoryStoreConfig = {
        siteName: siteName.trim(),
        logoUrl: (logoUrl || "").trim(),
        banners: cleanBanners,
        supportPhone: cleanSupportPhone
      };
      return res.json({ 
        success: true, 
        siteName: memoryStoreConfig.siteName, 
        logoUrl: memoryStoreConfig.logoUrl, 
        banners: memoryStoreConfig.banners,
        supportPhone: memoryStoreConfig.supportPhone
      });
    }
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to set up promotional branding configuration: " + err.message });
  }
});

// 10. Process checkout/placement request of Cart Orders
app.post("/api/orders", async (req, res) => {
  try {
    const { items, address, pinCode, phone, couponCode, customerInstructions, paymentId, razorpayOrderId, razorpaySignature } = req.body;
    const activeSession = getCurrentUser(req);
    if (!activeSession) {
      return res.status(401).json({ error: "Authentication is required to place and track orders." });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Your cart cannot be empty when checking out." });
    }

    if (!address || !pinCode || !phone) {
      return res.status(400).json({ error: "All shipping credentials (address, pin code, and telephone) are mandatory." });
    }

    // Fetch active delivery charge
    let activeCharge = 120;
    if (mongooseConnected) {
      const dbConf = await DeliveryConfig.findOne({});
      if (dbConf) {
        activeCharge = dbConf.deliveryCharge;
      }
    } else {
      activeCharge = memoryDeliveryCharge;
    }

    // Fetch coupon detail
    let appliedCoupon: any = null;
    if (couponCode) {
      const cleanCode = couponCode.trim().toUpperCase();
      if (mongooseConnected) {
        appliedCoupon = await Coupon.findOne({ code: cleanCode, isActive: true });
      } else {
        appliedCoupon = memoryCoupons.find(c => c.code === cleanCode && c.isActive);
      }
    }

    let calculatedItemTotal = 0;
    let computedShippingTotal = 0;
    const validatedItems: any[] = [];

    for (const item of items) {
      const qty = Math.max(1, Number(item.quantity) || 1);
      let targetProduct: any = null;

      if (mongooseConnected) {
        try {
          targetProduct = await Product.findById(item.productId);
        } catch {}
      } else {
        targetProduct = memoryProducts.find(p => p._id === item.productId);
      }

      if (!targetProduct) {
        return res.status(400).json({ error: `The item "${item.title}" is no longer available in our collection.` });
      }

      calculatedItemTotal += targetProduct.price * qty;
      const unitShipping = targetProduct.shippingCost !== undefined ? Number(targetProduct.shippingCost) : 0;
      computedShippingTotal += unitShipping * qty;

      // Decrement stock gracefully
      const originalStock = targetProduct.stock;
      targetProduct.stock = Math.max(0, originalStock - qty);
      if (mongooseConnected) {
        await targetProduct.save();
      }

      validatedItems.push({
        productId: targetProduct._id.toString(),
        title: targetProduct.title,
        price: targetProduct.price,
        shippingCost: unitShipping,
        quantity: qty
      });
    }

    // Calculate dynamic discount with specified Coupon
    let discountPercent = appliedCoupon ? appliedCoupon.discountPercent : 0;
    let finalItemsTotal = calculatedItemTotal;
    let finalDeliveryCharge = computedShippingTotal;

    if (appliedCoupon) {
      if (appliedCoupon.appliesToDelivery) {
        // Entirely free: applies to both product price and delivery charge
        finalItemsTotal = 0;
        finalDeliveryCharge = 0;
      } else {
        // Gives discount on product price but not on delivery
        const discRatio = (100 - discountPercent) / 100;
        finalItemsTotal = Math.round(calculatedItemTotal * discRatio);
      }
    }

    const totalAmount = finalItemsTotal + finalDeliveryCharge;
    const finalPaymentStatus = totalAmount === 0 ? "Free / Coupon" : "Paid";

    if (mongooseConnected) {
      const freshOrder = new Order({
        email: activeSession.email,
        items: validatedItems,
        address,
        pinCode,
        phone,
        deliveryCharge: finalDeliveryCharge,
        totalAmount,
        paymentStatus: finalPaymentStatus,
        orderDate: new Date(),
        remark: "Yet to Confirm",
        customerInstructions: (customerInstructions || "").trim(),
        paymentId: paymentId || "",
        razorpayOrderId: razorpayOrderId || "",
        razorpaySignature: razorpaySignature || ""
      });
      await freshOrder.save();

      // Clear the user's stored DB cart and save their checkout credentials into User document
      await User.findByIdAndUpdate(activeSession.userId, {
        $set: {
          cart: [],
          address,
          pinCode,
          phone,
          appliedCouponCode: "" // clear applied coupon once used
        }
      });

      return res.status(201).json({ success: true, order: freshOrder });
    } else {
      const freshMemOrder = {
        _id: "order_mem_" + Math.random().toString(36).substr(2, 9),
        email: activeSession.email,
        items: validatedItems,
        address,
        pinCode,
        phone,
        deliveryCharge: finalDeliveryCharge,
        totalAmount,
        paymentStatus: finalPaymentStatus,
        orderDate: new Date(),
        remark: "Yet to Confirm",
        customerInstructions: (customerInstructions || "").trim(),
        paymentId: paymentId || "",
        razorpayOrderId: razorpayOrderId || "",
        razorpaySignature: razorpaySignature || ""
      };
      memoryOrders.unshift(freshMemOrder);

      // Save user profile details to memory
      const memUser = memoryUsers.find(u => u._id === activeSession.userId);
      if (memUser) {
        memUser.cart = [];
        memUser.address = address;
        memUser.pinCode = pinCode;
        memUser.phone = phone;
        memUser.appliedCouponCode = "";
      }

      return res.status(201).json({ success: true, order: freshMemOrder });
    }
  } catch (err: any) {
    console.error("Cart checkout execution error:", err);
    return res.status(500).json({ error: "Failed to place your order: " + err.message });
  }
});

// 11. Custom Razorpay Intent for complete Cart total sum
app.post("/api/orders/checkout-intent", async (req, res) => {
  try {
    const { totalAmount } = req.body;
    if (!totalAmount || Number(totalAmount) <= 0) {
      return res.status(400).json({ error: "Invalid payment total amount." });
    }

    const rzp = getRazorpay();
    const paiseAmount = Math.round(Number(totalAmount) * 100);

    if (!rzp) {
      const simulatedOrderId = "order_sim_" + Math.random().toString(36).substring(2, 10).toUpperCase();
      return res.json({
        success: true,
        order_id: simulatedOrderId,
        amount: paiseAmount,
        currency: "INR",
        isDemo: true,
        keyId: "rzp_test_demokey_12345"
      });
    }

    const opt = {
      amount: paiseAmount,
      currency: "INR",
      receipt: `rec_cart_${Math.random().toString(36).substring(2, 7)}`
    };

    const externalOrder = await rzp.orders.create(opt);
    return res.json({
      success: true,
      order_id: externalOrder.id,
      amount: externalOrder.amount,
      currency: externalOrder.currency,
      isDemo: false,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (err: any) {
    console.error("Cart dynamic checkout order process failure:", err);
    return res.status(500).json({ error: "Payment checkout initialization failed: " + err.message });
  }
});

// 12. Retrieval of past orders placed by currently authenticated customer
app.get("/api/orders/my-orders", async (req, res) => {
  try {
    const activeSession = getCurrentUser(req);
    if (!activeSession) {
      return res.status(401).json({ error: "Please log in to retrieve your past orders catalog." });
    }

    if (mongooseConnected) {
      const clientOrders = await Order.find({ email: activeSession.email }).sort({ orderDate: -1 });
      return res.json({ orders: clientOrders });
    } else {
      const clientOrders = memoryOrders
        .filter(o => o.email.toLowerCase() === activeSession.email.toLowerCase())
        .map(o => ({
          ...o,
          orderDate: o.orderDate // preserved Date
        }));
      return res.json({ orders: clientOrders });
    }
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to retrieve past orders: " + err.message });
  }
});

// 13. Audit all placed orders (Secure Administrative Only)
app.get("/api/admin/orders", verifyAdmin, async (req, res) => {
  try {
    if (mongooseConnected) {
      const allOrders = await Order.find({}).sort({ orderDate: -1 });
      return res.json({ orders: allOrders });
    } else {
      return res.json({ orders: memoryOrders });
    }
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to read orders record: " + err.message });
  }
});

// 14. GET and POST category routes
app.get("/api/categories", async (req, res) => {
  try {
    if (mongooseConnected) {
      const cats = await Category.find({});
      return res.json({ categories: cats.map((c: any) => c.name) });
    } else {
      return res.json({ categories: memoryCategories });
    }
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to retrieve categories: " + err.message });
  }
});

app.post("/api/admin/categories", verifyAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({ error: "Category name is required." });
    }
    const cleanName = name.trim();
    if (mongooseConnected) {
      const existing = await Category.findOne({ name: cleanName });
      if (existing) {
        return res.status(400).json({ error: "Category name already exists." });
      }
      const newCat = new Category({ name: cleanName });
      await newCat.save();
      return res.status(201).json({ success: true, category: cleanName });
    } else {
      const existing = memoryCategories.find(c => c.toLowerCase() === cleanName.toLowerCase());
      if (existing) {
        return res.status(400).json({ error: "Category already exists in memory." });
      }
      memoryCategories.push(cleanName);
      return res.status(201).json({ success: true, category: cleanName });
    }
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to create category: " + err.message });
  }
});

// 15. Coupon admin and checkouts routes
app.get("/api/admin/coupons", verifyAdmin, async (req, res) => {
  try {
    if (mongooseConnected) {
      const allCoupons = await Coupon.find({});
      return res.json({ coupons: allCoupons });
    } else {
      return res.json({ coupons: memoryCoupons });
    }
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to read coupons list." });
  }
});

app.post("/api/admin/coupons", verifyAdmin, async (req, res) => {
  try {
    const { code, discountPercent, appliesToDelivery } = req.body;
    if (!code || isNaN(Number(discountPercent)) || Number(discountPercent) <= 0) {
      return res.status(400).json({ error: "Code and discountPercent must be a valid number higher than zero." });
    }
    const cleanCode = code.trim().toUpperCase();
    const percentNum = Math.min(100, Math.max(1, Number(discountPercent)));
    const deliveryBool = !!appliesToDelivery;

    if (mongooseConnected) {
      const existing = await Coupon.findOne({ code: cleanCode });
      if (existing) {
        return res.status(400).json({ error: `Coupon code '${cleanCode}' already exists.` });
      }
      const newCoupon = new Coupon({
        code: cleanCode,
        discountPercent: percentNum,
        appliesToDelivery: deliveryBool,
        isActive: true
      });
      await newCoupon.save();
      return res.status(201).json({ success: true, coupon: newCoupon });
    } else {
      const existing = memoryCoupons.find(c => c.code === cleanCode);
      if (existing) {
        return res.status(400).json({ error: `Coupon code '${cleanCode}' already exists in memory.` });
      }
      const newCoupon = {
        _id: "coupon_" + Math.random().toString(36).substr(2, 9),
        code: cleanCode,
        discountPercent: percentNum,
        appliesToDelivery: deliveryBool,
        isActive: true
      };
      memoryCoupons.push(newCoupon);
      return res.status(201).json({ success: true, coupon: newCoupon });
    }
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to save coupon code: " + err.message });
  }
});

app.delete("/api/admin/coupons/:id", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (mongooseConnected) {
      const deletedCoupon = await Coupon.findByIdAndDelete(id);
      if (!deletedCoupon) {
        return res.status(404).json({ error: "Coupon not found." });
      }
      return res.json({ success: true, message: "Coupon deleted successfully." });
    } else {
      const idx = memoryCoupons.findIndex(c => c._id === id);
      if (idx === -1) {
        return res.status(404).json({ error: "Coupon not found in memory database." });
      }
      memoryCoupons.splice(idx, 1);
      return res.json({ success: true, message: "Coupon deleted successfully from memory." });
    }
  } catch (err: any) {
    console.error("Admin coupon deletion failure:", err);
    return res.status(500).json({ error: "System failure deleting coupon: " + err.message });
  }
});

app.post("/api/apply-coupon", async (req, res) => {
  try {
    const { code } = req.body;
    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "Coupon code is required." });
    }
    const cleanCode = code.trim().toUpperCase();

    if (mongooseConnected) {
      const couponObj = await Coupon.findOne({ code: cleanCode, isActive: true });
      if (!couponObj) {
        return res.status(404).json({ error: "Coupon code is invalid or has expired." });
      }
      return res.json({ coupon: couponObj });
    } else {
      const couponObj = memoryCoupons.find(c => c.code === cleanCode && c.isActive);
      if (!couponObj) {
        return res.status(404).json({ error: "Coupon code is invalid or has expired in memory." });
      }
      return res.json({ coupon: couponObj });
    }
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to validate coupon rate: " + err.message });
  }
});

// 16. Admin change and save orders remark value
app.put("/api/admin/orders/:id/remark", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { remark } = req.body;

    const validRemarks = ["Yet to Confirm", "Confirmed", "Shipped", "Delivered", "Failed"];
    if (!remark || !validRemarks.includes(remark)) {
      return res.status(400).json({ error: "Invalid remark. Must be one of: Confirmed, Shipped, Delivered, Yet to Confirm, Failed" });
    }

    if (mongooseConnected) {
      const updatedOrder = await Order.findByIdAndUpdate(
        id,
        { remark },
        { new: true }
      );
      if (!updatedOrder) {
        return res.status(404).json({ error: "Order not found." });
      }
      return res.json({ success: true, order: updatedOrder });
    } else {
      const oIdx = memoryOrders.findIndex(o => o._id === id);
      if (oIdx === -1) {
        return res.status(404).json({ error: "Order not found in memory registry." });
      }
      memoryOrders[oIdx].remark = remark;
      return res.json({ success: true, order: memoryOrders[oIdx] });
    }
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to update order remark status: " + err.message });
  }
});

// Sitemap dynamic generator endpoint for search engines and SEO
app.get("/sitemap.xml", (req, res) => {
  const host = req.get("host") || "localhost:3000";
  const protocol = req.headers["x-forwarded-proto"] || (req.secure ? "https" : "http");
  const baseUrl = `${protocol}://${host}`;
  const currentIsoDate = new Date().toISOString().split("T")[0];

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${currentIsoDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/login</loc>
    <lastmod>${currentIsoDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/cart</loc>
    <lastmod>${currentIsoDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/my-orders</loc>
    <lastmod>${currentIsoDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>`;

  res.header("Content-Type", "application/xml");
  res.status(200).send(xmlContent);
});

// robots.txt configuration to link to the XML sitemap and configure crawling parameters
app.get("/robots.txt", (req, res) => {
  const host = req.get("host") || "localhost:3000";
  const protocol = req.headers["x-forwarded-proto"] || (req.secure ? "https" : "http");
  const baseUrl = `${protocol}://${host}`;

  const robotsContent = `User-agent: *
Allow: /
Disallow: /admin/dashboard

Sitemap: ${baseUrl}/sitemap.xml`;

  res.header("Content-Type", "text/plain");
  res.status(200).send(robotsContent);
});

// ----------------------------------------------------
// Render Keep-Alive / Heartbeat Daemon to prevent sleep
// ----------------------------------------------------
let capturedPublicUrl: string | null = null;
let selfPingIntervalStarted = false;

function startSelfPingDaemon(url: string) {
  if (selfPingIntervalStarted) return;
  selfPingIntervalStarted = true;
  console.log(`[SELF-PING] Render Keep-Alive daemon energized! Target URL: ${url}`);

  // Immediate ping check
  fetch(`${url}/api/health?self_ping=bootstrap`)
    .then((res) => console.log(`[SELF-PING] Initialization check sent to ${url} (Status: ${res.status})`))
    .catch((err) => console.warn(`[SELF-PING] Initial handshake error (expected if server warming up):`, err.message));

  // Run every 25 seconds to beat Render's activity timeout window
  setInterval(async () => {
    try {
      const pingUrl = `${url}/api/health?self_ping=${Date.now()}`;
      const res = await fetch(pingUrl, {
        headers: {
          "User-Agent": "AuraKeepAliveDaemon/2.0",
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        }
      });
      console.log(`[SELF-PING] Keep-alive request completed. Status: ${res.status}`);
    } catch (err: any) {
      console.warn(`[SELF-PING] Keep-alive request failed: ${err.message}`);
    }
  }, 25000);
}

// Global middleware to capture external production domain dynamically on first user access
app.use((req, res, next) => {
  if (!capturedPublicUrl) {
    const host = req.get("host");
    if (host && !host.includes("localhost") && !host.includes("127.0.0.1") && !host.includes("0.0.0.0")) {
      const protocol = req.headers["x-forwarded-proto"] || (req.secure ? "https" : "http");
      capturedPublicUrl = `${protocol}://${host}`;
      startSelfPingDaemon(capturedPublicUrl);
    }
  }
  next();
});

// Serve frontend application static site compiled files
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Inject Vite development hot server compilation middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    // Host production built static pages
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SYSTEM RUNTIME] Aura Candle Express server fully energized on http://localhost:${PORT}`);

    // If Render automatically exposes the external URL as an environment variable, use it right away!
    if (process.env.RENDER_EXTERNAL_URL) {
      capturedPublicUrl = process.env.RENDER_EXTERNAL_URL;
      startSelfPingDaemon(capturedPublicUrl);
    }
  });
}

startServer();
