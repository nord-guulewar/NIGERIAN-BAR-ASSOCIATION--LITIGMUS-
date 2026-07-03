import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Scale, Phone, Mail, MapPin, Gavel, Award, Building2 } from 'lucide-react';

const officials = [
  {
    name: 'Hon. Justice Olukayode Ariwoola',
    position: 'Chief Justice of Nigeria (CJN)',
    court: 'Supreme Court of Nigeria',
    location: 'Abuja',
    phone: '+234 9 904 4140',
    email: 'cjn@supremecourt.gov.ng',
    address: 'Supreme Court Complex, Three Arms Zone, Abuja'
  },
  {
    name: 'Hon. Justice Ibrahim Tanko Muhammad',
    position: 'Former Chief Justice of Nigeria',
    court: 'Supreme Court of Nigeria',
    location: 'Abuja',
    phone: '+234 9 904 4141',
    email: '—',
    address: 'Supreme Court Complex, Three Arms Zone, Abuja'
  },
  {
    name: 'Hon. Justice Kudirat Kekere-Ekun',
    position: 'Justice of the Supreme Court',
    court: 'Supreme Court of Nigeria',
    location: 'Abuja',
    phone: '+234 9 904 4142',
    email: '—',
    address: 'Supreme Court Complex, Three Arms Zone, Abuja'
  },
  {
    name: 'Hon. Justice John Inyang Okoro',
    position: 'Justice of the Supreme Court',
    court: 'Supreme Court of Nigeria',
    location: 'Abuja',
    phone: '+234 9 904 4143',
    email: '—',
    address: 'Supreme Court Complex, Three Arms Zone, Abuja'
  },
  {
    name: 'Hon. Justice Uwani Musa Abba Aji',
    position: 'Justice of the Supreme Court',
    court: 'Supreme Court of Nigeria',
    location: 'Abuja',
    phone: '+234 9 904 4144',
    email: '—',
    address: 'Supreme Court Complex, Three Arms Zone, Abuja'
  },
  {
    name: 'Presiding Justice, Court of Appeal (Lagos)',
    position: 'President, Court of Appeal',
    court: 'Court of Appeal, Lagos Division',
    location: 'Lagos',
    phone: '+234 1 269 2121',
    email: 'info@appealcourt.gov.ng',
    address: 'Court of Appeal Complex, Lagos'
  }
];

const stateChiefJudges = [
  { state: 'Lagos State', name: 'Hon. Justice Kazeem O. Alogba' },
  { state: 'Rivers State', name: 'Hon. Justice Simeon D. Amadi' },
  { state: 'Kano State', 'name': 'Hon. Justice Dije Abdu Abore' },
  { state: 'Delta State', name: 'Hon. Justice Z. A. Allegenla' },
  { state: 'Oyo State', name: 'Hon. Justice M. L. Garba' },
  { state: 'Kaduna State', name: 'Hon. Justice A. B. Yusuf' },
  { state: 'Enugu State', name: 'Hon. Justice A. N. Onovo' },
  { state: 'Borno State', name: 'Hon. Justice K. M. Kolo' },
  { state: 'Sokoto State', name: 'Hon. Justice M. A. Pindiga' },
  { state: 'Anambra State', name: 'Hon. Justice O. O. Okeke' },
  { state: 'Edo State', name: 'Hon. Justice D. I. Okungbowa' },
  { state: 'Ondo State', name: 'Hon. Justice O. E. Akeredolu' }
];

const benchers = [
  { name: 'Chief Femi Gbajabiamila, SAN', position: 'Former Speaker, House of Representatives' },
  { name: 'Chief Wole Olanipekun, SAN', position: 'Former NBA President' },
  { name: 'Professor Itse Sagay, SAN', position: 'Former Chairman, FJI & JSC Nominee' },
  { name: 'Dr. Babatunde Raji Fashola, SAN', position: 'Former Minister of Works & Housing' },
  { name: 'Yemi Osinbajo, SAN', position: 'Former Vice President of Nigeria' },
  { name: 'M. D. Abubakar, SAN', position: 'Former Attorney General of several states' },
  { name: 'Joe-Kyari Gadzama, SAN', position: 'Noted Criminal Law Practitioner' }
];

const Contacts = () => {
  return (
    <div className="contacts-page">
      <section className="page-hero">
        <Container>
          <div className="page-hero-content">
            <Scale size={48} className="page-hero-icon" />
            <h1>Court Officials & Contacts</h1>
            <p>Key judicial officers, registrars, and Benchers across Nigeria's court system</p>
          </div>
        </Container>
      </section>

      <section className="officials-section py-5">
        <Container>
          <div className="section-header text-center mb-5">
            <span className="section-tag">Supreme Court Justices</span>
            <h2>Justices of the Supreme Court</h2>
          </div>
          <Row className="g-4">
            {officials.slice(0, 5).map((official, index) => (
              <Col lg={6} key={index}>
                <Card className="official-card h-100">
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-start mb-3">
                      <div className="official-avatar me-3"><Gavel size={24} /></div>
                      <div>
                        <h5 className="mb-1">{official.name}</h5>
                        <p className="text-primary mb-0 small">{official.position}</p>
                      </div>
                    </div>
                    <div className="official-meta">
                      <div><Building2 size={14} className="me-2" />{official.court}</div>
                      <div><MapPin size={14} className="me-2" />{official.location}</div>
                      <div>{official.address}</div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      <section className="state-chief-judges py-5" style={{ background: '#f8f9fa' }}>
        <Container>
          <div className="section-header text-center mb-5">
            <span className="section-tag">State High Courts</span>
            <h2>Chief Judges of Selected States</h2>
          </div>
          <Row className="g-3">
            {stateChiefJudges.map((cj, index) => (
              <Col lg={3} md={4} sm={6} key={index}>
                <Card className="cj-card text-center">
                  <Card.Body className="p-3">
                    <Award size={28} className="mb-2" style={{ color: '#d4af37' }} />
                    <h6>{cj.name}</h6>
                    <small className="text-muted">{cj.state}</small>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      <section className="benchers-section py-5">
        <Container>
          <div className="section-header text-center mb-5">
            <span className="section-tag">Notable Benchers</span>
            <h2>Senior Advocates of Nigeria (SAN)</h2>
          </div>
          <Row className="g-3">
            {benchers.map((bencher, index) => (
              <Col lg={4} md={6} key={index}>
                <Card className="bencher-card">
                  <Card.Body className="p-3">
                    <h6>{bencher.name}</h6>
                    <p className="small text-muted mb-0">{bencher.position}</p>
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

export default Contacts;
