import React from 'react';
import { Container, Row, Col, Card, Badge } from 'react-bootstrap';
import { Scale, Calendar, MapPin, Bell, FileText, Gavel } from 'lucide-react';

const updates = [
  {
    date: '2026-06-08',
    title: 'Supreme Court Delivers Judgment in Landmark Electoral Matter',
    court: 'Supreme Court of Nigeria',
    summary: 'The Supreme Court today delivered its long-awaited judgment in the electoral tribunal appeals arising from the 2023 general elections, setting key precedents for election petition procedures.',
    type: 'judgment',
    urgent: true
  },
  {
    date: '2026-06-05',
    title: 'Court of Appeal Sits in Enugu — Cause List for June Session',
    court: 'Court of Appeal, Enugu Division',
    summary: 'The Court of Appeal will sit in Enugu from June 15-30, 2026. All counsel are advised to check the Cause List for their matter schedules and filing deadlines.',
    type: 'sitting',
    urgent: false
  },
  {
    date: '2026-06-03',
    title: 'Federal High Court Abuja — New Practice Direction on Filing',
    court: 'Federal High Court, Abuja',
    summary: 'A new Practice Direction on electronic filing and service of processes takes effect July 1, 2026. All legal practitioners must register on the e-filing portal before the deadline.',
    type: 'notice',
    urgent: false
  },
  {
    date: '2026-06-01',
    title: 'Lagos State Judiciary — Annual Vacation Notice',
    court: 'Lagos State High Court',
    summary: 'The Lagos State Judiciary announces its annual vacation from August 1 to September 15, 2026. Only urgent and interim applications will be entertained during this period.',
    type: 'vacation',
    urgent: false
  },
  {
    date: '2026-05-28',
    title: 'National Industrial Court Rules on Workers\' Compensation',
    court: 'National Industrial Court, Lagos',
    summary: 'The NIC delivered a significant judgment expanding the scope of employer liability under the Employees Compensation Act, affecting workplace injury claims nationwide.',
    type: 'judgment',
    urgent: true
  },
  {
    date: '2026-05-25',
    title: 'Kano Sharia Court of Appeal — Ramadan Sittings Conclude',
    court: 'Sharia Court of Appeal, Kano',
    summary: 'The special Ramadan sittings of the Sharia Court of Appeal have concluded. Regular sittings resume on June 2, 2026. All pending matters have been reassigned new dates.',
    type: 'sitting',
    urgent: false
  }
];

const sittings = [
  { court: 'Supreme Court', location: 'Abuja', dates: 'June 15 — July 31, 2026', matters: 'Constitutional Appeals, Criminal Appeals' },
  { court: 'Court of Appeal (Lagos)', location: 'Lagos', dates: 'June 10 — June 30, 2026', matters: 'Civil Appeals, Criminal Appeals' },
  { court: 'Federal High Court (Abuja)', location: 'Abuja', dates: 'Year-round', matters: 'Federal Jurisdiction, Banking, Tax' },
  { court: 'Lagos High Court', location: 'Ikeja, Lagos Island, etc.', dates: 'Year-round (except vacation)', matters: 'Civil, Criminal, Family, Commercial' },
  { court: 'NIC (Abuja)', location: 'Abuja', dates: 'June 8 — July 18, 2026', matters: 'Labour Disputes, Employment Matters' },
  { court: 'Sharia Court of Appeal (Kano)', location: 'Kano', dates: 'June 2 — June 27, 2026', matters: 'Islamic Personal Law Appeals' }
];

const CourtUpdates = () => {
  const typeColors = { judgment: 'danger', sitting: 'primary', notice: 'info', vacation: 'warning' };

  return (
    <div className="court-updates-page">
      <section className="page-hero">
        <Container>
          <div className="page-hero-content">
            <Bell size={48} className="page-hero-icon" />
            <h1>Court Updates</h1>
            <p>The latest judgments, sittings, and notices from courts across Nigeria</p>
          </div>
        </Container>
      </section>

      <section className="updates-section py-5">
        <Container>
          <div className="section-header text-center mb-5">
            <span className="section-tag">Latest News</span>
            <h2>Court Notices & Judgments</h2>
          </div>
          <Row className="g-4">
            {updates.map((update, index) => (
              <Col lg={6} key={index}>
                <Card className={`update-card h-100 ${update.urgent ? 'border-danger' : ''}`}>
                  <Card.Body className="p-4">
                    <div className="update-header mb-2">
                      <Badge bg={typeColors[update.type]} className="me-2">{update.type}</Badge>
                      {update.urgent && <Badge bg="danger">Urgent</Badge>}
                      <small className="text-muted ms-2"><Calendar size={14} className="me-1" />{update.date}</small>
                    </div>
                    <h5>{update.title}</h5>
                    <p className="small text-muted"><MapPin size={14} className="me-1" />{update.court}</p>
                    <p>{update.summary}</p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      <section className="sittings-section py-5" style={{ background: '#f8f9fa' }}>
        <Container>
          <div className="section-header text-center mb-5">
            <span className="section-tag">Current Sittings</span>
            <h2>Court Sitting Schedules</h2>
          </div>
          <Row className="g-3">
            {sittings.map((sitting, index) => (
              <Col lg={4} md={6} key={index}>
                <Card className="sitting-card h-100">
                  <Card.Body className="p-3">
                    <h5>{sitting.court}</h5>
                    <div className="small text-muted mb-1"><MapPin size={14} className="me-1" />{sitting.location}</div>
                    <div className="small text-muted mb-1"><Calendar size={14} className="me-1" />{sitting.dates}</div>
                    <div className="small"><FileText size={14} className="me-1" />{sitting.matters}</div>
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

export default CourtUpdates;
