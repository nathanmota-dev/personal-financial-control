import { apiGuard } from "@/lib/auth/server";
import { aiJsonResponse, rejectAiMethod } from "@/lib/server/ai/route";
import { checkAiSettingsRequest } from "@/lib/server/ai/settings-requests";
import { privateRoute } from "@/lib/server/route-response";

/** Tries the form's configuration without saving it. A key left out is taken from the saved configuration. */
export const POST = privateRoute(async (request: Request) => await apiGuard(request) ?? aiJsonResponse(checkAiSettingsRequest, request));

export const HEAD = rejectAiMethod;

export const OPTIONS = rejectAiMethod;
