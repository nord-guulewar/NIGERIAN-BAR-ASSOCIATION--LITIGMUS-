import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Badge, Button, Spinner, Alert, Table, Form } from 'react-bootstrap';
import { caseAPI } from '../services/api';
import { generateCaseReport } from '../utils/pdfGenerator';
import moment from 'moment';
import { getSessionToken } from '../utils/sessionAuth';

const CaseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadFormVisible, setUploadFormVisible] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  const fetchCaseDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await caseAPI.getById(id);
      setCaseData(response.data.data.case);
      setLoading(false);
    } catch (err) {
      setError('Failed to load case details');
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCaseDetails();
  }, [fetchCaseDetails]);

  const getStatusBadge = (status) => {
    const variants = {
      'Pending': 'warning',
      'In Progress': 'primary',
      'Adjourned': 'info',
      'Judgement Reserved': 'secondary',
      'Closed': 'success',
      'Dismissed': 'danger',
      'Settled': 'success'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const handleFileChange = (e) => {
    // Reset errors when file changes
    setUploadError('');
    setUploadSuccess('');
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    const fileInput = document.getElementById('documentFile');
    const documentTypeSelect = document.getElementById('documentType');
    
    if (!fileInput.files[0] || !documentTypeSelect.value) {
      setUploadError('Please select a file and document type');
      return;
    }
    
    setUploadLoading(true);
    setUploadError('');
    setUploadSuccess('');
    
    try {
      formData.append('document', fileInput.files[0]);
      
      const response = await fetch(`/api/documents/${id}/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getSessionToken()}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setUploadSuccess(result.message);
      
      // Reset form
      fileInput.value = '';
      documentTypeSelect.value = '';
      
      // Hide upload form after successful upload
      setUploadFormVisible(false);
      
      // Refresh case data to show new document
      setTimeout(() => {
        fetchCaseDetails();
      }, 1000);
    } catch (error) {
      setUploadError(`Error: ${error.message}`);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/documents/${id}/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getSessionToken()}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Refresh case data
      fetchCaseDetails();
    } catch (error) {
      alert(`Error deleting document: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading case details...</p>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <div>
      <div className="page-header d-flex justify-content-between align-items-center">
        <div>
          <h2>{caseData.caseNumber}</h2>
          <p className="text-muted">{caseData.title}</p>
        </div>
        <div>
          <Button variant="outline-secondary" onClick={() => navigate('/cases')} className="me-2">
            <i className="bi bi-arrow-left me-2"></i>Back
          </Button>
          <Button variant="success" onClick={() => generateCaseReport(caseData)} className="me-2">
            <i className="bi bi-file-earmark-pdf me-2"></i>Download PDF
          </Button>
          <Button variant="primary" onClick={() => window.print()}>
            <i className="bi bi-printer me-2"></i>Print
          </Button>
        </div>
      </div>

      <Row>
        <Col md={8}>
          <Card className="mb-3">
            <Card.Header><h6 className="mb-0">Case Information</h6></Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <p><strong>Case Number:</strong> {caseData.caseNumber}</p>
                  <p><strong>Case Type:</strong> {caseData.caseType}</p>
                  <p><strong>Court Type:</strong> {caseData.courtType}</p>
                  <p><strong>State:</strong> {caseData.state}</p>
                </Col>
                <Col md={6}>
                  <p><strong>Status:</strong> {getStatusBadge(caseData.status)}</p>
                  <p><strong>Priority:</strong> <Badge bg="info">{caseData.priority}</Badge></p>
                  <p><strong>Filing Date:</strong> {moment(caseData.filingDate).format('MMMM DD, YYYY')}</p>
                  <p><strong>Registered By:</strong> {caseData.registeredBy?.firstName} {caseData.registeredBy?.lastName}</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="mb-3">
            <Card.Header><h6 className="mb-0">Parties</h6></Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <h6 className="text-primary">Plaintiff</h6>
                  <p><strong>Name:</strong> {caseData.plaintiff.name}</p>
                  <p><strong>Address:</strong> {caseData.plaintiff.address || 'N/A'}</p>
                  <p><strong>Phone:</strong> {caseData.plaintiff.phoneNumber || 'N/A'}</p>
                  <p><strong>Email:</strong> {caseData.plaintiff.email || 'N/A'}</p>
                  {caseData.plaintiff.lawyer?.name && (
                    <>
                      <h6 className="mt-3">Lawyer</h6>
                      <p><strong>Name:</strong> {caseData.plaintiff.lawyer.name}</p>
                      <p><strong>Bar Number:</strong> {caseData.plaintiff.lawyer.barNumber}</p>
                    </>
                  )}
                </Col>
                <Col md={6}>
                  <h6 className="text-danger">Defendant</h6>
                  <p><strong>Name:</strong> {caseData.defendant.name}</p>
                  <p><strong>Address:</strong> {caseData.defendant.address || 'N/A'}</p>
                  <p><strong>Phone:</strong> {caseData.defendant.phoneNumber || 'N/A'}</p>
                  <p><strong>Email:</strong> {caseData.defendant.email || 'N/A'}</p>
                  {caseData.defendant.lawyer?.name && (
                    <>
                      <h6 className="mt-3">Lawyer</h6>
                      <p><strong>Name:</strong> {caseData.defendant.lawyer.name}</p>
                      <p><strong>Bar Number:</strong> {caseData.defendant.lawyer.barNumber}</p>
                    </>
                  )}
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {caseData.hearingDates && caseData.hearingDates.length > 0 && (
            <Card className="mb-3">
              <Card.Header><h6 className="mb-0">Hearing Dates</h6></Card.Header>
              <Card.Body>
                <Table hover size="sm">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Status</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {caseData.hearingDates.map((hearing, index) => (
                      <tr key={index}>
                        <td>{moment(hearing.date).format('MMM DD, YYYY')}</td>
                        <td>{hearing.time}</td>
                        <td><Badge bg="info">{hearing.status}</Badge></td>
                        <td>{hearing.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}

          {caseData.notes && (
            <Card className="mb-3">
              <Card.Header><h6 className="mb-0">Notes</h6></Card.Header>
              <Card.Body>
                <p>{caseData.notes}</p>
              </Card.Body>
            </Card>
          )}
          
          {/* Document Upload Section */}
          <Card className="mb-3">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0">Documents</h6>
                <Button variant="outline-primary" size="sm" onClick={() => setUploadFormVisible(!uploadFormVisible)}>
                  <i className="bi bi-upload me-2"></i>Upload Document
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {/* Upload Form */}
              {uploadFormVisible && (
                <Form onSubmit={handleUploadSubmit} encType="multipart/form-data">
                  <Form.Group className="mb-3" controlId="documentType">
                    <Form.Label>Document Type</Form.Label>
                    <Form.Control as="select" id="documentType">
                      <option value="">Select Document Type</option>
                      <option value="pleading">Pleading</option>
                      <option value="motion">Motion</option>
                      <option value="evidence">Evidence</option>
                      <option value="witness_statement">Witness Statement</option>
                      <option value="expert_report">Expert Report</option>
                      <option value="judgment">Judgment</option>
                      <option value="correspondence">Correspondence</option>
                      <option value="other">Other</option>
                    </Form.Control>
                  </Form.Group>
                  
                  <Form.Group className="mb-3" controlId="documentFile">
                    <Form.Label>Choose File</Form.Label>
                    <Form.Control type="file" id="documentFile" onChange={handleFileChange} />
                    <Form.Text className="text-muted">
                      Allowed types: PDF, JPG, PNG, GIF, DOC, DOCX, TXT (Max 10MB)
                    </Form.Text>
                  </Form.Group>
                  
                  {uploadError && (
                    <Alert variant="danger">{uploadError}</Alert>
                  )}
                  
                  {uploadSuccess && (
                    <Alert variant="success">{uploadSuccess}</Alert>
                  )}
                  
                  <Button variant="success" type="submit" disabled={uploadLoading}>
                    {uploadLoading ? 'Uploading...' : 'Upload Document'}
                  </Button>
                  <Button variant="outline-secondary" type="button" onClick={() => setUploadFormVisible(false)} style={{ marginLeft: '10px' }}>
                    Cancel
                  </Button>
                </Form>
              )}
              
              {/* Documents List */}
              <div>
                {caseData.documents && caseData.documents.length > 0 ? (
                  <Table hover size="sm">
                    <thead>
                      <tr>
                        <th>Document Name</th>
                        <th>Type</th>
                        <th>Upload Date</th>
                        <th>Uploaded By</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {caseData.documents.map((doc, index) => (
                        <tr key={index}>
                          <td>{doc.name}</td>
                          <td>{doc.documentType}</td>
                          <td>{new Date(doc.uploadDate).toLocaleDateString()}</td>
                          <td>{doc.uploadedBy ? `${doc.uploadedBy.firstName} ${doc.uploadedBy.lastName}` : 'Unknown'}</td>
                          <td>
                            <Button variant="outline-danger" size="sm" onClick={() => handleDeleteDocument(doc._id)}>
                              <i className="bi bi-trash me-2"></i>Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <p className="text-muted text-center py-3">No documents uploaded yet.</p>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="mb-3">
            <Card.Header><h6 className="mb-0">Assigned Judge</h6></Card.Header>
            <Card.Body>
              {caseData.assignedJudge ? (
                <>
                  <p><strong>{caseData.assignedJudge.title} {caseData.assignedJudge.firstName} {caseData.assignedJudge.lastName}</strong></p>
                  <p className="text-muted mb-0"><i className="bi bi-envelope me-2"></i>{caseData.assignedJudge.email}</p>
                </>
              ) : (
                <p className="text-muted">No judge assigned yet</p>
              )}
            </Card.Body>
          </Card>

          <Card className="mb-3">
            <Card.Header><h6 className="mb-0">Filing Fee</h6></Card.Header>
            <Card.Body>
              <p><strong>Amount:</strong> ₦{caseData.filingFee?.amount?.toLocaleString() || 0}</p>
              <p><strong>Status:</strong> {caseData.filingFee?.paid ? (
                <Badge bg="success">Paid</Badge>
              ) : (
                <Badge bg="warning">Unpaid</Badge>
              )}</p>
              {caseData.filingFee?.paid && caseData.filingFee?.paymentDate && (
                <p><strong>Payment Date:</strong> {moment(caseData.filingFee.paymentDate).format('MMM DD, YYYY')}</p>
              )}
              {caseData.filingFee?.receiptNumber && (
                <p><strong>Receipt:</strong> {caseData.filingFee.receiptNumber}</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CaseDetails;
