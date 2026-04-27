import { Link } from "react-router-dom";

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
    title: "About MPSAJMER CONNECT",
    subtitle:
      "We help alumni, students, and faculty stay connected through mentorship, opportunities, and meaningful community engagement.",
    sections: [
      {
        heading: "Our Mission",
        paragraphs: [
          "MPSAJMER CONNECT is built to strengthen long-term relationships across graduating batches and departments.",
          "We make it easier to share knowledge, discover opportunities, and support one another through every career stage.",
        ],
      },
      {
        heading: "What We Offer",
        paragraphs: [
          "Members can join groups, explore jobs, attend events, and participate in mentorship programs.",
          "Admins and moderators can verify accounts, manage approvals, and maintain a safe community space.",
        ],
      },
    ],
  },
  news: {
    title: "Alumni News",
    subtitle:
      "Latest updates from our alumni community, campus network, and platform improvements.",
    sections: [
      {
        heading: "Community Highlights",
        paragraphs: [
          "We regularly publish alumni achievements, major announcements, and featured stories.",
          "Check back soon as we roll out a richer editorial and newsletter workflow.",
        ],
      },
      {
        heading: "Platform Updates",
        paragraphs: [
          "Recent releases are focused on account security, moderation workflows, and profile quality.",
          "More updates are planned for search, messaging, and event discovery.",
        ],
      },
    ],
  },
  donate: {
    title: "Support The Community",
    subtitle:
      "Your support helps us improve career initiatives, mentorship programs, and alumni outreach.",
    sections: [
      {
        heading: "Why Contributions Matter",
        paragraphs: [
          "Donations help maintain the platform and fund alumni-driven programs.",
          "They also support student mentoring, networking events, and community-led initiatives.",
        ],
      },
      {
        heading: "How To Contribute",
        paragraphs: [
          "To coordinate support, please contact our alumni office at alumni@school.edu.",
          "We will share approved channels and contribution options after verification.",
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    subtitle:
      "This page explains what information we collect, how it is used, and how you can control your data.",
    lastUpdated: "31 March 2026",
    sections: [
      {
        heading: "Data We Collect",
        paragraphs: [
          "We collect account details, profile information, and activity required to provide alumni networking features.",
          "Optional data such as profile images, interests, and mentorship preferences can be updated at any time.",
        ],
      },
      {
        heading: "How We Use Data",
        paragraphs: [
          "Your information is used to authenticate access, personalize your experience, and power community features.",
          "We do not sell personal data. Access is restricted based on role and security controls.",
        ],
      },
      {
        heading: "Your Controls",
        paragraphs: [
          "You can manage profile visibility and notification preferences from account settings.",
          "If you need account deletion or additional support, contact the platform administrators.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    subtitle:
      "By using MPSAJMER CONNECT, you agree to follow community standards and applicable platform rules.",
    lastUpdated: "31 March 2026",
    sections: [
      {
        heading: "Acceptable Use",
        paragraphs: [
          "Use the platform for professional networking, mentorship, and alumni collaboration.",
          "Do not post unlawful, abusive, or misleading content.",
        ],
      },
      {
        heading: "Account Responsibility",
        paragraphs: [
          "You are responsible for keeping your login credentials secure.",
          "Role misuse, impersonation, or unauthorized access attempts may result in suspension.",
        ],
      },
      {
        heading: "Moderation and Enforcement",
        paragraphs: [
          "Admins may review reports, remove harmful content, and suspend accounts that violate policies.",
          "These actions are intended to protect users and preserve trust in the community.",
        ],
      },
    ],
  },
  contact: {
    title: "Contact Us",
    subtitle:
      "Need help with your account, verification, or platform usage? Reach out to the alumni support team.",
    sections: [
      {
        heading: "Support Channels",
        paragraphs: [
          "Email: alumni@school.edu",
          "Phone: (123) 456-7890",
          "Address: 1234 School Avenue, City, State 12345",
        ],
      },
      {
        heading: "When To Contact Us",
        paragraphs: [
          "Use this channel for account approval queries, login access issues, and moderation concerns.",
          "For urgent security matters, include clear details so the team can prioritize quickly.",
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
      <main className="container mx-auto max-w-4xl px-4 py-12">
        <div className="mb-10 rounded-lg border bg-card p-6 shadow-sm sm:p-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{content.title}</h1>
          <p className="mt-3 text-muted-foreground">{content.subtitle}</p>
          {content.lastUpdated ? (
            <p className="mt-4 text-sm text-muted-foreground">Last updated: {content.lastUpdated}</p>
          ) : null}
        </div>

        <div className="space-y-6">
          {content.sections.map((section) => (
            <section key={section.heading} className="rounded-lg border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold">{section.heading}</h2>
              <div className="mt-3 space-y-3">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="leading-relaxed text-muted-foreground">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4 text-sm">
          <Link className="font-medium text-foreground underline-offset-4 hover:underline" to="/">
            Back to home
          </Link>
          <Link className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" to="/privacy">
            Privacy
          </Link>
          <Link className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" to="/terms">
            Terms
          </Link>
          <Link className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" to="/contact">
            Contact
          </Link>
        </div>
      </main>
    </div>
  );
}
