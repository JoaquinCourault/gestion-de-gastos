import fs from 'fs';
import path from 'path';

export function readJson<T>(filename: string): T {
  const p = path.join(process.cwd(), filename);
  if (!fs.existsSync(p)) return ([] as unknown) as T;
  const raw = fs.readFileSync(p, 'utf-8');
  return JSON.parse(raw) as T;
}

export function writeJson<T>(filename: string, data: T) {
  const p = path.join(process.cwd(), filename);
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf-8');
}
