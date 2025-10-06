export function generatePassword(length = 16, opts = { lower: true, upper: true, numbers: true, symbols: true, excludeLookAlikes: true }) {
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()-_=+[]{};:,.<>/?';
  const lookalikes = 'Il1O0';
  let pool = '';
  if (opts.lower) pool += lower;
  if (opts.upper) pool += upper;
  if (opts.numbers) pool += numbers;
  if (opts.symbols) pool += symbols;
  if (opts.excludeLookAlikes) pool = pool.split('').filter(ch => !lookalikes.includes(ch)).join('');
  if (!pool) return '';
  let out = '';
  const randomValues = crypto.getRandomValues(new Uint32Array(length));
  for (let i = 0; i < length; i++) {
    out += pool[randomValues[i] % pool.length];
  }
  return out;
}
