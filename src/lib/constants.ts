export const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "aol.com",
  "icloud.com",
  "mail.com",
  "protonmail.com",
  "zoho.com",
  "yandex.com",
  "gmx.com",
  "gmx.net",
  "live.com",
  "msn.com",
  "me.com",
  "mac.com",
  "inbox.com",
  "fastmail.com",
  "tutanota.com",
  "hushmail.com",
  "mailfence.com",
  "disroot.org",
  "riseup.net",
  "posteo.de",
  "runbox.com",
  "kolabnow.com",
  "proton.me",
  "pm.me",
  "yahoo.co.uk",
  "yahoo.co.in",
  "hotmail.co.uk",
]);

export const NAME_COLUMN_PATTERNS = [
  /^name$/i,
  /^full[_\s]?name$/i,
  /^contact[_\s]?name$/i,
  /^customer[_\s]?name$/i,
];

export const FIRST_NAME_PATTERNS = [/^first[_\s]?name$/i, /^fname$/i];
export const LAST_NAME_PATTERNS = [/^last[_\s]?name$/i, /^lname$/i, /^surname$/i];

export const EMAIL_COLUMN_PATTERNS = [
  /^email$/i,
  /^e[_\s]?mail$/i,
  /^email[_\s]?address$/i,
];

export const PHONE_COLUMN_PATTERNS = [
  /^phone$/i,
  /^phone[_\s]?number$/i,
  /^tel$/i,
  /^telephone$/i,
  /^mobile$/i,
  /^cell$/i,
];

export const PRESERVE_ACRONYMS = new Set([
  "LLC",
  "INC",
  "CEO",
  "CTO",
  "CFO",
  "COO",
  "VP",
  "SVP",
  "EVP",
  "MD",
  "PhD",
  "DDS",
  "DVM",
  "RN",
  "LPN",
  "PA",
  "NP",
  "II",
  "III",
  "IV",
  "JR",
  "SR",
  "USA",
  "UK",
  "NYC",
]);

export const BATCH_SIZE = 500;
