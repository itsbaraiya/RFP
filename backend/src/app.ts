// 
// App
// 

import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import path from "path";

import userRoutes from "./routes/UserRoutes";
import authRoutes from "./routes/AuthRoutes";
import dashboardRoutes from "./routes/DashboardRoutes";
import { authMiddleware } from "./middlewares/auth";
import rfpRoutes from "./routes/RfpRoutes";

dotenv.config();
const app = express();

app.use(cors({
  origin: process.env.Frontend_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/users", userRoutes);
app.use("/api/rfps", rfpRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.get("/", (req, res) => res.send("API is running"));
app.use("/api/uploads", express.static(path.join(__dirname, "../uploads")));


export default app;

