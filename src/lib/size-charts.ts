import type { SizeChartData } from "@/components/providers/ui-provider";

export function getDefaultSizeChart(category: string): SizeChartData {
  const cat = category.toLowerCase().trim();

  if (cat.includes("dress") || cat.includes("فساتين")) {
    return {
      headers: ["Size", "Bust (cm)", "Waist (cm)", "Hips (cm)", "Length (cm)"],
      rows: [
        { Size: "XS", "Bust (cm)": "82", "Waist (cm)": "64", "Hips (cm)": "88", "Length (cm)": "115" },
        { Size: "S", "Bust (cm)": "86", "Waist (cm)": "68", "Hips (cm)": "92", "Length (cm)": "116" },
        { Size: "M", "Bust (cm)": "90", "Waist (cm)": "72", "Hips (cm)": "96", "Length (cm)": "118" },
        { Size: "L", "Bust (cm)": "96", "Waist (cm)": "78", "Hips (cm)": "102", "Length (cm)": "120" },
        { Size: "XL", "Bust (cm)": "102", "Waist (cm)": "84", "Hips (cm)": "108", "Length (cm)": "122" },
      ],
    };
  }

  if (cat.includes("tailor") || cat.includes("بدل")) {
    return {
      headers: ["Size", "Shoulder (cm)", "Chest (cm)", "Sleeve (cm)", "Waist (cm)", "Length (cm)"],
      rows: [
        { Size: "XS", "Shoulder (cm)": "38", "Chest (cm)": "88", "Sleeve (cm)": "58", "Waist (cm)": "66", "Length (cm)": "72" },
        { Size: "S", "Shoulder (cm)": "40", "Chest (cm)": "92", "Sleeve (cm)": "59", "Waist (cm)": "70", "Length (cm)": "73" },
        { Size: "M", "Shoulder (cm)": "42", "Chest (cm)": "96", "Sleeve (cm)": "60", "Waist (cm)": "74", "Length (cm)": "75" },
        { Size: "L", "Shoulder (cm)": "44", "Chest (cm)": "102", "Sleeve (cm)": "61", "Waist (cm)": "80", "Length (cm)": "77" },
        { Size: "XL", "Shoulder (cm)": "46", "Chest (cm)": "108", "Sleeve (cm)": "62", "Waist (cm)": "86", "Length (cm)": "79" },
      ],
    };
  }

  if (cat.includes("outerwear") || cat.includes("خارجية")) {
    return {
      headers: ["Size", "Chest (cm)", "Shoulder (cm)", "Sleeve (cm)", "Length (cm)"],
      rows: [
        { Size: "XS", "Chest (cm)": "94", "Shoulder (cm)": "40", "Sleeve (cm)": "59", "Length (cm)": "105" },
        { Size: "S", "Chest (cm)": "98", "Shoulder (cm)": "41", "Sleeve (cm)": "60", "Length (cm)": "107" },
        { Size: "M", "Chest (cm)": "104", "Shoulder (cm)": "43", "Sleeve (cm)": "61", "Length (cm)": "109" },
        { Size: "L", "Chest (cm)": "110", "Shoulder (cm)": "45", "Sleeve (cm)": "62", "Length (cm)": "111" },
        { Size: "XL", "Chest (cm)": "116", "Shoulder (cm)": "47", "Sleeve (cm)": "63", "Length (cm)": "113" },
      ],
    };
  }

  if (cat.includes("pants") || cat.includes("skirt") || cat.includes("بنطلون") || cat.includes("تنانير")) {
    return {
      headers: ["Size", "Waist (cm)", "Hips (cm)", "Outseam (cm)"],
      rows: [
        { Size: "XS", "Waist (cm)": "64", "Hips (cm)": "88", "Outseam (cm)": "104" },
        { Size: "S", "Waist (cm)": "68", "Hips (cm)": "92", "Outseam (cm)": "105" },
        { Size: "M", "Waist (cm)": "72", "Hips (cm)": "96", "Outseam (cm)": "107" },
        { Size: "L", "Waist (cm)": "78", "Hips (cm)": "102", "Outseam (cm)": "109" },
        { Size: "XL", "Waist (cm)": "84", "Hips (cm)": "108", "Outseam (cm)": "111" },
      ],
    };
  }

  if (cat.includes("footwear") || cat.includes("أحذية")) {
    return {
      headers: ["EU Size", "US Size", "Foot Length (cm)"],
      rows: [
        { "EU Size": "36", "US Size": "6.0", "Foot Length (cm)": "23.0" },
        { "EU Size": "37", "US Size": "6.5", "Foot Length (cm)": "23.5" },
        { "EU Size": "38", "US Size": "7.5", "Foot Length (cm)": "24.0" },
        { "EU Size": "39", "US Size": "8.5", "Foot Length (cm)": "24.5" },
        { "EU Size": "40", "US Size": "9.0", "Foot Length (cm)": "25.0" },
        { "EU Size": "41", "US Size": "9.5", "Foot Length (cm)": "25.5" },
      ],
    };
  }

  // Default Top / Hoodie / General Size Chart
  return {
    headers: ["Size", "Chest (cm)", "Shoulder (cm)", "Sleeve (cm)", "Length (cm)"],
    rows: [
      { Size: "XS", "Chest (cm)": "96", "Shoulder (cm)": "44", "Sleeve (cm)": "58", "Length (cm)": "66" },
      { Size: "S", "Chest (cm)": "100", "Shoulder (cm)": "46", "Sleeve (cm)": "59", "Length (cm)": "68" },
      { Size: "M", "Chest (cm)": "106", "Shoulder (cm)": "48", "Sleeve (cm)": "60", "Length (cm)": "70" },
      { Size: "L", "Chest (cm)": "112", "Shoulder (cm)": "50", "Sleeve (cm)": "61", "Length (cm)": "72" },
      { Size: "XL", "Chest (cm)": "118", "Shoulder (cm)": "52", "Sleeve (cm)": "62", "Length (cm)": "74" },
    ],
  };
}
