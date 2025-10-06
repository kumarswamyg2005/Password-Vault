export function generatePassword(length: number, opts: any = {}) {
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";

  let chars = "";
  if (opts.lower) chars += lower;
  if (opts.upper) chars += upper;
  if (opts.numbers) chars += numbers;
  if (opts.symbols) chars += symbols;

  if (opts.excludeLookAlikes) {
    chars = chars.replace(/[Il1O0]/g, "");
  }

  let pwd = "";
  for (let i = 0; i < length; i++) {
    pwd += chars[Math.floor(Math.random() * chars.length)];
  }
  return pwd;
}
