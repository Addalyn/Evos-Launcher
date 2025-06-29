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

describe('App', () => {
  it('should render', () => {
    expect(render(<App />)).toBeTruthy();
  });
});
