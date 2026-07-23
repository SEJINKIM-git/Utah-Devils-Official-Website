import { INSIGHT_AI_URL } from "@/lib/supabase";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <div>
          <div className="wordmark">
            UTAH <span className="outline-red">DEVILS</span>
          </div>
          <p style={{ marginTop: 8 }}>
            유타대학교 아시아캠퍼스 야구동아리 Utah Devils Baseball Club
          </p>
        </div>
        <div className="site-footer__meta">
          <div>
            <a href={INSIGHT_AI_URL} target="_blank" rel="noopener noreferrer">
              DEVILS INSIGHT AI ↗
            </a>
          </div>
          <div style={{ marginTop: 6 }}>© UTAH DEVILS BASEBALL CLUB</div>
        </div>
      </div>
    </footer>
  );
}
