export function parseTags(formData: FormData): string[] {
  return ((formData.get("tags") as string) ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}
