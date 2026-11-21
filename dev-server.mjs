import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, relative, extname, isAbsolute } from "node:path";

const root = process.cwd();
const mime = { ".html":"text/html; charset=utf-8", ".css":"text/css; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".mjs":"text/javascript; charset=utf-8", ".json":"application/json; charset=utf-8", ".webmanifest":"application/manifest+json; charset=utf-8", ".svg":"image/svg+xml" };
createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const file = resolve(root, `.${pathname === "/" ? "/index.html" : pathname}`);
    const fromRoot = relative(root, file);
    if (isAbsolute(fromRoot) || fromRoot === ".." || fromRoot.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`)) {
      response.writeHead(403).end("Forbidden"); return;
    }
    const content = await readFile(file);
    response.writeHead(200, { "content-type": mime[extname(file)] || "application/octet-stream", "cache-control": "no-store" }).end(content);
  } catch { response.writeHead(404).end("Not found"); }
}).listen(8765, "127.0.0.1", () => process.stdout.write("Preview: http://127.0.0.1:8765\n"));
