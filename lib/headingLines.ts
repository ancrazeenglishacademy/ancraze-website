// Shows card headings in two lines, e.g. "Self Fluent" / "in 30 Days"
export function headingLines(name: string) {
  const text =
    name === name.toUpperCase()
      ? name.toLowerCase().replace(/\b[a-z]/g, (ch) => ch.toUpperCase()).replace(/\bIn\b/g, "in")
      : name;
  return text.trim().split(/\s+(?=in\s+\d)/i);
}
