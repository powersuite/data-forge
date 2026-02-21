export function generateEmailPatterns(
  firstName: string,
  lastName: string,
  domain: string
): string[] {
  const f = firstName.toLowerCase().trim();
  const l = lastName.toLowerCase().trim();

  if (!f || !l || !domain) return [];

  const fi = f[0]; // first initial
  const li = l[0]; // last initial

  return [
    `${f}@${domain}`,
    `${f}.${l}@${domain}`,
    `${fi}${l}@${domain}`,
    `${f}${li}@${domain}`,
    `${f}_${l}@${domain}`,
    `${f}${l}@${domain}`,
    `${l}${f}@${domain}`,
    `${l}.${f}@${domain}`,
    `${l}${fi}@${domain}`,
    `${fi}.${l}@${domain}`,
    `${f}-${l}@${domain}`,
    `${l}@${domain}`,
  ];
}
