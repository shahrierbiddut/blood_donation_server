// server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Root route
app.get("/", (req, res) => {
  res.send("🚀 Blood Donation Platform Server is running!");
});

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ message: "Server is healthy ✅" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

// Server listen
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await connectDB();
    console.log("✅ MongoDB connected successfully!");
    
    app.listen(PORT, () => console.log(`✅ Server started on port ${PORT}`));
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error.message);
    process.exit(1);
  }
})();
