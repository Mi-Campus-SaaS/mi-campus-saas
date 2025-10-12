import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL } from './config.js';

export function login(username, password) {
  const response = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({
      username: username,
      password: password,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'AuthLogin' },
    }
  );

  const success = check(response, {
    'login status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    'login returns access token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.access_token !== undefined;
      } catch {
        return false;
      }
    },
  });

  if (!success) {
    console.error(`Login failed for ${username}: ${response.status} - ${response.body}`);
    return null;
  }

  try {
    const body = JSON.parse(response.body);
    return {
      accessToken: body.access_token,
      refreshToken: body.refresh_token,
      user: body.user,
    };
  } catch (e) {
    console.error(`Failed to parse login response: ${e.message}`);
    return null;
  }
}

export function refreshToken(refreshToken) {
  const response = http.post(
    `${BASE_URL}/auth/refresh`,
    JSON.stringify({
      refresh_token: refreshToken,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'AuthRefresh' },
    }
  );

  check(response, {
    'refresh status is 200': (r) => r.status === 200,
    'refresh returns new token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.access_token !== undefined;
      } catch {
        return false;
      }
    },
  });

  if (response.status === 200) {
    const body = JSON.parse(response.body);
    return {
      accessToken: body.access_token,
      refreshToken: body.refresh_token,
    };
  }

  return null;
}

export function getAuthHeaders(accessToken) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
  };
}

export function logout(refreshToken, accessToken) {
  const response = http.post(
    `${BASE_URL}/auth/logout`,
    JSON.stringify({
      refresh_token: refreshToken,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      tags: { name: 'AuthLogout' },
    }
  );

  check(response, {
    'logout status is 204': (r) => r.status === 204,
  });

  return response.status === 204;
}

