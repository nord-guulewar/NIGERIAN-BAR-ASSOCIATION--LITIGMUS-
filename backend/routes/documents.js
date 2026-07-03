const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { uploadDocument, getCaseDocuments, deleteDocument } = require('../controllers/documentController');

// All routes require authentication
router.use(protect);

// Upload document for a case
// Only admin, registrar, clerk can upload documents
router.post('/:caseId/documents', authorize('admin', 'registrar', 'clerk'), uploadDocument);

// Get all documents for a case
// Accessible to admin, registrar, clerk, judge assigned to case, or user who registered the case
router.get('/:caseId/documents', getCaseDocuments);

// Delete a document from a case
// Only admin, registrar, clerk, or the user who uploaded the document can delete
router.delete('/:caseId/documents/:documentId', authorize('admin', 'registrar', 'clerk'), deleteDocument);

module.exports = router;