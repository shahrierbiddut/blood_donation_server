// db.js
const mongoose = require("mongoose");
const dns = require("node:dns");
require("dotenv").config();

const connectDB = async () => {
  try {
    const dnsServers = (process.env.DNS_SERVERS || "8.8.8.8,1.1.1.1")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (dnsServers.length > 0) {
      dns.setServers(dnsServers);
      console.log("DNS:", dnsServers.join(", "));
    }

    mongoose.set("strictQuery", true);
    mongoose.set("sanitizeFilter", true);

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 45000
    });

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
