export function itemSlug(id: string, name: string): string {
  const safeName = name.replace(/\s+/g, "-");
  return `${id}-${safeName}`;
}

export function itemUrl(id: string, name?: string): string {
  if (!name) return `/${id}/`;
  return `/${itemSlug(id, name)}/`;
}

export function parseItemSlug(slug: string): string {
  return slug.split("-")[0];
}
