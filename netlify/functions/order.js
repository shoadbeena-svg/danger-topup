// Receives an order from the page and forwards it to your Telegram.
// BOT_TOKEN and CHAT_ID are set in Netlify's environment variables (never in the page).
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
  const token = process.env.BOT_TOKEN, chat = process.env.CHAT_ID;
  if (!token || !chat) return { statusCode: 500, body: "Not configured" };

  let d;
  try { d = JSON.parse(event.body || "{}"); } catch (e) { return { statusCode: 400, body: "Bad JSON" }; }

  const s = (v, n) => String(v == null ? "" : v).replace(/[\u0000-\u001f]/g, " ").trim().slice(0, n);
  const o = {
    cat: s(d.cat, 40), pkg: s(d.pkg, 60), price: Number(d.price) || 0,
    pid: s(d.pid, 12), method: s(d.method, 10), trx: s(d.trx, 30),
    name: s(d.name, 50), phone: s(d.phone, 20)
  };
  if (!/^\d{6,12}$/.test(o.pid) || o.trx.length < 6 || !o.pkg || o.price <= 0) {
    return { statusCode: 400, body: "Invalid order" };
  }

  const text = [
    "🆕 নতুন অর্ডার",
    "ধরন: " + o.cat,
    "প্যাকেজ: " + o.pkg,
    "দাম: ৳" + o.price,
    "Player ID: " + o.pid,
    "পেমেন্ট: " + o.method,
    "TrxID: " + o.trx,
    o.name ? "নাম: " + o.name : "",
    o.phone ? "ফোন: " + o.phone : ""
  ].filter(Boolean).join("\n");

  try {
    const r = await fetch("https://api.telegram.org/bot" + token + "/sendMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text })
    });
    return r.ok ? { statusCode: 200, body: "ok" } : { statusCode: 502, body: "Telegram error" };
  } catch (e) {
    return { statusCode: 502, body: "Network error" };
  }
};
