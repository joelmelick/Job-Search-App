import { CompanyInfo } from "./types";

export interface NormalizedCompanyInfo {
  ownership: "public" | "private" | null;
  ticker: string | null;
  funding: string | null;
  overview: string | null;
}

/**
 * company_info is free-form JSON written by several agents, and its key names
 * have drifted (notes vs note, public_or_private vs status vs ownership).
 * Read every known variant so cards don't silently drop fields.
 */
export function normalizeCompanyInfo(
  info: CompanyInfo | null | undefined
): NormalizedCompanyInfo {
  const raw = (info ?? {}) as Record<string, unknown>;

  const text = (...keys: string[]): string | null => {
    for (const key of keys) {
      const value = raw[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
    return null;
  };

  // Values seen: "public", "private", "publicly_traded", "Publicly traded",
  // "Private, PE-backed by ..."
  const ownershipText =
    text("public_or_private", "status", "ownership")?.toLowerCase() ?? "";
  const ownership = ownershipText.includes("public")
    ? "public"
    : ownershipText.includes("private")
    ? "private"
    : null;

  return {
    ownership,
    ticker: text("ticker"),
    funding: text("last_funding", "funding"),
    overview: text("notes", "note"),
  };
}
