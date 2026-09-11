import React from "react";

const MAIN_SITE_URL = "https://smtop100.blog/";
const REGEN_URL = "https://smtop100.blog/regen/";

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

          <nav className="top100-family-header__nav" aria-label="Top 100 websites">
            <a href={MAIN_SITE_URL}>Top 100</a>
            <a href="https://archive.smtop100.blog/">Stats &amp; History</a>
            <a href="https://tournaments.smtop100.blog/">Tournaments</a>
            <a href="https://vote.smtop100.blog/">Voting Results</a>
            <a href="https://vote.smtop100.blog/vote">Vote</a>
            <a className="is-current" href="https://awards.smtop100.blog/">Awards</a>
            <a href="https://manager.smtop100.blog/">Manager</a>
            <a href={REGEN_URL}>Regen</a>
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
            <a href="https://archive.smtop100.blog/">Stats &amp; History</a>
            <a href="https://tournaments.smtop100.blog/">Tournaments</a>
            <a href="https://vote.smtop100.blog/">Voting Results</a>
            <a href="https://vote.smtop100.blog/vote">Vote</a>
            <a href={`${MAIN_SITE_URL}rules/`}>Rules</a>
            <a href={`${MAIN_SITE_URL}support/`}>Support</a>
            <a href="https://awards.smtop100.blog/">Awards</a>
            <a href="https://manager.smtop100.blog/">Manager</a>
            <a href={REGEN_URL}>Regen</a>
          </nav>
        </div>
        <div className="top100-family-footer__note">Manager Awards, winners, records and authenticated community voting.</div>
      </footer>
    </div>
  );
}
