export const FALLBACK_PRODUCT_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
      <rect width="800" height="800" fill="#FFF9F1"/>
      <rect x="40" y="40" width="720" height="720" rx="48" fill="#F3E4E6" stroke="#D9B66F" stroke-width="4"/>
      <circle cx="400" cy="340" r="76" fill="#8F1D35"/>
      <text x="400" y="362" text-anchor="middle" font-family="Georgia, serif" font-size="72" font-weight="bold" fill="#FFF9F1">G</text>
      <text x="400" y="470" text-anchor="middle" font-family="Georgia, serif" font-size="36" font-weight="bold" fill="#332522">GOJIFEM MARKETPLACE</text>
      <text x="400" y="518" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="#8F1D35">Verified Merchant Listing</text>
    </svg>`,
  );

export function handleImageError(e: React.SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget;
  if (img.dataset.fallbackApplied === 'true') return;
  img.dataset.fallbackApplied = 'true';
  img.src = FALLBACK_PRODUCT_IMAGE;
}
