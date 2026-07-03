const assignCaseAutomatically = async (caseId) => {
  try {
    // Find judges with matching specialties
    const eligibleJudges = await User.find({
      role: 'judge',
      specialties: case.caseType,
      isActive: true
    });

    if (eligibleJudges.length === 0) {
      throw new Error('No eligible judges found');
    }

    // Calculate priority weight
    const priorityWeights = {
      Urgent: 3,
      High: 2,
      Medium: 1,
      Low: 0.5
    };
    const weight = priorityWeights[case.priority] || 1;

    // Score judges
    const scores = eligibleJudges.map(j => ({
      judgeId: j._id,
      score: weight / (j.currentLoad + 1)
    }));

    // Assign to best judge
    const bestJudge = scores.reduce((max, current) => (
      current.score > max.score ? current : max
    ));

    // Update case and judge
    await Case.findByIdAndUpdate(
      caseId,
      {
        assignedJudge: bestJudge.judgeId,
        assignedBy: req.user._id,
        assignedDate: Date.now()
      },
      { new: true }
    );

    await User.findByIdAndUpdate(
      bestJudge.judgeId,
      { $inc: { currentLoad: 1 } }
    );

    // Audit log (to be implemented separately)
  } catch (error) {
    console.error('Auto-assignment failed:', error);
  }
};

// Call this in case creation logic
createCase(req, res) {
  // ...existing code...
  assignCaseAutomatically(case._id);
}
