import { act, renderHook, waitFor } from '@testing-library/react';
import { useUser } from '@/hooks/useUser';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock fetch
global.fetch = jest.fn();

describe('useUser Hook', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    useUser.getState().setUser(null);
    useUser.getState().setLoading(true);
  });

  test('initializes with null user and loading true', () => {
    const { result } = renderHook(() => useUser());
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  test('setUser updates the user state', () => {
    const { result } = renderHook(() => useUser());
    const mockUser = { id: 1, email: 'test@example.com', full_name: 'Test User' };
    
    act(() => {
      result.current.setUser(mockUser);
    });
    
    expect(result.current.user).toEqual(mockUser);
  });
  
  test('fetchUser sets user to null when no token exists', async () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    
    const { result } = renderHook(() => useUser());
    
    await act(async () => {
      await result.current.fetchUser();
    });
    
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('token');
    expect(fetch).not.toHaveBeenCalled();
  });
  
  test('fetchUser sets user data on successful API response', async () => {
    const mockToken = 'fake-token';
    const mockUserData = { id: 1, email: 'test@example.com', full_name: 'Test User' };
    
    mockLocalStorage.getItem.mockReturnValue(mockToken);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockUserData),
    });
    
    const { result } = renderHook(() => useUser());
    
    await act(async () => {
      await result.current.fetchUser();
    });
    
    expect(result.current.user).toEqual(mockUserData);
    expect(result.current.loading).toBe(false);
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('token');
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/users/me', {
      headers: {
        'Authorization': `Bearer ${mockToken}`,
      },
    });
  });
  
  test('fetchUser handles API error', async () => {
    const mockToken = 'fake-token';
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    mockLocalStorage.getItem.mockReturnValue(mockToken);
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    const { result } = renderHook(() => useUser());
    
    await act(async () => {
      await result.current.fetchUser();
    });
    
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    consoleErrorSpy.mockRestore();
  });
  
  test('fetchUser handles non-OK API response', async () => {
    const mockToken = 'fake-token';
    
    mockLocalStorage.getItem.mockReturnValue(mockToken);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
    });
    
    const { result } = renderHook(() => useUser());
    
    await act(async () => {
      await result.current.fetchUser();
    });
    
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
  });
}); 