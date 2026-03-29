function isUuidLike(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    id,
  );
}

/** Human-friendly labels for UUID primary keys in POS UI. */
export function formatOrderLabel(id: string): string {
  if (isUuidLike(id)) {
    return `ORD-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
  }
  return id;
}

export function formatTxLabel(id: string): string {
  if (isUuidLike(id)) {
    return `TX-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
  }
  return id;
}
