const express = require('express');
const router = express.Router();
const { getLGAsByState, getAllLGAsWithStates, getTotalLGACount } = require('../config/lgas');

// @route   GET /api/lgas
// @desc    Get all LGAs
// @access  Public
router.get('/', (req, res) => {
  try {
    const allLGAs = getAllLGAsWithStates();
    const totalCount = getTotalLGACount();

    res.json({
      success: true,
      count: totalCount,
      data: {
        lgas: allLGAs
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/lgas/state/:stateCode
// @desc    Get LGAs by state code
// @access  Public
router.get('/state/:stateCode', (req, res) => {
  try {
    const { stateCode } = req.params;
    const lgas = getLGAsByState(stateCode.toUpperCase());

    if (!lgas || lgas.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No LGAs found for this state code'
      });
    }

    res.json({
      success: true,
      count: lgas.length,
      data: {
        stateCode: stateCode.toUpperCase(),
        lgas
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/lgas/count
// @desc    Get total count of LGAs
// @access  Public
router.get('/count', (req, res) => {
  try {
    const totalCount = getTotalLGACount();

    res.json({
      success: true,
      data: {
        totalLGAs: totalCount,
        totalStates: 37
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
