import Keychain from 'react-native-keychain';
import { authorize, refresh } from 'react-native-app-auth';
import { AZURE_CLIENT_ID, AZURE_TENANT_ID } from '@env';

const CLIENT_ID = AZURE_CLIENT_ID;
const TENANT_ID = AZURE_TENANT_ID;
const VENZO_DOMAIN = '@venzotechnologies.com';

const AUTHORITY = `https://login.microsoftonline.com/${TENANT_ID}`;
const REDIRECT_URI = 'com.venzo.sitsure://auth';
const SCOPES = ['openid', 'profile', 'email', 'User.Read', 'User.ReadBasic.All'];

export const authConfig = {
  issuer: `${AUTHORITY}/v2.0`,
  clientId: CLIENT_ID,
  redirectUrl: REDIRECT_URI,
  scopes: SCOPES,
  serviceConfiguration: {
    authorizationEndpoint: `${AUTHORITY}/oauth2/v2.0/authorize`,
    tokenEndpoint: `${AUTHORITY}/oauth2/v2.0/token`,
  },
  usePKCE: true,
};

export async function signInWithMicrosoft() {
  return authorize(authConfig);
}

export async function refreshAccessToken(refreshToken) {
  return refresh(authConfig, { refreshToken });
}

export function parseIdToken(idToken) {
  try {
    const payload = idToken.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function validateDomain(email) {
  return email && email.toLowerCase().endsWith(VENZO_DOMAIN);
}

const KEYCHAIN_SERVICE = 'com.venzo.sitsure';

export async function storeTokens({ accessToken, idToken, refreshToken, accessTokenExpirationDate, account }) {
  await Keychain.setGenericPassword(
    'sitsure_tokens',
    JSON.stringify({ accessToken, idToken, refreshToken, accessTokenExpirationDate, account }),
    { service: KEYCHAIN_SERVICE },
  );
}

export async function loadStoredTokens() {
  try {
    const creds = await Keychain.getGenericPassword({ service: KEYCHAIN_SERVICE });
    if (!creds) return { accessToken: null, idToken: null, refreshToken: null, accessTokenExpirationDate: null, account: null };
    const data = JSON.parse(creds.password);
    return {
      accessToken: data.accessToken || null,
      idToken: data.idToken || null,
      refreshToken: data.refreshToken || null,
      accessTokenExpirationDate: data.accessTokenExpirationDate || null,
      account: data.account || null,
    };
  } catch {
    return { accessToken: null, idToken: null, refreshToken: null, accessTokenExpirationDate: null, account: null };
  }
}

export async function getValidAccessToken(stored) {
  const { accessToken, refreshToken, accessTokenExpirationDate } = stored;
  const needsRefresh =
    !accessTokenExpirationDate ||
    new Date(accessTokenExpirationDate).getTime() - Date.now() < 60 * 1000;

  if (!needsRefresh) return accessToken;

  if (!refreshToken) throw new Error('session_expired');

  try {
    const result = await refreshAccessToken(refreshToken);
    await storeTokens({
      accessToken: result.accessToken,
      idToken: stored.idToken,
      refreshToken: result.refreshToken || refreshToken,
      accessTokenExpirationDate: result.accessTokenExpirationDate,
      account: stored.account,
    });
    return result.accessToken;
  } catch {
    throw new Error('session_expired');
  }
}

export async function clearStoredTokens() {
  await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE });
}
