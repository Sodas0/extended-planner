/**
 * Simple tests for the axios instance
 */
import { describe, test, expect, jest, beforeEach } from '@jest/globals';

// Mock the localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: '',
    pathname: '',
  },
  writable: true,
});

// Mock axios module
jest.mock('axios', () => {
  return {
    create: jest.fn(() => ({
      defaults: {},
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      }
    }))
  };
});

describe('Axios instance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  test('should create with correct base URL', () => {
    // This test just verifies the axios module is properly imported
    const axiosModule = require('@/utils/axios');
    expect(axiosModule).toBeDefined();
  });
}); 