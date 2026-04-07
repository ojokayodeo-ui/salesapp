import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getProbabilityColor(probability: number): string {
  if (probability >= 80) return "text-emerald-600";
  if (probability >= 60) return "text-yellow-600";
  if (probability >= 40) return "text-orange-600";
  return "text-red-600";
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case "high":   return "bg-red-100 text-red-700";
    case "medium": return "bg-yellow-100 text-yellow-700";
    case "low":    return "bg-slate-100 text-slate-600";
    default:       return "bg-slate-100 text-slate-600";
  }
}

export function getSourceColor(source: string): string {
  switch (source) {
    case "cold":     return "bg-blue-100 text-blue-700";
    case "inbound":  return "bg-green-100 text-green-700";
    case "referral": return "bg-purple-100 text-purple-700";
    case "form":     return "bg-orange-100 text-orange-700";
    case "csv":      return "bg-slate-100 text-slate-700";
    default:         return "bg-slate-100 text-slate-700";
  }
}

export function getActivityIcon(type: string): string {
  switch (type) {
    case "email":        return "mail";
    case "call":         return "phone";
    case "meeting":      return "calendar";
    case "note":         return "file-text";
    case "task":         return "check-square";
    case "stage_change": return "arrow-right";
    default:             return "activity";
  }
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + "…";
}

export function parseTags(tagsJson: string): string[] {
  try {
    return JSON.parse(tagsJson);
  } catch {
    return [];
  }
}
