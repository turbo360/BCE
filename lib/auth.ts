import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import crypto from "crypto";

const SECRET = process.env.SECRET_KEY || "bce-case-studies-secret-2025";
const COOKIE_NAME = "bce_session";
const ADMIN_COOKIE = "bce_admin";

function sign(payload: string): string {
  const hmac = crypto.createHmac("sha256", SECRET);
  hmac.update(payload);
  return hmac.digest("hex");
}

export function createToken(userId: number, email: string): string {
  const payload = JSON.stringify({ userId, email });
  const encoded = Buffer.from(payload).toString("base64");
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

export function verifyToken(token: string): { userId: number; email: string } | null {
  try {
    const [encoded, signature] = token.split(".");
    if (!encoded || !signature) return null;
    if (sign(encoded) !== signature) return null;
    const payload = JSON.parse(Buffer.from(encoded, "base64").toString());
    return payload;
  } catch {
    return null;
  }
}

export function createAdminToken(): string {
  const payload = Buffer.from(JSON.stringify({ admin: true })).toString("base64");
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminToken(token: string): boolean {
  try {
    const [encoded, signature] = token.split(".");
    if (!encoded || !signature) return false;
    return sign(encoded) === signature;
  } catch {
    return false;
  }
}

export async function getSessionUser(): Promise<{ userId: number; email: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return verifyAdminToken(token);
}

export function getUserFromRequest(request: NextRequest): { userId: number; email: string } | null {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function isAdminRequest(request: NextRequest): boolean {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return verifyAdminToken(token);
}

export { COOKIE_NAME, ADMIN_COOKIE };
