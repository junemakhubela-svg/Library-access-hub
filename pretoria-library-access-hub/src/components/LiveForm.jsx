import { useEffect, useRef, useState } from 'react';
import { CATEGORIES, RESOURCES, getResource } from '../data/resources.js';

const TIME_SLOTS = [
  { id: 'morning', label: 'Morning (09:00–12:00)' },
  { id: 'afternoon', label: 'Afternoon (12:00–15:00)' },
  { id: 'evening', label: 'Evening (15:00–19:00)' },
];

const MAX_NEEDS_LENGTH = 500;
const MAX_DAYS_AHEAD = 90;

// Order matters: it drives the error summary order, which must match the visual/DOM order.
const FIELDS = [
  { name: 'fullName', label: 'Full name' },
  { name: 'email', label: 'Email address' },
  { name: 'cardNumber', label: 'Library card number' },
  { name: 'resource', label: 'What would you like to book?' },
  { name: 'date', label: 'Preferred date' },
  { name: 'timeSlot', label: 'Time slot' },
  { name: 'attendees', label: 'Number of people attending' },
  { name: 'needs', label: 'Access requirements' },
  { name: 'consent', label: 'Booking terms' },
];

function toLocalISODate(date) {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10);
}

function todayISO() {
  return toLocalISODate(new Date());
}

function maxDateISO() {
  const date = new Date();
  date.setDate(date.getDate() + MAX_DAYS_AHEAD);
  return toLocalISODate(date);
}

function createInitialValues(resourceId) {
  return {
    fullName: '',
    email: '',
    cardNumber: '',
    resource: resourceId && getResource(resourceId) ? resourceId : '',
    date: '',
    timeSlot: '',
    attendees: '1',
    needs: '',
    consent: false,
  };
}

/** Returns an error message, or '' when the field is valid. Messages say how to fix the problem (WCAG 3.3.3). */
export function validateField(name, values) {
  const value = values[name];
  switch (name) {
    case 'fullName':
      if (!value.trim()) return 'Enter your full name.';
      if (value.trim().length < 2) return 'Your full name must be at least 2 characters.';
      return '';
    case 'email':
      if (!value.trim()) return 'Enter your email address.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())) {
        return 'Enter an email address in the correct format, like name@example.com.';
      }
      return '';
    case 'cardNumber': {
      const digits = value.replace(/\s/g, '');
      if (!digits) return 'Enter your library card number.';
      if (!/^\d{8}$/.test(digits)) return 'Your library card number must be exactly 8 digits.';
      return '';
    }
    case 'resource':
      if (!value) return 'Choose a course, event, study room or archive session to book.';
      return '';
    case 'date':
      if (!value) return 'Enter the date you would like to attend.';
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'Enter the date in the format YYYY-MM-DD, for example 2026-11-05.';
      if (value < todayISO()) return 'Choose today’s date or a date in the future.';
      if (value > maxDateISO()) return `Bookings open up to ${MAX_DAYS_AHEAD} days ahead. Choose an earlier date.`;
      return '';
    case 'timeSlot':
      if (!value) return 'Choose a time slot.';
      return '';
    case 'attendees': {
      const trimmed = value.trim();
      if (!/^\d+$/.test(trimmed)) return 'Enter the number of people attending as a whole number from 1 to 8.';
      const count = Number(trimmed);
      if (count < 1 || count > 8) return 'Enter a number of people from 1 to 8.';
      return '';
    }
    case 'needs':
      if (value.length > MAX_NEEDS_LENGTH) {
        return `Access requirements must be ${MAX_NEEDS_LENGTH} characters or fewer. You have ${value.length}.`;
      }
      return '';
    case 'consent':
      if (!value) return 'Confirm that you agree to the library booking terms.';
      return '';
    default:
      return '';
  }
}

function validateAll(values) {
  return FIELDS.reduce((errors, field) => {
    const message = validateField(field.name, values);
    if (message) errors[field.name] = message;
    return errors;
  }, {});
}

/** The element an error summary link should focus (first radio for the radio group). */
function focusTargetId(name) {
  return name === 'timeSlot' ? `booking-timeSlot-${TIME_SLOTS[0].id}` : `booking-${name}`;
}

/** Joins ids for aria-describedby, dropping empty entries. */
function describedBy(...ids) {
  const joined = ids.filter(Boolean).join(' ');
  return joined || undefined;
}

function FieldError({ name, message }) {
  if (!message) return null;
  return (
    <p className="field-error" id={`booking-${name}-error`}>
      <span className="visually-hidden">Error: </span>
      {message}
    </p>
  );
}

/**
 * LiveForm.jsx — accessible booking & registration form with live validation.
 *
 *  - Every control has a <label htmlFor>; hints + errors are linked with aria-describedby.
 *  - aria-invalid={!!errors.field} reflects validation state.
 *  - Field errors are validated on blur and announced through a polite live region.
 *  - On a failed submit, focus moves to an error summary of in-page links.
 *  - While "sending", the form sets aria-busy and the button uses aria-disabled (not
 *    `disabled`, which would drop keyboard focus to <body>).
 *  - On success, focus moves to the confirmation heading and the reference number is announced.
 */
export default function LiveForm({ initialResourceId = '' }) {
  const [values, setValues] = useState(() => createInitialValues(initialResourceId));
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [status, setStatus] = useState('idle'); // idle | submitting | error | success
  const [submitCount, setSubmitCount] = useState(0);
  const [liveMessage, setLiveMessage] = useState('');
  const [confirmation, setConfirmation] = useState(null);

  const errorSummaryRef = useRef(null);
  const successHeadingRef = useRef(null);
  const firstFieldRef = useRef(null);
  const announceTimer = useRef(null);
  const submitTimer = useRef(null);

  useEffect(
    () => () => {
      window.clearTimeout(announceTimer.current);
      window.clearTimeout(submitTimer.current);
    },
    [],
  );

  // Clearing the region first guarantees the same message is re-announced if it repeats.
  const announce = (message) => {
    window.clearTimeout(announceTimer.current);
    setLiveMessage('');
    announceTimer.current = window.setTimeout(() => setLiveMessage(message), 100);
  };

  // Focus management after a failed submit. Depends on submitCount so a second
  // failed attempt moves focus to the summary again.
  useEffect(() => {
    if (status === 'error') errorSummaryRef.current?.focus();
  }, [status, submitCount]);

  useEffect(() => {
    if (status === 'success') successHeadingRef.current?.focus();
  }, [status]);

  const errorEntries = FIELDS.filter((field) => errors[field.name]);

  const updateValue = (name, value) => {
    const nextValues = { ...values, [name]: value };
    setValues(nextValues);
    // Once a field has been visited, re-validate silently as the user corrects it,
    // so the error disappears as soon as it's fixed (no extra announcement).
    if (touched[name]) {
      setErrors((current) => ({ ...current, [name]: validateField(name, nextValues) }));
    }
  };

  const handleChange = (event) => {
    const { name, type, checked, value } = event.target;
    updateValue(name, type === 'checkbox' ? checked : value);
  };

  const validateOnBlur = (name) => {
    const message = validateField(name, values);
    setTouched((current) => ({ ...current, [name]: true }));
    setErrors((current) => ({ ...current, [name]: message }));
    if (message && message !== errors[name]) {
      const label = FIELDS.find((field) => field.name === name)?.label ?? name;
      announce(`${label}: ${message}`);
    }
  };

  const handleBlur = (event) => validateOnBlur(event.target.name);

  // React's onBlur bubbles (focusout); ignore moves between radios in the same group.
  const handleRadioGroupBlur = (event) => {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    validateOnBlur('timeSlot');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (status === 'submitting') return;

    const nextErrors = validateAll(values);
    setErrors(nextErrors);
    setTouched(Object.fromEntries(FIELDS.map((field) => [field.name, true])));

    if (Object.keys(nextErrors).length > 0) {
      setStatus('error');
      setSubmitCount((count) => count + 1);
      return;
    }

    setStatus('submitting');
    announce('Sending your booking…');
    // Simulated network request.
    submitTimer.current = window.setTimeout(() => {
      const resource = getResource(values.resource);
      const reference = `NPL-${Date.now().toString(36).toUpperCase().slice(-6)}`;
      const slot = TIME_SLOTS.find((item) => item.id === values.timeSlot);
      setConfirmation({ reference, resource, date: values.date, slot, email: values.email.trim() });
      setStatus('success');
      announce(`Booking confirmed. Your reference is ${reference.split('').join(' ')}.`);
    }, 800);
  };

  const handleSummaryLink = (event, name) => {
    event.preventDefault();
    const target = document.getElementById(focusTargetId(name));
    target?.focus();
    target?.scrollIntoView?.({ block: 'center' });
  };

  const resetForm = () => {
    setValues(createInitialValues(''));
    setErrors({});
    setTouched({});
    setConfirmation(null);
    setStatus('idle');
    announce('');
    // Wait for the form to re-render before focusing its first field.
    window.setTimeout(() => firstFieldRef.current?.focus(), 0);
  };

  const selectedResource = getResource(values.resource);
  const isSubmitting = status === 'submitting';

  const liveRegion = (
    <div className="visually-hidden" role="status" aria-live="polite" aria-atomic="true" data-testid="form-live-region">
      {liveMessage}
    </div>
  );

  // The live region lives OUTSIDE both branches so it stays mounted when the form is
  // swapped for the confirmation; a freshly inserted live region is often not announced.
  return (
    <>
      {status === 'success' && confirmation ? (
        <section className="confirmation" aria-labelledby="confirmation-heading">
          <h2 id="confirmation-heading" ref={successHeadingRef} tabIndex={-1}>
            Booking confirmed
          </h2>
          <p>
            Your reference number is <strong className="reference">{confirmation.reference}</strong>.
          </p>
          <dl className="meta">
            <dt>Booking</dt>
            <dd>{confirmation.resource?.title}</dd>
            <dt>Date</dt>
            <dd>{confirmation.date}</dd>
            <dt>Time</dt>
            <dd>{confirmation.slot?.label}</dd>
          </dl>
          <p>We have sent a confirmation to {confirmation.email}. Bring your library card on the day.</p>
          <p>
            <button type="button" className="button" onClick={resetForm}>
              Make another booking
            </button>
          </p>
        </section>
      ) : (
        <section className="booking" aria-labelledby="booking-form-heading">
          <h2 id="booking-form-heading">Your booking details</h2>

          {status === 'error' && errorEntries.length > 0 ? (
            <div className="error-summary" ref={errorSummaryRef} tabIndex={-1} aria-labelledby="error-summary-heading">
              <h3 id="error-summary-heading">
                There is a problem with your booking: {errorEntries.length}{' '}
                {errorEntries.length === 1 ? 'error' : 'errors'}
              </h3>
              <ul>
                {errorEntries.map((field) => (
                  <li key={field.name}>
                    <a href={`#${focusTargetId(field.name)}`} onClick={(event) => handleSummaryLink(event, field.name)}>
                      {errors[field.name]}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <form noValidate onSubmit={handleSubmit} aria-labelledby="booking-form-heading" aria-busy={isSubmitting}>
            <p className="form-intro">All fields are required unless marked optional.</p>

            <div className="form-field">
              <label htmlFor="booking-fullName">Full name</label>
              <FieldError name="fullName" message={errors.fullName} />
              <input
                ref={firstFieldRef}
                id="booking-fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                value={values.fullName}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-required="true"
                aria-invalid={!!errors.fullName}
                aria-describedby={describedBy(errors.fullName && 'booking-fullName-error')}
              />
            </div>

            <div className="form-field">
              <label htmlFor="booking-email">Email address</label>
              <p className="hint" id="booking-email-hint">
                We’ll send your confirmation and any changes here.
              </p>
              <FieldError name="email" message={errors.email} />
              <input
                id="booking-email"
                name="email"
                type="email"
                autoComplete="email"
                spellCheck={false}
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-required="true"
                aria-invalid={!!errors.email}
                aria-describedby={describedBy('booking-email-hint', errors.email && 'booking-email-error')}
              />
            </div>

            <div className="form-field">
              <label htmlFor="booking-cardNumber">Library card number</label>
              <p className="hint" id="booking-cardNumber-hint">
                8 digits, printed on the back of your card. Spaces are fine.
              </p>
              <FieldError name="cardNumber" message={errors.cardNumber} />
              <input
                id="booking-cardNumber"
                name="cardNumber"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                className="input--short"
                value={values.cardNumber}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-required="true"
                aria-invalid={!!errors.cardNumber}
                aria-describedby={describedBy(
                  'booking-cardNumber-hint',
                  errors.cardNumber && 'booking-cardNumber-error',
                )}
              />
            </div>

            <div className="form-field">
              <label htmlFor="booking-resource">What would you like to book?</label>
              <p className="hint" id="booking-resource-hint">
                Choose a course, event, study room or archive research session.
              </p>
              <FieldError name="resource" message={errors.resource} />
              <select
                id="booking-resource"
                name="resource"
                value={values.resource}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-required="true"
                aria-invalid={!!errors.resource}
                aria-describedby={describedBy(
                  'booking-resource-hint',
                  selectedResource && 'booking-resource-summary',
                  errors.resource && 'booking-resource-error',
                )}
              >
                <option value="">Select an option</option>
                {CATEGORIES.map((category) => (
                  <optgroup key={category.id} label={category.label}>
                    {RESOURCES.filter((resource) => resource.category === category.id).map((resource) => (
                      <option key={resource.id} value={resource.id}>
                        {resource.title}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {selectedResource ? (
                <p className="selected-summary" id="booking-resource-summary">
                  {selectedResource.schedule}. {selectedResource.location}.
                </p>
              ) : null}
            </div>

            <div className="form-field">
              <label htmlFor="booking-date">Preferred date</label>
              <p className="hint" id="booking-date-hint">
                Today or up to {MAX_DAYS_AHEAD} days ahead. You can type the date as YYYY-MM-DD.
              </p>
              <FieldError name="date" message={errors.date} />
              <input
                id="booking-date"
                name="date"
                type="date"
                className="input--short"
                min={todayISO()}
                max={maxDateISO()}
                value={values.date}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-required="true"
                aria-invalid={!!errors.date}
                aria-describedby={describedBy('booking-date-hint', errors.date && 'booking-date-error')}
              />
            </div>

            <fieldset
              className="form-field"
              onBlur={handleRadioGroupBlur}
              aria-describedby={describedBy(errors.timeSlot && 'booking-timeSlot-error')}
            >
              <legend>Time slot</legend>
              <FieldError name="timeSlot" message={errors.timeSlot} />
              {TIME_SLOTS.map((slot) => (
                <div className="choice" key={slot.id}>
                  <input
                    type="radio"
                    id={`booking-timeSlot-${slot.id}`}
                    name="timeSlot"
                    value={slot.id}
                    checked={values.timeSlot === slot.id}
                    onChange={handleChange}
                    aria-invalid={!!errors.timeSlot}
                  />
                  <label htmlFor={`booking-timeSlot-${slot.id}`}>{slot.label}</label>
                </div>
              ))}
            </fieldset>

            <div className="form-field">
              <label htmlFor="booking-attendees">Number of people attending</label>
              <p className="hint" id="booking-attendees-hint">
                Including you. From 1 to 8.
              </p>
              <FieldError name="attendees" message={errors.attendees} />
              <input
                id="booking-attendees"
                name="attendees"
                type="text"
                inputMode="numeric"
                className="input--tiny"
                value={values.attendees}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-required="true"
                aria-invalid={!!errors.attendees}
                aria-describedby={describedBy('booking-attendees-hint', errors.attendees && 'booking-attendees-error')}
              />
            </div>

            <div className="form-field">
              <label htmlFor="booking-needs">Access requirements (optional)</label>
              <p className="hint" id="booking-needs-hint">
                Tell us anything that helps us prepare, such as a guide dog, braille handouts or a quiet space.{' '}
                {values.needs.length} of {MAX_NEEDS_LENGTH} characters used.
              </p>
              <FieldError name="needs" message={errors.needs} />
              <textarea
                id="booking-needs"
                name="needs"
                rows={4}
                value={values.needs}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={!!errors.needs}
                aria-describedby={describedBy('booking-needs-hint', errors.needs && 'booking-needs-error')}
              />
            </div>

            <div className="form-field">
              <FieldError name="consent" message={errors.consent} />
              <div className="choice">
                <input
                  id="booking-consent"
                  name="consent"
                  type="checkbox"
                  checked={values.consent}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  aria-required="true"
                  aria-invalid={!!errors.consent}
                  aria-describedby={describedBy('booking-consent-hint', errors.consent && 'booking-consent-error')}
                />
                <label htmlFor="booking-consent">I agree to the library booking terms</label>
              </div>
              <p className="hint" id="booking-consent-hint">
                Cancel at least 24 hours ahead so someone else can use your place.
              </p>
            </div>

            <button type="submit" className="button" aria-disabled={isSubmitting}>
              {isSubmitting ? 'Sending booking…' : 'Confirm booking'}
            </button>
          </form>
        </section>
      )}
      {liveRegion}
    </>
  );
}
