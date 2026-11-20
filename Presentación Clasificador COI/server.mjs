import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";

const port = 8766;
const home = `http://localhost:${port}/`;
const openOnStart = process.argv.includes("--abrir");
const html = ["index.html", "text/html; charset=utf-8"];
const assets = new Map([
  ["/", html],
  ["/index.html", html],
  ["/styles.css", ["styles.css", "text/css; charset=utf-8"]],
  ["/campus.css", ["campus.css", "text/css; charset=utf-8"]],
  ["/slides.js", ["slides.js", "text/javascript; charset=utf-8"]],
  ["/presentation.js", ["presentation.js", "text/javascript; charset=utf-8"]],
  ["/fonts/inter.ttf", ["fonts/inter.ttf", "font/ttf"]],
  ["/fonts/plex-mono.ttf", ["fonts/plex-mono.ttf", "font/ttf"]],
  ["/fonts/instrument-serif.ttf", ["fonts/instrument-serif.ttf", "font/ttf"]],
  ["/fonts/instrument-serif-italic.ttf", ["fonts/instrument-serif-italic.ttf", "font/ttf"]],
]);

function openBrowser() {
  const browser = spawn(process.env.ComSpec || "cmd.exe", ["/d", "/c", `start "" "${home}"`], {
    windowsHide: true,
    windowsVerbatimArguments: true,
    detached: true,
    stdio: "ignore",
  });
  browser.on("error", () => console.log(`Abrí ${home} en el navegador.`));
  browser.unref();
}

const server = createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }
  const pathname = request.url.split("?")[0];
  const asset = assets.get(pathname);
  if (!asset) {
    response.writeHead(404).end();
    return;
  }
  const [file, contentType] = asset;
  try {
    const contents = await readFile(new URL(`./dist/${file}`, import.meta.url));
    response.writeHead(200, {
      "Content-Type": contentType,
      "Content-Length": contents.length,
      "Cache-Control": "no-store",
    });
    response.end(request.method === "HEAD" ? undefined : contents);
  } catch (error) {
    console.error(`Error al leer ${file}`, error.message);
    response.writeHead(500).end();
  }
});

server.on("error", async (error) => {
  if (error.code === "EADDRINUSE" && openOnStart) {
    // El lanzador se puede abrir otra vez si la presentación ya está servida.
    try {
      const existing = await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(2500) });
      if (existing.ok && (await existing.text()).includes('<script src="./slides.js" defer>')) {
        openBrowser();
        return;
      }
    } catch (connectionError) {
      console.error(connectionError.message);
    }
  }
  console.error(`No se pudo servir ${home}`, error.message);
  process.exitCode = 1;
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Presentación Clasificador COI disponible en ${home}`);
  console.log("Ctrl+C cierra el servidor.");
  if (openOnStart) openBrowser();
});
