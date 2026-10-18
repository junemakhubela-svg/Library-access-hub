/**
 * Navigation.jsx
 * - SkipLink: the first focusable element in the document (WCAG 2.4.1 Bypass Blocks).
 * - Navigation: the main <nav> landmark with aria-current on the active view.
 */

export const NAV_ITEMS = [
  { route: 'home', href: '#/', label: 'Home' },
  { route: 'catalog', href: '#/catalog', label: 'Find resources' },
  { route: 'book', href: '#/book', label: 'Book or register' },
];

/**
 * The app uses hash routing (#/catalog), so a plain href="#main-content" would be
 * interpreted as a route change. We keep the real href (so it still works if JS
 * fails and is announced as a link), but intercept activation and move focus
 * programmatically to <main tabIndex={-1}> via the ref owned by Layout.
 */
export function SkipLink({ targetRef, targetId = 'main-content' }) {
  const handleActivate = (event) => {
    event.preventDefault();
    const target = targetRef?.current ?? document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView?.({ block: 'start' });
    }
  };

  return (
    <a className="skip-link" href={`#${targetId}`} onClick={handleActivate}>
      Skip to main content
    </a>
  );
}

export default function Navigation({ currentRoute }) {
  return (
    <nav className="main-nav" aria-label="Main">
      <ul>
        {NAV_ITEMS.map((item) => {
          const isCurrent = item.route === currentRoute;
          return (
            <li key={item.route}>
              <a href={item.href} aria-current={isCurrent ? 'page' : undefined}>
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
