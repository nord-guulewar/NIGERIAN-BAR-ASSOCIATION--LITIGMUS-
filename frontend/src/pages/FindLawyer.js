import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Scale, MapPin, Phone, Mail, Clock, Award, Users } from 'lucide-react';

const lawyers = [
  {
    name: 'Barr. Amina Ibrahim',
    specialty: 'Human Rights & Constitutional Law',
    location: 'Abuja',
    phone: '+234 801 234 5678',
    email: 'amina.ibrahim@probono.ng',
    experience: '15 years',
    cases: 127,
    description: 'Specializes in fundamental human rights litigation, pro bono representation for indigent detainees, and constitutional advocacy.'
  },
  {
    name: 'Barr. Chukwuemeka Okafor',
    specialty: 'Criminal Defense & Access to Justice',
    location: 'Lagos',
    phone: '+234 802 345 6789',
    email: 'c.okafor@probono.ng',
    experience: '12 years',
    cases: 203,
    description: 'Dedicated to providing free legal representation to accused persons who cannot afford counsel. Focus on criminal justice reform.'
  },
  {
    name: 'Barr. Fatima Bello',
    specialty: 'Family Law & Women\'s Rights',
    location: 'Kano',
    phone: '+234 803 456 7890',
    email: 'f.bello@probono.ng',
    experience: '10 years',
    cases: 89,
    description: 'Handles domestic violence cases, child custody disputes, and matrimonial causes pro bono for vulnerable women and children.'
  },
  {
    name: 'Barr. Tunde Adeleke',
    specialty: 'Land Law & Property Rights',
    location: 'Ibadan',
    phone: '+234 804 567 8901',
    email: 't.adeleke@probono.ng',
    experience: '18 years',
    cases: 156,
    description: 'Provides free legal aid in land disputes, forced evictions, and property rights matters for rural communities.'
  },
  {
    name: 'Barr. Grace Eze',
    specialty: 'Labour Law & Workers\' Rights',
    location: 'Port Harcourt',
    phone: '+234 805 678 9012',
    email: 'g.eze@probono.ng',
    experience: '8 years',
    cases: 74,
    description: 'Advocates for workers\' rights, unfair dismissal cases, and workplace safety violations on a pro bono basis.'
  },
  {
    name: 'Barr. Musa Abdullahi',
    specialty: 'Environmental Law & Community Rights',
    location: 'Kaduna',
    phone: '+234 806 789 0123',
    email: 'm.abdullahi@probono.ng',
    experience: '11 years',
    cases: 62,
    description: 'Focuses on environmental justice, oil spill compensation claims, and community land rights in the Niger Delta region.'
  }
];

const FindLawyer = () => {
  return (
    <div className="find-lawyer-page">
      <section className="page-hero">
        <Container>
          <div className="page-hero-content">
            <Scale size={48} className="page-hero-icon" />
            <h1>Find a Lawyer</h1>
            <p>Pro bono legal practitioners ready to serve justice across Nigeria</p>
          </div>
        </Container>
      </section>

      <section className="lawyers-section py-5">
        <Container>
          <div className="section-header text-center mb-5">
            <span className="section-tag">Pro Bono Directory</span>
            <h2>Our Volunteer Legal Practitioners</h2>
            <p className="text-muted">Experienced lawyers offering free legal services to those in need</p>
          </div>
          <Row className="g-4">
            {lawyers.map((lawyer, index) => (
              <Col lg={4} md={6} key={index}>
                <Card className="lawyer-card h-100">
                  <Card.Body className="p-4">
                    <div className="lawyer-header mb-3">
                      <div className="lawyer-avatar">
                        <Users size={24} />
                      </div>
                      <div>
                        <h4>{lawyer.name}</h4>
                        <span className="lawyer-specialty">{lawyer.specialty}</span>
                      </div>
                    </div>
                    <p className="lawyer-bio">{lawyer.description}</p>
                    <div className="lawyer-meta">
                      <div className="meta-item"><MapPin size={16} /> {lawyer.location}</div>
                      <div className="meta-item"><Award size={16} /> {lawyer.experience}</div>
                      <div className="meta-item"><Scale size={16} /> {lawyer.cases} cases</div>
                      <div className="meta-item"><Phone size={16} /> {lawyer.phone}</div>
                      <div className="meta-item"><Mail size={16} /> {lawyer.email}</div>
                    </div>
                  </Card.Body>
                  <Card.Body className="pt-0">
                    <Button variant="outline-primary" className="w-100">Contact Lawyer</Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      <section className="info-section py-5" style={{ background: '#f8f9fa' }}>
        <Container>
          <Row className="g-4">
            <Col md={6}>
              <Card className="info-card h-100">
                <Card.Body className="p-4">
                  <Clock size={32} className="mb-3" style={{ color: '#d4af37' }} />
                  <h3>How Pro Bono Works</h3>
                  <p>
                    The Nigerian Bar Association's Pro Bono Program connects indigent persons,
                    vulnerable groups, and public-interest causes with volunteer lawyers across
                    all 36 states and the FCT. Whether you need representation in a criminal
                    matter, help with a land dispute, or advice on your fundamental rights,
                    our directory makes it easy to find qualified legal assistance at no cost.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="info-card h-100">
                <Card.Body className="p-4">
                  <Users size={32} className="mb-3" style={{ color: '#d4af37' }} />
                  <h3>Need a Lawyer?</h3>
                  <p>
                    To request pro bono assistance, contact your nearest NBA Branch Secretariat
                    or the Legal Aid Council of Nigeria. You can also reach out directly to any
                    lawyer listed above. All consultations are treated with strict confidence,
                    and services are provided free of charge to eligible persons.
                  </p>
                  <Button variant="primary">Request Assistance</Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default FindLawyer;
