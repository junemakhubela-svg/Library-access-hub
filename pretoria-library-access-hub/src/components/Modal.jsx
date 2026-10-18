import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(',');

/**
 * Modal.jsx — accessible modal dialog (WAI-ARIA Authoring Practices "Dialog (Modal)").
 *
 * Focus lifecycle, all driven by refs:
 *  1. On open: remember document.activeElement (the trigger), move focus to the
 *     dialog title (titleRef.current.focus()) so the screen reader announces
 *     "<title>, dialog, heading level 2".
 *  2. While open: Tab / Shift+Tab cycle within the dialog; the app root receives
 *     `inert` + aria-hidden so neither the mouse, keyboard nor virtual cursor can
 *     reach background content.
 *  3. Escape, the Close button, or a backdrop click call onClose.
 *  4. On close: inert is removed and focus returns to the trigger if it is still
 *     in the document (if a view switch removed it, App moves focus to the new <h1>).
 */
export default function Modal({ isOpen, onClose, title, description, children, appRootId = 'root' }) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef(null);
  const titleRef = useRef(null);
  const onCloseRef = useRef(onClose);

  // Keep the latest onClose without re-running the focus effect on every render.
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const trigger = document.activeElement;
    const appRoot = document.getElementById(appRootId);
    const previousOverflow = document.body.style.overflow;

    // Move focus into the dialog first, then hide the background from AT.
    titleRef.current?.focus();
    if (appRoot && !appRoot.contains(dialogRef.current)) {
      appRoot.setAttribute('inert', '');
      appRoot.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current?.();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;

      const focusable = Array.from(dialogRef.current.querySelectorAll(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) {
        event.preventDefault();
        titleRef.current?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      const focusIsOutside = !dialogRef.current.contains(active);

      if (event.shiftKey) {
        if (active === first || active === titleRef.current || focusIsOutside) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || focusIsOutside) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (appRoot) {
        appRoot.removeAttribute('inert');
        appRoot.removeAttribute('aria-hidden');
      }
      document.body.style.overflow = previousOverflow;
      if (trigger instanceof HTMLElement && trigger.isConnected) {
        trigger.focus();
      }
    };
  }, [isOpen, appRootId]);

  if (!isOpen) return null;

  const handleBackdropMouseDown = (event) => {
    if (event.target === event.currentTarget) onClose();
  };

  return createPortal(
    <div className="modal-backdrop" onMouseDown={handleBackdropMouseDown}>
      <div
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
      >
        <div className="modal__header">
          <h2 id={titleId} ref={titleRef} tabIndex={-1} className="modal__title">
            {title}
          </h2>
          <button type="button" className="button button--secondary modal__close" onClick={onClose}>
            Close
          </button>
        </div>
        {description ? (
          <p id={descriptionId} className="modal__description">
            {description}
          </p>
        ) : null}
        <div className="modal__body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
