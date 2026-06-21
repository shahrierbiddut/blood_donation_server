const express = require("express");
const router = express.Router();
const {
  getDivisions,
  getDistrictsByDivision,
  getUpazilasByDistrict,
  getUnionsByUpazila
} = require("../controllers/locationController");

router.get("/divisions", getDivisions);
router.get("/districts/:divisionId", getDistrictsByDivision);
router.get("/upazilas/:districtId", getUpazilasByDistrict);
router.get("/unions/:upazilaId", getUnionsByUpazila);

module.exports = router;
