import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Card, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { caseAPI, stateAPI, courtAPI } from '../services/api';
import { toast } from 'react-toastify';

const NewCase = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [states, setStates] = useState([]);
  const [courts, setCourts] = useState([]);
  const [caseTypes, setCaseTypes] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    caseType: '',
    courtType: '',
    state: '',
    plaintiff: {
      name: '',
      address: '',
      phoneNumber: '',
      email: '',
      lawyer: {
        name: '',
        barNumber: '',
        phoneNumber: '',
        email: ''
      }
    },
    defendant: {
      name: '',
      address: '',
      phoneNumber: '',
      email: '',
      lawyer: {
        name: '',
        barNumber: '',
        phoneNumber: '',
        email: ''
      }
    },
    priority: 'Medium',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statesRes, courtsRes, typesRes] = await Promise.all([
        stateAPI.getAll(),
        courtAPI.getAll(),
        courtAPI.getCaseTypes()
      ]);
      setStates(statesRes.data.data.states);
      setCourts(courtsRes.data.data.courts);
      setCaseTypes(typesRes.data.data.caseTypes);
    } catch (err) {
      toast.error('Failed to load form data');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const keys = name.split('.');
    
    if (keys.length === 1) {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    } else if (keys.length === 2) {
      setFormData(prev => ({
        ...prev,
        [keys[0]]: {
          ...prev[keys[0]],
          [keys[1]]: type === 'checkbox' ? checked : value
        }
      }));
    } else if (keys.length === 3) {
      setFormData(prev => ({
        ...prev,
        [keys[0]]: {
          ...prev[keys[0]],
          [keys[1]]: {
            ...prev[keys[0]][keys[1]],
            [keys[2]]: value
          }
        }
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await caseAPI.create(formData);
      toast.success('Case registered successfully!');
      navigate(`/cases/${response.data.data.case._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register case');
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Register New Case</h2>
        <p className="text-muted">Fill in the case details below</p>
      </div>

      <Form onSubmit={handleSubmit}>
        <Card className="mb-3">
          <Card.Header><h6 className="mb-0">Case Information</h6></Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Case Title <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    placeholder="Enter case title"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Case Type <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="caseType"
                    value={formData.caseType}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select case type</option>
                    {caseTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Court Type <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="courtType"
                    value={formData.courtType}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select court</option>
                    {courts.map(court => (
                      <option key={court.code} value={court.code}>{court.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>State <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select state</option>
                    {states.map(state => (
                      <option key={state.code} value={state.code}>{state.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Priority</Form.Label>
                  <Form.Select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Card className="mb-3">
          <Card.Header><h6 className="mb-0">Plaintiff Information</h6></Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="plaintiff.name"
                    value={formData.plaintiff.name}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    type="text"
                    name="plaintiff.address"
                    value={formData.plaintiff.address}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control
                    type="tel"
                    name="plaintiff.phoneNumber"
                    value={formData.plaintiff.phoneNumber}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="plaintiff.email"
                    value={formData.plaintiff.email}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={12}><h6 className="mt-2 mb-3">Plaintiff's Lawyer</h6></Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Lawyer Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="plaintiff.lawyer.name"
                    value={formData.plaintiff.lawyer.name}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Bar Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="plaintiff.lawyer.barNumber"
                    value={formData.plaintiff.lawyer.barNumber}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Card className="mb-3">
          <Card.Header><h6 className="mb-0">Defendant Information</h6></Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="defendant.name"
                    value={formData.defendant.name}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    type="text"
                    name="defendant.address"
                    value={formData.defendant.address}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control
                    type="tel"
                    name="defendant.phoneNumber"
                    value={formData.defendant.phoneNumber}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="defendant.email"
                    value={formData.defendant.email}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={12}><h6 className="mt-2 mb-3">Defendant's Lawyer</h6></Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Lawyer Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="defendant.lawyer.name"
                    value={formData.defendant.lawyer.name}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Bar Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="defendant.lawyer.barNumber"
                    value={formData.defendant.lawyer.barNumber}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Alert variant="info" className="mb-3">
          Filing fees are calculated and enforced by the backend after submission based on the court and case type.
        </Alert>

        <Card className="mb-3">
          <Card.Header><h6 className="mb-0">Additional Notes</h6></Card.Header>
          <Card.Body>
            <Form.Group>
              <Form.Control
                as="textarea"
                rows={4}
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Enter any additional notes..."
              />
            </Form.Group>
          </Card.Body>
        </Card>

        <div className="d-flex gap-2">
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Registering...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-2"></i>
                Register Case
              </>
            )}
          </Button>
          <Button variant="outline-secondary" onClick={() => navigate('/cases')}>
            Cancel
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default NewCase;
