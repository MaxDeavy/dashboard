export function extractXmlTagValue(xml: string, tag: string): string {
  const values = extractXmlTagValues(xml, tag);
  return values[0] ?? "";
}

export function extractXmlTagValues(xml: string, tag: string): string[] {
  const values: string[] = [];

  const cdataRegex = new RegExp(
    `<${tag}[^>]*><!\\[CDATA\\[([^\\]]*)\\]\\]></${tag}>`,
    "gi",
  );
  for (const match of xml.matchAll(cdataRegex)) {
    values.push(match[1]);
  }
  if (values.length > 0) {
    return values;
  }

  const plainRegex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "gi");
  for (const match of xml.matchAll(plainRegex)) {
    const value = match[1]?.trim();
    if (value) values.push(value);
  }

  return values;
}

export function parseSoapResponse(xml: string): Record<string, string> {
  const result: Record<string, string> = {};
  const tagRegex = /<([A-Za-z0-9_:-]+)>([^<]*)<\/\1>/g;

  for (const match of xml.matchAll(tagRegex)) {
    result[match[1]] = match[2];
  }

  return result;
}
