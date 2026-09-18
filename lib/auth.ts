import { cookies } from "next/headers";

export type Role = "president" | "vice_president" | "member";

export type SessionPayload = {
  memberId: string;
  role: Role;
  isAdmin: boolean;
  exp: number; // epoch ms
};

const COOKIE_NAME = "byp_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 365; // 1년

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET 환경변수가 설정되지 않았습니다");
  return secret;
}

function toBase64Url(bytes: Uint8Array<ArrayBuffer>): string {
  let str = "";
  bytes.forEach((b) => (str += String.fromCharCode(b)));
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(b64url: string): Uint8Array<ArrayBuffer> {
  const padded = b64url
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(b64url.length + ((4 - (b64url.length % 4)) % 4), "=");
  const str = atob(padded);
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i);
  return bytes;
}

async function getKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function sign(payload: SessionPayload, secret: string): Promise<string> {
  const data = JSON.stringify(payload);
  const key = await getKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return `${toBase64Url(new TextEncoder().encode(data))}.${toBase64Url(new Uint8Array(sig))}`;
}

async function verify(token: string, secret: string): Promise<SessionPayload | null> {
  const [dataB64, sigB64] = token.split(".");
  if (!dataB64 || !sigB64) return null;

  const key = await getKey(secret);
  const dataBytes = fromBase64Url(dataB64);
  const sigBytes = fromBase64Url(sigB64);
  const valid = await crypto.subtle.verify("HMAC", key, sigBytes, dataBytes);
  if (!valid) return null;

  const payload = JSON.parse(new TextDecoder().decode(dataBytes)) as SessionPayload;
  if (payload.exp < Date.now()) return null;
  return payload;
}

/** proxy.ts처럼 next/headers의 cookies()를 쓸 수 없는 곳에서 토큰 문자열을 직접 검증할 때 사용 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  return verify(token, getSecret());
}

export async function createSessionCookie(memberId: string, role: Role, isAdmin: boolean) {
  const payload: SessionPayload = { memberId, role, isAdmin, exp: Date.now() + SESSION_TTL_MS };
  const token = await sign(payload, getSecret());
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** Server Component/Server Action에서 현재 로그인 정보를 읽는다. 없으면 null. */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verify(token, getSecret());
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
