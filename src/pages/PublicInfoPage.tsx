import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { Footer } from "@/shared/layout/Footer";

type PublicInfoKey = "about" | "news" | "donate" | "privacy" | "terms" | "contact";

type PublicInfoContent = {
  title: string;
  subtitle: string;
  lastUpdated?: string;
  sections: Array<{
    heading: string;
    paragraphs: string[];
  }>;
};

const PAGE_CONTENT: Record<PublicInfoKey, PublicInfoContent> = {
  about: {
    title: "About Maheshwari Public School, Ajmer Connect",
    subtitle:
      "Bridging the gap between our glorious past and a promising future by keeping the alumni network closely knit.",
    sections: [
      {
        heading: "Our Legacy",
        paragraphs: [
          "As a leading institution, Maheshwari Public School, Ajmer has been a beacon of quality education and holistic development. Our MPS Ajmer alumni network spans the globe, making significant contributions in various fields such as medicine, engineering, civil services, business, and arts.",
          "The official MPS Ajmer Connect platform is an exclusive alumni directory and networking hub designed to bring our diverse and accomplished graduates together on a single platform to foster collaboration, mentorship, and lifelong relationships.",
        ],
      },
      {
        heading: "Our Mission",
        paragraphs: [
          "Our mission is to build a highly engaged and supportive alumni community that actively participates in the growth and development of the school and its students.",
          "Through MPS Ajmer Connect, we aim to provide a secure environment where alumni can reconnect with old friends, share professional opportunities, mentor recent graduates, and stay updated on the latest happenings at their alma mater.",
        ],
      },
      {
        heading: "What We Offer",
        paragraphs: [
          "Alumni can access a comprehensive MPS Ajmer alumni directory, post and apply for exclusive job opportunities, and engage in interest-based community groups.",
          "The platform also hosts a dedicated Mentorship Program, allowing experienced professionals to guide the next generation of MPS graduates.",
        ],
      },
    ],
  },
  news: {
    title: "MPS Ajmer Alumni News",
    subtitle:
      "Stay informed with the latest updates, achievements, and announcements from the MPS Ajmer community.",
    sections: [
      {
        heading: "Community Highlights & Achievements",
        paragraphs: [
          "Our alumni continue to make us proud on the global stage. From groundbreaking research to entrepreneurial success, the MPS Ajmer family is always reaching new heights.",
          "We regularly feature interviews, success stories, and spotlights on alumni who are making a positive impact in their respective industries and communities.",
        ],
      },
      {
        heading: "Campus Updates",
        paragraphs: [
          "While you may have left the campus, the campus never leaves you. We bring you the latest developments from Maheshwari Public School, Ajmer.",
          "Stay updated on infrastructural upgrades, newly introduced academic programs, student achievements, and upcoming annual functions or sports meets.",
        ],
      },
    ],
  },
  donate: {
    title: "Support Maheshwari Public School",
    subtitle:
      "Give back to the institution that shaped your foundation and help us empower the next generation.",
    sections: [
      {
        heading: "Why Give Back?",
        paragraphs: [
          "Your contributions play a vital role in enhancing the educational experience for current students at Maheshwari Public School, Ajmer.",
          "Donations support scholarships for meritorious and underprivileged students, infrastructural advancements, sports facilities, and technology upgrades.",
        ],
      },
      {
        heading: "Contribution Initiatives",
        paragraphs: [
          "Alumni can contribute to specific funds such as the Library Development Fund, the Sports Infrastructure Fund, or directly sponsor a student's education.",
          "We also welcome non-monetary contributions such as volunteering for guest lectures, conducting skill-building workshops, and offering internships.",
        ],
      },
      {
        heading: "How To Donate",
        paragraphs: [
          "To make a financial contribution or to discuss a specialized endowment, please contact the Principal's Office directly.",
          "Reach out to us at mpsajmer123@gmail.com or call 91-145-2641508 to coordinate your support.",
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    subtitle:
      "Your privacy is our priority. This policy outlines how MPS Ajmer Connect collects, utilizes, and safeguards your data.",
    lastUpdated: "09 May 2026",
    sections: [
      {
        heading: "Information Collection",
        paragraphs: [
          "When you register on MPS Ajmer Connect, we collect essential information such as your full name, email address, graduation year, and professional details to verify your alumni status.",
          "We may also collect usage data, including IP addresses, browser types, and interaction metrics, to optimize platform performance and ensure security.",
        ],
      },
      {
        heading: "Use of Information",
        paragraphs: [
          "The primary purpose of collecting your data is to facilitate networking, provide tailored job recommendations, and keep you informed about school events.",
          "Your profile information is visible to other verified alumni to foster connections. We strictly prohibit the selling, renting, or unauthorized sharing of your personal data with third-party marketing agencies.",
        ],
      },
      {
        heading: "Data Protection & Security",
        paragraphs: [
          "We implement industry-standard security measures, including encryption and secure server hosting, to protect your data against unauthorized access, alteration, or disclosure.",
          "Access to backend databases is strictly restricted to authorized administrators of Maheshwari Public School, Ajmer.",
        ],
      },
      {
        heading: "Your Rights and Controls",
        paragraphs: [
          "You hold full control over your profile. You can update your information, adjust visibility settings, or request account deletion at any time through your account dashboard.",
          "If you have concerns regarding your data privacy, please contact the administrators at admin@raghavagarwal.com.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    subtitle:
      "By accessing and using the MPS Ajmer Connect platform, you agree to abide by these terms and community guidelines.",
    lastUpdated: "09 May 2026",
    sections: [
      {
        heading: "Acceptance of Terms",
        paragraphs: [
          "Welcome to the official alumni portal of Maheshwari Public School, Ajmer. By registering an account, you confirm that you are a genuine alumnus/alumna, faculty member, or authorized affiliate of the school.",
          "Falsifying your identity or providing inaccurate graduation details will result in immediate permanent suspension from the platform.",
        ],
      },
      {
        heading: "Community Guidelines & Acceptable Use",
        paragraphs: [
          "MPS Ajmer Connect is a professional and respectful environment. Users must refrain from posting defamatory, abusive, offensive, discriminatory, or unlawful content.",
          "Spamming, unsolicited commercial promotions, and harassment of fellow alumni are strictly prohibited and will be met with strict disciplinary action.",
        ],
      },
      {
        heading: "Intellectual Property & Content Ownership",
        paragraphs: [
          "Users retain ownership of the content they post. However, by posting on this platform, you grant Maheshwari Public School, Ajmer a non-exclusive license to use, display, and distribute the content within the context of the platform.",
          "The platform's branding, logos, and proprietary software are the intellectual property of Maheshwari Public School, Ajmer and the platform developer.",
        ],
      },
      {
        heading: "Moderation and Termination",
        paragraphs: [
          "The administrative team reserves the right to review, edit, or remove any content that violates these Terms of Service without prior notice.",
          "We reserve the right to suspend or terminate accounts that engage in malicious activities, breach security protocols, or violate community standards.",
        ],
      },
    ],
  },
  contact: {
    title: "Contact Maheshwari Public School, Ajmer",
    subtitle:
      "Get in touch with the school administration or the alumni portal support team.",
    sections: [
      {
        heading: "School Contact Information",
        paragraphs: [
          "Address: Maheshwari Public School, Mahesh Path, Capt. D. P. Choudhary Marg, Vaishali Nagar, Ajmer 305004",
          "Phone: 91-145-2641508, 2641351",
          "Email: mpsajmer123@gmail.com",
          "Website: mpsajmer.com",
        ],
      },
      {
        heading: "Visiting Hours",
        paragraphs: [
          "Principal's Office: 9:00 AM to 10:00 AM (On School Days only). At other times, by appointment only.",
          "School's Office: 9:00 AM to 12:00 Noon (On School Days only).",
        ],
      },
      {
        heading: "Technical Support",
        paragraphs: [
          "If you are facing technical issues with the alumni portal, login problems, or need to report a bug, please reach out to the platform manager.",
          "Developer Email: admin@raghavagarwal.com",
        ],
      },
    ],
  },
};

interface PublicInfoPageProps {
  readonly pageKey: PublicInfoKey;
}

export default function PublicInfoPage({ pageKey }: PublicInfoPageProps) {
  const content = PAGE_CONTENT[pageKey];

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={`${content.title} | MPS Ajmer Alumni Connect`} 
        description={content.subtitle} 
        url={`/${pageKey}`} 
      />
      {/* Navigation spacer since navbar is fixed */}
      <div className="h-20"></div>
      
      <main className="container mx-auto max-w-4xl px-4 py-12">
        <div className="mb-10 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-8 md:p-12 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full mix-blend-multiply blur-3xl"></div>
          <div className="relative z-10">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-foreground mb-4">{content.title}</h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">{content.subtitle}</p>
            {content.lastUpdated ? (
              <p className="mt-6 text-sm font-medium text-primary">Last updated: {content.lastUpdated}</p>
            ) : null}
          </div>
        </div>

        <div className="space-y-8">
          {content.sections.map((section) => (
            <section key={section.heading} className="rounded-2xl border border-border/50 bg-card p-8 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                <span className="w-8 h-1 bg-primary rounded-full inline-block"></span>
                {section.heading}
              </h2>
              <div className="space-y-4">
                {section.paragraphs.map((paragraph, idx) => (
                  <p key={idx} className="leading-relaxed text-muted-foreground text-lg">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-center gap-6 text-sm border-t border-border/50 pt-8">
          <Link className="font-semibold text-primary underline-offset-4 hover:underline" to="/">
            Back to Home
          </Link>
          <span className="text-border">|</span>
          <Link className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline transition-colors" to="/privacy">
            Privacy Policy
          </Link>
          <Link className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline transition-colors" to="/terms">
            Terms of Service
          </Link>
          <Link className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline transition-colors" to="/contact">
            Contact Us
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
