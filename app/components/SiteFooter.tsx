import Link from "next/link";
import { INSIGHT_AI_URL } from "@/lib/supabase";

const SITE_LINKS = [
  { href: "/#devils", label: "Devils" },
  { href: "/#player", label: "Player" },
  { href: "/#schedule", label: "Schedule" },
  { href: "/#archive", label: "Archive" },
  { href: "/#shop", label: "Shop" },
];

const EXTERNAL_LINKS = [
  { href: INSIGHT_AI_URL, label: "Devils Insight AI ↗" },
  { href: "https://www.instagram.com/uac.baseball", label: "Instagram ↗" },
  { href: "https://youtube.com/@utahdevils", label: "YouTube ↗" },
];

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__grid">
          <div>
            <div className="wordmark">
              UTAH <span className="outline-red">DEVILS</span>
            </div>
            <p style={{ marginTop: 10, maxWidth: 260 }}>
              유타대학교 아시아캠퍼스 야구동아리
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
            {EXTERNAL_LINKS.map((l) => (
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
              href="https://www.instagram.com/uac.baseball"
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
