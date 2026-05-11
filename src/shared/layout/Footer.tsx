import { Link } from "react-router-dom";

interface FooterProps {
  showFullFooter?: boolean;
  isLandingPage?: boolean;
}

export const Footer = ({ showFullFooter = false, isLandingPage = false }: FooterProps) => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className={`border-t border-border px-4 pt-8 pb-24 md:pb-8 bg-card/50 backdrop-blur-sm relative z-10 ${isLandingPage ? 'pt-20 pb-16 md:pb-10 bg-card' : ''}`}>
      <div className="container mx-auto px-4 max-w-5xl">
        {showFullFooter && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="MPS Ajmer Logo" className="w-8 h-8" />
                <span className="text-xl font-bold">Maheshwari Public School, Ajmer</span>
              </div>
              <div className="text-muted-foreground leading-relaxed space-y-2 text-sm">
                <p className="font-semibold text-foreground">Contact Us</p>
                <p>Address<br />Maheshwari Public School<br />Mahesh Path, Capt. D. P. Choudhary Marg,<br />Vaishali Nagar, Ajmer 305004</p>
                <p>Phone: 91-145-2641508, 2641351</p>
                <p>Website: <a href="https://mpsajmer.com" className="hover:text-primary transition-colors">mpsajmer.com</a></p>
                <p>E-mail: mpsajmer123@gmail.com</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="text-muted-foreground leading-relaxed space-y-2 text-sm mt-0 md:mt-14">
                <p className="font-semibold text-foreground">Principal's Office visiting hours</p>
                <p>(On School Days only)<br />9.00 am. to 10.00 am.<br />(At other time by appointment only)</p>

                <p className="font-semibold text-foreground mt-4">Schools Office Hours</p>
                <p>(On School Days only)<br />9.00 a.m to 12.00 Noon</p>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-6 text-foreground">Platform</h4>
              <ul className="space-y-4">
                <li><Link to="/directory" className="text-muted-foreground hover:text-primary transition-colors">Directory</Link></li>
                <li><Link to="/jobs" className="text-muted-foreground hover:text-primary transition-colors">Job Board</Link></li>
                <li><Link to="/mentorship" className="text-muted-foreground hover:text-primary transition-colors">Mentorship</Link></li>
                <li><Link to="/events" className="text-muted-foreground hover:text-primary transition-colors">Events</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-6 text-foreground">Support & Links</h4>
              <ul className="space-y-4">
                <li><Link to="/faq" className="text-muted-foreground hover:text-primary transition-colors">FAQ</Link></li>
                <li><Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors">Contact Us</Link></li>
                <li><Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
        )}

        <div className={`flex flex-col md:flex-row justify-between items-center gap-6 ${showFullFooter ? 'pt-8 border-t border-border' : ''}`}>
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Logo" className="w-6 h-6 opacity-80" />
              <a href="https://mpsajmer.com" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-foreground/80 tracking-tight hover:text-primary transition-colors">
                Maheshwari Public School, Ajmer
              </a>
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-medium">
              &copy; 1989 - {currentYear} All rights reserved.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-1">
            <p className="text-xs text-muted-foreground font-medium">
              Developed & Managed by <a href="https://raghavagarwal.com" target="_blank" rel="noopener noreferrer" className="text-foreground font-semibold hover:text-primary transition-colors hover:underline">Raghav Agarwal</a>
            </p>
            <div className="text-[10px] text-muted-foreground/60 flex flex-wrap justify-center md:justify-end gap-x-2 gap-y-1">
              <a href="mailto:admin@raghavagarwal.com" className="hover:text-primary transition-colors hover:underline">admin@raghavagarwal.com</a>
              <span className="hidden sm:inline text-muted-foreground/30">|</span>
              <a href="https://raghavagarwal.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors hover:underline">raghavagarwal.com</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
