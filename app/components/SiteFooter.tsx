import Link from "next/link";
import { INSIGHT_AI_URL } from "@/lib/supabase";
import { getSiteContent, getSiteSettings } from "@/lib/site-content";

const SITE_LINKS = [
  { href: "/#devils", label: "Devils" },
  { href: "/#player", label: "Player" },
  { href: "/#schedule", label: "Schedule" },
  { href: "/#archive", label: "Archive" },
  { href: "/#shop", label: "Shop" },
];

export default async function SiteFooter() {
  const [content, settings] = await Promise.all([getSiteContent(), getSiteSettings()]);
  const externalLinks = [
    { href: INSIGHT_AI_URL, label: "Devils Insight AI ↗" },
    { href: settings.instagram_url, label: "Instagram ↗" },
    { href: settings.youtube_url, label: "YouTube ↗" },
  ];
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__grid">
          <div>
            <div className="wordmark">
              UTAH <span className="outline-red">DEVILS</span>
            </div>
            <p style={{ marginTop: 10, maxWidth: 260 }}>
              {content.footer_about}
            </p>
          </div>
          <div className="site-footer__col">
            <div className="site-footer__head">Site</div>
            {SITE_LINKS.map((l) => (
              <Link key={l.href} href={l.href}>
                {l.label}
              </Link>
            ))}
          </div>
          <div className="site-footer__col">
            <div className="site-footer__head">Links</div>
            {externalLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {l.label}
              </a>
            ))}
          </div>
          <div className="site-footer__col">
            <div className="site-footer__head">Contact</div>
            <span>
              University of Utah Asia Campus
              <br />
              Songdo, Incheon, Korea
            </span>
            <a
              href={settings.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              문의: Instagram DM ↗
            </a>
          </div>
        </div>
        <div className="site-footer__bar">
          <span>
            © {new Date().getFullYear()} UTAH DEVILS BASEBALL CLUB · EST. 2022
          </span>
          <span>SONGDO · INCHEON</span>
        </div>
      </div>
    </footer>
  );
}
