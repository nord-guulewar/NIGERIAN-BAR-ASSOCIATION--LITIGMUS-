const express = require('express');
const router = express.Router();
const Judge = require('../models/Judge');
const Case = require('../models/Case');
const { protect, authorize } = require('../middleware/auth');
const moment = require('moment');

router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      title,
      email,
      phoneNumber,
      courtType,
      state,
      specialization,
      maxDailyCases,
      appointmentDate,
      availability
    } = req.body;

    const judgeExists = await Judge.findOne({ email });
    if (judgeExists) {
      return res.status(400).json({
        success: false,
        message: 'Judge already exists with this email'
      });
    }

    const judge = await Judge.create({
      firstName,
      lastName,
      title,
      email,
      phoneNumber,
      courtType,
      state,
      specialization,
      maxDailyCases,
      appointmentDate,
      availability
    });

    res.status(201).json({
      success: true,
      message: 'Judge added successfully',
      data: { judge }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    const { courtType, state, isActive, specialization } = req.query;

    const query = {};
    if (courtType) query.courtType = courtType;
    if (state) query.state = state;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (specialization) query.specialization = specialization;

    const judges = await Judge.find(query).sort({ lastName: 1 });

    res.status(200).json({
      success: true,
      data: { judges, count: judges.length }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const judge = await Judge.findById(req.params.id);

    if (!judge) {
      return res.status(404).json({
        success: false,
        message: 'Judge not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { judge }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/:id/workload', protect, async (req, res) => {
  try {
    const judge = await Judge.findById(req.params.id);

    if (!judge) {
      return res.status(404).json({
        success: false,
        message: 'Judge not found'
      });
    }

    const today = moment().startOf('day');
    const endOfDay = moment().endOf('day');

    const todayCases = await Case.find({
      assignedJudge: judge._id,
      'hearingDates.date': {
        $gte: today.toDate(),
        $lte: endOfDay.toDate()
      },
      status: { $in: ['Pending', 'In Progress', 'Adjourned'] }
    }).populate('plaintiff.lawyer defendant.lawyer');

    const totalActiveCases = await Case.countDocuments({
      assignedJudge: judge._id,
      status: { $in: ['Pending', 'In Progress', 'Adjourned'] }
    });

    res.status(200).json({
      success: true,
      data: {
        judge: {
          id: judge._id,
          name: judge.getFullName(),
          maxDailyCases: judge.maxDailyCases,
          currentCaseLoad: judge.currentCaseLoad,
          totalCasesHandled: judge.totalCasesHandled
        },
        todayCases: todayCases.length,
        totalActiveCases,
        cases: todayCases,
        canTakeMoreCases: judge.canTakeCase()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const judge = await Judge.findById(req.params.id);

    if (!judge) {
      return res.status(404).json({
        success: false,
        message: 'Judge not found'
      });
    }

    const updatedJudge = await Judge.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Judge updated successfully',
      data: { judge: updatedJudge }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const judge = await Judge.findById(req.params.id);

    if (!judge) {
      return res.status(404).json({
        success: false,
        message: 'Judge not found'
      });
    }

    const activeCases = await Case.countDocuments({
      assignedJudge: judge._id,
      status: { $in: ['Pending', 'In Progress', 'Adjourned'] }
    });

    if (activeCases > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete judge with ${activeCases} active cases. Please reassign cases first.`
      });
    }

    await Judge.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Judge deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
