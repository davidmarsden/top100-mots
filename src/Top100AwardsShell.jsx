import React from "react";

const MAIN_SITE_URL = "https://smtop100.blog/";
const REGEN_URL = "https://smtop100.blog/regen/";

const GLOBAL_LINKS = [
  { label: "Top 100", href: MAIN_SITE_URL },
  { label: "Top 100 Regen", href: REGEN_URL },
  { label: "About", href: `${MAIN_SITE_URL}about/` },
  { label: "Explore", href: `${MAIN_SITE_URL}explore/` },
];

const AWARDS_LINKS = [
  { label: "Awards home", href: "https://awards.smtop100.blog/" },
  { label: "Vote in the Awards", href: "https://awards.smtop100.blog/vote" },
  { label: "Hall of Fame & history", href: "https://awards.smtop100.blog/history" },
];

export default function Top100AwardsShell({ children }) {
  return (
    <div className="top100-awards-shell">
      <header className="top100-family-header">
        <div className="top100-family-header__inner">
          <a className="top100-family-header__identity" href={MAIN_SITE_URL} aria-label="Visit the Top 100 main site">
            <div className="top100-family-header__wordmark"><span>Top</span><strong>100</strong></div>
            <div className="top100-family-header__pitch-line"><span /><i /><span /></div>
            <div className="top100-family-header__tagline">Managers. Stories. A bigger game.</div>
          </a>

          <div className="top100-family-header__product">
            <span>Top 100</span>
            <strong>Awards</strong>
          </div>

          <nav className="top100-family-header__nav" aria-label="Top 100 public navigation">
            {GLOBAL_LINKS.map((link) => <a key={link.label} href={link.href}>{link.label}</a>)}
          </nav>

          <nav className="top100-family-header__utility" aria-label="Manager account">
            <a className="top100-family-header__manager-link" href="https://manager.smtop100.blog/">Manager sign-in</a>
          </nav>

          <nav className="top100-family-header__local" aria-label="Manager Awards navigation">
            {AWARDS_LINKS.map((link) => <a key={link.label} href={link.href}>{link.label}</a>)}
          </nav>
        </div>
      </header>

      <main className="top100-awards-shell__main">{children}</main>

      <footer className="top100-family-footer">
        <div className="top100-family-footer__inner">
          <div className="top100-family-footer__brand">
            <a className="top100-family-footer__wordmark" href={MAIN_SITE_URL}><span>Top</span><strong>100</strong></a>
            <span>Awards</span>
          </div>
          <nav aria-label="Top 100 footer links">
            <a href={MAIN_SITE_URL}>Top 100</a>
            <a href={REGEN_URL}>Top 100 Regen</a>
            <a href={`${MAIN_SITE_URL}about/`}>About</a>
            <a href={`${MAIN_SITE_URL}explore/`}>Explore</a>
            <a href={`${MAIN_SITE_URL}support/`}>Support</a>
            <a href={`${MAIN_SITE_URL}subscribe/`}>Subscribe</a>
            <a href="https://manager.smtop100.blog/">Manager portal</a>
          </nav>
        </div>
        <div className="top100-family-footer__note">End-of-season Manager Awards voting, Hall of Fame, manager cabinets and Awards history.</div>
      </footer>
    </div>
  );
}
