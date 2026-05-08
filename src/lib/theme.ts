export type Theme = "light" | "dark";
export type ThemePref = "light" | "dark" | "system";

function systemTheme(): Theme {
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function getThemePref(): ThemePref {
  return (localStorage.getItem("theme") as ThemePref) ?? "system";
}

export function setThemePref(pref: ThemePref): void {
  if (pref === "system") {
    localStorage.removeItem("theme");
  } else {
    localStorage.setItem("theme", pref);
  }
  document.documentElement.dataset.theme = pref === "system" ? systemTheme() : pref;
}
