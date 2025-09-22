// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import { v2 as cloudinary } from "cloudinary";
import { EventEmitter } from "events";

// Routes
import productRoutes from "./routes/products.js";
import orderRoutes from "./routes/orders.js";
import paystackRouter from "./routes/paystack.js";
import bundleRoutes from "./routes/bundleRoutes.js";
import inventoryRoutes from "./routes/inventory.js";
import metaRoutes from "./routes/meta.js";
import cartRoutes from "./routes/cart.js";
import shopallRoutes from "./routes/shopallRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import addressRoutes from "./routes/addressRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import reviewRouter from "./routes/reviewRouter.js";
import billingAddressRoutes from "./routes/billingAddressRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import newsletterRoutes from "./routes/newsletterRoutes.js";
import emailRoutes from "./routes/email.js";

import { cleanupOldOrders } from "./utils/cleanupOrders.js";

dotenv.config();
EventEmitter.defaultMaxListeners = 40;

const app = express();

// ==== Cloudinary Setup ====
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ==== CORS Config ====
const allowedOrigins = [
  "https://www.thetiabrand.org", // Production frontend
  "http://localhost:5173",       // Local Vite dev
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-User-Country",
      "Cache-Control",
      "Pragma",
      "x-idempotency-key",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

// ==== Middleware ====
// Raw body parser for webhooks
app.use(
  bodyParser.json({
    verify: (req, res, buf) => {
      if (req.originalUrl.startsWith("/api/webhooks")) {
        req.rawBody = buf.toString();
      }
    },
  })
);

// Standard JSON parser (for everything else)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Static uploads
app.use("/uploads", express.static("Uploads"));

// ==== Routes ====
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/paystack", paystackRouter);
app.use("/api/bundles", bundleRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/meta", metaRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/shopall", shopallRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/billing-addresses", billingAddressRoutes);
app.use("/api/reviews", reviewRouter);
app.use("/api/admin", adminRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/email", emailRoutes);

// ==== Health Checks ====
app.get("/", (req, res) => res.send("TIA Backend is running 🚀"));
app.get("/health", (req, res) =>
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() })
);
app.get("/healthz", (req, res) => res.status(200).json({ status: "ok" }));

// ==== Error Handler ====
app.use((err, req, res, next) => {
  console.error(
    `[${new Date().toISOString()}] Error in ${req.method} ${req.url}:`,
    err.stack
  );
  res.status(500).json({ error: "Something went wrong!" });
});

// ==== Cron Job ====
// cleanupOldOrders(); // runs on startup - REMOVED

// ==== Start Server ====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
