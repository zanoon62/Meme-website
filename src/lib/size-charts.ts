import type { SizeChartData } from "@/components/providers/ui-provider";

export function getDefaultSizeChart(category: string): SizeChartData {
  const cat = category.toLowerCase().trim();

  if (cat.includes("dress") || cat.includes("فساتين")) {
    return {
      headers: ["Size", "Bust (cm)", "Waist (cm)", "Hips (cm)", "Length (cm)", "Weight (kg)"],
      rows: [
        { Size: "XS", "Bust (cm)": "82", "Waist (cm)": "64", "Hips (cm)": "88", "Length (cm)": "115", "Weight (kg)": "45-52" },
        { Size: "S", "Bust (cm)": "86", "Waist (cm)": "68", "Hips (cm)": "92", "Length (cm)": "116", "Weight (kg)": "52-58" },
        { Size: "M", "Bust (cm)": "90", "Waist (cm)": "72", "Hips (cm)": "96", "Length (cm)": "118", "Weight (kg)": "58-65" },
        { Size: "L", "Bust (cm)": "96", "Waist (cm)": "78", "Hips (cm)": "102", "Length (cm)": "120", "Weight (kg)": "65-73" },
        { Size: "XL", "Bust (cm)": "102", "Waist (cm)": "84", "Hips (cm)": "108", "Length (cm)": "122", "Weight (kg)": "73-82" },
      ],
    };
  }

  if (cat.includes("tailor") || cat.includes("بدل")) {
    return {
      headers: ["Size", "Shoulder (cm)", "Chest (cm)", "Sleeve (cm)", "Waist (cm)", "Length (cm)", "Weight (kg)"],
      rows: [
        { Size: "XS", "Shoulder (cm)": "38", "Chest (cm)": "88", "Sleeve (cm)": "58", "Waist (cm)": "66", "Length (cm)": "72", "Weight (kg)": "50-58" },
        { Size: "S", "Shoulder (cm)": "40", "Chest (cm)": "92", "Sleeve (cm)": "59", "Waist (cm)": "70", "Length (cm)": "73", "Weight (kg)": "58-66" },
        { Size: "M", "Shoulder (cm)": "42", "Chest (cm)": "96", "Sleeve (cm)": "60", "Waist (cm)": "74", "Length (cm)": "75", "Weight (kg)": "66-75" },
        { Size: "L", "Shoulder (cm)": "44", "Chest (cm)": "102", "Sleeve (cm)": "61", "Waist (cm)": "80", "Length (cm)": "77", "Weight (kg)": "75-85" },
        { Size: "XL", "Shoulder (cm)": "46", "Chest (cm)": "108", "Sleeve (cm)": "62", "Waist (cm)": "86", "Length (cm)": "79", "Weight (kg)": "85-95" },
      ],
    };
  }

  if (cat.includes("outerwear") || cat.includes("خارجية")) {
    return {
      headers: ["Size", "Chest (cm)", "Shoulder (cm)", "Sleeve (cm)", "Length (cm)", "Weight (kg)"],
      rows: [
        { Size: "XS", "Chest (cm)": "94", "Shoulder (cm)": "40", "Sleeve (cm)": "59", "Length (cm)": "105", "Weight (kg)": "48-55" },
        { Size: "S", "Chest (cm)": "98", "Shoulder (cm)": "41", "Sleeve (cm)": "60", "Length (cm)": "107", "Weight (kg)": "55-62" },
        { Size: "M", "Chest (cm)": "104", "Shoulder (cm)": "43", "Sleeve (cm)": "61", "Length (cm)": "109", "Weight (kg)": "62-70" },
        { Size: "L", "Chest (cm)": "110", "Shoulder (cm)": "45", "Sleeve (cm)": "62", "Length (cm)": "111", "Weight (kg)": "70-80" },
        { Size: "XL", "Chest (cm)": "116", "Shoulder (cm)": "47", "Sleeve (cm)": "63", "Length (cm)": "113", "Weight (kg)": "80-90" },
      ],
    };
  }

  if (cat.includes("pants") || cat.includes("skirt") || cat.includes("بنطلون") || cat.includes("تنانير")) {
    return {
      headers: ["Size", "Waist (cm)", "Hips (cm)", "Outseam (cm)", "Weight (kg)"],
      rows: [
        { Size: "XS", "Waist (cm)": "64", "Hips (cm)": "88", "Outseam (cm)": "104", "Weight (kg)": "45-52" },
        { Size: "S", "Waist (cm)": "68", "Hips (cm)": "92", "Outseam (cm)": "105", "Weight (kg)": "52-58" },
        { Size: "M", "Waist (cm)": "72", "Hips (cm)": "96", "Outseam (cm)": "107", "Weight (kg)": "58-65" },
        { Size: "L", "Waist (cm)": "78", "Hips (cm)": "102", "Outseam (cm)": "109", "Weight (kg)": "65-73" },
        { Size: "XL", "Waist (cm)": "84", "Hips (cm)": "108", "Outseam (cm)": "111", "Weight (kg)": "73-82" },
      ],
    };
  }

  if (cat.includes("footwear") || cat.includes("أحذية")) {
    return {
      headers: ["EU Size", "US Size", "Foot Length (cm)", "Weight (kg)"],
      rows: [
        { "EU Size": "36", "US Size": "6.0", "Foot Length (cm)": "23.0", "Weight (kg)": "45-55" },
        { "EU Size": "37", "US Size": "6.5", "Foot Length (cm)": "23.5", "Weight (kg)": "48-58" },
        { "EU Size": "38", "US Size": "7.5", "Foot Length (cm)": "24.0", "Weight (kg)": "52-62" },
        { "EU Size": "39", "US Size": "8.5", "Foot Length (cm)": "24.5", "Weight (kg)": "56-66" },
        { "EU Size": "40", "US Size": "9.0", "Foot Length (cm)": "25.0", "Weight (kg)": "60-70" },
        { "EU Size": "41", "US Size": "9.5", "Foot Length (cm)": "25.5", "Weight (kg)": "64-75" },
      ],
    };
  }

  // Default Top / Hoodie / General Size Chart
  return {
    headers: ["Size", "Chest (cm)", "Shoulder (cm)", "Sleeve (cm)", "Length (cm)", "Weight (kg)"],
    rows: [
      { Size: "XS", "Chest (cm)": "96", "Shoulder (cm)": "44", "Sleeve (cm)": "58", "Length (cm)": "66", "Weight (kg)": "48-55" },
      { Size: "S", "Chest (cm)": "100", "Shoulder (cm)": "46", "Sleeve (cm)": "59", "Length (cm)": "68", "Weight (kg)": "55-62" },
      { Size: "M", "Chest (cm)": "106", "Shoulder (cm)": "48", "Sleeve (cm)": "60", "Length (cm)": "70", "Weight (kg)": "62-70" },
      { Size: "L", "Chest (cm)": "112", "Shoulder (cm)": "50", "Sleeve (cm)": "61", "Length (cm)": "72", "Weight (kg)": "70-80" },
      { Size: "XL", "Chest (cm)": "118", "Shoulder (cm)": "52", "Sleeve (cm)": "62", "Length (cm)": "74", "Weight (kg)": "80-90" },
    ],
  };
}
