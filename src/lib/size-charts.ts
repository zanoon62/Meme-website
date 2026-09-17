import type { SizeChartData } from "@/components/providers/ui-provider";

export function getDefaultSizeChart(category: string): SizeChartData {
  const cat = category.toLowerCase().trim();

  if (cat.includes("dress") || cat.includes("فساتين")) {
    return {
      headers: ["Size", "Bust (cm)", "Waist (cm)", "Hips (cm)", "Length (cm)", "Height (cm)", "Weight (kg)"],
      rows: [
        { Size: "XS", "Bust (cm)": "82", "Waist (cm)": "64", "Hips (cm)": "88", "Length (cm)": "115", "Height (cm)": "155-162", "Weight (kg)": "45-52" },
        { Size: "S", "Bust (cm)": "86", "Waist (cm)": "68", "Hips (cm)": "92", "Length (cm)": "116", "Height (cm)": "158-165", "Weight (kg)": "52-58" },
        { Size: "M", "Bust (cm)": "90", "Waist (cm)": "72", "Hips (cm)": "96", "Length (cm)": "118", "Height (cm)": "160-168", "Weight (kg)": "58-65" },
        { Size: "L", "Bust (cm)": "96", "Waist (cm)": "78", "Hips (cm)": "102", "Length (cm)": "120", "Height (cm)": "162-170", "Weight (kg)": "65-73" },
        { Size: "XL", "Bust (cm)": "102", "Waist (cm)": "84", "Hips (cm)": "108", "Length (cm)": "122", "Height (cm)": "165-173", "Weight (kg)": "73-82" },
      ],
    };
  }

  if (cat.includes("tailor") || cat.includes("بدل")) {
    return {
      headers: ["Size", "Shoulder (cm)", "Chest (cm)", "Sleeve (cm)", "Waist (cm)", "Length (cm)", "Height (cm)", "Weight (kg)"],
      rows: [
        { Size: "XS", "Shoulder (cm)": "38", "Chest (cm)": "88", "Sleeve (cm)": "58", "Waist (cm)": "66", "Length (cm)": "72", "Height (cm)": "160-168", "Weight (kg)": "50-58" },
        { Size: "S", "Shoulder (cm)": "40", "Chest (cm)": "92", "Sleeve (cm)": "59", "Waist (cm)": "70", "Length (cm)": "73", "Height (cm)": "165-172", "Weight (kg)": "58-66" },
        { Size: "M", "Shoulder (cm)": "42", "Chest (cm)": "96", "Sleeve (cm)": "60", "Waist (cm)": "74", "Length (cm)": "75", "Height (cm)": "170-177", "Weight (kg)": "66-75" },
        { Size: "L", "Shoulder (cm)": "44", "Chest (cm)": "102", "Sleeve (cm)": "61", "Waist (cm)": "80", "Length (cm)": "77", "Height (cm)": "175-182", "Weight (kg)": "75-85" },
        { Size: "XL", "Shoulder (cm)": "46", "Chest (cm)": "108", "Sleeve (cm)": "62", "Waist (cm)": "86", "Length (cm)": "79", "Height (cm)": "180-188", "Weight (kg)": "85-95" },
      ],
    };
  }

  if (cat.includes("outerwear") || cat.includes("خارجية")) {
    return {
      headers: ["Size", "Chest (cm)", "Shoulder (cm)", "Sleeve (cm)", "Length (cm)", "Height (cm)", "Weight (kg)"],
      rows: [
        { Size: "XS", "Chest (cm)": "94", "Shoulder (cm)": "40", "Sleeve (cm)": "59", "Length (cm)": "105", "Height (cm)": "158-165", "Weight (kg)": "48-55" },
        { Size: "S", "Chest (cm)": "98", "Shoulder (cm)": "41", "Sleeve (cm)": "60", "Length (cm)": "107", "Height (cm)": "162-169", "Weight (kg)": "55-62" },
        { Size: "M", "Chest (cm)": "104", "Shoulder (cm)": "43", "Sleeve (cm)": "61", "Length (cm)": "109", "Height (cm)": "166-173", "Weight (kg)": "62-70" },
        { Size: "L", "Chest (cm)": "110", "Shoulder (cm)": "45", "Sleeve (cm)": "62", "Length (cm)": "111", "Height (cm)": "170-178", "Weight (kg)": "70-80" },
        { Size: "XL", "Chest (cm)": "116", "Shoulder (cm)": "47", "Sleeve (cm)": "63", "Length (cm)": "113", "Height (cm)": "175-183", "Weight (kg)": "80-90" },
      ],
    };
  }

  if (cat.includes("pants") || cat.includes("skirt") || cat.includes("بنطلون") || cat.includes("تنانير")) {
    return {
      headers: ["Size", "Waist (cm)", "Hips (cm)", "Outseam (cm)", "Height (cm)", "Weight (kg)"],
      rows: [
        { Size: "XS", "Waist (cm)": "64", "Hips (cm)": "88", "Outseam (cm)": "104", "Height (cm)": "155-162", "Weight (kg)": "45-52" },
        { Size: "S", "Waist (cm)": "68", "Hips (cm)": "92", "Outseam (cm)": "105", "Height (cm)": "158-165", "Weight (kg)": "52-58" },
        { Size: "M", "Waist (cm)": "72", "Hips (cm)": "96", "Outseam (cm)": "107", "Height (cm)": "160-168", "Weight (kg)": "58-65" },
        { Size: "L", "Waist (cm)": "78", "Hips (cm)": "102", "Outseam (cm)": "109", "Height (cm)": "162-170", "Weight (kg)": "65-73" },
        { Size: "XL", "Waist (cm)": "84", "Hips (cm)": "108", "Outseam (cm)": "111", "Height (cm)": "165-173", "Weight (kg)": "73-82" },
      ],
    };
  }

  if (cat.includes("footwear") || cat.includes("أحذية")) {
    return {
      headers: ["EU Size", "US Size", "Foot Length (cm)", "Height (cm)", "Weight (kg)"],
      rows: [
        { "EU Size": "36", "US Size": "6.0", "Foot Length (cm)": "23.0", "Height (cm)": "150-158", "Weight (kg)": "45-55" },
        { "EU Size": "37", "US Size": "6.5", "Foot Length (cm)": "23.5", "Height (cm)": "155-162", "Weight (kg)": "48-58" },
        { "EU Size": "38", "US Size": "7.5", "Foot Length (cm)": "24.0", "Height (cm)": "158-165", "Weight (kg)": "52-62" },
        { "EU Size": "39", "US Size": "8.5", "Foot Length (cm)": "24.5", "Height (cm)": "162-169", "Weight (kg)": "56-66" },
        { "EU Size": "40", "US Size": "9.0", "Foot Length (cm)": "25.0", "Height (cm)": "165-172", "Weight (kg)": "60-70" },
        { "EU Size": "41", "US Size": "9.5", "Foot Length (cm)": "25.5", "Height (cm)": "168-175", "Weight (kg)": "64-75" },
      ],
    };
  }

  // Default Top / Hoodie / General Size Chart
  return {
    headers: ["Size", "Chest (cm)", "Shoulder (cm)", "Sleeve (cm)", "Length (cm)", "Height (cm)", "Weight (kg)"],
    rows: [
      { Size: "XS", "Chest (cm)": "96", "Shoulder (cm)": "44", "Sleeve (cm)": "58", "Length (cm)": "66", "Height (cm)": "158-165", "Weight (kg)": "48-55" },
      { Size: "S", "Chest (cm)": "100", "Shoulder (cm)": "46", "Sleeve (cm)": "59", "Length (cm)": "68", "Height (cm)": "162-169", "Weight (kg)": "55-62" },
      { Size: "M", "Chest (cm)": "106", "Shoulder (cm)": "48", "Sleeve (cm)": "60", "Length (cm)": "70", "Height (cm)": "166-173", "Weight (kg)": "62-70" },
      { Size: "L", "Chest (cm)": "112", "Shoulder (cm)": "50", "Sleeve (cm)": "61", "Length (cm)": "72", "Height (cm)": "170-178", "Weight (kg)": "70-80" },
      { Size: "XL", "Chest (cm)": "118", "Shoulder (cm)": "52", "Sleeve (cm)": "62", "Length (cm)": "74", "Height (cm)": "175-183", "Weight (kg)": "80-90" },
    ],
  };
}

// ─────────────────────────────────────────────
// Size recommendation
// ─────────────────────────────────────────────

export type SizeRecommendation = {
  size: string;
  confidence: "high" | "medium" | "low";
  reason: string;
};

/**
 * Parses a range cell like "58-65" or a single value like "72" into
 * [min, max]. Returns null if the cell isn't numeric at all (e.g. an EU
 * shoe size column being used for something else).
 */
function parseRange(raw: string | undefined): [number, number] | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^0-9.\-–—]/g, "").replace(/[–—]/g, "-");
  const parts = cleaned.split("-").map((p) => parseFloat(p)).filter((n) => !Number.isNaN(n));
  if (parts.length === 0) return null;
  if (parts.length === 1) return [parts[0], parts[0]];
  return [Math.min(parts[0], parts[1]), Math.max(parts[0], parts[1])];
}

/** Distance from a value to a [min, max] range — 0 if inside it. */
function distanceToRange(value: number, range: [number, number]): number {
  if (value < range[0]) return range[0] - value;
  if (value > range[1]) return value - range[1];
  return 0;
}

/**
 * Recommends a size from a product's OWN size chart, given the customer's
 * height (cm) and weight (kg) — real per-product data, not a hardcoded
 * global formula. Every product can have a different chart (via the admin's
 * per-product size chart editor), so this reads whatever Height/Weight
 * ranges are present in *that* chart's rows and picks the row whose
 * combined distance to the customer's inputs is smallest, matching real
 * rows rather than interpolating a fake one.
 *
 * Returns null if the chart has neither a Height nor a Weight column —
 * there's nothing honest to recommend from in that case, and the caller
 * should say so rather than fabricate a guess.
 */
export function recommendSize(
  chart: SizeChartData,
  input: { heightCm?: number; weightKg?: number },
): SizeRecommendation | null {
  const sizeHeader = chart.headers.find((h) => h.toLowerCase().includes("size")) || chart.headers[0];
  const heightHeader = chart.headers.find((h) => h.toLowerCase().includes("height"));
  const weightHeader = chart.headers.find((h) => h.toLowerCase().includes("weight"));

  if (!heightHeader && !weightHeader) return null;
  if (input.heightCm === undefined && input.weightKg === undefined) return null;

  type Scored = { row: Record<string, string>; score: number; matchedHeight: boolean; matchedWeight: boolean };
  const scored: Scored[] = [];

  for (const row of chart.rows) {
    let score = 0;
    let signals = 0;
    let matchedHeight = false;
    let matchedWeight = false;

    if (heightHeader && input.heightCm !== undefined) {
      const range = parseRange(row[heightHeader]);
      if (range) {
        const d = distanceToRange(input.heightCm, range);
        score += d;
        signals++;
        matchedHeight = d === 0;
      }
    }
    if (weightHeader && input.weightKg !== undefined) {
      const range = parseRange(row[weightHeader]);
      if (range) {
        // Weight typically has a narrower natural range than height, so
        // weigh it a bit more heavily when both signals are present —
        // it's usually the stronger predictor of which size actually fits.
        const d = distanceToRange(input.weightKg, range);
        score += d * 1.5;
        signals++;
        matchedWeight = d === 0;
      }
    }

    if (signals > 0) {
      scored.push({ row, score, matchedHeight, matchedWeight });
    }
  }

  if (scored.length === 0) return null;

  scored.sort((a, b) => a.score - b.score);
  const best = scored[0];
  const size = String(best.row[sizeHeader] ?? "").trim();
  if (!size) return null;

  const bothMatched = (heightHeader ? best.matchedHeight : true) && (weightHeader ? best.matchedWeight : true);
  const bothProvided = input.heightCm !== undefined && input.weightKg !== undefined && heightHeader && weightHeader;

  let confidence: SizeRecommendation["confidence"];
  let reason: string;
  if (bothMatched && bothProvided) {
    confidence = "high";
    reason = "Your height and weight both fall within this size's typical range.";
  } else if (bothMatched || best.score < 3) {
    confidence = "medium";
    reason = bothProvided
      ? "Close to this size's typical range — one measurement is right at the edge."
      : "Based on the measurement you provided; add the other for a more precise match.";
  } else {
    confidence = "low";
    reason = "Your measurements fall between two sizes — consider sizing up if you prefer a relaxed fit.";
  }

  return { size, confidence, reason };
}
