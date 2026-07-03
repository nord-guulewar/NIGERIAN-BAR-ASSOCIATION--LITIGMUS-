export const TAB_AUTH_ACTIVE_KEY = 'tabAuthActive';
export const TAB_TOKEN_KEY = 'tabToken';
export const TAB_USER_KEY = 'tabUser';

export const getSessionToken = () => {
  const tabActive = sessionStorage.getItem(TAB_AUTH_ACTIVE_KEY) === 'true';
  return tabActive ? sessionStorage.getItem(TAB_TOKEN_KEY) : null;
};

export const getSessionUser = () => {
  const tabActive = sessionStorage.getItem(TAB_AUTH_ACTIVE_KEY) === 'true';
  if (!tabActive) return null;

  const rawUser = sessionStorage.getItem(TAB_USER_KEY);
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser);
  } catch (error) {
    return null;
  }
};

export const clearStoredSession = () => {
  sessionStorage.removeItem(TAB_AUTH_ACTIVE_KEY);
  sessionStorage.removeItem(TAB_TOKEN_KEY);
  sessionStorage.removeItem(TAB_USER_KEY);
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};