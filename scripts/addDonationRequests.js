const mongoose = require("mongoose");
const dns = require("node:dns");
require("dotenv").config();

const User = require("../models/User");
const DonationRequest = require("../models/DonationRequest");

const requests = [
  {
    recipientName: "Mariam Hasan",
    bloodGroup: "O+",
    district: "Chattogram",
    upazila: "Agrabad",
    hospitalName: "Chattogram Medical",
    donationDate: "2026-06-26",
    donationTime: "14:00",
    requestMessage: "Urgent requirement for dengue patient."
  },
  {
    recipientName: "Ayesha Rahman",
    bloodGroup: "A-",
    district: "Dhaka",
    upazila: "Mirpur",
    hospitalName: "National Heart Foundation",
    donationDate: "2026-06-27",
    donationTime: "09:30",
    requestMessage: "Cardiac patient needs blood before scheduled procedure."
  },
  {
    recipientName: "Fahim Chowdhury",
    bloodGroup: "B+",
    district: "Sylhet",
    upazila: "Sadar",
    hospitalName: "Sylhet MAG Osmani Medical",
    donationDate: "2026-06-28",
    donationTime: "12:15",
    requestMessage: "One bag needed for emergency surgery support."
  },
  {
    recipientName: "Nabila Islam",
    bloodGroup: "AB+",
    district: "Rajshahi",
    upazila: "Boalia",
    hospitalName: "Rajshahi Medical College Hospital",
    donationDate: "2026-06-29",
    donationTime: "15:45",
    requestMessage: "Patient admitted in ICU, donor needed today."
  },
  {
    recipientName: "Tanzim Ahmed",
    bloodGroup: "O-",
    district: "Khulna",
    upazila: "Sonadanga",
    hospitalName: "Khulna Medical College Hospital",
    donationDate: "2026-06-30",
    donationTime: "10:30",
    requestMessage: "Rare blood group required for accident patient."
  },
  {
    recipientName: "Samira Akter",
    bloodGroup: "A+",
    district: "Barishal",
    upazila: "Sadar",
    hospitalName: "Sher-E-Bangla Medical College",
    donationDate: "2026-07-01",
    donationTime: "13:00",
    requestMessage: "Blood needed before maternity operation."
  },
  {
    recipientName: "Rafiq Uddin",
    bloodGroup: "B-",
    district: "Rangpur",
    upazila: "Sadar",
    hospitalName: "Rangpur Medical College Hospital",
    donationDate: "2026-07-02",
    donationTime: "11:00",
    requestMessage: "Thalassemia patient needs urgent support."
  },
  {
    recipientName: "Jannatul Ferdous",
    bloodGroup: "AB-",
    district: "Mymensingh",
    upazila: "Sadar",
    hospitalName: "Mymensingh Medical College Hospital",
    donationDate: "2026-07-03",
    donationTime: "16:20",
    requestMessage: "Emergency blood request for post-operative care."
  }
];

const connect = async () => {
  const dnsServers = (process.env.DNS_SERVERS || "8.8.8.8,1.1.1.1")
    .split(",")
    .map((server) => server.trim())
    .filter(Boolean);

  if (dnsServers.length) {
    dns.setServers(dnsServers);
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
    socketTimeoutMS: 45000
  });
};

const ensureRequester = async () => {
  const existingUser = await User.findOne({ status: "active" }).sort({ createdAt: 1 });
  if (existingUser) return existingUser;

  return User.create({
    name: "BloodLife Request Desk",
    email: "requestdesk@bloodlife.test",
    password: "Test@12345",
    phone: "01700-000001",
    bloodGroup: "O+",
    division: "Dhaka",
    district: "Dhaka",
    upazila: "Dhanmondi",
    union: "Dhanmondi",
    address: "Dhaka",
    role: "donor",
    status: "active",
    isDonor: true,
    emailVerified: true
  });
};

const run = async () => {
  try {
    await connect();
    const requester = await ensureRequester();
    let created = 0;
    let skipped = 0;

    for (const item of requests) {
      const exists = await DonationRequest.exists({
        recipientName: item.recipientName,
        hospitalName: item.hospitalName,
        donationDate: new Date(item.donationDate)
      });

      if (exists) {
        skipped++;
        continue;
      }

      await DonationRequest.create({
        ...item,
        requester: requester._id,
        donationDate: new Date(item.donationDate),
        status: "pending"
      });
      created++;
    }

    console.log(`Added ${created} donation requests. Skipped ${skipped} existing requests.`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error(error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

run();
