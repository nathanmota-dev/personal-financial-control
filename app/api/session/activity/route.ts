import { authResponse, sessionMutation } from "@/lib/auth/server";
import { unlockResponse, cookieOptions, sessionResponse } from "@/lib/auth/cookies";
export async function POST(request: Request) {
  try {
    const session = await sessionMutation(request, true);
    return unlockResponse(session, session.user);
  } catch (error) { return authResponse(error); }
}
export async function DELETE(request: Request) {
  try {
    await sessionMutation(request);
    const response = sessionResponse();
    response.cookies.set("unlock", "", { ...cookieOptions(), maxAge: 0 });
    return response;
  } catch (error) { return authResponse(error); }
}
