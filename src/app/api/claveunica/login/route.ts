import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  buildAuthorizationUrl,
  computeCodeChallenge,
  generateCodeVerifier,
  generateState,
} from '@/lib/auth/claveunica';

const STATE_COOKIE = 'claveunica_state';
const VERIFIER_COOKIE = 'claveunica_verifier';
const COOKIE_TTL_SECONDS = 60 * 5; // 5 minutes

export async function POST() {
  try {
    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = computeCodeChallenge(codeVerifier);
    const authorizeUrl = buildAuthorizationUrl({ state, codeChallenge });

    const cookieStore = await cookies();
    cookieStore.set(STATE_COOKIE, state, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: COOKIE_TTL_SECONDS,
    });

    cookieStore.set(VERIFIER_COOKIE, codeVerifier, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: COOKIE_TTL_SECONDS,
    });

    return NextResponse.json({
      ok: true,
      url: authorizeUrl,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message ?? 'No se pudo iniciar sesión con ClaveÚnica.',
      },
      { status: 500 }
    );
  }
}
