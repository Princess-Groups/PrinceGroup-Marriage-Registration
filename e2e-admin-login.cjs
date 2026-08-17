// Headless-Chrome CDP end-to-end test for the admin login flow.
// Drives the real dev server (http://localhost:5178) as a browser would:
//  1. GET /admin -> expect redirect to /admin/login
//  2. On /admin/login, fill username/password, submit
//  3. Wait for navigation to /admin (means server fn set the cookie + guard accepted it)
//  4. Logout -> expect back navigation to /admin/login

const { spawn } = require("child_process");

const BASE = "http://localhost:5178";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9277;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
      }
    };
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
}

async function main() {
  const cp = spawn(
    CHROME,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--remote-debugging-port=" + PORT,
      "--user-data-dir=" + process.env.TEMP + "/pcdp-e2e",
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  try {
    // Find the page target websocket.
    let list;
    for (let i = 0; i < 40; i++) {
      try {
        const r = await fetch(`http://localhost:${PORT}/json`);
        list = await r.json();
        if (list.some((p) => p.type === "page")) break;
      } catch {}
      await sleep(300);
    }
    const page = list.find((p) => p.type === "page");
    if (!page) throw new Error("no page target");

    const ws = new (require("ws"))(page.webSocketDebuggerUrl);
    await new Promise((res) => ws.on("open", res));
    const cdp = new CDP(ws);

    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Log.enable");

    // Capture console + network errors from the page to diagnose failures.
    cdp.ws.addEventListener("message", (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.method === "Runtime.consoleAPICalled") {
          const lvl = msg.params.type;
          if (["error", "warning"].includes(lvl)) {
            const text = msg.params.args.map((a) => a.value ?? a.description ?? "").join(" ");
            if (text) console.log("[page:" + lvl + "]", text.slice(0, 300));
          }
        }
        if (msg.method === "Runtime.exceptionThrown") {
          const d = msg.params.exceptionDetails;
          console.error("[page:exception]", d.text, d.exception?.description ?? "");
        }
      } catch {}
    });

    const failures = [];

    // Step 0: go to /admin unauthenticated. The SSR middleware must 302 to login.
    await cdp.send("Page.navigate", { url: BASE + "/admin" });
    await sleep(1500);
    let url = await cdp.send("Page.getNavigationHistory");
    let current = url.entries[url.currentIndex].url;
    console.log("[step 0] /admin now at:", current);
    if (!current.includes("/admin/login")) {
      failures.push("expected redirect to /admin/login, got " + current);
    }

    // Step 1: fill the form and submit.
    await cdp.send("Page.navigate", { url: BASE + "/admin/login" });
    await sleep(1800);
    await cdp.send("Runtime.evaluate", {
      expression: `
        (() => {
          const inputs = document.querySelectorAll('input');
          const user = [...inputs].find(i => i.type !== 'password');
          const pass = document.querySelector('input[type=password]');
          if (!user || !pass) return 'MISSING_INPUTS';
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(user, 'BeemBoy');
          user.dispatchEvent(new Event('input', { bubbles: true }));
          setter.call(pass, 'BeemBoy@123');
          pass.dispatchEvent(new Event('input', { bubbles: true }));
          return 'filled';
        })()
      `,
      awaitPromise: true,
    });
    await sleep(200);

    // Submit the form.
    const sub = await cdp.send("Runtime.evaluate", {
      expression: `document.querySelector('form').requestSubmit(); 'submitted'`,
      returnByValue: true,
    });
    void sub;
    console.log("[step 1] submitted login form", JSON.stringify(sub.result?.value));

    // grab any toast/error that appears
    await sleep(1200);
    const errTxt = await cdp.send("Runtime.evaluate", {
      expression: `[...document.querySelectorAll('[data-sonner-toast]')].map(t=>t.innerText).join(' | ') || document.body.innerText.split('\\n').slice(0,12).join(' / ')`,
      returnByValue: true,
    });
    console.log("[step 1.5] visible text:", JSON.stringify(errTxt.result?.value));

    // Wait up to ~6s for navigation to /admin (login RPC sets cookie, guard lets through).
    let landed = false;
    for (let i = 0; i < 30; i++) {
      await sleep(250);
      const hist = await cdp.send("Page.getNavigationHistory");
      const cur = hist.entries[hist.currentIndex].url;
      if (cur.includes("/admin") && !cur.includes("/admin/login")) {
        landed = true;
        url = cur;
        console.log("[step 2] landed on dashboard:", cur);
        break;
      }
    }
    if (!landed) {
      // get final URL + any error text
      const hist = await cdp.send("Page.getNavigationHistory");
      const cur = hist.entries[hist.currentIndex].url;
      const res = await cdp.send("Runtime.evaluate", {
        expression: `document.body.innerText.slice(0,300)`,
        returnByValue: true,
      });
      failures.push(
        "login did not reach dashboard. url=" + cur + " body=" + JSON.stringify(res.result?.value || ""),
      );
    }

    // Step 3: verify the dashboard shows content (auth passed) and cookie set.
    if (landed) {
      const txt = await cdp.send("Runtime.evaluate", {
        expression: `document.body.innerText.includes('Admin Dashboard') ? 'DASHBOARD_OK' : document.body.innerText.slice(0,120)`,
        returnByValue: true,
      });
      console.log("[step 3] dashboard content:", txt.result?.value);
      if (txt.result?.value !== "DASHBOARD_OK") failures.push("dashboard content missing");

      // Step 4: logout
      const out = await cdp.send("Runtime.evaluate", {
        expression: `(document.body.innerText.includes('Logout') ? [...document.querySelectorAll('button')].find(b=>b.innerText.includes('Logout')).click() : null, 'clicked')`,
        returnByValue: true,
      });
      void out;
      await sleep(1800);
      const hist2 = await cdp.send("Page.getNavigationHistory");
      const cur2 = hist2.entries[hist2.currentIndex].url;
      console.log("[step 4] after logout at:", cur2);
      if (!cur2.includes("/admin/login")) {
        failures.push("logout did not return to login. url=" + cur2);
      }
    }

    ws.close();
    if (failures.length) {
      console.error("\n=== FAILURES ===");
      failures.forEach((f) => console.error(" -", f));
      process.exit(1);
    }
    console.log("\n=== ALL PASSED ===");
  } finally {
    cp.kill();
  }
}

main().catch((e) => {
  console.error("E2E error:", e);
  process.exit(1);
});