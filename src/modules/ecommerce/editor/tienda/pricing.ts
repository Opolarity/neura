type NormalizedPriceInput = {
  price?: number | null;
  regularPrice?: number | null;
  salePrice?: number | null;
};

type NormalizedPrice = {
  effectivePrice: number;
  originalPrice?: number;
  hasDiscount: boolean;
};

function isValidPrice(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function normalizePrice({
  price,
  regularPrice,
  salePrice,
}: NormalizedPriceInput): NormalizedPrice {
  const hasRawPrice = isValidPrice(price);
  const hasRegularPrice = isValidPrice(regularPrice);
  const hasSalePrice = isValidPrice(salePrice);

  let effectivePrice =
    (hasRawPrice ? price : undefined) ??
    (hasSalePrice ? salePrice : undefined) ??
    (hasRegularPrice ? regularPrice : undefined) ??
    0;

  if (hasRawPrice && hasSalePrice && salePrice < price) {
    effectivePrice = salePrice;
  }

  const originalCandidates = [
    hasRegularPrice ? regularPrice : undefined,
    hasRawPrice ? price : undefined,
  ].filter((candidate): candidate is number => isValidPrice(candidate));

  const originalPrice = originalCandidates.find(
    (candidate) => candidate > effectivePrice,
  );

  return {
    effectivePrice,
    originalPrice,
    hasDiscount: originalPrice != null,
  };
}
