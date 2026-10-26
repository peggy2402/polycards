import { spawn } from "child_process";
import http from "http";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9222;

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function getDebuggerUrl() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const data = await res.json();
      const page = data.find((d) => d.type === "page" && d.url.includes("compile-test"));
      if (page && page.webSocketDebuggerUrl) {
        return page.webSocketDebuggerUrl;
      }
    } catch {
      await wait(500);
    }
  }
  throw new Error("Cannot connect to Chrome remote debugging port");
}

async function compileTarget(slug) {
  console.log(`\n========================================`);
  console.log(`Đang biên dịch AR Target: ${slug}...`);
  console.log(`========================================`);

  const chromeProc = spawn(CHROME_PATH, [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    "--no-sandbox",
    `http://localhost:3000/compile-test.html?target=${slug}`,
  ]);

  try {
    const wsUrl = await getDebuggerUrl();
    const ws = new WebSocket(wsUrl);

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout compiling ${slug}`));
      }, 60000);

      ws.onopen = () => {
        // Enable Console and Runtime
        ws.send(JSON.stringify({ id: 1, method: "Runtime.enable" }));
        ws.send(JSON.stringify({ id: 2, method: "Console.enable" }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.method === "Runtime.exceptionThrown") {
            console.error(`[Chrome JS Exception]`, JSON.stringify(msg.params.exceptionDetails));
          }
          if (msg.method === "Runtime.consoleAPICalled") {
            const text = msg.params.args.map((a) => a.value || a.description || "").join(" ");
            console.log(`[Chrome Console] ${text}`);
            if (text.includes(`SUCCESS_SAVED_${slug}.mind`) || text.includes(`[SAVED] ${slug}.mind`)) {
              clearTimeout(timeout);
              resolve();
            }
          }
        } catch {}
      };

      ws.onerror = (err) => {
        clearTimeout(timeout);
        reject(err);
      };
    });

    console.log(`Thành công biên dịch target ${slug}.mind!`);
  } finally {
    chromeProc.kill("SIGKILL");
    await wait(1000);
  }
}

async function main() {
  const targets = ["cat", "dog", "deer", "elephant", "lion", "panda"];
  for (const t of targets) {
    try {
      await compileTarget(t);
    } catch (err) {
      console.error(`Lỗi khi biên dịch ${t}:`, err.message);
    }
  }
  console.log("\nHoàn tất biên dịch toàn bộ target!");
}

main();
