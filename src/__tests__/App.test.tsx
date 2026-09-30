/**
 * @fileoverview Unit tests for the main App component
 * Tests the basic rendering functionality of the Evos Launcher main application component.
 * Ensures the App component mounts and renders correctly in the test environment.
 * @author Evos Launcher Team
 * @since 1.0.0
 */

import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import App from '../renderer/App';

jest.mock('axios', () => {
  const instance = {
    defaults: { baseURL: '' },
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
    get: jest.fn().mockResolvedValue({ data: [] }),
    post: jest.fn().mockResolvedValue({ data: {} }),
  };
  return {
    __esModule: true,
    default: {
      ...instance,
      create: jest.fn(() => instance),
    },
    ...instance,
    create: jest.fn(() => instance),
  };
});

const storage: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => storage[key] || null,
  setItem: (key: string, value: string) => {
    storage[key] = value.toString();
  },
  removeItem: (key: string) => {
    delete storage[key];
  },
  clear: () => {
    Object.keys(storage).forEach((k) => delete storage[k]);
  },
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('App', () => {
  it('should render', () => {
    expect(render(<App />)).toBeTruthy();
  });
});
