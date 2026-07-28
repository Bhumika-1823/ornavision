import { twMerge } from "tailwind-merge";

import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isAllowedEmailDomain(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return false;
  return normalized.endsWith(".com");
}

export function isValidPassword(password: string) {
  const normalized = password || "";
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8}$/.test(
    normalized,
  );
}
