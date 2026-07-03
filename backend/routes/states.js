const express = require('express');
const router = express.Router();
const nigerianStates = require('../config/states');

router.get('/', (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        states: nigerianStates,
        count: nigerianStates.length
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
    const state = nigerianStates.find(
      s => s.code.toLowerCase() === req.params.code.toLowerCase() ||
           s.name.toLowerCase() === req.params.code.toLowerCase()
    );

    if (!state) {
      return res.status(404).json({
        success: false,
        message: 'State not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { state }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/zone/:zone', (req, res) => {
  try {
    const states = nigerianStates.filter(
      s => s.zone.toLowerCase() === req.params.zone.toLowerCase()
    );

    if (states.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No states found in this zone'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        zone: req.params.zone,
        states,
        count: states.length
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
