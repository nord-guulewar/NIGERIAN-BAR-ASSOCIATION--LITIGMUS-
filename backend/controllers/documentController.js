const Case = require('../models/Case');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads/documents';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

// File filter to accept only certain file types
const fileFilter = (req, file, cb) => {
  // Accept images, PDFs, and common document types
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

  const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB limit
    }
  });

  // Upload document for a case
  const uploadDocument = [
    upload.single('document'),
    async (req, res) => {
      try {
        const { caseId } = req.params;
        const { description, documentType } = req.body;
        
        if (!req.file) {
          return res.status(400).json({
            success: false,
            message: 'No file uploaded'
          });
        }
        
        // Validate case exists
        const caseData = await Case.findById(caseId);
        if (!caseData) {
          // Delete uploaded file if case doesn't exist
          fs.unlinkSync(req.file.path);
          return res.status(404).json({
            success: false,
            message: 'Case not found'
          });
        }
        
        // Check if user has permission to upload to this case
        // Only admin, registrar, clerk, or the user who registered the case can upload
        if (req.user.role !== 'admin' && 
            req.user.role !== 'registrar' && 
            req.user.role !== 'clerk' && 
            caseData.registeredBy.toString() !== req.user._id.toString()) {
          // Delete uploaded file if user doesn't have permission
          fs.unlinkSync(req.file.path);
          return res.status(403).json({
            success: false,
            message: 'Not authorized to upload documents to this case'
          });
        }
        
        // Create document object
        const document = {
          name: req.file.originalname,
          documentType: documentType || path.extname(req.file.originalname).substring(1),
          uploadDate: new Date(),
          uploadedBy: req.user._id
        };
        
        // Add document to case using $push operator
        const updatedCase = await Case.findByIdAndUpdate(
          caseId,
          { $push: { documents: document } },
          { new: true }
        ).populate('documents.uploadedBy', 'firstName lastName email');
        
        res.status(201).json({
          success: true,
          message: 'Document uploaded successfully',
          data: {
            document: updatedCase.documents[updatedCase.documents.length - 1]
          }
        });
      } catch (error) {
        // Delete uploaded file on error
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({
          success: false,
          message: error.message
        });
      }
    }
  ];

// Get all documents for a case
const getCaseDocuments = async (req, res) => {
  try {
    const { caseId } = req.params;
    
    // Validate case exists
    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }
    
    // Check if user has permission to view this case
    // Only admin, registrar, clerk, judge assigned to case, or the user who registered the case can view
    const hasPermission = 
      req.user.role === 'admin' ||
      req.user.role === 'registrar' ||
      req.user.role === 'clerk' ||
      req.user.role === 'judge' ||
      caseData.registeredBy.toString() === req.user._id.toString() ||
      (caseData.assignedJudge && caseData.assignedJudge.toString() === req.user._id.toString());
    
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view documents for this case'
      });
    }
    
    // Populate uploadedBy for documents
    await caseData.populate('documents.uploadedBy', 'firstName lastName email');
    
    res.status(200).json({
      success: true,
      data: {
        documents: caseData.documents
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete a document from a case
const deleteDocument = async (req, res) => {
  try {
    const { caseId, documentId } = req.params;
    
    // Validate case exists
    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }
    
    // Check if document exists
    const documentIndex = caseData.documents.findIndex(doc => doc._id.toString() === documentId);
    if (documentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    // Check if user has permission to delete this document
    // Only admin, registrar, clerk, or the user who uploaded the document can delete
    if (req.user.role !== 'admin' && 
        req.user.role !== 'registrar' && 
        req.user.role !== 'clerk' && 
        caseData.documents[documentIndex].uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this document'
      });
    }
    
    // Remove document using $pull
    await Case.findByIdAndUpdate(
      caseId,
      { $pull: { documents: { _id: documentId } } },
      { new: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  uploadDocument,
  getCaseDocuments,
  deleteDocument
};