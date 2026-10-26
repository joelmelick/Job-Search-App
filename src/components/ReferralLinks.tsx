"use client";

import { companyPeopleUrl, networkSearchUrl } from "@/lib/linkedin";

/**
 * Two LinkedIn lookups for finding a way in: the company's People tab (precise,
 * but the slug is guessed from the name) and a search of your own 1st/2nd
 * degree connections there (always resolves).
 */
export default function ReferralLinks({ company }: { company: string }) {
  if (!company?.trim()) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="text-gray-400">Referrals:</span>
      <a
        href={companyPeopleUrl(company)}
        target="_blank"
        rel="noopener noreferrer"
        title={`LinkedIn: people at ${company}`}
        className="text-[#1F4E79] hover:underline"
      >
        People
      </a>
      <span className="text-gray-300">·</span>
      <a
        href={networkSearchUrl(company)}
        target="_blank"
        rel="noopener noreferrer"
        title={`LinkedIn: your 1st and 2nd degree connections at ${company}`}
        className="text-[#1F4E79] hover:underline"
      >
        1st/2nd
      </a>
    </div>
  );
}
