/**
 * LinkedIn lookup links for finding referral paths into a company.
 *
 * The company page URL needs LinkedIn's own slug, which we can only guess from
 * the company name — good for clean names ("Intuit" -> intuit), wrong for ones
 * whose slug differs ("Qualcomm Technologies, Inc." is really /company/qualcomm).
 * The network search link never breaks, so cards offer both.
 */

const LEGAL_SUFFIXES = new Set([
  "inc",
  "llc",
  "ltd",
  "limited",
  "corp",
  "corporation",
  "co",
  "plc",
  "gmbh",
  "ag",
  "sa",
  "nv",
  "bv",
  "ab",
  "oy",
  "pbc",
]);

/** Drop parentheticals and punctuation: "Cisco (Splunk)" -> "cisco". */
function cleanName(company: string): string {
  return company
    .replace(/\([^)]*\)/g, " ")
    .replace(/&/g, " and ")
    .replace(/[^A-Za-z0-9\s-]/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/** Name words with any trailing legal suffix removed. */
function nameWords(company: string): string[] {
  return cleanName(company)
    .split(" ")
    .filter(Boolean)
    .filter((word, i, all) => !(i === all.length - 1 && LEGAL_SUFFIXES.has(word)));
}

/** Best-guess LinkedIn company slug. */
export function companySlug(company: string): string {
  return nameWords(company).join("-");
}

/** The company's People tab — verified employees plus "people you know". */
export function companyPeopleUrl(company: string): string {
  return `https://www.linkedin.com/company/${companySlug(company)}/people/`;
}

/** People search at this company, limited to 1st and 2nd degree connections. */
export function networkSearchUrl(company: string): string {
  const params = new URLSearchParams({
    keywords: nameWords(company).join(" "),
    network: '["F","S"]',
  });
  return `https://www.linkedin.com/search/results/people/?${params.toString()}`;
}
