export function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || `item-${Date.now()}`;
}

export function whatsappLink(mobile: string, text: string) {
  const digits = mobile.replace(/\D/g, "").replace(/^91/, "");
  return `https://wa.me/91${digits}?text=${encodeURIComponent(text)}`;
}

export function telLink(mobile: string) {
  const digits = mobile.replace(/\D/g, "");
  return `tel:+91${digits.replace(/^91/, "")}`;
}
