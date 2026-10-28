import { pinHandler } from "@/lib/auth/pin-handler";
export async function POST(request: Request) { return pinHandler(request, "setup"); }
export async function PATCH(request: Request) { return pinHandler(request, "change"); }
