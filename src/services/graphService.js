const GRAPH_FIELDS = 'displayName,mail,userPrincipalName,jobTitle,department,mobilePhone';

const profileCache = new Map();
const photoUrlCache = new Map();

async function fetchGraphUser(email, accessToken) {
  const endpoint = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(email)}?$select=${GRAPH_FIELDS}`;
  const response = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Graph user fetch failed (${response.status})`);
  return response.json();
}

async function fetchGraphPhoto(email, accessToken) {
  const cached = photoUrlCache.get(email);
  if (cached !== undefined) return cached;

  const endpoint = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(email)}/photo/$value`;
  const response = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok || response.status === 404) {
    photoUrlCache.set(email, null);
    return null;
  }

  // URL.createObjectURL not available in React Native — convert to base64 data URI
  const arrayBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  const photoUrl = `data:image/jpeg;base64,${base64}`;
  photoUrlCache.set(email, photoUrl);
  return photoUrl;
}

export async function getGraphUserProfile(email, accessToken) {
  if (!email) return null;
  const normalized = email.toLowerCase();
  const cached = profileCache.get(normalized);
  if (cached !== undefined) return cached;

  const data = await fetchGraphUser(normalized, accessToken);
  if (!data) {
    profileCache.set(normalized, null);
    return null;
  }
  const photoUrl = await fetchGraphPhoto(normalized, accessToken);
  const result = { ...data, photoUrl: photoUrl || null };
  profileCache.set(normalized, result);
  return result;
}

export async function fetchMyPhoto(accessToken) {
  const endpoint = 'https://graph.microsoft.com/v1.0/me/photo/$value';
  const response = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) return null;

  const arrayBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return `data:image/jpeg;base64,${base64}`;
}

export function clearProfileCache() {
  profileCache.clear();
  photoUrlCache.clear();
}
