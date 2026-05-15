export const AUTH_TOKEN_KEY = 'nupal_auth_token';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'admin';
}

// Helper function to set cookie
function setCookie(name: string, value: string, days: number = 7) {
  if (typeof window !== 'undefined') {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  }
}

// Helper function to get cookie
function getCookie(name: string): string | null {
  if (typeof window !== 'undefined') {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
  }
  return null;
}

// Helper function to delete cookie
function deleteCookie(name: string) {
  if (typeof window !== 'undefined') {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  }
}

export function setToken(token: string) {
  if (typeof window !== 'undefined') {
    let remember = true;
    try {
        const raw = localStorage.getItem('nupal_student_settings');
        if (raw) {
            remember = JSON.parse(raw).sessionRemember !== false;
        }
    } catch {}

    if (remember) {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
        setCookie('token', token, 7);
    } else {
        sessionStorage.setItem(AUTH_TOKEN_KEY, token);
        // Set session cookie (no expires)
        document.cookie = `token=${token};path=/;SameSite=Lax`;
    }
  }
}

export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    const sessionToken = sessionStorage.getItem(AUTH_TOKEN_KEY);
    if (sessionToken) return sessionToken;
    const localToken = localStorage.getItem(AUTH_TOKEN_KEY);
    if (localToken) return localToken;
    return getCookie('token');
  }
  return null;
}

export function removeToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    deleteCookie('token');
  }
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function parseJwt(token: string): User | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );

    const decoded = JSON.parse(jsonPayload);
    // .NET's ClaimTypes.Role serialises as "role" in JWT
    const role = decoded.role === 'admin' ? 'admin' : 'student';
    return {
      id: decoded.nameid || decoded.sub,
      email: decoded.email,
      name: decoded.unique_name || decoded.name,
      role,
    };
  } catch (e) {
    return null;
  }
}

/** Shortcut: returns 'admin' | 'student' | null (null = not logged in) */
export function getUserRole(): 'admin' | 'student' | null {
  const token = getToken();
  if (!token) return null;
  return parseJwt(token)?.role ?? null;
}
