const express = require('express');
const router = express.Router();
const { nigerianCourts, caseTypes } = require('../config/courts');

router.get('/', (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        courts: nigerianCourts,
        count: nigerianCourts.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/types', (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        caseTypes,
        count: caseTypes.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/:code', (req, res) => {
  try {
    const court = nigerianCourts.find(
      c => c.code.toLowerCase() === req.params.code.toLowerCase()
    );

    if (!court) {
      return res.status(404).json({
        success: false,
        message: 'Court not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { court }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
