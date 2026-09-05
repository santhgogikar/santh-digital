import { NextResponse } from "next/server";

export function handleAuthError(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }
    if (error.message === "SELECT_BRANCH") {
      return NextResponse.json({ error: "Choose a branch to continue." }, { status: 400 });
    }
  }
  throw error;
}
