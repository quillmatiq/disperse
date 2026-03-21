import { getActiveSession, login } from "../lib/auth";
import { toMessage } from "../lib/utils";

// Already logged in — go straight to share
const active = await getActiveSession();
if (active) {
  window.location.replace("/share");
}

const loginStatus = document.getElementById("login-status")!;

document.getElementById("login-form")!.addEventListener("submit", async (e) => {
  e.preventDefault();
  const handle = (document.getElementById("handle") as HTMLInputElement).value.trim();
  if (!handle) return;
  loginStatus.textContent = "Redirecting to your Atmosphere login…";
  loginStatus.className = "status";
  try {
    await login(handle);
  } catch (err) {
    loginStatus.textContent = toMessage(err);
    loginStatus.className = "status error";
  }
});
