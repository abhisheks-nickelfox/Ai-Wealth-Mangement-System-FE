const THIRTY_DAYS = 30 * 24 * 60 * 60; // seconds

export function setCookie(name: string, value: string, persistent = false): void {
  let cookie = `${name}=${encodeURIComponent(value)}; path=/; SameSite=Strict`;
  if (persistent) cookie += `; Max-Age=${THIRTY_DAYS}`;
  if (window.location.protocol === 'https:') cookie += '; Secure';
  document.cookie = cookie;
}

export function getCookie(name: string): string | null {
  const entry = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.split('=')[1]) : null;
}

export function deleteCookie(name: string): void {
  document.cookie = `${name}=; path=/; Max-Age=0; SameSite=Strict`;
}
