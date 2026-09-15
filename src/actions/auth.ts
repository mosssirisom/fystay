"use server";

import { signOut } from "@/auth";

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

/** Same as signOutAction, but to a caller-chosen destination - kept separate so signOutAction itself stays usable directly as a <form action> (which always calls it with a FormData argument). */
export async function signOutToAction(redirectTo: string) {
  await signOut({ redirectTo });
}
