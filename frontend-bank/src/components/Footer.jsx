const SECTIONS = [
  { title: 'Personal Banking', links: ['Savings Account','Fixed Deposits','Personal Loans','Credit Cards','Insurance','Demat Account'] },
  { title: 'Quick Links',      links: ['Locate ATM','Locate Branch','Interest Rates','Forex Rates','IFSC Code Finder','EMI Calculator'] },
  { title: 'Security',         links: ['Safe Banking Tips','Report Phishing','Report Fraud','Privacy Policy','Terms & Conditions','Grievance Redressal'] },
  { title: 'Contact Us',       links: ['Customer Care: 1800-202-6161','Email Support','Chat with Us','Feedback','Complaints','NRI Services'] },
]

export default function Footer() {
  return (
    <footer>
      <div className="footer-inner">
        <div className="footer-grid">
          {SECTIONS.map(({ title, links }) => (
            <div className="footer-section" key={title}>
              <h4>{title}</h4>
              {links.map(link => (
                <a key={link} href="#" className="footer-link">{link}</a>
              ))}
            </div>
          ))}
        </div>

        <div className="footer-bottom">
          <div className="footer-copyright">
            &copy; 2024 HDFC Bank Ltd. All Rights Reserved. CIN: L65920MH1994PLC080618<br />
            HDFC Bank House, Senapati Bapat Marg, Lower Parel, Mumbai — 400013. RBI License No. MH0000047.
          </div>
          <div className="footer-trust-badges">
            <div className="trust-badge">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="11" width="18" height="11" rx="2" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"/>
                <path d="M7 11V7a5 5 0 0110 0v4" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              256-bit SSL
            </div>
            <div className="trust-badge">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"/>
              </svg>
              DICGC Insured
            </div>
            <div className="trust-badge">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"/>
                <path d="M9 12l2 2 4-4" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              RBI Regulated
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
