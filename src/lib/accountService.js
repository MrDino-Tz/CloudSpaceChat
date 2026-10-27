import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export function hasPasswordProvider(user) {
  return !!user?.providerData?.some((p) => p.providerId === "password");
}

export function hasRealEmail(user) {
  const email = user?.email || "";
  return !!email && !email.endsWith("@openspacechat.internal");
}

export async function changePassword(user, currentPassword, newPassword) {
  if (!user?.email) {
    throw new Error("You need to be signed in to change your password.");
  }
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}

export async function sendPasswordReset(user) {
  if (!user?.email) {
    throw new Error("No email address on this account.");
  }
  await sendPasswordResetEmail(auth, user.email);
}

export function passwordErrorMessage(err) {
  const code = err?.code || "";
  if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
    return "Current password is incorrect.";
  }
  if (code === "auth/weak-password") {
    return "New password must be at least 6 characters.";
  }
  if (code === "auth/network-request-failed") {
    return "No internet connection. Please try again.";
  }
  if (code === "auth/requires-recent-login") {
    return "Please sign out and sign in again to change your password.";
  }
  if (code === "auth/too-many-requests") {
    return "Too many attempts. Try again later.";
  }
  return (err?.message || "Could not update password.").replace("Firebase: ", "");
}
