/**
 * benguha.com — personal site + app launcher
 *
 * Routes:
 *   GET  /                 Homepage with menu of installed apps
 *   GET  /admin            Admin panel (requires admin cookie)
 *   GET  /admin/login      Login form
 *   POST /admin/login      Checks ADMIN_TOKEN, sets session cookie
 *   POST /admin/logout     Clears session cookie
 *   GET  /api/apps         Public JSON list of installed apps
 *   POST /api/apps         Add an app (admin only)
 *   PUT  /api/apps/:id     Edit an app (admin only)
 *   DELETE /api/apps/:id   Remove an app (admin only)
 *
 * Storage: KV namespace APPS, single key "apps" -> JSON array of:
 *   { id, name, description, url, icon }
 */

const COOKIE_NAME = "bg_admin";

function html(strings, ...values) {
  return strings.reduce((acc, s, i) => acc + s + (values[i] ?? ""), "");
}

const baseStyles = `
  :root {
    color-scheme: light dark;
    --bg: #0b0d10;
    --panel: #14171c;
    --text: #e7e9ec;
    --muted: #9aa3ad;
    --accent: #5b9dff;
    --border: #262b32;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
  }
  a { color: var(--accent); text-decoration: none; }
  a:hover { text-decoration: underline; }
  header {
    padding: 2.5rem 1.5rem 1rem;
    text-align: center;
  }
  header h1 {
    margin: 0;
    font-size: 2rem;
    letter-spacing: -0.02em;
  }
  header p {
    color: var(--muted);
    margin: 0.4rem 0 0;
  }
  main {
    max-width: 920px;
    margin: 0 auto;
    padding: 1.5rem;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 1rem;
    margin-top: 1.5rem;
  }
  .card {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    transition: border-color 0.15s ease, transform 0.15s ease;
  }
  .card:hover {
    border-color: var(--accent);
    transform: translateY(-2px);
  }
  .card .icon { font-size: 1.6rem; }
  .card h3 { margin: 0; font-size: 1.05rem; }
  .card p { margin: 0; color: var(--muted); font-size: 0.9rem; }
  .empty {
    text-align: center;
    color: var(--muted);
    padding: 3rem 1rem;
    border: 1px dashed var(--border);
    border-radius: 12px;
    margin-top: 1.5rem;
  }
  .about {
    border-left: 3px solid var(--border);
    padding: 0.6rem 1rem;
    margin-top: 1.5rem;
    color: var(--muted);
    font-size: 0.95rem;
    line-height: 1.6;
  }
  .about a { color: var(--accent); }
  .section-label {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
    margin: 2rem 0 0;
  }
  footer {
    text-align: center;
    color: var(--muted);
    font-size: 0.8rem;
    padding: 2rem 1rem 3rem;
  }
  form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    max-width: 420px;
  }
  label { font-size: 0.85rem; color: var(--muted); }
  input, textarea {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text);
    padding: 0.6rem 0.75rem;
    font-size: 0.95rem;
    font-family: inherit;
  }
  button {
    background: var(--accent);
    color: #08111f;
    border: none;
    border-radius: 8px;
    padding: 0.65rem 1rem;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
  }
  button.secondary {
    background: transparent;
    color: var(--text);
    border: 1px solid var(--border);
  }
  button.danger {
    background: #3a1414;
    color: #ff8080;
    border: 1px solid #5a1f1f;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1.5rem;
  }
  th, td {
    text-align: left;
    padding: 0.6rem 0.5rem;
    border-bottom: 1px solid var(--border);
    font-size: 0.9rem;
    vertical-align: top;
  }
  th { color: var(--muted); font-weight: 500; }
  .row-actions { display: flex; gap: 0.5rem; }
  .topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 920px;
    margin: 0 auto;
    padding: 1rem 1.5rem 0;
  }
  .topbar a.back { color: var(--muted); font-size: 0.9rem; }
  .badge {
    display: inline-block;
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 0.2rem 0.6rem;
    font-size: 0.75rem;
    color: var(--muted);
  }
  .msg {
    border-radius: 8px;
    padding: 0.6rem 0.9rem;
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
  }
  .msg.error { background: #3a1414; color: #ff8080; border: 1px solid #5a1f1f; }
  .msg.ok { background: #143a1f; color: #7ee69b; border: 1px solid #1f5a30; }
`;

function page(title, body, opts = {}) {
  return html`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>${baseStyles}${opts.extraStyles || ""}</style>
</head>
<body>
${body}
</body>
</html>`;
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

async function getApps(env) {
  const raw = await env.APPS.get("apps");
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveApps(env, apps) {
  await env.APPS.put("apps", JSON.stringify(apps));
}

function renderHomepage(apps) {
  const cards = apps.map((a) => html`
    <a class="card" href="${escapeHtml(a.url)}" target="_blank" rel="noopener">
      <div class="icon">${escapeHtml(a.icon || "🔧")}</div>
      <h3>${escapeHtml(a.name)}</h3>
      <p>${escapeHtml(a.description || "")}</p>
    </a>`).join("");

  const body = html`
    <header>
      <h1>benguha.com</h1>
      <p>Benjamin Guha's projects &amp; tools — built once, used anywhere.</p>
    </header>
    <main>
      <section class="about">
        <p>
          I'm Ben — I build small tools whenever computers can make life more efficient.
          Everything here is public and free to use. Source lives on
          <a href="https://github.com/benjaminguha1" target="_blank" rel="noopener">GitHub</a>.
        </p>
      </section>
      <h2 class="section-label">Tools</h2>
      ${apps.length ? `<div class="grid">${cards}</div>` : `<div class="empty">No apps installed yet. Check back soon — new tools land here as they're built.</div>`}
    </main>
    <footer>
      <a href="https://github.com/benjaminguha1" target="_blank" rel="noopener">github</a>
      &nbsp;·&nbsp;
      <a class="back" href="/admin/login">admin</a>
    </footer>
  `;
  return page("benguha.com", body);
}

function renderLogin(error) {
  const body = html`
    <main style="max-width:420px; margin-top:4rem;">
      <h2>Admin sign-in</h2>
      ${error ? `<div class="msg error">${escapeHtml(error)}</div>` : ""}
      <form method="POST" action="/admin/login">
        <label for="token">Admin token</label>
        <input type="password" id="token" name="token" autofocus required />
        <button type="submit">Sign in</button>
      </form>
      <p style="margin-top:1rem;"><a class="back" href="/">&larr; back to site</a></p>
    </main>
  `;
  return page("Sign in — benguha.com", body);
}

function renderAdmin(apps) {
  const rows = apps.map((a) => html`
    <tr>
      <td><strong>${escapeHtml(a.name)}</strong><br/><span class="badge">${escapeHtml(a.id)}</span></td>
      <td>${escapeHtml(a.description || "")}</td>
      <td><a href="${escapeHtml(a.url)}" target="_blank" rel="noopener">${escapeHtml(a.url)}</a></td>
      <td>
        <div class="row-actions">
          <form method="POST" action="/admin/apps/${encodeURIComponent(a.id)}/delete" onsubmit="return confirm('Remove ${escapeHtml(a.name)}?');">
            <button class="danger" type="submit">Remove</button>
          </form>
        </div>
      </td>
    </tr>`).join("");

  const body = html`
    <div class="topbar">
      <strong>benguha.com — admin</strong>
      <div>
        <a class="back" href="/" style="margin-right:1rem;">view site</a>
        <form method="POST" action="/admin/logout" style="display:inline;">
          <button class="secondary" type="submit">Sign out</button>
        </form>
      </div>
    </div>
    <main>
      <h2>Add an app or project</h2>
      <form method="POST" action="/admin/apps">
        <label for="name">Name</label>
        <input id="name" name="name" required placeholder="e.g. Recipe Tracker" />
        <label for="url">URL</label>
        <input id="url" name="url" required placeholder="https://recipes.benguha.com" />
        <label for="icon">Icon (single emoji, optional)</label>
        <input id="icon" name="icon" maxlength="4" placeholder="🍳" />
        <label for="description">Short description</label>
        <textarea id="description" name="description" rows="2" placeholder="What does it do?"></textarea>
        <button type="submit">Add app</button>
      </form>

      <h2 style="margin-top:2.5rem;">Installed apps (${apps.length})</h2>
      ${apps.length ? `<table><thead><tr><th>App</th><th>Description</th><th>URL</th><th></th></tr></thead><tbody>${rows}</tbody></table>` : `<div class="empty">Nothing installed yet — add your first app above.</div>`}
    </main>
  `;
  return page("Admin — benguha.com", body);
}

function getCookie(request, name) {
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

function isAdmin(request, env) {
  const token = getCookie(request, COOKIE_NAME);
  return !!token && !!env.ADMIN_TOKEN && token === env.ADMIN_TOKEN;
}

function setSessionCookie(token) {
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`;
}

function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

function redirect(location, headers = {}) {
  return new Response(null, { status: 303, headers: { Location: location, ...headers } });
}

function slugify(name) {
  return (
    String(name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || `app-${Date.now()}`
  );
}

async function uniqueId(base, apps) {
  let id = base;
  let n = 2;
  const ids = new Set(apps.map((a) => a.id));
  while (ids.has(id)) {
    id = `${base}-${n++}`;
  }
  return id;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method.toUpperCase();

    // ---- Public homepage ----
    if (pathname === "/" && method === "GET") {
      const apps = await getApps(env);
      return new Response(renderHomepage(apps), {
        headers: { "Content-Type": "text/html;charset=UTF-8" },
      });
    }

    // ---- Public read-only API ----
    if (pathname === "/api/apps" && method === "GET") {
      const apps = await getApps(env);
      return new Response(JSON.stringify(apps, null, 2), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // ---- Login ----
    if (pathname === "/admin/login" && method === "GET") {
      if (isAdmin(request, env)) return redirect("/admin");
      return new Response(renderLogin(), { headers: { "Content-Type": "text/html;charset=UTF-8" } });
    }

    if (pathname === "/admin/login" && method === "POST") {
      const form = await request.formData();
      const token = (form.get("token") || "").toString();
      if (env.ADMIN_TOKEN && token === env.ADMIN_TOKEN) {
        return redirect("/admin", { "Set-Cookie": setSessionCookie(token) });
      }
      return new Response(renderLogin("Incorrect token."), {
        status: 401,
        headers: { "Content-Type": "text/html;charset=UTF-8" },
      });
    }

    if (pathname === "/admin/logout" && method === "POST") {
      return redirect("/", { "Set-Cookie": clearSessionCookie() });
    }

    // ---- Everything else under /admin requires auth ----
    if (pathname.startsWith("/admin")) {
      if (!isAdmin(request, env)) return redirect("/admin/login");

      if (pathname === "/admin" && method === "GET") {
        const apps = await getApps(env);
        return new Response(renderAdmin(apps), { headers: { "Content-Type": "text/html;charset=UTF-8" } });
      }

      if (pathname === "/admin/apps" && method === "POST") {
        const form = await request.formData();
        const name = (form.get("name") || "").toString().trim();
        const appUrl = (form.get("url") || "").toString().trim();
        const icon = (form.get("icon") || "").toString().trim();
        const description = (form.get("description") || "").toString().trim();
        if (!name || !appUrl) return redirect("/admin");

        const apps = await getApps(env);
        const id = await uniqueId(slugify(name), apps);
        apps.push({ id, name, url: appUrl, icon, description });
        await saveApps(env, apps);
        return redirect("/admin");
      }

      const delMatch = pathname.match(/^\/admin\/apps\/([^/]+)\/delete$/);
      if (delMatch && method === "POST") {
        const id = decodeURIComponent(delMatch[1]);
        const apps = await getApps(env);
        await saveApps(env, apps.filter((a) => a.id !== id));
        return redirect("/admin");
      }

      return new Response("Not found", { status: 404 });
    }

    // ---- Authenticated JSON API (for programmatic management) ----
    if (pathname === "/api/apps" && (method === "POST" || method === "PUT" || method === "DELETE")) {
      if (!isAdmin(request, env)) {
        return new Response(JSON.stringify({ error: "unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
      const apps = await getApps(env);

      if (method === "POST") {
        const body = await request.json().catch(() => ({}));
        const name = (body.name || "").toString().trim();
        const appUrl = (body.url || "").toString().trim();
        if (!name || !appUrl) {
          return new Response(JSON.stringify({ error: "name and url are required" }), { status: 400 });
        }
        const id = await uniqueId(slugify(body.id || name), apps);
        const app = { id, name, url: appUrl, icon: (body.icon || "").toString(), description: (body.description || "").toString() };
        apps.push(app);
        await saveApps(env, apps);
        return new Response(JSON.stringify(app), { status: 201, headers: { "Content-Type": "application/json" } });
      }
    }

    const apiIdMatch = pathname.match(/^\/api\/apps\/([^/]+)$/);
    if (apiIdMatch && (method === "PUT" || method === "DELETE")) {
      if (!isAdmin(request, env)) {
        return new Response(JSON.stringify({ error: "unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
      const id = decodeURIComponent(apiIdMatch[1]);
      const apps = await getApps(env);
      const idx = apps.findIndex((a) => a.id === id);

      if (method === "DELETE") {
        if (idx === -1) return new Response(JSON.stringify({ error: "not found" }), { status: 404 });
        apps.splice(idx, 1);
        await saveApps(env, apps);
        return new Response(JSON.stringify({ ok: true }));
      }

      if (method === "PUT") {
        if (idx === -1) return new Response(JSON.stringify({ error: "not found" }), { status: 404 });
        const body = await request.json().catch(() => ({}));
        apps[idx] = { ...apps[idx], ...body, id };
        await saveApps(env, apps);
        return new Response(JSON.stringify(apps[idx]), { headers: { "Content-Type": "application/json" } });
      }
    }

    return new Response("Not found", { status: 404 });
  },
};
