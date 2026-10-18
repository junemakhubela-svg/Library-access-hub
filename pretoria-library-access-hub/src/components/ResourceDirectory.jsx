import { useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORIES, FEATURES, FORMATS, RESOURCES, getCategory, labelFor } from '../data/resources.js';
import Modal from './Modal.jsx';

const ANNOUNCE_DELAY_MS = 600;

function toggleInList(list, value) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function matchesQuery(resource, query) {
  if (!query) return true;
  const haystack = [
    resource.title,
    resource.summary,
    resource.description,
    resource.location,
    getCategory(resource.category)?.label,
  ]
    .join(' ')
    .toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

/**
 * ResourceDirectory.jsx — searchable, filterable catalogue of library resources.
 *
 * React state → accessibility tree:
 *   activeCategories → aria-pressed on each category toggle button
 *   filtersOpen      → aria-expanded on the "More filters" disclosure + hidden on its panel
 *   isPending        → aria-busy on the results list while the count announcement is debounced
 *   announcement     → text of the role="status" (aria-live="polite") region
 *   selected         → Modal open state; focus moves into the dialog and back to the trigger
 */
export default function ResourceDirectory({ onBook }) {
  const [query, setQuery] = useState('');
  const [activeCategories, setActiveCategories] = useState([]); // empty array = all categories
  const [formats, setFormats] = useState([]);
  const [features, setFeatures] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [announcement, setAnnouncement] = useState('');
  const [isPending, setIsPending] = useState(false);

  const searchRef = useRef(null);
  // Previous result set; comparing values keeps the initial load silent even under StrictMode.
  const previousResults = useRef(null);

  const results = useMemo(
    () =>
      RESOURCES.filter(
        (resource) =>
          matchesQuery(resource, query.trim()) &&
          (activeCategories.length === 0 || activeCategories.includes(resource.category)) &&
          (formats.length === 0 || formats.includes(resource.format)) &&
          features.every((feature) => resource.features.includes(feature)),
      ),
    [query, activeCategories, formats, features],
  );

  const activeFilterCount = activeCategories.length + formats.length + features.length + (query ? 1 : 0);

  // Debounced live-region announcement: typing "digital" should produce ONE
  // announcement after the user pauses, not seven (one per keystroke).
  useEffect(() => {
    if (previousResults.current === null || previousResults.current === results) {
      previousResults.current = results;
      return undefined;
    }
    previousResults.current = results;
    setIsPending(true);
    const timer = window.setTimeout(() => {
      const count = results.length;
      setAnnouncement(
        count === 0
          ? 'No resources match your search. Try removing a filter or using a different keyword.'
          : `${count} of ${RESOURCES.length} resources shown.`,
      );
      setIsPending(false);
    }, ANNOUNCE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [results]);

  const clearAll = () => {
    setQuery('');
    setActiveCategories([]);
    setFormats([]);
    setFeatures([]);
    // The button that was activated stays in place, but returning the user to the
    // start of the search flow is the most useful next focus position.
    searchRef.current?.focus();
  };

  const selectedCategory = selected ? getCategory(selected.category) : null;

  return (
    <div className="directory">
      <section className="filters" aria-labelledby="filters-heading">
        <h2 id="filters-heading">Search and filter</h2>

        <form role="search" aria-label="Library resources" onSubmit={(event) => event.preventDefault()}>
          <div className="form-field">
            <label htmlFor="resource-search">Search by keyword</label>
            <p className="hint" id="resource-search-hint">
              For example: “coding”, “history” or “quiet”. Results update as you type.
            </p>
            <input
              ref={searchRef}
              id="resource-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-describedby="resource-search-hint"
              autoComplete="off"
            />
          </div>
        </form>

        <div className="toggle-group" role="group" aria-labelledby="category-label">
          <p id="category-label" className="group-label">
            Category
          </p>
          <ul className="toggle-list">
            <li>
              <button
                type="button"
                className="toggle"
                aria-pressed={activeCategories.length === 0}
                onClick={() => setActiveCategories([])}
              >
                All resources
              </button>
            </li>
            {CATEGORIES.map((category) => (
              <li key={category.id}>
                <button
                  type="button"
                  className="toggle"
                  aria-pressed={activeCategories.includes(category.id)}
                  onClick={() => setActiveCategories((current) => toggleInList(current, category.id))}
                >
                  {category.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="disclosure">
          <h3 className="disclosure__heading">
            <button
              type="button"
              className="disclosure__button"
              aria-expanded={filtersOpen}
              aria-controls="more-filters-panel"
              onClick={() => setFiltersOpen((open) => !open)}
            >
              <span className="disclosure__icon" aria-hidden="true">
                {filtersOpen ? '−' : '+'}
              </span>
              More filters
              {formats.length + features.length > 0 ? ` (${formats.length + features.length} active)` : ''}
            </button>
          </h3>
          <div id="more-filters-panel" className="disclosure__panel" hidden={!filtersOpen}>
            <fieldset className="checkbox-group">
              <legend>Format</legend>
              {FORMATS.map((format) => (
                <div className="choice" key={format.id}>
                  <input
                    type="checkbox"
                    id={`format-${format.id}`}
                    checked={formats.includes(format.id)}
                    onChange={() => setFormats((current) => toggleInList(current, format.id))}
                  />
                  <label htmlFor={`format-${format.id}`}>{format.label}</label>
                </div>
              ))}
            </fieldset>
            <fieldset className="checkbox-group">
              <legend>Accessibility features</legend>
              <p className="hint">Only show resources that have every feature you tick.</p>
              {FEATURES.map((feature) => (
                <div className="choice" key={feature.id}>
                  <input
                    type="checkbox"
                    id={`feature-${feature.id}`}
                    checked={features.includes(feature.id)}
                    onChange={() => setFeatures((current) => toggleInList(current, feature.id))}
                  />
                  <label htmlFor={`feature-${feature.id}`}>{feature.label}</label>
                </div>
              ))}
            </fieldset>
          </div>
        </div>

        <p>
          <button type="button" className="button button--secondary" onClick={clearAll}>
            Clear all filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </button>
        </p>
      </section>

      <section className="results" aria-labelledby="results-heading">
        <h2 id="results-heading">Results</h2>

        {/* Visible count (static, readable in browse mode) + polite live region (announced).
            Kept separate so the visible text updates instantly while speech is debounced. */}
        <p className="results__count">
          {results.length} of {RESOURCES.length} resources shown
        </p>
        <p className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
          {announcement}
        </p>

        {results.length === 0 ? (
          <div className="empty-state">
            <p>
              <strong>No resources match your search.</strong>
            </p>
            <p>Try removing a filter or using a different keyword.</p>
          </div>
        ) : (
          <ul className="card-grid" aria-busy={isPending} aria-labelledby="results-heading">
            {results.map((resource) => {
              const category = getCategory(resource.category);
              return (
                <li key={resource.id}>
                  <article className="card" aria-labelledby={`card-${resource.id}`}>
                    <p className="badge">{category.singular}</p>
                    <h3 id={`card-${resource.id}`}>{resource.title}</h3>
                    <dl className="meta">
                      <dt>Format</dt>
                      <dd>{labelFor(FORMATS, resource.format)}</dd>
                      <dt>When</dt>
                      <dd>{resource.schedule}</dd>
                      <dt>Where</dt>
                      <dd>{resource.location}</dd>
                    </dl>
                    <p>{resource.summary}</p>
                    <button type="button" className="button button--secondary" onClick={() => setSelected(resource)}>
                      View details<span className="visually-hidden"> for {resource.title}</span>
                    </button>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Modal
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.title ?? ''}
        description={selected?.summary}
      >
        {selected ? (
          <>
            <p className="badge">{selectedCategory.singular}</p>
            <p>{selected.description}</p>
            <dl className="meta">
              <dt>Format</dt>
              <dd>{labelFor(FORMATS, selected.format)}</dd>
              <dt>When</dt>
              <dd>{selected.schedule}</dd>
              <dt>Where</dt>
              <dd>{selected.location}</dd>
              <dt>Availability</dt>
              <dd>{selected.capacity}</dd>
            </dl>
            <h3>Accessibility features</h3>
            <ul>
              {selected.features.map((feature) => (
                <li key={feature}>{labelFor(FEATURES, feature)}</li>
              ))}
            </ul>
            <div className="modal__actions">
              <button
                type="button"
                className="button"
                onClick={() => {
                  const id = selected.id;
                  setSelected(null);
                  onBook?.(id);
                }}
              >
                {selectedCategory.action}
              </button>
            </div>
          </>
        ) : null}
      </Modal>
    </div>
  );
}
