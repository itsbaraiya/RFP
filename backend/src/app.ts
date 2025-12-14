import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import path from "path";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import userRoutes from "./routes/UserRoutes";
import authRoutes from "./routes/AuthRoutes";
import dashboardRoutes from "./routes/DashboardRoutes";
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
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
  })
);

/**
 * ======================
 * BODY PARSERS
 * ======================
 */
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

/**
 * ======================
 * CORS + UPLOADS
 * ======================
 */
const allowedOrigin = process.env.Frontend_URL;
app.use(
  "/api/uploads",
  cors({
    origin: allowedOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
  express.static(path.join(__dirname, "../uploads"))
);

/**
 * ======================
 * ROUTES
 * ======================
 */
app.use("/api/users", userRoutes);
app.use("/api/rfps", rfpRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/", (req, res) => res.send("API is running"));

export default app;
