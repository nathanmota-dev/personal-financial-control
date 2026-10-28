import { pinHandler } from "@/lib/auth/pin-handler";
export async function POST(request: Request) { return pinHandler(request, "unlock"); }
