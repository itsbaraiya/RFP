// 
// App
// 

import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import path from "path";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import userRoutes from "./routes/UserRoutes";
import authRoutes from "./routes/AuthRoutes";
import dashboardRoutes from "./routes/DashboardRoutes";
import { authMiddleware } from "./middlewares/auth";
import rfpRoutes from "./routes/RfpRoutes";

dotenv.config();
const app = express();

/**
 * ======================
 * SECURITY
 * ======================
 */
app.use(helmet());

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
);

/**
 * ======================
 * CORS
 * ======================
 */
const allowedOrigin = process.env.Frontend_URL || process.env.FRONTEND_URL;

// CORS configuration - allow localhost in development, configured origin in production
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true);
      }

      // In development, allow localhost
      if (process.env.NODE_ENV !== "production") {
        if (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
          return callback(null, true);
        }
      }

      // In production, check against allowed origin
      if (allowedOrigin && origin === allowedOrigin) {
        return callback(null, true);
      }

      // If no origin is configured and we're in development, allow it
      if (!allowedOrigin && process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }

      // Reject other origins
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: [],
    maxAge: 86400, // 24 hours
  })
);

/**
 * ======================
 * BODY LIMITS
 * ======================
 */
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/users", userRoutes);
app.use("/api/rfps", rfpRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.get("/", (req, res) => res.send("API is running"));

// Serve uploaded files
const uploadsPath = path.join(__dirname, "../uploads");
app.use("/api/uploads", express.static(uploadsPath, {
  setHeaders: (res, filePath) => {
    // Set proper headers for PDF files
    if (filePath.endsWith(".pdf")) {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "inline; filename=" + path.basename(filePath));
    }
  },
}));


export default app;

