import { useAuth } from '@clerk/clerk-expo';
import { Platform } from 'react-native';

let API_BASE_URL = process.env.EXPO_PUBLIC_APP_URL || 'https://krishi-web-for-mobile-building.vercel.app/api/';

// Android emulator uses 10.0.2.2 to access the host machine's localhost
if (__DEV__ && Platform.OS === 'android' && API_BASE_URL.includes('localhost')) {
  API_BASE_URL = API_BASE_URL.replace('localhost', '10.0.2.2');
}

export const useApiClient = () => {
  const { getToken } = useAuth();

  const request = async (endpoint: string, options: RequestInit = {}) => {
    try {
      const token = await getToken();

      const headers = new Headers(options.headers);
      headers.set('Content-Type', 'application/json');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok || (data && data.success === false)) {
        throw new Error(data.error || data.message || 'API request failed');
      }

      return data;
    } catch (error: any) {
      console.error(`API Error [${endpoint}]:`, error.message);
      throw error;
    }
  };

  return {
    get: (endpoint: string, options?: RequestInit) => request(endpoint, { ...options, method: 'GET' }),
    post: (endpoint: string, body?: any, options?: RequestInit) => request(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
    put: (endpoint: string, body?: any, options?: RequestInit) => request(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
    del: (endpoint: string, options?: RequestInit) => request(endpoint, { ...options, method: 'DELETE' }),
  };
};
