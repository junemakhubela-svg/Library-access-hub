import Navigation, { SkipLink } from './Navigation.jsx';

/**
 * Layout.jsx — the semantic landmark shell.
 *
 * Landmark map (what NVDA's "D" key and VoiceOver's rotor will list):
 *   banner        <header>
 *   navigation    <nav aria-label="Main">
 *   main          <main id="main-content" tabIndex={-1}>
 *   complementary <aside> (sibling of <main>, never nested inside it)
 *   contentinfo   <footer>
 *
 * The skip link is rendered before the header so it is the very first Tab stop.
 */
export default function Layout({ currentRoute, mainRef, aside, children }) {
  return (
    <>
      <SkipLink targetRef={mainRef} />

      <header className="site-header">
        <div className="container header-inner">
          <p className="site-title">
            <a href="#/">
              Pretoria Public Library
              <span>Adaptive Learning &amp; Resource Portal</span>
            </a>
          </p>
          <Navigation currentRoute={currentRoute} />
        </div>
      </header>

      <div className="page-grid">
        <main id="main-content" ref={mainRef} tabIndex={-1} className="site-main">
          {children}
        </main>
        {aside}
      </div>

      <footer className="site-footer">
        <div className="container">
          <p>
            <strong>Pretoria Public Library</strong> · 12 Oak Street, Pretoria ·{' '}
            <a href="tel:+27105550143">010 555 0143</a>
          </p>
          <ul className="footer-links">
            <li>
              <a href="#/">Accessibility statement</a>
            </li>
            <li>
              <a href="#/">Contact us</a>
            </li>
            <li>
              <a href="#/">Privacy</a>
            </li>
          </ul>
          <p className="footer-note">
            A service of the City of Tshwane Metropolitan Municipality. Prototype for ticket MD-2026-0143. Found an accessibility barrier? Tell the
            front desk or call us — we fix reported issues within 10 working days.
          </p>
        </div>
      </footer>
    </>
  );
}
