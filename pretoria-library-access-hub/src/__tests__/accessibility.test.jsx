import { describe, expect, it } from 'vitest';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import App from '../App.jsx';
import LiveForm from '../components/LiveForm.jsx';
import ResourceDirectory from '../components/ResourceDirectory.jsx';

/**
 * Runs axe-core against a DOM node with the WCAG 2.0/2.1 A/AA rule sets plus best practices.
 * color-contrast is disabled here ONLY because jsdom has no layout/rendering engine;
 * contrast is verified in a real browser with Lighthouse (see README §4).
 */
async function runAxe(node, { region = true } = {}) {
  const results = await axe.run(node, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] },
    rules: {
      'color-contrast': { enabled: false },
      region: { enabled: region },
    },
  });
  return results.violations.map((violation) => `${violation.id}: ${violation.help} (${violation.nodes.length})`);
}

describe('App shell', () => {
  it('has no axe violations on the home view', async () => {
    render(<App />);
    expect(await runAxe(document.body)).toEqual([]);
  });

  it('exposes the expected landmarks and a single h1', () => {
    render(<App />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
    expect(screen.getByRole('complementary')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('makes the skip link the first tab stop and moves focus to <main>', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.tab();
    const skip = screen.getByRole('link', { name: 'Skip to main content' });
    expect(skip).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('marks the current view with aria-current and moves focus to the new h1 on view switch', async () => {
    const user = userEvent.setup();
    render(<App />);
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(within(nav).getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');

    await user.click(within(nav).getByRole('link', { name: 'Find resources' }));
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: 'Find learning resources' })).toHaveFocus(),
    );
    expect(within(nav).getByRole('link', { name: 'Find resources' })).toHaveAttribute('aria-current', 'page');
    expect(document.title).toBe('Find resources | Pretoria Public Library');
    expect(await runAxe(document.body)).toEqual([]);
  });
});

describe('ResourceDirectory', () => {
  it('has no axe violations', async () => {
    const { container } = render(<ResourceDirectory />);
    expect(await runAxe(container, { region: false })).toEqual([]);
  });

  it('updates aria-pressed on category toggles in real time', async () => {
    const user = userEvent.setup();
    render(<ResourceDirectory />);
    const all = screen.getByRole('button', { name: 'All resources' });
    const rooms = screen.getByRole('button', { name: 'Study rooms' });

    expect(all).toHaveAttribute('aria-pressed', 'true');
    expect(rooms).toHaveAttribute('aria-pressed', 'false');

    await user.click(rooms);
    expect(rooms).toHaveAttribute('aria-pressed', 'true');
    expect(all).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('3 of 12 resources shown')).toBeInTheDocument();

    await user.click(all);
    expect(all).toHaveAttribute('aria-pressed', 'true');
    expect(rooms).toHaveAttribute('aria-pressed', 'false');
  });

  it('toggles aria-expanded and the hidden panel on the "More filters" disclosure via keyboard', async () => {
    const user = userEvent.setup();
    render(<ResourceDirectory />);
    const disclosure = screen.getByRole('button', { name: /More filters/ });
    const panel = document.getElementById(disclosure.getAttribute('aria-controls'));

    expect(disclosure).toHaveAttribute('aria-expanded', 'false');
    expect(panel).not.toBeVisible();

    disclosure.focus();
    await user.keyboard('{Enter}');
    expect(disclosure).toHaveAttribute('aria-expanded', 'true');
    expect(panel).toBeVisible();

    await user.keyboard(' ');
    expect(disclosure).toHaveAttribute('aria-expanded', 'false');
  });

  it('announces the result count through a polite live region after typing', async () => {
    const user = userEvent.setup();
    render(<ResourceDirectory />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveTextContent('');

    await user.type(screen.getByRole('searchbox', { name: 'Search by keyword' }), 'digital');
    await waitFor(() => expect(status).toHaveTextContent('4 of 12 resources shown.'), { timeout: 2000 });
  });

  it('opens a modal dialog, focuses its title, traps Tab, closes on Escape and restores focus', async () => {
    const user = userEvent.setup();
    render(<ResourceDirectory />);
    const trigger = screen.getByRole('button', { name: 'View details for Quiet Study Room A' });
    await user.click(trigger);

    const dialog = screen.getByRole('dialog', { name: 'Quiet Study Room A' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(within(dialog).getByRole('heading', { level: 2, name: 'Quiet Study Room A' })).toHaveFocus();
    expect(await runAxe(dialog, { region: false })).toEqual([]);

    const close = within(dialog).getByRole('button', { name: 'Close' });
    const action = within(dialog).getByRole('button', { name: 'Reserve this room' });
    await user.tab();
    expect(close).toHaveFocus();
    await user.tab();
    expect(action).toHaveFocus();
    await user.tab(); // wraps back to the first control: no escape from the dialog
    expect(close).toHaveFocus();
    await user.tab({ shift: true }); // and wraps backwards
    expect(action).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});

describe('LiveForm', () => {
  it('has no axe violations in its initial state', async () => {
    const { container } = render(<LiveForm />);
    expect(await runAxe(container, { region: false })).toEqual([]);
  });

  it('associates every control with a label', () => {
    render(<LiveForm />);
    [
      'Full name',
      'Email address',
      'Library card number',
      'What would you like to book?',
      'Preferred date',
      'Number of people attending',
      'Access requirements (optional)',
      'I agree to the library booking terms',
    ].forEach((label) => expect(screen.getByLabelText(label)).toBeInTheDocument());
  });

  it('on an empty submit: sets aria-invalid, links errors via aria-describedby, and focuses the error summary', async () => {
    const user = userEvent.setup();
    const { container } = render(<LiveForm />);
    await user.click(screen.getByRole('button', { name: 'Confirm booking' }));

    const summaryHeading = screen.getByRole('heading', { name: /There is a problem with your booking/ });
    expect(summaryHeading.parentElement).toHaveFocus();

    const card = screen.getByLabelText('Library card number');
    expect(card).toHaveAttribute('aria-invalid', 'true');
    expect(card.getAttribute('aria-describedby')).toContain('booking-cardNumber-error');
    expect(card).toHaveAccessibleDescription(/Enter your library card number/);

    // Summary links move focus straight to the field.
    await user.click(screen.getByRole('link', { name: 'Enter your library card number.' }));
    expect(card).toHaveFocus();

    expect(await runAxe(container, { region: false })).toEqual([]);
  });

  it('announces a field error in the live region when the user leaves an invalid field', async () => {
    const user = userEvent.setup();
    render(<LiveForm />);
    const live = screen.getByTestId('form-live-region');
    expect(live).toHaveAttribute('aria-live', 'polite');

    await user.type(screen.getByLabelText('Library card number'), '1234');
    await user.tab();
    await waitFor(() =>
      expect(live).toHaveTextContent('Library card number: Your library card number must be exactly 8 digits.'),
    );
    expect(screen.getByLabelText('Library card number')).toHaveAttribute('aria-invalid', 'true');

    // Fixing the value clears the error state without another announcement.
    await user.type(screen.getByLabelText('Library card number'), '5678');
    expect(screen.getByLabelText('Library card number')).toHaveAttribute('aria-invalid', 'false');
  });

  it('completes a valid booking, focuses the confirmation and announces the reference', async () => {
    const user = userEvent.setup();
    render(<LiveForm initialResourceId="room-a" />);
    const today = new Date();
    today.setDate(today.getDate() + 3);
    const offset = today.getTimezoneOffset() * 60000;
    const futureDate = new Date(today.getTime() - offset).toISOString().slice(0, 10);

    expect(screen.getByLabelText('What would you like to book?')).toHaveValue('room-a');
    await user.type(screen.getByLabelText('Full name'), 'Thandiwe Mokoena');
    await user.type(screen.getByLabelText('Email address'), 'thandiwe@example.com');
    await user.type(screen.getByLabelText('Library card number'), '1234 5678');
    await act(async () => {
      const date = screen.getByLabelText('Preferred date');
      await user.clear(date);
      await user.type(date, futureDate);
    });
    await user.click(screen.getByLabelText('Afternoon (12:00–15:00)'));
    await user.click(screen.getByLabelText('I agree to the library booking terms'));
    await user.click(screen.getByRole('button', { name: 'Confirm booking' }));

    const heading = await screen.findByRole('heading', { name: 'Booking confirmed' }, { timeout: 2000 });
    expect(heading).toHaveFocus();
    await waitFor(() =>
      expect(screen.getByTestId('form-live-region')).toHaveTextContent(/Booking confirmed\. Your reference is/),
    );
  });
});
