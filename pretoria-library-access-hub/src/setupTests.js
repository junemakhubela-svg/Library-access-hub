import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  window.location.hash = '';
});

// jsdom does not implement scrolling APIs.
window.scrollTo = () => {};
Element.prototype.scrollIntoView = function scrollIntoView() {};
