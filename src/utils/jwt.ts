import { randomUUID } from "crypto";
import * as jose from "jose";

export const signJwt = async (payload: {
  id: string;
  username: string;
}): Promise<[string, string]> => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set");
  }

  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const jti = randomUUID();

  const jwt = await new jose.SignJWT({ payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("180d")
    .setJti(jti) // Add unique JWT ID
    .sign(secret);

  return [jwt, jti];
};

export const verifyJwt = async (
  token: string,
): Promise<{
  payload: { id: string; username: string };
  jti: string;
} | null> => {
  try {
    if (!process.env.JWT_SECRET) {
      return null;
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);

    if (!payload.jti) {
      return null;
    }

    return {
      payload: payload.payload as { id: string; username: string },
      jti: payload.jti,
    };
  } catch {
    return null;
  }
};
