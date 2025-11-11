import { createHash, randomBytes } from 'crypto';
import { encryptJson } from '@/lib/crypto/secure';

type Nullable<T> = T | null | undefined;

export interface ClaveUnicaConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  issuer: string;
  authorizeUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  pjudBaseUrl: string;
}

export interface ClaveUnicaTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  id_token?: string;
  scope?: string;
}

export interface ClaveUnicaUserInfo {
  sub: string;
  given_name?: string;
  family_name?: string;
  name?: string;
  email?: string;
  preferred_username?: string;
  rolUnico?: {
    numero: string;
    DV?: string;
    tipo?: string;
  };
  run?: {
    numero: string;
    dv?: string;
    tipo?: string;
  };
  [key: string]: unknown;
}

export interface EncryptedCredentialsPayload {
  providerUserId: string;
  scope?: string;
  expiresIn?: number;
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  obtainedAt: string;
}

const codeVerifierLength = 64;

function ensureEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}

function normalizeIssuer(issuer: string): string {
  return issuer.endsWith('/') ? issuer.slice(0, -1) : issuer;
}

export function getClaveUnicaConfig(): ClaveUnicaConfig {
  const issuer = normalizeIssuer(ensureEnv('CLAVEUNICA_ISSUER'));

  return {
    clientId: ensureEnv('CLAVEUNICA_CLIENT_ID'),
    clientSecret: ensureEnv('CLAVEUNICA_CLIENT_SECRET'),
    redirectUri: ensureEnv('CLAVEUNICA_REDIRECT_URI'),
    issuer,
    authorizeUrl: `${issuer}/authorize`,
    tokenUrl: `${issuer}/token`,
    userInfoUrl: `${issuer}/userinfo`,
    pjudBaseUrl: ensureEnv('PJUD_BASE_URL'),
  };
}

function toBase64Url(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+/g, '');
}

export function generateState(): string {
  return toBase64Url(randomBytes(24));
}

export function generateCodeVerifier(): string {
  return toBase64Url(randomBytes(codeVerifierLength));
}

export function computeCodeChallenge(codeVerifier: string): string {
  const hash = createHash('sha256').update(codeVerifier).digest();
  return toBase64Url(hash);
}

export function buildAuthorizationUrl(params: { state: string; codeChallenge: string }): string {
  const config = getClaveUnicaConfig();
  const url = new URL(config.authorizeUrl);

  url.searchParams.set('client_id', config.clientId);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('redirect_uri', config.redirectUri);
  url.searchParams.set('scope', 'openid run name email');
  url.searchParams.set('state', params.state);
  url.searchParams.set('code_challenge', params.codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');

  return url.toString();
}

export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string
): Promise<ClaveUnicaTokenResponse> {
  const config = getClaveUnicaConfig();

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code_verifier: codeVerifier,
  });

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`ClaveÚnica token exchange failed: ${errorText}`);
  }

  const tokenPayload = (await response.json()) as ClaveUnicaTokenResponse;
  if (!tokenPayload.access_token) {
    throw new Error('ClaveÚnica token response missing access_token.');
  }

  return tokenPayload;
}

export async function fetchClaveUnicaUserInfo(accessToken: string): Promise<ClaveUnicaUserInfo> {
  const { userInfoUrl } = getClaveUnicaConfig();
  const response = await fetch(userInfoUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`ClaveÚnica userInfo failed: ${errorText}`);
  }

  return (await response.json()) as ClaveUnicaUserInfo;
}

export function formatRun(run: Nullable<ClaveUnicaUserInfo['rolUnico']> | Nullable<ClaveUnicaUserInfo['run']>) {
  if (!run) return null;
  const numero = 'numero' in run ? run.numero : (run as any)?.numero;
  const dv = ('DV' in run ? (run as any).DV : (run as any)?.dv) ?? null;
  if (!numero) return null;
  return dv ? `${numero}-${dv}` : numero;
}

export function encryptCredentials(payload: {
  tokens: ClaveUnicaTokenResponse;
  providerUserId: string;
}): string {
  const encryptedPayload: EncryptedCredentialsPayload = {
    providerUserId: payload.providerUserId,
    accessToken: payload.tokens.access_token,
    obtainedAt: new Date().toISOString(),
    ...(payload.tokens.scope !== undefined && { scope: payload.tokens.scope }),
    ...(payload.tokens.expires_in !== undefined && { expiresIn: payload.tokens.expires_in }),
    ...(payload.tokens.refresh_token !== undefined && { refreshToken: payload.tokens.refresh_token }),
    ...(payload.tokens.id_token !== undefined && { idToken: payload.tokens.id_token }),
  };

  return encryptJson(encryptedPayload);
}
