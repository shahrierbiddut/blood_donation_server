// server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");

const app = express();

// ==================== CORS Configuration ====================
const corsOptions = {
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
  maxAge: 86400 // 24 hours
};

// ==================== Middleware ====================
app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ==================== API Routes ====================
// Auth routes ✅
app.use("/api/auth", require("./routes/auth"));
// Location routes ✅
app.use("/api/location", require("./routes/location"));
// Donation request routes ✅
app.use("/api/donations", require("./routes/donations"));

// User routes (will be created in Phase 2)
// app.use("/api/users", require("./routes/users"));

// Donation routes (will be created in Phase 5)
// app.use("/api/donations", require("./routes/donations"));

// Search routes (will be created in Phase 9)
// app.use("/api/search", require("./routes/search"));

// Funding routes (will be created in Phase 8)
// app.use("/api/funding", require("./routes/funding"));

// Admin routes (will be created in Phase 7)
// app.use("/api/admin", require("./routes/admin"));

// ==================== Health Check Routes ====================
app.get("/", (req, res) => {
  res.json({ 
    message: "🚀 Blood Donation Platform Server is running!",
    version: "1.0.0",
    environment: process.env.NODE_ENV
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "healthy ✅",
    timestamp: new Date().toISOString()
  });
});

// ==================== 404 Not Found Middleware ====================
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: "Route not found",
    path: req.path
  });
});

// ==================== Global Error Handling Middleware ====================
app.use((err, req, res, next) => {
  console.error("❌ Error:", err);
  
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || "Internal server error";
  
  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
});

// ==================== Server Startup ====================
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await connectDB();
    console.log("✅ MongoDB connected successfully!");
    
    app.listen(PORT, () => {
      console.log(`✅ Server started on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Base URL: ${process.env.APP_URL}`);
    });
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error.message);
    process.exit(1);
  }
})();
