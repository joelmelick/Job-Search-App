import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { url } = body;

  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  // Attempt to fetch and parse the job page
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const html = await res.text();

    // Basic extraction: pull title tag and meta description
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "";

    // Try to extract pay info from text
    const payMatch = html.match(/\$[\d,]+(?:K)?\s*[-–]\s*\$[\d,]+(?:K)?/i);
    const payRange = payMatch ? payMatch[0] : null;

    // Extract pay_min / pay_max from range string
    let pay_min: number | null = null;
    let pay_max: number | null = null;
    if (payRange) {
      const nums = payRange.match(/[\d,]+/g);
      if (nums && nums.length >= 2) {
        const a = parseInt(nums[0].replace(/,/g, ""));
        const b = parseInt(nums[1].replace(/,/g, ""));
        pay_min = Math.min(a, b);
        pay_max = Math.max(a, b);
        // Handle K notation
        if (pay_min < 1000) pay_min *= 1000;
        if (pay_max < 1000) pay_max *= 1000;
      }
    }

    // Derive company and role from URL hostname and title
    const urlObj = new URL(url);
    const company = urlObj.hostname.replace(/^www\./, "").split(".")[0];
    const role = title.replace(/\s*[-|]\s*.*/g, "").trim();

    return NextResponse.json({
      company,
      role,
      url,
      pay_min,
      pay_max,
      pay_range: payRange,
      description: `Fetched from ${url}`,
    });
  } catch (err) {
    // Return a stub if scraping fails
    return NextResponse.json({
      company: "",
      role: "",
      url,
      pay_min: null,
      pay_max: null,
      pay_range: null,
      description: `Could not fetch page: ${err instanceof Error ? err.message : "unknown error"}`,
    });
  }
}
