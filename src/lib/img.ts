// Build a local product image URL (replaces Unsplash URLs which have no network
// access in the sandbox preview).
export function img(
  name: string,
  category: string,
  color: string,
  idx: number = 0,
  w: number = 1200,
  h: number = 1500
): string {
  const params = new URLSearchParams({
    name,
    category,
    color,
    idx: String(idx),
    w: String(w),
    h: String(h),
  });
  return `/api/product-img?${params.toString()}`;
}

// Hero / editorial image — wider aspect
export function editorialImg(
  name: string,
  color: string = "noir",
  w: number = 1920,
  h: number = 1080
): string {
  const params = new URLSearchParams({
    name,
    category: "Editorial",
    color,
    idx: "0",
    w: String(w),
    h: String(h),
  });
  return `/api/product-img?${params.toString()}`;
}
