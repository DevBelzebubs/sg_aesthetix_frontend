import { cpSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

// Copy bcryptjs npm package to output node_modules as a fallback
const src = join(root, "node_modules", "bcryptjs");
const dst = join(root, ".open-next", "server-functions", "default", "node_modules", "bcryptjs");

if (!existsSync(src)) {
  console.error(`Source not found: ${src}`);
  process.exit(1);
}

cpSync(src, dst, { recursive: true, force: true, dereference: true });
console.log(`Copied bcryptjs to ${dst}`);
