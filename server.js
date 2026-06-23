// server.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
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
app.use(helmet());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
    data: null
  }
});

app.use("/api", apiRateLimiter);

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

// User routes ✅
app.use("/api/users", require("./routes/users"));

// Donation routes (will be created in Phase 5)
// app.use("/api/donations", require("./routes/donations"));

// Search routes (will be created in Phase 9)
// app.use("/api/search", require("./routes/search"));

// Funding routes (will be created in Phase 8)
// app.use("/api/funding", require("./routes/funding"));

// Admin routes ✅
app.use("/api/admin", require("./routes/admin"));

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

// ==================== Initialize Admin User ====================
app.get("/api/init-admin", async (req, res) => {
  try {
    const User = require("./models/User");
    const bcrypt = require("bcryptjs");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: "admin123@gmail.com" });
    if (existingAdmin) {
      return res.status(200).json({
        success: true,
        message: "⚠️ Admin user already exists!",
        email: "admin123@gmail.com"
      });
    }

    // Create admin user
    const adminUser = new User({
      name: "Admin Rahim",
      email: "admin123@gmail.com",
      password: "Admin@12345", // Strong password: uppercase, lowercase, number, special char
      phone: "01700000000",
      bloodGroup: "O+",
      division: "Dhaka",
      district: "Dhaka",
      upazila: "Dhanmondi",
      union: "Banani",
      address: "Admin Office, Dhaka",
      role: "admin",
      status: "active",
      isAdmin: true,
      isDonor: false,
      emailVerified: true
    });

    await adminUser.save();
    res.status(201).json({
      success: true,
      message: "✅ Admin user created successfully!",
      user: {
        email: "admin123@gmail.com",
        password: "Admin@12345",
        role: "admin"
      }
    });
  } catch (error) {
    console.error("❌ Error initializing admin:", error.message);
    res.status(500).json({
      success: false,
      message: "Error creating admin user",
      error: error.message
    });
  }
});

// ==================== 404 Not Found Middleware ====================
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: "Route not found",
    data: {
      path: req.path
    }
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
    data: null,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
});

// ==================== Server Startup ====================
const PORT = process.env.PORT || 5000;

// Initialize admin user on startup
const initializeAdmin = async () => {
  try {
    const User = require("./models/User");
    
    const existingAdmin = await User.findOne({ email: "admin123@gmail.com" });
    if (!existingAdmin) {
      const adminUser = new User({
        name: "Admin Rahim",
        email: "admin123@gmail.com",
        password: "Admin@12345",
        phone: "01700000000",
        bloodGroup: "O+",
        division: "Dhaka",
        district: "Dhaka",
        upazila: "Dhanmondi",
        union: "Banani",
        address: "Admin Office, Dhaka",
        role: "admin",
        status: "active",
        isAdmin: true,
        isDonor: false,
        emailVerified: true
      });
      
      await adminUser.save();
      console.log("✅ Admin user initialized!");
      console.log("📧 Email: admin123@gmail.com");
      console.log("🔐 Password: Admin@12345");
    } else {
      console.log("ℹ️  Admin user already exists");
    }
  } catch (error) {
    console.error("⚠️  Error initializing admin:", error.message);
  }
};

(async () => {
  try {
    await connectDB();
    console.log("✅ MongoDB connected successfully!");
    
    // Initialize admin user
    await initializeAdmin();
    
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
