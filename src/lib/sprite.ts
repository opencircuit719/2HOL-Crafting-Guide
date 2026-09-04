export function getSpriteUrl(objectId: string, variant?: "last"): string {
  const suffix = variant === "last" ? "_last" : "";
  return `/sprites/obj_${objectId}${suffix}.png`;
}
