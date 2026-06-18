import { draftMode } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

// Turns Draft Mode OFF and returns the visitor to the live, published site.
// Linked from the "Exit preview" banner in the marketing layout.
export async function GET(request: NextRequest) {
  (await draftMode()).disable();
  return NextResponse.redirect(new URL("/", request.url));
}
