const mongoose = require("mongoose");
const dns = require("node:dns");
require("dotenv").config();

const User = require("../models/User");
const DonationRequest = require("../models/DonationRequest");

const mockUsers = [
  { id: "u1", name: "Rahim Ahmed", email: "rahim@gmail.com", phone: "01711-456789", bloodGroup: "A+", role: "admin", status: "active", division: "Dhaka", district: "Dhaka", upazila: "Dhanmondi", union: "Dhanmondi", address: "Dhanmondi, Dhaka", avatar: "https://i.pravatar.cc/120?img=12", totalDonations: 12, lastDonation: "2024-05-20" },
  { id: "u2", name: "Sadia Islam", email: "sadia@gmail.com", phone: "01822-345678", bloodGroup: "O+", role: "volunteer", status: "active", division: "Dhaka", district: "Dhaka", upazila: "Mirpur", union: "Mirpur", address: "Mirpur, Dhaka", avatar: "https://i.pravatar.cc/120?img=47", totalDonations: 8, lastDonation: "2024-05-18" },
  { id: "u3", name: "Tanvir Hasan", email: "tanvir@gmail.com", phone: "01933-567890", bloodGroup: "B+", role: "donor", status: "active", division: "Dhaka", district: "Dhaka", upazila: "Dhanmondi", union: "Dhanmondi", address: "Dhanmondi, Dhaka", avatar: "https://i.pravatar.cc/120?img=15", totalDonations: 5, lastDonation: "2024-05-15" },
  { id: "u4", name: "Hasan Mahmud", email: "hasan@gmail.com", phone: "01644-678901", bloodGroup: "AB-", role: "donor", status: "blocked", division: "Chattogram", district: "Chattogram", upazila: "Patenga", union: "Patenga", address: "Patenga, Chattogram", avatar: "https://i.pravatar.cc/120?img=33", totalDonations: 3, lastDonation: "2024-05-10" },
  { id: "u5", name: "Nusrat Jahan", email: "nusrat@gmail.com", phone: "01755-789012", bloodGroup: "AB+", role: "volunteer", status: "active", division: "Dhaka", district: "Dhaka", upazila: "Badda", union: "Badda", address: "Badda, Dhaka", avatar: "https://i.pravatar.cc/120?img=35", totalDonations: 6, lastDonation: "2024-05-12" },
  { id: "u6", name: "Fatima Khan", email: "fatima@gmail.com", phone: "01866-890123", bloodGroup: "O-", role: "donor", status: "active", division: "Khulna", district: "Khulna", upazila: "Boyra", union: "Boyra", address: "Boyra, Khulna", avatar: "https://i.pravatar.cc/120?img=5", totalDonations: 9, lastDonation: "2024-05-19" },
  { id: "u7", name: "Mohammad Ali", email: "ali@gmail.com", phone: "01977-901234", bloodGroup: "A-", role: "donor", status: "active", division: "Dhaka", district: "Dhaka", upazila: "Tejgaon", union: "Tejgaon", address: "Tejgaon, Dhaka", avatar: "https://i.pravatar.cc/120?img=11", totalDonations: 15, lastDonation: "2024-05-21" },
  { id: "u8", name: "Jasmine Begum", email: "jasmine@gmail.com", phone: "01688-012345", bloodGroup: "B-", role: "volunteer", status: "active", division: "Sylhet", district: "Sylhet", upazila: "Sadar", union: "Sadar", address: "Sadar, Sylhet", avatar: "https://i.pravatar.cc/120?img=26", totalDonations: 4, lastDonation: "2024-05-14" },
  { id: "u9", name: "Rahman Khan", email: "rahman@gmail.com", phone: "01799-123456", bloodGroup: "A+", role: "donor", status: "blocked", division: "Dhaka", district: "Dhaka", upazila: "Rampura", union: "Rampura", address: "Rampura, Dhaka", avatar: "https://i.pravatar.cc/120?img=52", totalDonations: 7, lastDonation: "2024-05-17" },
  { id: "u10", name: "Sophia Ahmed", email: "sophia@gmail.com", phone: "01810-234567", bloodGroup: "O+", role: "donor", status: "active", division: "Rajshahi", district: "Rajshahi", upazila: "Boalia", union: "Boalia", address: "Boalia, Rajshahi", avatar: "https://i.pravatar.cc/120?img=44", totalDonations: 11, lastDonation: "2024-05-19" },
  { id: "u11", name: "Karim Hassan", email: "karim@gmail.com", phone: "01921-345678", bloodGroup: "B+", role: "donor", status: "active", division: "Dhaka", district: "Dhaka", upazila: "Banani", union: "Banani", address: "Banani, Dhaka", avatar: "https://i.pravatar.cc/120?img=20", totalDonations: 10, lastDonation: "2024-05-16" },
  { id: "u12", name: "Layla Omar", email: "layla@gmail.com", phone: "01632-456789", bloodGroup: "AB+", role: "volunteer", status: "active", division: "Dhaka", district: "Dhaka", upazila: "Gulshan", union: "Gulshan", address: "Gulshan, Dhaka", avatar: "https://i.pravatar.cc/120?img=49", totalDonations: 8, lastDonation: "2024-05-18" },
];

const mockRequests = [
  { recipientName: "Rahim Ahmed", bloodGroup: "A+", district: "Dhaka", upazila: "Dhanmondi", hospital: "Square Hospital", donationDate: "2026-06-20", donationTime: "10:00", message: "Emergency surgery scheduled in the morning. One bag is required before operation.", requesterEmail: "rahim@gmail.com" },
  { recipientName: "Sadia Islam", bloodGroup: "O+", district: "Chattogram", upazila: "Pahartali", hospital: "Chattogram Medical College Hospital", donationDate: "2026-06-21", donationTime: "11:30", message: "Dengue patient needs platelet support. Donor has been contacted.", requesterEmail: "sadia@gmail.com" },
  { recipientName: "Hasan Mahmud", bloodGroup: "B+", district: "Khulna", upazila: "Bagerhat", hospital: "Khulna City Medical", donationDate: "2026-06-22", donationTime: "14:00", message: "Post-operative patient support completed successfully.", requesterEmail: "tanvir@gmail.com" },
  { recipientName: "Nusrat Jahan", bloodGroup: "AB-", district: "Rajshahi", upazila: "Boalia", hospital: "Rajshahi Medical College Hospital", donationDate: "2026-06-23", donationTime: "09:45", message: "Request cancelled after blood was arranged from family donor.", requesterEmail: "nusrat@gmail.com" },
  { recipientName: "Jasmine Begum", bloodGroup: "B-", district: "Mymensingh", upazila: "Fulbaria", hospital: "Mymensingh Medical College Hospital", donationDate: "2026-06-27", donationTime: "16:45", message: "One bag delivered for ICU support.", requesterEmail: "jasmine@gmail.com" },
];

const seedData = async () => {
  let isConnected = false;
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI not found in .env file");
    }

    const dnsServers = (process.env.DNS_SERVERS || "8.8.8.8,1.1.1.1")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (dnsServers.length > 0) {
      dns.setServers(dnsServers);
      console.log("DNS:", dnsServers.join(", "));
    }

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 45000
    });
    isConnected = true;
    console.log("✅ Connected to MongoDB");

    // Confirm before clearing
    console.log("\n⚠️  This script will clear existing Users and DonationRequests collections");
    console.log("📋 Proceeding to seed mock data...\n");

    // Clear existing data
    await User.deleteMany({});
    console.log("🗑️  Cleared Users collection");

    await DonationRequest.deleteMany({});
    console.log("🗑️  Cleared DonationRequests collection");

    // Seed Users
    const seededUsers = [];
    for (const mockUser of mockUsers) {
      const user = new User({
        name: mockUser.name,
        email: mockUser.email,
        password: "Test@12345", // Default password for all seed users
        phone: mockUser.phone,
        bloodGroup: mockUser.bloodGroup,
        division: mockUser.division,
        district: mockUser.district,
        upazila: mockUser.upazila,
        union: mockUser.union,
        address: mockUser.address,
        avatar: mockUser.avatar,
        role: mockUser.role,
        status: mockUser.status,
        isAdmin: mockUser.role === "admin",
        isVolunteer: mockUser.role === "volunteer",
        isDonor: mockUser.role === "donor" || mockUser.role === "volunteer",
        totalDonations: mockUser.totalDonations,
        lastDonationDate: mockUser.lastDonation ? new Date(mockUser.lastDonation) : null,
        emailVerified: true
      });

      await user.save();
      seededUsers.push(user);
    }
    console.log(`✅ Seeded ${seededUsers.length} users`);

    // Seed Donation Requests
    let requestCount = 0;
    for (const mockRequest of mockRequests) {
      // Find requester by email
      const requester = seededUsers.find(u => u.email === mockRequest.requesterEmail);
      if (!requester) {
        console.log(`⚠️  Requester not found for ${mockRequest.requesterEmail}, skipping request`);
        continue;
      }

      const donationRequest = new DonationRequest({
        requester: requester._id,
        recipientName: mockRequest.recipientName,
        district: mockRequest.district,
        upazila: mockRequest.upazila,
        hospitalName: mockRequest.hospital,
        bloodGroup: mockRequest.bloodGroup,
        donationDate: new Date(mockRequest.donationDate),
        donationTime: mockRequest.donationTime,
        requestMessage: mockRequest.message,
        status: "pending"
      });

      await donationRequest.save();
      requestCount++;
    }
    console.log(`✅ Seeded ${requestCount} donation requests`);

    console.log("\n✨ Seed completed successfully!");
    console.log("📊 Summary:");
    console.log(`  • Users: ${seededUsers.length}`);
    console.log(`  • Donation Requests: ${requestCount}`);
    console.log("\n🔑 Default credentials for all seed users:");
    console.log("  • Password: Test@12345");
    console.log("\n📧 Sample emails:");
    seededUsers.slice(0, 3).forEach(user => {
      console.log(`  • ${user.email} (${user.role})`);
    });

    if (isConnected) {
      await mongoose.connection.close();
    }
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding data:", error.message);
    if (error.message.includes("querySrv ECONNREFUSED")) {
      console.error("Hint: DNS could not resolve MongoDB SRV record. Check network DNS, VPN/firewall, or Atlas access settings.");
    }
    if (isConnected) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

seedData();