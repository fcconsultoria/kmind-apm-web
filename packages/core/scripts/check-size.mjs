import { gzipSync } from "node:zlib";
import { readFileSync } from "node:fs";

const size = gzipSync(readFileSync("dist/index.js")).byteLength;
const limit = 10 * 1024;
if (size > limit) throw new Error(`Core bundle is ${size} B gzip; the limit is ${limit} B.`);
console.log(`Core bundle: ${size} B gzip (limit ${limit} B)`);
