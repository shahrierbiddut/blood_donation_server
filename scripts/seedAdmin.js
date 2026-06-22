const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("../models/User");

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI not found in .env file");
    }
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: "admin123@gmail.com" });
    if (existingAdmin) {
      console.log("⚠️  Admin user already exists!");
      await mongoose.connection.close();
      return;
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

    // Save to database (password will be hashed by the pre-save hook)
    await adminUser.save();
    console.log("✅ Admin user created successfully!");
    console.log("📧 Email: admin123@gmail.com");
    console.log("🔐 Password: Admin@12345");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding admin:", error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedAdmin();
