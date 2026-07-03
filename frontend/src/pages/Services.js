import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Scale, FileText, Gavel, Users, Building2, Shield, BookOpen, Handshake, Landmark, GraduationCap, Briefcase } from 'lucide-react';

const services = [
  { icon: <Gavel size={32} />, title: 'Case Management', description: 'End-to-end digital case tracking from filing to final judgment, with automated numbering and real-time status updates across all court levels.' },
  { icon: <Users size={32} />, title: 'Judge Assignment', description: 'Intelligent workload-based assignment ensuring fair distribution of cases among judicial officers based on specialization and current load.' },
  { icon: <FileText size={32} />, title: 'Document Management', description: 'Secure digital filing, storage, and retrieval of court documents with role-based access control and full audit trails.' },
  { icon: <Building2 size={32} />, title: 'Registry Services', description: 'Digital court registry for case registration, Cause List generation, and public access to court records and schedules.' },
  { icon: <Shield size={32} />, title: 'Legal Aid & Pro Bono', description: 'Directory of volunteer lawyers providing free legal services, connecting indigent persons with qualified practitioners across Nigeria.' },
  { icon: <BookOpen size={32} />, title: 'Legal Research', description: 'Access to Nigerian statutes, case law, rules of court, and legal precedents powered by a comprehensive digital law library.' },
  { icon: <Handshake size={32} />, title: 'Mediation & ADR', description: 'Support for Alternative Dispute Resolution including case tracking for mediation, conciliation, and arbitration proceedings.' },
  { icon: <Landmark size={32} />, title: 'Court Administration', description: 'Tools for registrars, bailiffs, and court administrators to manage calendars, staff, resources, and inter-court transfers.' },
  { icon: <GraduationCap size={32} />, title: 'Legal Education', description: 'Continuing Legal Education (CLE) modules, training resources, and certification tracking for legal professionals and court staff.' },
  { icon: <Briefcase size={32} />, title: 'Financial Management', description: 'Integrated court fee collection, fine management, budget tracking, and financial reporting for court accounts departments.' },
  { icon: <FileText size={32} />, title: 'Reporting & Analytics', description: 'Real-time dashboards showing case statistics, disposal rates, pending matters, and performance metrics for all court levels.' },
  { icon: <Scale size={32} />, title: 'Public Access Portal', description: 'Transparency tools enabling citizens to track case status, access Cause Lists, and find pro bono legal assistance.' }
];

const courtLevels = [
  { name: 'Supreme Court of Nigeria', description: 'The apex court with final appellate jurisdiction over all lower courts.' },
  { name: 'Court of Appeal', description: 'Hears appeals from the Federal High Court, State High Courts, and other tribunals.' },
  { name: 'Federal High Court', description: 'Has jurisdiction over federal laws, banking, taxation, citizenship, and admiralty matters.' },
  { name: 'State High Courts', description: 'Superior courts of record in each state with unlimited civil and criminal jurisdiction.' },
  { name: 'National Industrial Court', description: 'Exclusive jurisdiction over labour, employment, and industrial relations matters.' },
  { name: 'Sharia Court of Appeal', description: 'Hears appeals involving Islamic personal law from State Sharia Courts of Appeal.' },
  { name: 'Customary Court of Appeal', description: 'Hears appeals involving customary law from State Customary Courts of Appeal.' },
  { name: 'Magistrate Courts', description: 'Courts of summary jurisdiction handling minor civil and criminal matters.' },
  { name: 'Customary/Area Courts', description: 'Courts applying customary law at the grassroots level across various communities.' }
];

const Services = () => {
  return (
    <div className="services-page">
      <section className="page-hero">
        <Container>
          <div className="page-hero-content">
            <Scale size={48} className="page-hero-icon" />
            <h1>Our Services</h1>
            <p>Comprehensive court management and legal services for the Nigerian justice system</p>
          </div>
        </Container>
      </section>

      <section className="services-section py-5">
        <Container>
          <div className="section-header text-center mb-5">
            <span className="section-tag">What We Offer</span>
            <h2>Platform Services</h2>
            <p className="text-muted">Digital tools transforming every aspect of court operations and legal practice</p>
          </div>
          <Row className="g-4">
            {services.map((service, index) => (
              <Col lg={4} md={6} key={index}>
                <Card className="service-card h-100">
                  <Card.Body className="p-4">
                    <div className="service-icon mb-3">{service.icon}</div>
                    <h4>{service.title}</h4>
                    <p className="text-muted">{service.description}</p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      <section className="courts-section py-5" style={{ background: '#f8f9fa' }}>
        <Container>
          <div className="section-header text-center mb-5">
            <span className="section-tag">Nigerian Court Hierarchy</span>
            <h2>Court Structure</h2>
            <p className="text-muted">The hierarchy of courts in Nigeria as established by the Constitution</p>
          </div>
          <Row className="g-3">
            {courtLevels.map((court, index) => (
              <Col lg={4} md={6} key={index}>
                <Card className="court-card">
                  <Card.Body className="p-3">
                    <div className="court-number">{index + 1}</div>
                    <h5>{court.name}</h5>
                    <p className="small text-muted mb-0">{court.description}</p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default Services;
