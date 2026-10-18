import { useCallback, useEffect, useRef, useState } from 'react';
import Layout from './components/Layout.jsx';
import ResourceDirectory from './components/ResourceDirectory.jsx';
import LiveForm from './components/LiveForm.jsx';

const SITE_NAME = 'Pretoria Public Library';

const ROUTES = {
  home: { title: 'Home', heading: 'Learn, borrow and connect — on your terms' },
  catalog: { title: 'Find resources', heading: 'Find learning resources' },
  book: { title: 'Book or register', heading: 'Book or register' },
};

/**
 * Hash routes look like "#/catalog". Any other hash (e.g. "#main-content" from the
 * skip link, or "#booking-email" from an error summary link) is NOT a route and returns
 * null, so in-page links never trigger a view switch.
 */
export function routeFromHash(hash) {
  if (hash === '' || hash === '#' || hash === '#/') return 'home';
  if (!hash.startsWith('#/')) return null;
  const segment = hash.slice(2).split(/[/?]/)[0];
  return ROUTES[segment] ? segment : 'home';
}

function HomeView({ onNavigate }) {
  return (
    <>
      <section className="hero" aria-labelledby="hero-intro">
        <p id="hero-intro" className="lead">
          Search free courses, digital archives, community events and study rooms. Every part of this portal works with
          a keyboard and a screen reader.
        </p>
        <p>
          <a className="button" href="#/catalog">
            Find resources
          </a>
        </p>
      </section>

      <section aria-labelledby="services-heading">
        <h2 id="services-heading">What you can do here</h2>
        <ul className="card-grid">
          <li>
            <article className="card" aria-labelledby="svc-courses">
              <h3 id="svc-courses">Enrol in a course</h3>
              <p>Digital skills, languages and job readiness — online or in person.</p>
              <a href="#/catalog">Browse courses</a>
            </article>
          </li>
          <li>
            <article className="card" aria-labelledby="svc-rooms">
              <h3 id="svc-rooms">Reserve a study room</h3>
              <p>Quiet rooms with screen-reader-equipped PCs and step-free access.</p>
              <a href="#/catalog">Browse study rooms</a>
            </article>
          </li>
          <li>
            <article className="card" aria-labelledby="svc-archives">
              <h3 id="svc-archives">Explore digital archives</h3>
              <p>Local history photos, oral histories and newspapers with transcripts.</p>
              <a href="#/catalog">Browse archives</a>
            </article>
          </li>
          <li>
            <article className="card" aria-labelledby="svc-events">
              <h3 id="svc-events">Register for events</h3>
              <p>Author talks, audio-described film screenings and family workshops.</p>
              <a href="#/catalog">Browse events</a>
            </article>
          </li>
        </ul>
      </section>

      <section aria-labelledby="week-heading">
        <h2 id="week-heading">This week at the library</h2>
        <ul className="event-list">
          <li>
            <button type="button" className="link-button" onClick={() => onNavigate('digital-skills')}>
              Book Digital Skills for Work — Tuesday, 18:00
            </button>
          </li>
          <li>
            <button type="button" className="link-button" onClick={() => onNavigate('film-night')}>
              Book Audio-Described Film Night — Friday, 18:30
            </button>
          </li>
          <li>
            <button type="button" className="link-button" onClick={() => onNavigate('coding-club')}>
              Book Family Coding Club — Saturday, 10:00
            </button>
          </li>
        </ul>
      </section>
    </>
  );
}

function Sidebar({ route }) {
  if (route === 'catalog') {
    return (
      <aside className="sidebar" aria-labelledby="aside-heading">
        <h2 id="aside-heading">Accessibility services</h2>
        <p>
          Every branch offers screen readers (NVDA and JAWS), screen magnification, braille embossing and hearing loops.
        </p>
        <p>
          Can’t find what you need? Call <a href="tel:+27105550143">010 555 0143</a>.
        </p>
      </aside>
    );
  }
  if (route === 'book') {
    return (
      <aside className="sidebar" aria-labelledby="aside-heading">
        <h2 id="aside-heading">Need help booking?</h2>
        <p>
          Call <a href="tel:+27105550143">010 555 0143</a> or visit the front desk. Staff can complete the booking with
          you.
        </p>
        <p>There is no time limit on this form.</p>
      </aside>
    );
  }
  return (
    <aside className="sidebar" aria-labelledby="aside-heading">
      <h2 id="aside-heading">Opening hours &amp; access</h2>
      <dl className="meta">
        <dt>Mon–Fri</dt>
        <dd>08:00–19:00</dd>
        <dt>Saturday</dt>
        <dd>09:00–14:00</dd>
        <dt>Sunday</dt>
        <dd>Closed</dd>
      </dl>
      <p>Step-free entrance on Oak Street. Hearing loop at the front desk. Guide dogs welcome.</p>
    </aside>
  );
}

export default function App() {
  const [route, setRoute] = useState(() => routeFromHash(window.location.hash) ?? 'home');
  const [bookingResourceId, setBookingResourceId] = useState('');
  const mainRef = useRef(null);
  const headingRef = useRef(null);
  // Tracks the last route we focused for. Comparing values (rather than a "has mounted"
  // flag) keeps this correct under React StrictMode's double-invoked effects.
  const lastFocusedRoute = useRef(route);

  useEffect(() => {
    const handleHashChange = () => {
      const next = routeFromHash(window.location.hash);
      if (next) setRoute(next);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // View-switch focus management: update the page title, then move focus to the new
  // view's <h1> so screen readers announce where the user has landed. Skipped on first
  // load so the browser's natural "start of page" focus (and the skip link) still work.
  useEffect(() => {
    document.title = `${ROUTES[route].title} | ${SITE_NAME}`;
    if (lastFocusedRoute.current === route) return;
    lastFocusedRoute.current = route;
    window.scrollTo?.(0, 0);
    headingRef.current?.focus();
  }, [route]);

  const goToBooking = useCallback((resourceId) => {
    setBookingResourceId(resourceId ?? '');
    if (window.location.hash === '#/book') {
      // Already on the booking view: hashchange won't fire, so move focus ourselves.
      headingRef.current?.focus();
    } else {
      window.location.hash = '#/book';
    }
  }, []);

  const { heading } = ROUTES[route];

  return (
    <Layout currentRoute={route} mainRef={mainRef} aside={<Sidebar route={route} />}>
      <h1 ref={headingRef} tabIndex={-1} className="page-heading">
        {heading}
      </h1>

      {route === 'home' ? <HomeView onNavigate={goToBooking} /> : null}

      {route === 'catalog' ? (
        <>
          <p className="lead">
            Search courses, digital archives, events and study rooms. Use the category buttons to narrow your results.
          </p>
          <ResourceDirectory onBook={goToBooking} />
        </>
      ) : null}

      {route === 'book' ? (
        <>
          <p className="lead">Reserve a study room, enrol in a course or register for an event.</p>
          {/* key forces a fresh form when a different resource is pre-selected */}
          <LiveForm key={bookingResourceId || 'blank'} initialResourceId={bookingResourceId} />
        </>
      ) : null}
    </Layout>
  );
}
