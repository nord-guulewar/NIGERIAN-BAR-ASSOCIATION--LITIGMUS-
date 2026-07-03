import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Scale, TrendingUp, Shield, Users,
  Clock, CheckCircle, BarChart3, Gavel, Lock,
  Menu, X, ChevronLeft, ChevronRight, Landmark, BookOpen, Award, ExternalLink
} from 'lucide-react';
import PolicyLinks from '../components/PolicyLinks';
import './LandingPage.css';
import loginIcon from '../assets/icons/login-2.svg';
import scaleIcon from '../assets/icons/scale.svg';
import searchIcon from '../assets/icons/search.svg';
import briefcaseIcon from '../assets/icons/briefcase.svg';
import newsIcon from '../assets/icons/news.svg';
import usersIcon from '../assets/icons/users.svg';
import buildingBankIcon from '../assets/icons/building-bank.svg';

const internationalLawFacts = [
  "The International Court of Justice (ICJ) was established in 1945 and is seated at The Hague, Netherlands.",
  "The Universal Declaration of Human Rights was adopted by the UN General Assembly on December 10, 1948.",
  "The Rome Statute, which established the International Criminal Court, entered into force on July 1, 2002.",
  "The Geneva Conventions of 1949 form the cornerstone of international humanitarian law, protecting war victims.",
  "The International Tribunal for the Law of the Sea (ITLOS) was established by the UN Convention on the Law of the Sea.",
  "The African Court on Human and Peoples' Rights was established in 2004 and is based in Arusha, Tanzania.",
  "The Nuremberg Trials (1945–1946) established the principle of individual criminal responsibility under international law.",
  "The Vienna Convention on Diplomatic Relations (1961) codified diplomatic immunity rules still in force today.",
  "The ECOWAS Court of Justice can hear human rights cases from individuals in all 15 member states.",
  "The International Law Commission has 34 members who collectively develop and codify international law.",
  "The principle of universal jurisdiction allows any state to prosecute certain crimes regardless of where they were committed.",
  "The International Criminal Tribunal for Rwanda (ICTR) was the first international tribunal to convict for genocide.",
  "The UN Security Council referred the Darfur situation to the ICC in 2005 under Resolution 1593.",
  "The African Charter on Human and Peoples' Rights was adopted in 1981 and is unique in recognizing peoples' rights.",
  "The principle of complementarity means the ICC only acts when national courts are unwilling or unable to prosecute."
];

const nigerianLegalHistory = [
  "The Nigerian legal system received independence on October 1, 1960, with the Nigeria Independence Act 1960.",
  "Sir Adetokunbo Ademola was the first indigenous Chief Justice of Nigeria, appointed in 1958.",
  "Justice Mary Odili became the first female Justice of the Supreme Court from Rivers State in 2001.",
  "The Nigerian Bar Association was founded in 1933 with 20 members; today it has over 150,000 members nationwide.",
  "The Legal Aid Council of Nigeria was established by Decree No. 56 of 1976 to provide free legal services to indigent Nigerians.",
  "Justice Amina Augie was the first female Justice of the Nigerian Supreme Court from the North-West geopolitical zone.",
  "The Supreme Court of Nigeria, established in 1914, is the final appellate court with 21 Justices as prescribed by the 1999 Constitution.",
  "The first law school in Nigeria, the Nigerian Law School, was established in Lagos in 1962 by the Legal Education Act.",
  "The Court of Appeal was established in 1976 to serve as an intermediate appellate court between the High Courts and the Supreme Court.",
  "Justice Dahiru Musdapher served as the 12th Chief Justice of Nigeria from 2011 to 2012, known for judicial reform advocacy.",
  "The Federal Capital Territory has a unique court system integrating the High Court, Sharia Court of Appeal, and Customary Court of Appeal.",
  "The Lagos State Judiciary, established in 1863, is the oldest modern court system in Nigeria.",
  "The Legal Practitioners Act of 1975 regulates the admission and discipline of legal practitioners in Nigeria.",
  "Nigeria operates a dual legal system: the English common law and customary/Islamic law, recognized by the Constitution.",
  "The 1999 Constitution established the National Judicial Council, responsible for recommending judicial appointments and discipline."
];

const allFacts = [
  ...internationalLawFacts.map(f => ({ text: f, category: 'International Law', icon: 'global' })),
  ...nigerianLegalHistory.map(f => ({ text: f, category: 'Nigerian Legal History', icon: 'local' }))
];

const footerPolicyKeys = [
  'privacy-policy',
  'terms-of-use',
  'information-security',
  'access-control-and-authorization'
];

const landingServiceIcons = {
  lawyer: searchIcon,
  services: briefcaseIcon,
  updates: newsIcon,
  contacts: usersIcon
};

const LandingPage = () => {
  const navigate = useNavigate();
  const [showPrivacyBanner, setShowPrivacyBanner] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [factVisible, setFactVisible] = useState(true);
  const [factDirection, setFactDirection] = useState('right');

  useEffect(() => {
    window.scrollTo(0, 0);
    const privacyAccepted = localStorage.getItem('privacyAccepted');
    if (privacyAccepted === 'true') setShowPrivacyBanner(false);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) entry.target.classList.add('animated');
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const rotateFact = useCallback((direction = 'right') => {
    setFactVisible(false);
    setFactDirection(direction);
    setTimeout(() => {
      setCurrentFactIndex(prev =>
        direction === 'right'
          ? (prev + 1) % allFacts.length
          : (prev - 1 + allFacts.length) % allFacts.length
      );
      setFactVisible(true);
    }, 400);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => rotateFact('right'), 6000);
    return () => clearInterval(interval);
  }, [rotateFact]);

  const acceptPrivacy = () => {
    localStorage.setItem('privacyAccepted', 'true');
    setShowPrivacyBanner(false);
  };

  const scrollToFeatures = () => {
    document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
  };

  const features = [
    { icon: <FileText size={36} />, title: 'Case Management', description: 'Comprehensive case tracking from filing to judgment with automated numbering' },
    { icon: <Users size={36} />, title: 'Multi-Role Access', description: '16 specialized roles including judges, registrars, clerks, and court personnel' },
    { icon: <Gavel size={36} />, title: 'Judge Assignment', description: 'Intelligent workload-based assignment for fair case distribution' },
    { icon: <Clock size={36} />, title: 'Hearing Scheduling', description: 'Automated hearing management with calendar integration' },
    { icon: <BarChart3 size={36} />, title: 'Analytics & Reports', description: 'Real-time dashboards with case statistics and trends' },
    { icon: <Shield size={36} />, title: 'Secure & Compliant', description: 'NDPR compliant with role-based access and encryption' }
  ];

  const stats = [
    { number: '37', label: 'States + FCT' },
    { number: '8', label: 'Court Types' },
    { number: '16', label: 'User Roles' },
    { number: '11', label: 'Case Types' }
  ];

  const currentFact = allFacts[currentFactIndex];

  return (
    <div className="landing-page">
      {/* Navigation Bar */}
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="nav-brand" onClick={() => navigate('/')}>
            <img src={scaleIcon} alt="" className="nav-brand-icon" aria-hidden="true" />
            <span>NBA LITIGMUS</span>
          </div>
          <div className="nav-links">
            <button className="nav-link-btn" onClick={() => navigate('/find-lawyer')}>
              <img src={searchIcon} alt="" className="nav-link-icon" aria-hidden="true" />
              <span>Find a Lawyer</span>
            </button>
            <button className="nav-link-btn" onClick={() => navigate('/services')}>
              <img src={briefcaseIcon} alt="" className="nav-link-icon" aria-hidden="true" />
              <span>Services</span>
            </button>
            <button className="nav-link-btn" onClick={() => navigate('/court-updates')}>
              <img src={newsIcon} alt="" className="nav-link-icon" aria-hidden="true" />
              <span>Court Updates</span>
            </button>
            <button className="nav-link-btn" onClick={() => navigate('/contacts')}>
              <img src={usersIcon} alt="" className="nav-link-icon" aria-hidden="true" />
              <span>Contacts</span>
            </button>
            <button className="nav-link-btn btn-login-nav" onClick={() => navigate('/login')}>
              <img src={loginIcon} alt="" className="nav-login-icon" aria-hidden="true" />
              <span>Login</span>
            </button>
            <button className="nav-link-btn btn-judge-nav" onClick={() => navigate('/judge-onboarding')}>Judge Onboarding</button>
          </div>
          <button className="nav-mobile-toggle" onClick={() => setMobileNavOpen(!mobileNavOpen)}>
            {mobileNavOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {mobileNavOpen && (
          <div className="nav-mobile-menu">
            <button onClick={() => { navigate('/find-lawyer'); setMobileNavOpen(false); }}>Find a Lawyer</button>
            <button onClick={() => { navigate('/services'); setMobileNavOpen(false); }}>Services</button>
            <button onClick={() => { navigate('/court-updates'); setMobileNavOpen(false); }}>Court Updates</button>
            <button onClick={() => { navigate('/contacts'); setMobileNavOpen(false); }}>Contacts</button>
            <button onClick={() => { navigate('/login'); setMobileNavOpen(false); }}>Login</button>
            <button onClick={() => { navigate('/judge-onboarding'); setMobileNavOpen(false); }}>Judge Onboarding</button>
          </div>
        )}
      </nav>

      {/* Hero Section — Full bleed */}
      <section className="hero-section">
        <div className="hero-grid">
          <div className="hero-left">
            <div className="hero-badge">
              <Scale size={18} />
              <span className="hero-badge-text">Nigerian Bar Association</span>
            </div>
            <h1 className="hero-title">
              <span className="hero-title-main">NBA LITIGMUS</span>
              <span className="hero-subtitle">Case Management System</span>
            </h1>
            <p className="hero-description">
              Modern, efficient, and comprehensive court management for the Nigerian legal system.
              Streamline case workflows and deliver justice faster.
            </p>
            <div className="hero-buttons">
              <button className="btn btn-primary btn-lg" onClick={() => navigate('/login')}>
                Get Started <span className="btn-arrow">→</span>
              </button>
              <button className="btn btn-outline btn-lg" onClick={() => navigate('/judge-onboarding')}>
                Judge Onboarding
              </button>
              <button className="btn btn-outline btn-lg" onClick={() => navigate('/find-lawyer')}>
                Find a Lawyer
              </button>
            </div>
            <div className="hero-stats">
              <div className="stat-item"><CheckCircle size={16} /> Production Ready</div>
              <div className="stat-item"><Shield size={16} /> NDPA/NDPR Privacy Ready</div>
              <div className="stat-item"><TrendingUp size={16} /> Real-time Analytics</div>
            </div>
            {showPrivacyBanner && (
              <div className="privacy-banner">
                <Lock size={18} />
                <span>Privacy, legal, and compliance information available for Nigerian and international users. <button className="privacy-link" onClick={() => navigate('/legal-compliance')}>Learn more</button></span>
                <button className="privacy-accept-btn" onClick={acceptPrivacy}>Accept</button>
              </div>
            )}
          </div>

          {/* Rotating Facts Panel */}
          <div className="hero-right">
            <div className="facts-panel">
              <div className="facts-header">
                <div className="facts-icon">{currentFact.icon === 'global' ? <Landmark size={20} /> : <BookOpen size={20} />}</div>
                <span className="facts-category">{currentFact.category}</span>
              </div>
              <div className={`facts-content ${factVisible ? 'fact-visible' : 'fact-hidden'} fact-${factDirection}`}>
                <Award size={28} className="fact-quote-icon" />
                <p className="fact-text">{currentFact.text}</p>
              </div>
              <div className="facts-controls">
                <button className="fact-nav-btn" onClick={() => rotateFact('left')}><ChevronLeft size={18} /></button>
                <div className="fact-dots">
                  {allFacts.slice(0, 8).map((_, index) => {
                    const isActive = currentFactIndex % 8 === index;
                    return <span key={index} className={`fact-dot ${isActive ? 'active' : ''}`} />;
                  })}
                </div>
                <button className="fact-nav-btn" onClick={() => rotateFact('right')}><ChevronRight size={18} /></button>
              </div>
            </div>
          </div>
        </div>
        <div className="scroll-indicator" onClick={scrollToFeatures}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 13l3 3 3-3M7 6l5 5 5-5"/>
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section animate-on-scroll">
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card animate-on-scroll">
              <div className="stat-number">{stat.number}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section animate-on-scroll">
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card animate-on-scroll">
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Public Services Section */}
      <section className="public-services-section">
        <div className="public-services-grid">
          <div className="public-service-card" onClick={() => navigate('/find-lawyer')}>
            <img src={landingServiceIcons.lawyer} alt="" className="public-service-icon" aria-hidden="true" />
            <h3>Find a Lawyer (Pro Bono)</h3>
            <p>Connect with volunteer legal practitioners offering free services across Nigeria</p>
            <span className="service-link">Browse Directory →</span>
          </div>
          <div className="public-service-card" onClick={() => navigate('/services')}>
            <img src={landingServiceIcons.services} alt="" className="public-service-icon" aria-hidden="true" />
            <h3>Our Services</h3>
            <p>Case management, court administration, legal research, and more for every court role</p>
            <span className="service-link">Explore →</span>
          </div>
          <div className="public-service-card" onClick={() => navigate('/court-updates')}>
            <img src={landingServiceIcons.updates} alt="" className="public-service-icon" aria-hidden="true" />
            <h3>Court Updates</h3>
            <p>Latest judgments, sitting schedules, and notices from courts nationwide</p>
            <span className="service-link">View Updates →</span>
          </div>
          <div className="public-service-card" onClick={() => navigate('/contacts')}>
            <img src={landingServiceIcons.contacts} alt="" className="public-service-icon" aria-hidden="true" />
            <h3>Court Officials</h3>
            <p>Contact details for Chief Judges, Supreme Court Justices, and notable Benchers</p>
            <span className="service-link">View Contacts →</span>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Transform Court Operations?</h2>
          <p className="cta-description">Join the digital transformation of the Nigerian legal system</p>
          <div className="cta-buttons">
            <button className="btn btn-light btn-cta" onClick={() => navigate('/login')}>
              Access System <span className="btn-arrow">→</span>
            </button>
            <button className="btn btn-outline btn-cta" onClick={() => navigate('/privacy')}>
              Privacy Policy
            </button>
            <button className="btn btn-outline btn-cta" onClick={() => navigate('/legal-compliance')}>
              Legal & Compliance
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand-block">
            <div className="footer-brand">
              <img src={buildingBankIcon} alt="" className="footer-brand-icon" aria-hidden="true" />
              <div>
                <h3 className="footer-brand-title">NBA LITIGMUS</h3>
                <p>Nigerian Bar Association Case Management System</p>
              </div>
            </div>
            <p className="footer-summary">Secure case workflows, role-based access, and policy-led digital operations for the Nigerian legal system.</p>
          </div>
          <div className="footer-nav-block">
            <div className="footer-links">
              <button onClick={() => navigate('/find-lawyer')}>Find a Lawyer</button>
              <button onClick={() => navigate('/services')}>Services</button>
              <button onClick={() => navigate('/court-updates')}>Court Updates</button>
              <button onClick={() => navigate('/contacts')}>Contacts</button>
            </div>
            <PolicyLinks
              compact
              className="landing-policy-links"
              showOverview={false}
              policyKeys={footerPolicyKeys}
            />
            <button className="footer-compliance-link" onClick={() => navigate('/legal-compliance')}>
              Legal & Compliance <ExternalLink size={14} />
            </button>
          </div>
          <div className="footer-info">
            <p>© 2026 Nigerian Bar Association. All rights reserved.</p>
            <p className="footer-tagline">Justice. Technology. Excellence.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
