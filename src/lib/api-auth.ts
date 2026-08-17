import jwt from "jsonwebtoken";
import { auth } from "@/lib/auth";

export type ApiUser = { id: string; role: "BUYER" | "CREATOR" | "ADMIN"; email?: string; name?: string };

const JWT_ISSUER = "artsy-mobile";

/**
 * Auth for API routes shared between the Next.js web app (NextAuth cookie
 * session) and the Expo mobile app (Bearer JWT, since a React Native fetch
 * client doesn't carry the web session cookie). Web requests are checked
 * first since that's the common case; the JWT path only runs when there's
 * no cookie session, so this adds no cost to normal web requests.
 */
export async function getApiUser(req: Request): Promise<ApiUser | null> {
  const session = await auth();
  if (session?.user) {
    return { id: session.user.id, role: session.user.role, email: session.user.email ?? undefined, name: session.user.name ?? undefined };
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice("Bearer ".length);
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return null;

  try {
    const payload = jwt.verify(token, secret, { issuer: JWT_ISSUER }) as jwt.JwtPayload;
    if (!payload.sub || !payload.role) return null;
    return { id: payload.sub, role: payload.role, email: payload.email, name: payload.name };
  } catch {
    return null;
  }
}

export function signMobileToken(user: { id: string; role: string; email: string; name: string }) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not configured");
  return jwt.sign({ role: user.role, email: user.email, name: user.name }, secret, {
    subject: user.id,
    issuer: JWT_ISSUER,
    expiresIn: "30d",
  });
}
