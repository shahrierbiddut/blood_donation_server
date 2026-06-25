// server/controllers/fundingController.js
const Funding = require("../models/Funding");

const getFundingHistory = async (req, res) => {
  try {
    const fundings = await Funding.find()
      .sort({ createdAt: -1 })
      .select("name amount currency campaign message anonymous paymentMethod status transactionId createdAt")
      .lean();

    return res.status(200).json({
      success: true,
      data: fundings
    });
  } catch (error) {
    console.error("Error fetching funding history:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch funding history",
      data: null
    });
  }
};

const getFundingTotal = async (req, res) => {
  try {
    const totalResult = await Funding.aggregate([
      { $group: { _id: null, totalCents: { $sum: "$amount" } } }
    ]);

    const totalCents = totalResult[0]?.totalCents || 0;

    return res.status(200).json({
      success: true,
      data: {
        totalCents,
        totalAmount: totalCents / 100
      }
    });
  } catch (error) {
    console.error("Error fetching funding total:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to calculate total funds",
      data: null
    });
  }
};

module.exports = {
  getFundingHistory,
  getFundingTotal
};
