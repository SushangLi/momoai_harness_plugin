var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __knownSymbol = (name2, symbol) => (symbol = Symbol[name2]) ? symbol : Symbol.for("Symbol." + name2);
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __decoratorStart = (base) => [, , , __create(base?.[__knownSymbol("metadata")] ?? null)];
var __decoratorStrings = ["class", "method", "getter", "setter", "accessor", "field", "value", "get", "set"];
var __expectFn = (fn) => fn !== void 0 && typeof fn !== "function" ? __typeError("Function expected") : fn;
var __decoratorContext = (kind, name2, done, metadata, fns) => ({ kind: __decoratorStrings[kind], name: name2, metadata, addInitializer: (fn) => done._ ? __typeError("Already initialized") : fns.push(__expectFn(fn || null)) });
var __decoratorMetadata = (array, target) => __defNormalProp(target, __knownSymbol("metadata"), array[3]);
var __runInitializers = (array, flags, self, value) => {
  for (var i = 0, fns = array[flags >> 1], n = fns && fns.length; i < n; i++) flags & 1 ? fns[i].call(self) : value = fns[i].call(self, value);
  return value;
};
var __decorateElement = (array, flags, name2, decorators, target, extra) => {
  var fn, it, done, ctx, access, k = flags & 7, s = !!(flags & 8), p = !!(flags & 16);
  var j = k > 3 ? array.length + 1 : k ? s ? 1 : 2 : 0, key = __decoratorStrings[k + 5];
  var initializers = k > 3 && (array[j - 1] = []), extraInitializers = array[j] || (array[j] = []);
  var desc = k && (!p && !s && (target = target.prototype), k < 5 && (k > 3 || !p) && __getOwnPropDesc(k < 4 ? target : { get [name2]() {
    return __privateGet(this, extra);
  }, set [name2](x) {
    return __privateSet(this, extra, x);
  } }, name2));
  k ? p && k < 4 && __name(extra, (k > 2 ? "set " : k > 1 ? "get " : "") + name2) : __name(target, name2);
  for (var i = decorators.length - 1; i >= 0; i--) {
    ctx = __decoratorContext(k, name2, done = {}, array[3], extraInitializers);
    if (k) {
      ctx.static = s, ctx.private = p, access = ctx.access = { has: p ? (x) => __privateIn(target, x) : (x) => name2 in x };
      if (k ^ 3) access.get = p ? (x) => (k ^ 1 ? __privateGet : __privateMethod)(x, target, k ^ 4 ? extra : desc.get) : (x) => x[name2];
      if (k > 2) access.set = p ? (x, y) => __privateSet(x, target, y, k ^ 4 ? extra : desc.set) : (x, y) => x[name2] = y;
    }
    it = (0, decorators[i])(k ? k < 4 ? p ? extra : desc[key] : k > 4 ? void 0 : { get: desc.get, set: desc.set } : target, ctx), done._ = 1;
    if (k ^ 4 || it === void 0) __expectFn(it) && (k > 4 ? initializers.unshift(it) : k ? p ? extra = it : desc[key] = it : target = it);
    else if (typeof it !== "object" || it === null) __typeError("Object expected");
    else __expectFn(fn = it.get) && (desc.get = fn), __expectFn(fn = it.set) && (desc.set = fn), __expectFn(fn = it.init) && initializers.unshift(fn);
  }
  return k || __decoratorMetadata(array, target), desc && __defProp(target, name2, desc), p ? k ^ 4 ? extra : desc : target;
};
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateIn = (member, obj) => Object(obj) !== obj ? __typeError('Cannot use the "in" operator on this value') : member.has(obj);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);

// src/index.ts
import { TypertRemoteService, Remote } from "@deepseek-ai/dsh-typert-protocol";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";

// src/core.ts
import QRCode from "qrcode";
import { randomBytes } from "node:crypto";

// src/domain.ts
function modelFrom(row) {
  if (!Number.isSafeInteger(Number(row.id)) || Number(row.id) < 1 || row.agent_source_type !== "api" || !row.is_chat || row.is_delisted || row.service_status !== "active" || row.billing_unit !== "token" || !["openai", "anthropic", "google"].includes(row.baseurl_type)) return null;
  return { id: Number(row.id), name: String(row.agent_name), format: row.baseurl_type, serviceStatus: "active", billingUnit: "token", recommended: row.recommended === true };
}
function protocol(model, preferred) {
  if (!["openai", "anthropic", "google"].includes(model.format)) throw Error("\u6A21\u578B\u517C\u5BB9\u4FE1\u606F\u7F3A\u5931\uFF0C\u65E0\u6CD5\u8C03\u7528");
  if (!["auto", "openai-completions", "anthropic-messages"].includes(preferred)) throw Error("\u4E0D\u652F\u6301\u7684\u8C03\u7528\u7C7B\u578B");
  const native = model.format === "anthropic" ? "anthropic-messages" : "openai-completions";
  const effective = preferred === "auto" ? native : preferred === "anthropic-messages" && model.format !== "anthropic" ? native : preferred;
  return { preferred, effective, reason: preferred === "auto" ? "\u81EA\u52A8\u9002\u914D" : effective !== preferred ? "\u5F53\u524D\u6A21\u578B\u4E0D\u652F\u6301\u671F\u671B\u534F\u8BAE\uFF0C\u5DF2\u81EA\u52A8\u9002\u914D\uFF1B\u5207\u56DE\u517C\u5BB9\u6A21\u578B\u65F6\u6062\u590D\u504F\u597D\u3002" : "" };
}
function tokenPurchasePlan(tokens, listings, available) {
  if (!Number.isSafeInteger(tokens) || tokens < 1) throw Error("\u8BF7\u8F93\u5165\u5927\u4E8E\u96F6\u7684\u6574\u6570 Token \u6570\u91CF");
  const sorted = listings.filter((x) => x.is_available !== false && Number.isFinite(Number(x.resell_price)) && Number(x.resell_price) > 0 && (x.unlimited || Number(x.token_onsale) > 0)).sort((a, b) => Number(a.resell_price) - Number(b.resell_price));
  let remaining = tokens, estimate = 0, maxPrice = 0;
  for (const row of sorted) {
    const take = Math.min(remaining, row.unlimited ? remaining : Math.floor(Number(row.token_onsale)));
    if (take <= 0) continue;
    maxPrice = Number(row.resell_price);
    estimate += take * maxPrice / 1e3;
    remaining -= take;
    if (!remaining) break;
  }
  if (!maxPrice) throw Error("\u6682\u65E0\u53EF\u8D2D\u4E70\u5E93\u5B58");
  const offered = tokens - remaining;
  const ceiling = Math.ceil((offered * maxPrice / 1e3 * 2 - 1e-9) * 100) / 100;
  if (!Number.isFinite(available) || ceiling > available) throw Error(`\u79EF\u5206\u4E0D\u8DB3\uFF0C\u672C\u6B21\u6570\u91CF\u6700\u591A\u9700\u8981 ${ceiling} \u79EF\u5206`);
  return { tokens: offered, requested: tokens, max_price: maxPrice, estimate: Math.ceil((estimate - 1e-9) * 100) / 100, ceiling };
}
var defaultModelFilters = { recommended: true, held: true, all: false };

// src/core.ts
var HttpFailure = class extends Error {
  constructor(status) {
    super(`MomoAI \u8BF7\u6C42\u5931\u8D25\uFF08HTTP ${status}\uFF09`);
    this.status = status;
  }
};
var MomoCore = class {
  constructor(vault, load, save, fetcher = fetch) {
    this.vault = vault;
    this.load = load;
    this.save = save;
    this.fetcher = fetcher;
  }
  models = [];
  state = { modelFilters: { ...defaultModelFilters }, model: 247, preferred: "auto", orders: [], purchases: [], usage: {} };
  account;
  balance = null;
  balanceAt = null;
  balanceError = null;
  catalogAt = 0;
  catalogError = null;
  catalogFlight = null;
  balanceFlight = null;
  balanceAccount = null;
  balanceAttemptAt = 0;
  busy = false;
  refreshFlight = null;
  async init() {
    this.state = { ...this.state, ...await this.load() };
    this.models = this.state.catalogCache?.version === 2 ? this.state.catalogCache.models : [];
    this.catalogAt = this.state.catalogCache?.version === 2 ? this.state.catalogCache.at : 0;
    this.account = JSON.parse((await this.vault.resolve("MOMOAI_DSH_ACCOUNT"))?.value || "null");
    for (const o of [...this.state.orders, ...this.state.purchases]) if (o.status === "sending") o.status = "uncertain";
    await this.persist();
  }
  async persist() {
    await this.save(this.state);
  }
  async request(path, body, auth = "key") {
    const token = auth === "key" ? this.account?.key : auth === "login" ? this.account?.authToken : void 0;
    if (auth !== "none" && !token) throw Error("\u8BF7\u5148\u8FDE\u63A5 MomoAI \u8D26\u6237");
    let response;
    try {
      response = await this.fetcher("https://momoai.pro" + path, { method: body === void 0 ? "GET" : "POST", headers: { "Content-Type": "application/json", ...token ? { Authorization: `Bearer ${token}` } : {} }, body: body === void 0 ? void 0 : JSON.stringify(body), signal: AbortSignal.timeout(3e4) });
    } catch {
      throw Error("\u7F51\u7EDC\u8BF7\u6C42\u672A\u5B8C\u6210\uFF0C\u8BF7\u68C0\u67E5\u8FDE\u63A5\uFF1B\u8D2D\u4E70\u8BF7\u6C42\u4E0D\u4F1A\u81EA\u52A8\u91CD\u8BD5");
    }
    const data = await response.json().catch(() => null);
    if (!response.ok || data?.success === false || !data) throw new HttpFailure(response.status);
    return data;
  }
  async storeAccount() {
    await this.vault.set("MOMOAI_DSH_ACCOUNT", JSON.stringify(this.account));
  }
  async login() {
    const a = this.account;
    const r = await this.request("/api/auth/login", { email: a.email, password: a.password }, "none");
    a.authToken = r.authToken;
    a.displayName = r.user?.username || a.nickname;
    a.userId = r.user?.user_id || a.userId;
    a.key = r.user?.user_momoai_key || a.key;
    if (!a.key) {
      const k = await this.request("/api/user/momoai-key", { action: "create" }, "login");
      a.key = k.data?.user_momoai_key;
    }
    if (!a.key || !a.authToken) throw Error("\u8D26\u6237\u5C1A\u672A\u5C31\u7EEA\uFF0C\u8BF7\u91CD\u8BD5\u8FDE\u63A5");
    await this.storeAccount();
  }
  async register(nickname, termsAccepted) {
    nickname = typeof nickname === "string" ? nickname.trim() : "";
    if (!nickname || nickname.length > 40 || termsAccepted !== true) throw Error("\u8BF7\u586B\u5199\u6635\u79F0\u5E76\u540C\u610F\u7528\u6237\u534F\u8BAE");
    if (this.account?.key) {
      await this.login();
      return;
    }
    if (!this.account) {
      const username = `momocli-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10).replaceAll("-", "")}-${randomBytes(5).toString("hex")}`;
      this.account = { nickname, termsAcceptedAt: (/* @__PURE__ */ new Date()).toISOString(), username, email: `${username}@gmail.com`, password: randomBytes(18).toString("base64url"), registration: "prepared" };
      await this.storeAccount();
    }
    const a = this.account;
    if (a.registration !== "prepared") {
      await this.login();
      return;
    }
    a.nickname = nickname;
    a.registration = "submitted";
    await this.storeAccount();
    try {
      await this.request("/api/auth/register", { username: a.nickname, email: a.email, password: a.password }, "none");
    } catch (e) {
      if (e instanceof HttpFailure && [400, 422].includes(e.status)) {
        a.registration = "prepared";
        await this.storeAccount();
      }
      throw e;
    }
    await this.login();
  }
  async catalog(force = false) {
    if (!force && this.catalogAt > 0 && Date.now() - this.catalogAt < 3e5) return;
    if (this.catalogFlight) return this.catalogFlight;
    this.catalogFlight = (async () => {
      const path = (page) => `/api/agents?type=chat&zone=normal&page=${page}&limit=100`;
      const first = await this.request(path(1), void 0, "none");
      const pages = Number(first.pagination?.totalPages || 1);
      if (!Number.isSafeInteger(pages) || pages < 1 || pages > 100 || !Array.isArray(first.data)) throw Error("\u6A21\u578B\u76EE\u5F55\u683C\u5F0F\u4E0D\u517C\u5BB9");
      const data = [...first.data];
      for (let start = 2; start <= pages; start += 4) {
        const batch = await Promise.all(Array.from({ length: Math.min(4, pages - start + 1) }, (_, i) => this.request(path(start + i), void 0, "none")));
        for (const r of batch) {
          if (!Array.isArray(r.data)) throw Error("\u6A21\u578B\u76EE\u5F55\u683C\u5F0F\u4E0D\u517C\u5BB9");
          data.push(...r.data);
        }
      }
      this.models = [...new Map(data.map(modelFrom).filter(Boolean).map((m) => [m.id, m])).values()];
      this.catalogAt = Date.now();
      this.catalogError = null;
      this.state.catalogCache = { version: 2, at: this.catalogAt, models: this.models };
      await this.persist();
    })().catch((e) => {
      this.catalogError = e.message;
      throw e;
    }).finally(() => {
      this.catalogFlight = null;
    });
    return this.catalogFlight;
  }
  async refreshBalance(force = true) {
    const account = this.account?.username || null;
    if (this.balanceAccount !== account) {
      this.balance = null;
      this.balanceAt = null;
      this.balanceError = null;
      this.balanceAttemptAt = 0;
      this.balanceAccount = account;
    }
    if (this.balanceFlight) {
      await this.balanceFlight;
      if (!force) return;
    }
    if (!force && Date.now() - this.balanceAttemptAt < 3e4) return;
    this.balanceAttemptAt = Date.now();
    this.balanceFlight = (async () => {
      try {
        const r = await this.request("/api/cli/exchange/balance");
        if (!r.data?.credits || !Array.isArray(r.data.tokens)) throw Error("\u4F59\u989D\u6570\u636E\u683C\u5F0F\u4E0D\u517C\u5BB9");
        if (this.account?.username !== account) return;
        this.balance = r.data;
        this.balanceAt = (/* @__PURE__ */ new Date()).toISOString();
        this.balanceError = null;
      } catch (e) {
        this.balanceError = "\u4F59\u989D\u6682\u65F6\u65E0\u6CD5\u5237\u65B0";
        throw e;
      }
    })().finally(() => {
      this.balanceFlight = null;
    });
    return this.balanceFlight;
  }
  selected(id = this.state.model) {
    const m = this.models.find((x) => x.id === id);
    if (!m) throw Error("\u6A21\u578B\u4E0D\u53EF\u7528\uFF0C\u8BF7\u5237\u65B0\u76EE\u5F55\u5E76\u91CD\u65B0\u9009\u62E9");
    return m;
  }
  view() {
    return { connected: !!this.account?.key, username: this.account?.displayName || this.account?.nickname, models: this.models, modelFilters: this.state.modelFilters, catalogError: this.catalogError, model: this.state.model, preferred: this.state.preferred, compat: this.models.some((x) => x.id === this.state.model) ? protocol(this.selected(), this.state.preferred) : null, balance: this.balance, balanceAt: this.balanceAt, balanceError: this.balanceError, orders: this.state.orders.filter((o) => o.account === this.account?.username), purchases: this.state.purchases.filter((p) => p.account === this.account?.username && p.status !== "quoted"), usage: Object.fromEntries(Object.entries(this.state.usage).filter(([, u]) => u.account === this.account?.username)) };
  }
  async execute(c) {
    if (c.type === "state") return this.view();
    if (c.type === "refresh") {
      if (this.busy) return this.view();
      if (!this.refreshFlight) this.refreshFlight = (async () => {
        await this.catalog(c.force === true);
        if (this.account?.key) await this.refreshBalance(c.force === true);
        return this.view();
      })().finally(() => {
        this.refreshFlight = null;
      });
      return this.refreshFlight;
    }
    if (!c || typeof c !== "object") throw Error("\u65E0\u6548\u64CD\u4F5C");
    if (this.busy) throw Error("\u4E0A\u4E00\u9879\u64CD\u4F5C\u5C1A\u672A\u7ED3\u675F");
    this.busy = true;
    try {
      if (c.type === "register") {
        await this.register(c.nickname, c.termsAccepted);
        await this.catalog();
        await this.refreshBalance();
      } else if (c.type === "modelFilters") {
        if (!c.filters || ["recommended", "held", "all"].some((k) => typeof c.filters[k] !== "boolean")) throw Error("\u65E0\u6548\u6A21\u578B\u8303\u56F4");
        this.state.modelFilters = { recommended: c.filters.recommended, held: c.filters.held, all: c.filters.all };
        await this.persist();
      } else if (c.type === "credentials") return { ...this.account, authToken: void 0 };
      else if (c.type === "select") {
        await this.catalog();
        this.selected(c.id);
        if (c.preferred) protocol(this.selected(c.id), c.preferred);
        this.state.model = c.id;
        if (c.preferred) this.state.preferred = c.preferred;
        await this.persist();
      } else if (c.type === "quote") {
        if (!Number.isFinite(c.amount) || c.amount < 1 || c.amount > 1e5 || !["wechat", "alipay"].includes(c.method)) throw Error("\u8BF7\u8F93\u5165\u6709\u6548\u91D1\u989D\u548C\u652F\u4ED8\u65B9\u5F0F");
        await this.login();
        const q = await this.request("/api/user/group-policy", { metric: "recharge_multiplier", scene: `recharge.${c.method}`, baseAmount: c.amount * 1e3 }, "login");
        const budget = Number(q.quote?.adjustedAmount);
        if (!Number.isFinite(budget) || budget <= 0) throw Error("\u5145\u503C\u62A5\u4EF7\u683C\u5F0F\u4E0D\u517C\u5BB9");
        const estimate = null;
        return { ...this.view(), quote: { agentId: c.agentId, amount: c.amount, method: c.method, budget, estimate } };
      } else if (c.type === "recharge") {
        if (!["wechat", "alipay"].includes(c.method) || !Number.isFinite(c.amount) || c.amount < 1 || c.amount > 1e5 || Math.abs(Math.round(c.amount * 100) - c.amount * 100) > 1e-7) throw Error("\u5145\u503C\u91D1\u989D\u987B\u4E3A 1\u2013100000 \u5143\uFF0C\u6700\u591A\u4E24\u4F4D\u5C0F\u6570");
        await this.login();
        const q = await this.request("/api/user/group-policy", { metric: "recharge_multiplier", scene: `recharge.${c.method}`, baseAmount: c.amount * 1e3 }, "login");
        const budget = Number(q.quote.adjustedAmount);
        if (!Number.isFinite(budget) || budget <= 0) throw Error("\u5145\u503C\u62A5\u4EF7\u683C\u5F0F\u4E0D\u517C\u5BB9");
        await this.refreshBalance();
        const creditsBefore = Number(this.balance.credits.spendable_total);
        const r = await this.request(`/api/payment/${c.method}`, { amount: c.amount, description: "MomoAI DSH \u79EF\u5206\u5145\u503C" }, "login");
        if (r.orderSaved !== true || typeof r.orderNo !== "string" || !r.orderNo) throw Error("\u8BA2\u5355\u672A\u4FDD\u5B58\uFF0C\u8BF7\u52FF\u652F\u4ED8");
        const url = c.method === "wechat" ? r.qrCodeUrl : r.paymentUrl;
        const parsed = new URL(url);
        if (c.method === "wechat" ? parsed.protocol !== "weixin:" : parsed.protocol !== "https:" || !/(^|\.)alipay\.com$/.test(parsed.hostname)) throw Error("\u652F\u4ED8\u5730\u5740\u65E0\u6548");
        const qrDataUrl = c.method === "wechat" ? await QRCode.toDataURL(url, { width: 240, margin: 2 }) : void 0;
        this.state.orders.push({ creditsBefore, qrDataUrl, id: r.orderNo, account: this.account.username, agentId: c.agentId, amount: c.amount, budget, used: 0, tokens: 0, status: "awaiting-confirmation", method: c.method, url });
        await this.persist();
      } else if (c.type === "paymentCheck") {
        const order = this.state.orders.find((o) => o.id === c.id && o.account === this.account?.username);
        if (!order) throw Error("\u8BA2\u5355\u4E0D\u5B58\u5728");
        const before = order.creditsBefore;
        await this.refreshBalance();
        return { ...this.view(), paymentCheck: { id: order.id, available: Number(this.balance.credits.spendable_total), change: typeof before === "number" && Number.isFinite(before) ? Number(this.balance.credits.spendable_total) - before : null } };
      } else if (c.type === "purchaseQuote") {
        await this.catalog();
        this.selected(c.agentId);
        await this.refreshBalance();
        const listings = await this.request(`/api/cli/exchange/listings?agent_id=${c.agentId}`);
        const plan = tokenPurchasePlan(c.tokens, listings.data.listings, Number(this.balance.credits.spendable_total));
        const quote = { id: randomBytes(12).toString("hex"), account: this.account.username, agentId: c.agentId, modelName: this.selected(c.agentId).name, ...plan, createdAt: Date.now(), status: "quoted", actualTokens: 0, used: 0 };
        this.state.purchases = this.state.purchases.filter((p) => p.status !== "quoted" || p.createdAt > Date.now() - 6e4);
        this.state.purchases.push(quote);
        await this.persist();
        return { ...this.view(), purchaseQuote: quote };
      } else if (c.type === "purchase") {
        const p = this.state.purchases.find((p2) => p2.id === c.id && p2.account === this.account?.username);
        if (!p || p.status !== "quoted") throw Error("\u8BE5\u8D2D\u4E70\u5DF2\u5904\u7406\u6216\u7ED3\u679C\u5F85\u6838\u5B9E\uFF0C\u8BF7\u52FF\u91CD\u590D\u63D0\u4EA4");
        if (Date.now() - p.createdAt > 6e4) throw Error("\u62A5\u4EF7\u5DF2\u8FC7\u671F\uFF0C\u8BF7\u91CD\u65B0\u83B7\u53D6\u62A5\u4EF7");
        await this.refreshBalance();
        if (Number(this.balance.credits.spendable_total) < p.ceiling) throw Error("\u79EF\u5206\u4F59\u989D\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u83B7\u53D6\u62A5\u4EF7");
        p.status = "sending";
        await this.persist();
        try {
          const r = await this.request("/api/cli/exchange/buy", { agent_id: p.agentId, tokens: p.tokens, max_price: p.max_price });
          const cost = Number(r.data.credits_used.total), tokens = Number(r.data.tokens_bought);
          if (!Number.isFinite(cost) || cost < 0 || cost > p.ceiling + 1e-3 || !Number.isSafeInteger(tokens) || tokens < 0 || tokens > p.tokens) throw Error("\u8D2D\u4E70\u7ED3\u679C\u5F02\u5E38");
          p.used = cost;
          p.actualTokens = tokens;
          p.status = tokens === p.requested ? "complete" : "partial";
          await this.persist();
        } catch (e) {
          p.status = "uncertain";
          await this.persist();
          throw e;
        }
        await this.refreshBalance().catch(() => {
        });
        return { ...this.view(), purchaseResult: p };
      } else if (c.type === "exchange") {
        throw Error("\u6574\u7B14\u5145\u503C\u5151\u6362\u5165\u53E3\u5DF2\u505C\u7528\uFF0C\u8BF7\u5728\u201C\u6309\u91CF\u8D2D\u4E70 Token\u201D\u4E2D\u586B\u5199\u6570\u91CF\u5E76\u786E\u8BA4\u8D2D\u4E70");
      } else throw Error("\u672A\u77E5\u64CD\u4F5C");
      return this.view();
    } finally {
      this.busy = false;
    }
  }
};

// src/transport.ts
import { Agent, fetch as undiciFetch } from "undici";
function momoTransport() {
  const dispatcher = new Agent({ connect: { timeout: 15e3 }, headersTimeout: 12e4, bodyTimeout: 12e4 });
  const request = async (input, init) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    if (url.origin !== "https://momoai.pro") throw Error("MomoAI \u8BF7\u6C42\u5730\u5740\u65E0\u6548");
    if (process.env.MOMOAI_DSH_USE_SYSTEM_PROXY === "1") return fetch(input, init);
    return await undiciFetch(url, { ...init, redirect: "error", dispatcher });
  };
  return { fetch: request, close: () => dispatcher.close() };
}

// src/usage.ts
import { lastAssistantStreamChunk } from "@deepseek-ai/dsh-llm";
function foldUsage(session, account) {
  const rows = {};
  let route;
  const attempts = /* @__PURE__ */ new Map();
  for (const e of session.log) {
    if (e.type === "request/context") {
      route = e.data;
      continue;
    }
    if (e.seq < (session.inheritedEventCount || 0)) continue;
    const slot = `${session.id}:${e.data?.turn}:${e.data?.step}`;
    if (e.type === "llm/retry-started") {
      attempts.set(slot, (attempts.get(slot) || 0) + 1);
      continue;
    }
    if (!["assistant/message", "assistant/attempt"].includes(e.type)) continue;
    const source = e.data.message?.source || route;
    if (source?.provider !== "momoai") continue;
    const usage = e.data.usage || lastAssistantStreamChunk(e.data.stream || [], "usage")?.usage;
    rows[`${account}:${slot}:${attempts.get(slot) || 0}`] = { account, sessionId: session.id, model: source.model, input: usage?.inputTokens ?? null, output: usage?.outputTokens ?? null, cacheRead: usage?.cacheReadTokens ?? null, cacheWrite: usage?.cacheWriteTokens ?? null };
  }
  return rows;
}

// src/adapter.ts
import { LlmAdapter, LlmError } from "@deepseek-ai/dsh-llm";
import { PiAiAdapter } from "@deepseek-ai/dsh-llm-pi-ai";
import { openAICompletionsApi } from "@earendil-works/pi-ai/api/openai-completions.lazy";
import { anthropicMessagesApi } from "@earendil-works/pi-ai/api/anthropic-messages.lazy";
var MomoAdapter = class extends LlmAdapter {
  constructor(core, transport) {
    super();
    this.core = core;
    this.transport = transport;
  }
  providerInfo() {
    return { id: "momoai", name: "MomoAI" };
  }
  providerRetryPolicy() {
    return { mode: "normal", maxRetries: 0 };
  }
  async listModels() {
    if (!this.core.account?.key) return [];
    return this.core.models.map((m) => ({ provider: "momoai", id: `momo_${m.id}`, name: m.name, inputModalities: ["text"] }));
  }
  delegate(model, preferred = this.core.state.preferred) {
    const id = Number(/^momo_(\d+)$/.exec(model)?.[1]);
    const m = this.core.selected(id);
    const key = this.core.account?.key;
    if (!key) throw new LlmError("\u8BF7\u5148\u6CE8\u518C MomoAI", "MISSING_CREDENTIAL");
    const api = protocol(m, preferred).effective;
    const baseUrl = api === "anthropic-messages" ? "https://momoai.pro" : "https://momoai.pro/v1";
    const desc = { id: model, name: m.name, api, provider: "momoai", baseUrl, reasoning: false, input: ["text"], contextWindow: 32768, maxTokens: 4096, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 } };
    const wire = api === "anthropic-messages" ? anthropicMessagesApi() : openAICompletionsApi();
    const piProvider = { id: "momoai", name: "MomoAI", baseUrl, auth: { apiKey: { name: "MomoAI", resolve: async () => ({ auth: { apiKey: key }, source: "MomoAI" }) } }, getModels: () => [desc], stream: (m2, c, o) => wire.stream(m2, c, { ...o, maxRetries: 0, ...this.transport ? { fetch: this.transport } : {} }), streamSimple: (m2, c, o) => wire.streamSimple(m2, c, { ...o, maxRetries: 0, ...this.transport ? { fetch: this.transport } : {} }) };
    const profile = { provider: "momoai", displayName: "MomoAI", api, baseURL: baseUrl, piProvider, configuredMaxTokens: /* @__PURE__ */ new Map([[model, 4096]]), modelErrors: /* @__PURE__ */ new Map(), streamIdleTimeoutMs: 12e4, maxRequestImageBytes: 1, maxRequestImages: 1, imageOffloadCountQuantum: 1, requestImagePixelBudget: 1, requestImageMaxBytes: 1, retryPolicy: this.providerRetryPolicy() };
    const profiles = /* @__PURE__ */ new Map([["momoai", profile]]);
    return new PiAiAdapter({ profiles: () => profiles, resolveApiKey: async () => key });
  }
  async resolveModel(provider, model, signal) {
    return this.delegate(model).resolveModel(provider, model, signal);
  }
  async prepareCall(provider, model, signal) {
    if (Date.now() - this.core.catalogAt > 3e5) await this.core.catalog();
    const preferred = this.core.state.preferred, preferences = { ...this.core.state.sessionPreferences };
    const prepared = await this.delegate(model, preferred).prepareCall(provider, model, signal);
    const alternates = /* @__PURE__ */ new Map();
    for (const p of new Set(Object.values(preferences))) alternates.set(p, await this.delegate(model, p).prepareCall(provider, model, signal));
    return { ...prepared, stream: (options) => this.streamSnapshot(alternates.get(preferences[options.sessionId]) || prepared, options) };
  }
  async *streamSnapshot(prepared, options) {
    options.signal?.throwIfAborted();
    const messages = options.messages.map((m) => {
      if (!m.source) return m;
      const { replayState, ...source } = m.source;
      return { ...m, source };
    });
    try {
      for await (const chunk of prepared.stream({ ...options, messages })) {
        options.signal?.throwIfAborted();
        yield chunk;
      }
      options.signal?.throwIfAborted();
    } finally {
      void this.core.refreshBalance().catch(() => {
      });
    }
  }
  async *stream(options) {
    const prepared = await this.prepareCall(options.provider, options.model, options.signal);
    yield* prepared.stream(options);
  }
};

// src/index.ts
var name = "momoai";
var inject = ["credentials", "llm", "agentDefaultModel", "agents", "sessions", "sessionProjections"];
var _execute_dec, _a, _init;
var MomoService = class extends (_a = TypertRemoteService, _execute_dec = [Remote("execute")], _a) {
  constructor(ctx, core) {
    super(ctx, "momoai", { namespace: "momoai" });
    this.core = core;
    __runInitializers(_init, 5, this);
  }
  async execute(command) {
    const principal = this.ctx.invocation?.peer?.principal;
    if (principal && principal.kind !== "owner") throw Error("\u4EC5\u8D26\u6237\u6240\u6709\u8005\u53EF\u64CD\u4F5C");
    const c = JSON.parse(command);
    if (!c || typeof c !== "object") throw Error("\u65E0\u6548\u64CD\u4F5C");
    const result = await this.core.execute(c);
    if (c.type === "select" && c.sessionId) {
      this.core.state.sessionPreferences ??= {};
      this.core.state.sessionPreferences[c.sessionId] = c.preferred || this.core.state.sessionPreferences[c.sessionId] || this.core.state.preferred;
      await this.core.persist();
    }
    if (c.type === "register" || c.type === "select") {
      const selection = { provider: "momoai", model: `momo_${this.core.state.model}` };
      const previous = this.ctx.agentDefaultModel.currentSelection();
      if (previous.provider !== "momoai") {
        this.core.state.previousDefault = previous;
        await this.core.persist();
      }
      await this.ctx.agentDefaultModel.saveSelection(selection);
      if (c.sessionId) {
        const agent = this.ctx.agents.get(c.sessionId);
        if (agent) {
          await this.ctx.llm.resolveCallConfig(selection);
          agent.model.select(selection);
        }
      }
    }
    if (c.type !== "credentials" && c.sessionId) {
      result.sessionId = c.sessionId;
      const session = this.ctx.sessions.get(c.sessionId);
      if (session) result.sessionProjection = this.ctx.sessionProjections.snapshot(session, ["tokenUsage"]).values.tokenUsage;
      const current = this.ctx.agents.get(c.sessionId)?.model.current();
      if (current?.provider === "momoai") {
        const id = Number(/^momo_(\d+)$/.exec(current.model)?.[1]);
        const model = this.core.models.find((m) => m.id === id);
        if (model) {
          result.model = id;
          result.preferred = this.core.state.sessionPreferences?.[c.sessionId] || this.core.state.preferred;
          result.compat = protocol(model, result.preferred);
        }
      }
    }
    return JSON.stringify(result);
  }
};
_init = __decoratorStart(_a);
__decorateElement(_init, 1, "execute", _execute_dec, MomoService);
__decoratorMetadata(_init, MomoService);
async function apply(ctx) {
  const root = join(process.env.DSH_HOME || join(homedir(), ".dsh"), "momoai-plugin");
  await mkdir(root, { recursive: true, mode: 448 });
  const file = join(root, "state.json");
  const load = async () => {
    try {
      return JSON.parse(await readFile(file, "utf8"));
    } catch (e) {
      if (e.code === "ENOENT") return {};
      throw Error("MomoAI \u72B6\u6001\u6587\u4EF6\u65E0\u6CD5\u8BFB\u53D6");
    }
  };
  let queue = Promise.resolve();
  const save = (state) => {
    const payload = JSON.stringify(state);
    const task = queue.then(async () => {
      await writeFile(file + ".tmp", payload, { mode: 384 });
      await rename(file + ".tmp", file);
    });
    queue = task.catch(() => {
    });
    return task;
  };
  const transport = momoTransport();
  ctx.effect(() => () => transport.close());
  const core = new MomoCore(ctx.credentials, load, save, transport.fetch);
  await core.init();
  new MomoService(ctx, core);
  ctx.llm.registerAdapter(["momoai"], new MomoAdapter(core, transport.fetch));
  void core.catalog().catch(() => {
  });
  if (core.account?.key) void core.refreshBalance().catch(() => {
  });
  ctx.effect(() => {
    const timer = setTimeout(() => {
      void (async () => {
        if (core.account?.key && !core.state.defaultInstalled) {
          const previous = ctx.agentDefaultModel.currentSelection();
          if (previous.provider !== "momoai") core.state.previousDefault = previous;
          core.state.defaultInstalled = true;
          await core.persist();
          await ctx.agentDefaultModel.saveSelection({ provider: "momoai", model: `momo_${core.state.model}` });
        }
      })().catch(() => ctx.logger.warn("MomoAI default model setup failed"));
    }, 0);
    return () => clearTimeout(timer);
  });
  const sync = (session) => {
    if (!core.account?.key) return;
    core.state.sessionPreferences ??= {};
    core.state.sessionPreferences[session.id] ??= core.state.preferred;
    core.state.sessionAccounts ??= {};
    const account = core.state.sessionAccounts[session.id] || core.account.username;
    const rows = foldUsage(session, account);
    core.state.sessionAccounts[session.id] = account;
    Object.assign(core.state.usage, rows);
    void core.persist().catch(() => ctx.logger.warn("MomoAI usage persistence failed"));
  };
  for (const session of ctx.sessions.list()) sync(session);
  ctx.on("session/created", sync);
  ctx.on("session/event", (session, event) => {
    if (["assistant/message", "assistant/attempt"].includes(event.type)) sync(session);
  });
  ctx.effect(() => () => {
    if (core.state.previousDefault && ctx.agentDefaultModel.currentSelection().provider === "momoai") {
      const defaults = ctx.agentDefaultModel;
      const previous = core.state.previousDefault;
      setTimeout(() => {
        void defaults.saveSelection(previous).catch(() => {
        });
      }, 0);
      core.state.defaultInstalled = false;
      void core.persist();
    }
  });
}
export {
  apply,
  inject,
  name
};
