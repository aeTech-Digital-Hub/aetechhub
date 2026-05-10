import { SignJWT, jwtVerify } from "jose";

export type JwtPayload = {
  sub: string; // user id
  email: string;
  name?: string;
  role: "admin" | "editor" | "client" | "user";
};

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ||
    process.env.AUTH_SECRET ||
    "dev-only-change-me-in-production-asap",
);

const ISSUER = "aetech-digital-hub";
const AUDIENCE = "aetech-app";
const EXPIRY = "7d";

export async function signJwt(payload: JwtPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(EXPIRY)
    .setSubject(payload.sub)
    .sign(SECRET);
}

export async function verifyJwt(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET, {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    return {
      sub: payload.sub as string,
      email: payload.email as string,
      name: payload.name as string | undefined,
      role: payload.role as JwtPayload["role"],
    };
  } catch {
    return null;
  }
}
