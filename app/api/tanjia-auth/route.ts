import { NextResponse } from "next/server";
import { tanjiaServerConfig } from "@/lib/tanjia-config";

export async function POST(request: Request) {
  if (!tanjiaServerConfig.helperPasscodeEnabled || !tanjiaServerConfig.helperPasscode) {
    return new NextResponse("Passcode not configured.", { status: 400 });
  }

  let body: { passcode?: string } = {};
  try {
    body = await request.json();
  } catch {
    return new NextResponse("Invalid request.", { status: 400 });
  }

  const provided = body.passcode?.trim();
  if (!provided) {
    return new NextResponse("Passcode required.", { status: 400 });
  }

  if (provided !== tanjiaServerConfig.helperPasscode) {
    return new NextResponse("Incorrect passcode.", { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: "tanjia_auth",
    value: "1",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  return response;
}
