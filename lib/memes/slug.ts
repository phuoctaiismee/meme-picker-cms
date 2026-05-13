export function slugifyTag(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function parseTags(value: FormDataEntryValue | null) {
  if (!value) {
    return [];
  }

  const seen = new Set<string>();

  return String(value)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((name) => ({ name, slug: slugifyTag(name) }))
    .filter((tag) => {
      if (!tag.slug || seen.has(tag.slug)) {
        return false;
      }

      seen.add(tag.slug);
      return true;
    });
}
