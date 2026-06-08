const DiseaseScan = require('../models/disease-scan.model');

// @desc    Get all scans with pagination, filtering, and sorting
// @route   GET /api/analytics/scans
// @access  Public
const getPublicScans = async (req, res) => {
  // 1. Pagination setup (Page and Limit)
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  // 2. Filtering
  const filter = {};
  // لو الفرونت إند باعت اسم محافظة أو مرض في اللينك، هنفلتر بيهم
  if (req.query.governorate) filter.governorate = req.query.governorate;
  if (req.query.diseaseName) filter.diseaseName = req.query.diseaseName;

  // 3. Sorting
  let sortObj = { createdAt: -1 }; // الافتراضي: الأحدث أولاً
  if (req.query.sortBy === 'governorate') {
    sortObj = { governorate: 1, createdAt: -1 };
  } else if (req.query.sortBy === 'disease') {
    sortObj = { diseaseName: 1, createdAt: -1 };
  }

  // 4. Execute Query
  const total = await DiseaseScan.countDocuments(filter);
  const scans = await DiseaseScan.find(filter)
    .sort(sortObj)
    .skip(skip)
    .limit(limit)
    .select('-user') // إخفاء الـ ID بتاع اليوزر للخصوصية
    .lean();

  res.status(200).json({
    success: true,
    pagination: {
      totalItems: total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      limit,
    },
    data: scans,
  });
};

// @desc    Get disease distribution by governorate
// @route   GET /api/analytics/distribution/governorate
// @access  Public
const getDistributionByGovernorate = async (req, res) => {
  const distribution = await DiseaseScan.aggregate([
    {
      // الخطوة الأولى: تجميع الحالات بالمحافظة واسم المرض
      $group: {
        _id: { governorate: '$governorate', disease: '$diseaseName' },
        count: { $sum: 1 },
      },
    },
    {
      // الخطوة التانية: تجميع كل الأمراض جوه المحافظة الواحدة
      $group: {
        _id: '$_id.governorate',
        diseases: {
          $push: {
            diseaseName: '$_id.disease',
            casesCount: '$count',
          },
        },
        totalScansInGovernorate: { $sum: '$count' },
      },
    },
    {
      // الترتيب: المحافظات اللي فيها فحوصات أكتر تظهر الأول
      $sort: { totalScansInGovernorate: -1 },
    },
  ]);

  res.status(200).json({
    success: true,
    count: distribution.length,
    data: distribution,
  });
};

// @desc    Get governorate distribution by disease
// @route   GET /api/analytics/distribution/disease
// @access  Public
const getDistributionByDisease = async (req, res) => {
  const distribution = await DiseaseScan.aggregate([
    {
      // الخطوة الأولى: تجميع الحالات باسم المرض والمحافظة
      $group: {
        _id: { disease: '$diseaseName', governorate: '$governorate' },
        count: { $sum: 1 },
      },
    },
    {
      // الخطوة التانية: تجميع كل المحافظات جوه المرض الواحد
      $group: {
        _id: '$_id.disease',
        governorates: {
          $push: {
            governorateName: '$_id.governorate',
            casesCount: '$count',
          },
        },
        totalCasesOfDisease: { $sum: '$count' },
      },
    },
    {
      // الترتيب: المرض الأكثر انتشاراً يظهر الأول
      $sort: { totalCasesOfDisease: -1 },
    },
  ]);

  res.status(200).json({
    success: true,
    count: distribution.length,
    data: distribution,
  });
};

module.exports = {
  getPublicScans,
  getDistributionByGovernorate,
  getDistributionByDisease,
};