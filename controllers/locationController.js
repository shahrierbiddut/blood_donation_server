const divisionData = require("../data/division.json");
const districtData = require("../data/district.json");
const upazilaData = require("../data/upazila.json");
const unionData = require("../data/unions.json");

const extractTableRows = (dataset) => {
  const table = dataset.find((item) => item.type === "table" && Array.isArray(item.data));
  return table ? table.data : [];
};

const divisions = extractTableRows(divisionData);
const districts = extractTableRows(districtData);
const upazilas = extractTableRows(upazilaData);
const unions = extractTableRows(unionData);

exports.getDivisions = (req, res) => {
  res.status(200).json({
    success: true,
    data: divisions.map((item) => ({
      id: item.id,
      name: item.name,
      bn_name: item.bn_name
    }))
  });
};

exports.getDistrictsByDivision = (req, res) => {
  const { divisionId } = req.params;

  const filteredDistricts = districts
    .filter((item) => item.division_id === String(divisionId))
    .map((item) => ({
      id: item.id,
      division_id: item.division_id,
      name: item.name,
      bn_name: item.bn_name
    }));

  res.status(200).json({
    success: true,
    data: filteredDistricts
  });
};

exports.getUpazilasByDistrict = (req, res) => {
  const { districtId } = req.params;

  const filteredUpazilas = upazilas
    .filter((item) => item.district_id === String(districtId))
    .map((item) => ({
      id: item.id,
      district_id: item.district_id,
      name: item.name,
      bn_name: item.bn_name
    }));

  res.status(200).json({
    success: true,
    data: filteredUpazilas
  });
};

exports.getUnionsByUpazila = (req, res) => {
  const { upazilaId } = req.params;

  const filteredUnions = unions
    .filter((item) => item.upazilla_id === String(upazilaId))
    .map((item) => ({
      id: item.id,
      upazilla_id: item.upazilla_id,
      name: item.name,
      bn_name: item.bn_name
    }));

  res.status(200).json({
    success: true,
    data: filteredUnions
  });
};
