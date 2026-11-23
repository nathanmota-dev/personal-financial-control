import { apiGuard } from "@/lib/auth/server";
import { aiJsonResponse, rejectAiMethod } from "@/lib/server/ai/route";
import { listAiModelsRequest } from "@/lib/server/ai/settings-requests";
import { privateRoute } from "@/lib/server/route-response";

/** Lists the models a local provider has installed, using the address typed in the form. */
export const POST = privateRoute(async (request: Request) => await apiGuard(request) ?? aiJsonResponse(listAiModelsRequest, request));

export const HEAD = rejectAiMethod;

export const OPTIONS = rejectAiMethod;
