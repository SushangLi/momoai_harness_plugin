window.__ModuleLoader__.load({id:'dsh-plugin-momoai',factory:(require)=>{const module={exports:{}};const exports=module.exports;
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client.tsx
var client_exports = {};
__export(client_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(client_exports);

// src/typert.ts
var import_zod = require("zod");

// node_modules/@deepseek-ai/dsh-typert-protocol/lib/types/remote-info.js
function createTypertRemoteInfo(spec, zod) {
  return new RemoteInfo(spec, zod);
}
var RemoteInfo = class {
  spec;
  zod;
  index;
  constructor(spec, zod) {
    this.spec = spec;
    this.zod = zod;
  }
  get package() {
    return this.spec.package;
  }
  get descriptors() {
    return this.resolve().descriptors;
  }
  get methods() {
    return this.resolve().methods;
  }
  resolve() {
    if (this.index !== void 0)
      return this.index;
    const zod = this.zod;
    const descriptors = [];
    const methods = /* @__PURE__ */ Object.create(null);
    for (const [endpoint, definition] of Object.entries(this.spec.methods)) {
      const separator = endpoint.indexOf("/");
      const namespace = endpoint.slice(0, separator);
      const method = endpoint.slice(separator + 1);
      const parameters = definition.parameters.map((parameter) => ({ ...parameter, wire: parameter.wire ?? parameter.name }));
      const descriptor = {
        ...definition,
        id: `${this.spec.package}#${endpoint}`,
        namespace,
        method,
        parameters,
        result: definition.result.description === void 0 ? definition.result : new ResultValue(definition.result)
      };
      if (definition.invocation.kind === "direct") {
        const inputs = [];
        const direct = Object.assign(descriptor, {
          input(options) {
            const strict = options?.strict === true;
            return inputs[strict ? 1 : 0] ??= new NamedInput(parameters, strict, zod);
          },
          invoke(remote, input, signal) {
            const named = input;
            const values = parameters.map((parameter) => named[parameter.wire]);
            if (definition.cancellation !== void 0)
              values.push(signal);
            const receiver = Reflect.get(remote, namespace);
            const call = Reflect.get(receiver, method);
            return call.apply(receiver, values);
          }
        });
        methods[endpoint] = direct;
      }
      descriptors.push(descriptor);
    }
    return this.index = { descriptors, methods };
  }
};
function optional(parameter) {
  return parameter.source === "json" && parameter.acceptsUndefined === true;
}
var NamedInput = class {
  parameters;
  strict;
  zod;
  schema;
  projection;
  constructor(parameters, strict, zod) {
    this.parameters = parameters;
    this.strict = strict;
    this.zod = zod;
  }
  codec(parameter) {
    return this.strict ? parameter.strictCodec : parameter.codec;
  }
  create = () => this.schema ??= this.zod.strictObject(Object.fromEntries(this.parameters.map((parameter) => {
    const value = this.codec(parameter).create();
    return [parameter.wire, optional(parameter) ? value.optional() : value.nonoptional()];
  })));
  get jsonSchema() {
    return this.project().jsonSchema;
  }
  get jsonSchemaError() {
    return this.project().jsonSchemaError;
  }
  project() {
    if (this.projection !== void 0)
      return this.projection;
    const unavailable = this.parameters.find((parameter) => this.codec(parameter).jsonSchema === void 0);
    if (unavailable !== void 0) {
      return this.projection = { jsonSchemaError: this.codec(unavailable).jsonSchemaError ?? `No JSON Schema for parameter ${unavailable.wire}` };
    }
    return this.projection = {
      jsonSchema: {
        type: "object",
        properties: Object.fromEntries(this.parameters.map((parameter) => [parameter.wire, {
          ...this.codec(parameter).jsonSchema,
          ...parameter.description === void 0 ? {} : { description: parameter.description }
        }])),
        required: this.parameters.filter((parameter) => !optional(parameter)).map((parameter) => parameter.wire),
        additionalProperties: false
      }
    };
  }
};
var ResultValue = class {
  spec;
  projection;
  constructor(spec) {
    this.spec = spec;
  }
  get mode() {
    return this.spec.mode;
  }
  get typeSymbol() {
    return this.spec.typeSymbol;
  }
  get create() {
    return this.spec.create;
  }
  get decode() {
    return this.spec.decode;
  }
  get encode() {
    return this.spec.encode;
  }
  get description() {
    return this.spec.description;
  }
  get jsonSchemaError() {
    return this.spec.jsonSchemaError;
  }
  get jsonSchema() {
    if (this.projection === void 0) {
      const schema = this.spec.jsonSchema;
      this.projection = { value: schema === void 0 ? void 0 : { ...schema, description: this.spec.description } };
    }
    return this.projection.value;
  }
};

// src/typert.ts
var codec = { mode: "strict", typeSymbol: "dsh-plugin-momoai#Json", create: () => import_zod.z.string().max(1e6), jsonSchema: { type: "string" } };
var TYPERT_REMOTE = createTypertRemoteInfo({ package: "dsh-plugin-momoai", methods: { "momoai/execute": { service: "momoai", description: "Owner-only account operations", invocation: { kind: "direct" }, parameters: [{ name: "command", source: "json", codec, strictCodec: codec }], result: codec } } }, import_zod.z);

// src/client.tsx
var import_react = __toESM(require("react"), 1);

// src/styles.ts
var styles = `
/* Lightweight multi-select pills retain native checkbox semantics. */
.momo-ui .momo-model-heading{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:18px}.momo-ui .momo-model-heading .momo-card-head{margin:0}
.momo-ui .momo-search-wrap{position:relative;width:220px;max-width:45%;color:var(--m-muted)}.momo-ui .momo-search-wrap>svg{position:absolute;left:10px;top:50%;transform:translateY(-50%);pointer-events:none}.momo-ui .momo-search-wrap input:not([type=checkbox]){min-height:32px;padding:6px 10px 6px 32px;border-color:transparent;background:var(--m-soft);font-size:11px}
.momo-ui .momo-model-filters{display:flex;align-items:center;gap:6px;margin-top:10px;flex-wrap:wrap}
.momo-ui .momo-model-filters label{position:relative;display:flex;align-items:center;justify-content:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:11px;line-height:20px;color:var(--m-muted);background:var(--m-soft);cursor:pointer;transition:background .15s,color .15s}
.momo-ui .momo-model-filters label:has(input:checked){color:var(--m-accent);background:var(--m-tint)}
.momo-ui .momo-model-filters label:hover{background:color-mix(in srgb,var(--m-accent) 12%,var(--m-bg));color:var(--m-accent)}
.momo-ui .momo-model-filters label:has(input:focus-visible){outline:2px solid var(--m-accent);outline-offset:2px}.momo-ui .momo-model-filters label:has(input:disabled){opacity:.5;cursor:wait}
.momo-ui .momo-model-filters input{position:absolute;opacity:0;width:1px;height:1px;pointer-events:none}
.momo-ui .momo-model-filters svg{display:none}.momo-ui .momo-model-filters input:checked+svg{display:block}
.momo-ui .momo-call-label{display:flex;align-items:center;justify-content:space-between}.momo-ui .momo-auto-label{font-size:10px;color:var(--m-accent)}
.momo-ui .momo-protocol-meta{display:flex;align-items:center;gap:6px;min-height:26px;margin-top:10px;color:var(--m-muted);font-size:11px}.momo-ui .momo-protocol-dot{width:5px;height:5px;border-radius:50%;background:var(--m-muted);opacity:.6}

.momo-ui{--m-bg:var(--dsw-alias-bg-base,#fff);--m-text:var(--dsw-alias-label-primary,#20232d);--m-muted:var(--dsw-alias-label-secondary,#737784);--m-line:color-mix(in srgb,var(--m-text) 12%,transparent);--m-soft:color-mix(in srgb,var(--m-text) 3%,var(--m-bg));--m-accent:#6254db;--m-tint:color-mix(in srgb,var(--m-accent) 7%,var(--m-bg));color:var(--m-text);font:13px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;text-align:left;letter-spacing:0}
.momo-ui *{box-sizing:border-box}.momo-ui h2,.momo-ui h3,.momo-ui p{margin:0}.momo-ui h2{font-size:22px;line-height:1.4;font-weight:650;letter-spacing:-.5px}.momo-ui h3{font-size:15px;font-weight:650}.momo-ui small,.momo-muted{color:var(--m-muted);font-size:12px}.momo-ui a{color:var(--m-accent);text-decoration:none}.momo-ui a:hover{text-decoration:underline}.momo-ui button,.momo-ui input,.momo-ui select{font:inherit}.momo-ui button,.momo-ui .momo-button{border:1px solid var(--m-line);border-radius:9px;background:var(--m-bg);color:var(--m-text);padding:9px 14px;min-height:38px;display:inline-flex;align-items:center;justify-content:center;gap:7px;cursor:pointer;text-decoration:none;font-weight:550;transition:background .15s,border-color .15s,box-shadow .15s}.momo-ui button:hover,.momo-ui .momo-button:hover{background:var(--m-soft);border-color:color-mix(in srgb,var(--m-text) 25%,transparent);text-decoration:none}.momo-ui button:disabled{opacity:.45;cursor:not-allowed}.momo-ui button.momo-primary,.momo-ui a.momo-primary{background:var(--m-accent);border-color:var(--m-accent);color:#fff}.momo-ui button.momo-primary:hover:not(:disabled){background:#5243c8}.momo-ui .momo-quiet{background:transparent;border-color:transparent;color:var(--m-muted)}.momo-ui input:not([type=checkbox]),.momo-ui select{width:100%;min-width:0;border:1px solid var(--m-line);border-radius:9px;padding:10px 12px;background:var(--m-bg);color:var(--m-text);min-height:42px;outline:none}.momo-ui input::placeholder{color:var(--m-muted);opacity:.7}.momo-ui input:focus,.momo-ui select:focus{border-color:var(--m-accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--m-accent) 13%,transparent)}.momo-ui :focus-visible{outline:2px solid var(--m-accent);outline-offset:3px}.momo-ui input[type=checkbox]{accent-color:var(--m-accent);width:16px;height:16px;flex-shrink:0}.momo-ui label.momo-field{display:grid;gap:7px;color:var(--m-muted);font-size:12px}.momo-panel{max-width:960px;margin:auto;padding:28px;display:grid;gap:22px;container-type:inline-size}.momo-header,.momo-row{display:flex;align-items:center;justify-content:space-between;gap:12px}.momo-brand{display:flex;align-items:center;gap:12px}.momo-logo{width:40px;height:40px;border-radius:13px;display:grid;place-items:center;background:var(--m-accent);color:white;font-size:21px;font-weight:750;letter-spacing:-3px;padding-right:3px;box-shadow:0 4px 12px #6254db22}.momo-eyebrow{font-size:10px;font-weight:650;letter-spacing:1.6px;color:var(--m-muted)}.momo-tag{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:550;background:var(--m-tint);color:var(--m-accent);white-space:nowrap}.momo-dot{width:6px;height:6px;border-radius:50%;background:#29a782}.momo-tabs{display:flex;gap:22px;border-bottom:1px solid var(--m-line)}.momo-ui .momo-tab{border:0;border-bottom:2px solid transparent;border-radius:0;padding:8px 0 12px;background:transparent;color:var(--m-muted);min-height:40px}.momo-ui .momo-tab[aria-pressed=true]{border-color:var(--m-accent);color:var(--m-accent)}.momo-stack{display:grid;gap:18px}.momo-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.momo-card{border:1px solid var(--m-line);border-radius:15px;background:var(--m-bg);padding:20px;min-width:0}.momo-card-head{display:flex;align-items:center;gap:10px;margin-bottom:16px}.momo-icon{width:32px;height:32px;display:grid;place-items:center;border-radius:10px;background:var(--m-tint);color:var(--m-accent)}.momo-stat{padding:22px 24px;background:var(--m-soft);border-color:transparent}.momo-stat.token{background:var(--m-tint)}.momo-stat-label{font-size:12px;color:var(--m-muted);display:flex;justify-content:space-between;gap:10px}.momo-number{font-size:34px;font-weight:650;letter-spacing:-1.2px;line-height:1.3;margin:12px 0 16px;font-variant-numeric:tabular-nums}.momo-number span{font-size:12px;color:var(--m-muted);font-weight:400;letter-spacing:0;margin-left:8px}.momo-stat-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:12px}.momo-sync{display:flex;align-items:center;justify-content:space-between;color:var(--m-muted);font-size:11px;margin-top:-10px}.momo-ui .momo-sync button{min-height:26px;padding:2px 5px;font-size:11px}.momo-model-grid{display:grid;align-items:start;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:16px}.momo-model-search{margin-bottom:12px}.momo-compat{padding-top:12px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:11px;color:var(--m-muted)}.momo-action-card{display:flex;flex-direction:column;gap:14px}.momo-action-card .momo-card-head{margin:0}.momo-action-card>button{margin-top:auto;width:100%}.momo-chips{display:flex;gap:6px;flex-wrap:wrap}.momo-ui .momo-chip{padding:4px 11px;min-height:29px;font-size:11px;color:var(--m-muted)}.momo-ui .momo-chip[aria-pressed=true]{background:var(--m-tint);border-color:var(--m-accent);color:var(--m-accent)}.momo-inline{display:grid;grid-template-columns:1fr 1fr;gap:10px}.momo-note{font-size:11px;line-height:1.7;color:var(--m-muted)}.momo-quote{padding:12px;background:var(--m-tint);border-radius:10px;display:grid;gap:10px}.momo-banner{padding:12px 16px;border-radius:10px;background:color-mix(in srgb,#d49028 10%,var(--m-bg));color:var(--m-text);font-size:12px;border:1px solid color-mix(in srgb,#d49028 25%,transparent)}.momo-record{border-top:1px solid var(--m-line);padding:16px 0}.momo-record:first-of-type{border-top:0}.momo-record summary{cursor:pointer;list-style:none;display:flex;justify-content:space-between;align-items:center;gap:14px}.momo-record summary::-webkit-details-marker{display:none}.momo-record summary:after{content:'\u2304';color:var(--m-muted)}.momo-record[open] summary:after{content:'\u2303'}.momo-record-body{padding-top:16px;display:grid;gap:12px;justify-items:start}.momo-qr{padding:10px;background:#fff;border-radius:14px;border:1px solid var(--m-line)}.momo-qr img{display:block;width:200px;height:200px}.momo-id{font:11px/1.6 ui-monospace,monospace;color:var(--m-muted);overflow-wrap:anywhere}.momo-empty{text-align:center;padding:32px;color:var(--m-muted)}.momo-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:18px}.momo-metrics strong{display:block;font-size:22px;font-weight:600;font-variant-numeric:tabular-nums}.momo-metrics span{font-size:11px;color:var(--m-muted)}.momo-ui pre{padding:16px;border-radius:10px;background:var(--m-soft);white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px}.momo-overlay{position:fixed;inset:0;background:#171a304d;backdrop-filter:blur(5px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:28px}.momo-window{position:relative;width:min(960px,100%);max-height:calc(100dvh - 56px);overflow:auto;border-radius:20px;background:var(--m-bg);box-shadow:0 24px 90px #14142a30;border:1px solid var(--m-line);overscroll-behavior:contain;scrollbar-width:thin}.momo-ui .momo-close{position:sticky;top:14px;float:right;margin:14px 14px -52px 0;width:30px;height:30px;min-height:30px;padding:0;z-index:2;border-color:transparent;background:var(--m-soft);font-size:19px}.momo-window .momo-header{padding-right:24px}.momo-dialog-layer{z-index:10001}.momo-dialog{width:min(460px,100%);padding:28px;border-radius:18px;background:var(--m-bg);border:1px solid var(--m-line);max-height:calc(100dvh - 48px);overflow:auto;box-shadow:0 20px 80px #14142a38}.momo-dialog h3{font-size:20px;margin:12px 0 6px}.momo-dialog .momo-number{font-size:36px;margin:22px 0}.momo-dialog-list{display:grid;gap:10px;padding:16px;background:var(--m-soft);border-radius:12px;margin:18px 0}.momo-dialog-list>div{display:flex;justify-content:space-between;gap:16px;font-size:12px}.momo-dialog-list span{color:var(--m-muted)}.momo-dialog-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:24px}.momo-footer-root{flex:1;width:100%;min-width:0;margin:0 calc(var(--dsh-sidebar-paint-inset,3px) + 1px)}.momo-footer{padding:12px;margin:8px 0;border:1px solid var(--m-line);border-radius:13px;background:color-mix(in srgb,var(--m-bg) 55%,transparent);display:grid;gap:10px}.momo-footer .momo-logo{width:24px;height:24px;border-radius:7px;font-size:14px;box-shadow:none}.momo-footer .momo-brand{gap:7px;font-size:12px;font-weight:600}.momo-footer-balance{font-size:20px;font-weight:650;font-variant-numeric:tabular-nums;letter-spacing:-.5px}.momo-footer-balance small{font-size:10px;font-weight:400;letter-spacing:0}.momo-footer-actions{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:11px}.momo-ui .momo-footer-actions button{padding:5px 10px;min-height:30px;font-size:11px}.momo-signup{width:100%;max-width:420px;margin:0 auto;display:grid;gap:18px;padding:48px 32px 32px}.momo-window:has(.momo-signup){width:min(460px,100%)}.momo-auth-tabs{display:grid;grid-template-columns:1fr 1fr;gap:4px;background:var(--m-soft);padding:4px;border-radius:12px;margin-bottom:10px}.momo-ui .momo-auth-tabs button{border:0;background:transparent;border-radius:9px;color:var(--m-muted);min-height:40px;font-size:14px}.momo-ui .momo-auth-tabs button[aria-pressed=true]{background:var(--m-bg);color:var(--m-text);box-shadow:0 1px 4px #14142a14}.momo-signup>input{min-height:46px}.momo-auth-caption{text-align:center}.momo-login-method{display:flex;gap:20px;border-bottom:1px solid var(--m-line)}.momo-ui .momo-login-method button{border:0;border-bottom:2px solid transparent;border-radius:0;background:transparent;padding:6px 2px 10px;min-height:34px;color:var(--m-muted);font-size:13px}.momo-ui .momo-login-method button[aria-pressed=true]{color:var(--m-accent);border-bottom-color:var(--m-accent)}.momo-ui .momo-auth-resend{border:0;background:transparent;padding:0;color:var(--m-accent);min-height:28px;font-size:12px}.momo-signup .momo-logo{width:52px;height:52px;border-radius:16px;font-size:27px;margin:0 auto 8px}.momo-agreement{display:flex;align-items:flex-start;gap:8px;font-size:12px;color:var(--m-muted)}.momo-loading{padding:50px;text-align:center;color:var(--m-muted)}
.momo-usage{display:flex;align-items:center;gap:20px;margin-top:20px}.momo-ring{position:relative;width:126px;flex-shrink:0}.momo-ring svg{display:block;width:100%}.momo-ring>div{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}.momo-ring strong{font-size:17px;letter-spacing:-.5px}.momo-ring small{font-size:10px}.momo-legend{display:grid;gap:12px;flex:1;min-width:0;font-size:12px}.momo-legend>div{display:flex;align-items:center;gap:6px;color:var(--m-muted)}.momo-legend strong{margin-left:auto;color:var(--m-text);font-variant-numeric:tabular-nums}.momo-legend i{width:7px;height:7px;border-radius:50%;display:block}.momo-footer-sell{display:flex;justify-content:space-between;align-items:center;font-size:11px;border-top:1px solid var(--m-line);padding-top:8px}
.momo-tag.momo-success{background:color-mix(in srgb,#259b7b 10%,var(--m-bg));color:#23866d}.momo-tag.momo-pending{background:color-mix(in srgb,#c58924 10%,var(--m-bg));color:#a37424}.momo-credentials{display:grid;gap:14px;margin-top:20px}.momo-credentials>div{display:grid;gap:5px}.momo-credentials code{display:block;padding:10px 12px;border-radius:8px;background:var(--m-soft);font:12px/1.6 ui-monospace,monospace;overflow-wrap:anywhere}
.momo-order-row{display:flex;align-items:center;gap:12px}.momo-order-title{flex:1;min-width:0}.momo-order-actions{display:flex;align-items:center;gap:12px;flex-shrink:0}.momo-ui button.momo-payment-status{font-size:11px;min-height:28px;padding:3px 9px;border-color:transparent;border-radius:20px}.momo-payment-qr{width:fit-content;margin:auto}.momo-footer-collapsed{margin:0;width:36px;flex:none}.momo-ui .momo-rail-button{width:36px;height:36px;padding:0;border:0;background:transparent}
@container (max-width:580px){.momo-ui .momo-model-heading{gap:10px}.momo-ui .momo-search-wrap{width:180px;max-width:48%}.momo-grid,.momo-model-grid{grid-template-columns:1fr}.momo-number{font-size:30px}.momo-stat{padding:18px}.momo-header{align-items:flex-start}.momo-header .momo-tag{display:none}.momo-order-row{flex-wrap:wrap}.momo-order-actions{margin-left:auto}}
@media(max-width:640px){.momo-overlay{padding:12px}.momo-window{max-height:calc(100dvh - 24px);border-radius:16px}.momo-panel{padding:20px}.momo-dialog{padding:22px}.momo-tabs{gap:18px}}
@media(prefers-reduced-motion:reduce){.momo-ui *{transition:none!important}}
`;

// src/domain.ts
var defaultModelFilters = { recommended: true, held: true, all: false };
function filterModels(models, filters, tokens = [], search = "") {
  const held = new Set(tokens.filter((t) => Number(t.token_balance) > 0 || Number(t.token_onsale) > 0).map((t) => Number(t.agent_id)));
  const query = search.trim().toLowerCase();
  return models.filter((m) => (filters.all || filters.recommended && m.recommended === true || filters.held && held.has(m.id)) && `${m.name} momo_${m.id} ${m.format}`.toLowerCase().includes(query));
}

// src/client.tsx
var inject = ["slots", "remote"];
var number = (v) => v == null ? "\u2014" : new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 8 }).format(Number(v));
var time = (v) => v ? new Date(v).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "\u5C1A\u672A\u5237\u65B0";
var labels = { "awaiting-confirmation": "\u5145\u503C\u8BA2\u5355", sending: "\u6B63\u5728\u5151\u6362", uncertain: "\u7ED3\u679C\u5F85\u6838\u5B9E\uFF0C\u8BF7\u52FF\u91CD\u590D\u8D2D\u4E70", partial: "\u90E8\u5206\u6210\u4EA4", complete: "\u5DF2\u5B8C\u6210" };
async function apply(ctx) {
  const off = await ctx.remote.$mount(TYPERT_REMOTE);
  ctx.effect(() => off);
  ctx.inject(["remote.momoai", "sessions"], (ctx2) => {
    const call = async (c) => {
      const active = Object.values(ctx2.sessions.list.getSnapshot().byId).find((x) => (x.retainedBy.mainView ?? 0) > 0);
      const r = await ctx2.remote.momoai.execute(JSON.stringify({ ...c, sessionId: active?.sessionId || active?.id }));
      if (!r.ok) throw Error(r.error?.message || "\u64CD\u4F5C\u672A\u5B8C\u6210\uFF0C\u8BF7\u68C0\u67E5\u8D26\u6237\u6216\u7F51\u7EDC");
      return JSON.parse(r.value);
    };
    function useWallet() {
      const [s, set] = (0, import_react.useState)(null), [error, err] = (0, import_react.useState)(""), [busy, lock] = (0, import_react.useState)(false);
      const pending = (0, import_react.useRef)(false), alive = (0, import_react.useRef)(true), generation = (0, import_react.useRef)(0);
      async function read(refresh = false) {
        if (pending.current) return;
        const revision = generation.current;
        try {
          const v = await call({ type: refresh ? "refresh" : "state" });
          if (alive.current && revision === generation.current) set(v);
        } catch (e) {
          if (alive.current && refresh) err(e.message || "\u5237\u65B0\u5931\u8D25\uFF0C\u4F59\u989D\u53EF\u80FD\u5DF2\u8FC7\u671F\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5");
        }
      }
      async function run(c, onFailure) {
        if (pending.current) return;
        pending.current = true;
        generation.current++;
        lock(true);
        err("");
        try {
          const v = await call(c);
          if (alive.current && c.type !== "credentials") set(v);
          return v;
        } catch (e) {
          const message = String(e.message).slice(0, 200);
          if (alive.current) err(message);
          onFailure?.(message);
          try {
            const current = await call({ type: "state" });
            if (alive.current) set(current);
          } catch {
          }
        } finally {
          pending.current = false;
          if (alive.current) lock(false);
        }
      }
      (0, import_react.useEffect)(() => {
        alive.current = true;
        void read();
        const timer = setInterval(() => {
          if (document.visibilityState === "visible") void read();
        }, 5e3);
        const focus = () => void read(true);
        window.addEventListener("focus", focus);
        return () => {
          alive.current = false;
          clearInterval(timer);
          window.removeEventListener("focus", focus);
        };
      }, []);
      return { s, error, busy, run };
    }
    function Icon({ name = "wallet", size = 18 }) {
      const paths = { search: "M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0", wallet: "M3 7h16v13H3z M3 7V4h13v3 M15 12h6v4h-6z", model: "M7 3h10v4H7z M7 17h10v4H7z M3 7h4v10H3z M17 7h4v10h-4z M9 9h6v6H9z", arrow: "M5 12h14 M13 6l6 6-6 6", refresh: "M20 7v5h-5 M4 17v-5h5 M6 7a7 7 0 0 1 12-1l2 6 M4 12l2 6a7 7 0 0 0 12-1", chart: "M5 19V9 M12 19V4 M19 19v-6", plus: "M12 5v14 M5 12h14", check: "M5 12l4 4L19 6", external: "M14 3h7v7 M21 3l-11 11 M10 3H3v18h18v-7", user: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M4 21v-3a8 8 0 0 1 16 0v3", history: "M3 4v6h6 M3 10a9 9 0 1 1 0 6 M12 7v5l3 2", info: "M12 10v7 M12 6v1 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0" };
      return /* @__PURE__ */ import_react.default.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, /* @__PURE__ */ import_react.default.createElement("path", { d: paths[name] || paths.wallet }));
    }
    function Dialog({ title, children, onClose, busy = false }) {
      const ref = (0, import_react.useRef)(null);
      (0, import_react.useEffect)(() => {
        const previous = document.activeElement;
        const node = ref.current;
        node?.focus();
        return () => previous?.focus();
      }, []);
      return /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-ui momo-overlay momo-dialog-layer", onKeyDown: (e) => {
        e.stopPropagation();
        if (e.key === "Escape" && !busy) onClose();
        if (e.key === "Tab") {
          const items = ref.current?.querySelectorAll("button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled)");
          if (!items?.length) {
            e.preventDefault();
            return;
          }
          const first = items[0], last = items[items.length - 1];
          if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && (document.activeElement === last || document.activeElement === ref.current)) {
            e.preventDefault();
            first.focus();
          }
        }
      } }, /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-dialog", role: "alertdialog", "aria-label": title, "aria-modal": "true", ref, tabIndex: -1 }, children));
    }
    function Usage({ rows, label }) {
      const input = rows.reduce((n, u) => n + (u.input || 0), 0), output = rows.reduce((n, u) => n + (u.output || 0), 0), total = input + output, unknown = rows.filter((u) => u.input === null || u.output === null).length;
      const circumference = 276.46, portion = total ? input / total : 0;
      return /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-card" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-row" }, /* @__PURE__ */ import_react.default.createElement("h3", null, label), /* @__PURE__ */ import_react.default.createElement("span", { className: "momo-tag" }, number(rows.length), " \u6B21\u8C03\u7528")), /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-usage" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-ring" }, /* @__PURE__ */ import_react.default.createElement("svg", { viewBox: "0 0 108 108", role: "img", "aria-label": `\u5DF2\u77E5\u7528\u91CF ${number(total)} Token\uFF0C\u8F93\u5165 ${number(input)}\uFF0C\u8F93\u51FA ${number(output)}` }, /* @__PURE__ */ import_react.default.createElement("circle", { cx: "54", cy: "54", r: "44", fill: "none", stroke: "var(--m-line)", strokeWidth: "9" }), total > 0 && /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("circle", { cx: "54", cy: "54", r: "44", fill: "none", stroke: "#38b39b", strokeWidth: "9" }), /* @__PURE__ */ import_react.default.createElement("circle", { cx: "54", cy: "54", r: "44", fill: "none", stroke: "var(--m-accent)", strokeWidth: "9", strokeDasharray: `${portion * circumference} ${circumference}`, transform: "rotate(-90 54 54)" }))), /* @__PURE__ */ import_react.default.createElement("div", null, /* @__PURE__ */ import_react.default.createElement("strong", null, number(total)), /* @__PURE__ */ import_react.default.createElement("small", null, "Token"))), /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-legend" }, /* @__PURE__ */ import_react.default.createElement("div", null, /* @__PURE__ */ import_react.default.createElement("i", { style: { background: "var(--m-accent)" } }), "\u8F93\u5165", /* @__PURE__ */ import_react.default.createElement("strong", null, number(input))), /* @__PURE__ */ import_react.default.createElement("div", null, /* @__PURE__ */ import_react.default.createElement("i", { style: { background: "#38b39b" } }), "\u8F93\u51FA", /* @__PURE__ */ import_react.default.createElement("strong", null, number(output))), unknown > 0 && /* @__PURE__ */ import_react.default.createElement("small", null, unknown, " \u6B21\u7528\u91CF\u672A\u77E5"), !total && !unknown && /* @__PURE__ */ import_react.default.createElement("small", null, "\u5F00\u59CB\u5BF9\u8BDD\u540E\u8BB0\u5F55\u7528\u91CF"))));
    }
    function Panel() {
      const { s, error, busy, run } = useWallet();
      const [nickname, nick] = (0, import_react.useState)(""), [email, setEmail] = (0, import_react.useState)(""), [password, setPassword] = (0, import_react.useState)(""), [mode, setMode] = (0, import_react.useState)("register"), [accepted, accept] = (0, import_react.useState)(false), [amount, amt] = (0, import_react.useState)("10"), [method, pay] = (0, import_react.useState)("wechat"), [secrets, secret] = (0, import_react.useState)(null), [payment, setPayment] = (0, import_react.useState)(null), [copied, copyState] = (0, import_react.useState)(false), [search, setSearch] = (0, import_react.useState)(""), [quantity, setQuantity] = (0, import_react.useState)(""), [purchase, setPurchase] = (0, import_react.useState)(null), [notice, setNotice] = (0, import_react.useState)(null), [tab, setTab] = (0, import_react.useState)("overview");
      const buyRef = (0, import_react.useRef)(null), rechargeRef = (0, import_react.useRef)(null);
      if (!s) return /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-ui momo-loading" }, /* @__PURE__ */ import_react.default.createElement("style", null, styles), error || "\u6B63\u5728\u8FDE\u63A5 MomoAI\u2026");
      if (!s.connected) return /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-ui" }, /* @__PURE__ */ import_react.default.createElement("style", null, styles), /* @__PURE__ */ import_react.default.createElement("form", { className: "momo-signup", onSubmit: (e) => {
        e.preventDefault();
        const command = mode === "register" ? { type: "register", nickname: nickname.trim(), email: email.trim(), password, termsAccepted: accepted } : { type: "connect", identifier: { type: "auto", value: email.trim() }, password };
        setPassword("");
        void run(command).then((result) => {
          if (result && mode === "register") {
            setMode("login");
            setLoginType("email");
          }
        });
      } }, /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-auth-tabs", "aria-label": "\u8FDE\u63A5\u65B9\u5F0F" }, [["register", "\u6CE8\u518C"], ["login", "\u767B\u5F55"]].map(([value, label]) => /* @__PURE__ */ import_react.default.createElement("button", { key: value, type: "button", disabled: busy, "aria-pressed": mode === value, onClick: () => {
        setMode(value);
        setPassword("");
      } }, label))), s.identityPending && /* @__PURE__ */ import_react.default.createElement("p", { className: "momo-banner" }, "\u5DF2\u6709\u8D26\u6237\u6B63\u5728\u5347\u7EA7\u8FDE\u63A5\u3002", /* @__PURE__ */ import_react.default.createElement("button", { type: "button", disabled: busy, onClick: () => run({ type: "refresh", force: true }) }, "\u91CD\u8BD5\u8FDE\u63A5")), s.pendingRegistration && s.pendingRegistration.status !== "rejected" && /* @__PURE__ */ import_react.default.createElement("p", { className: "momo-note" }, s.pendingRegistration.status === "uncertain" ? "\u6CE8\u518C\u7ED3\u679C\u5F85\u786E\u8BA4\uFF0C\u8BF7\u5148\u5C1D\u8BD5\u9A8C\u8BC1\u90AE\u7BB1\u540E\u767B\u5F55\u3002" : s.pendingRegistration.message || "\u8BF7\u9A8C\u8BC1\u90AE\u7BB1\u540E\u767B\u5F55\u3002"), mode === "register" && /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("input", { "aria-label": "\u6635\u79F0", placeholder: "\u6635\u79F0\uFF08\u53EF\u4EE5\u91CD\u590D\uFF09", autoComplete: "nickname", maxLength: 40, value: nickname, onChange: (e) => nick(e.target.value), disabled: busy, required: true })), /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("input", { "aria-label": mode === "login" ? "\u90AE\u7BB1\u6216\u7528\u6237\u540D" : "\u90AE\u7BB1", type: mode === "login" ? "text" : "email", placeholder: mode === "login" ? "\u90AE\u7BB1\u6216\u7528\u6237\u540D" : "\u90AE\u7BB1", autoComplete: "username", value: email, onChange: (e) => setEmail(e.target.value), disabled: busy, required: true }), /* @__PURE__ */ import_react.default.createElement("input", { "aria-label": "\u5BC6\u7801", type: "password", placeholder: mode === "register" ? "\u5BC6\u7801\uFF08\u81F3\u5C11 12 \u4E2A\u5B57\u7B26\uFF09" : "\u5BC6\u7801", autoComplete: mode === "register" ? "new-password" : "current-password", value: password, onChange: (e) => setPassword(e.target.value), disabled: busy, required: true })), mode === "register" && /* @__PURE__ */ import_react.default.createElement("label", { className: "momo-agreement" }, /* @__PURE__ */ import_react.default.createElement("input", { type: "checkbox", checked: accepted, onChange: (e) => accept(e.target.checked), disabled: busy }), /* @__PURE__ */ import_react.default.createElement("span", null, "\u6211\u5DF2\u9605\u8BFB\u5E76\u540C\u610F", /* @__PURE__ */ import_react.default.createElement("a", { href: "https://momoai.pro/zh/terms-of-service", target: "_blank", rel: "noreferrer" }, "\u7528\u6237\u534F\u8BAE"), "\u53CA", /* @__PURE__ */ import_react.default.createElement("a", { href: "https://momoai.pro/zh/privacy-policy", target: "_blank", rel: "noreferrer" }, "\u9690\u79C1\u653F\u7B56"))), /* @__PURE__ */ import_react.default.createElement("button", { className: "momo-primary", disabled: busy || mode === "register" && (!accepted || !nickname.trim()), type: "submit" }, busy ? "\u5904\u7406\u4E2D\u2026" : mode === "register" ? "\u6CE8\u518C" : "\u767B\u5F55", /* @__PURE__ */ import_react.default.createElement(Icon, { name: "arrow" })), (s.pendingRegistration || /邮箱.*验证|验证.*邮箱/.test(error)) && /* @__PURE__ */ import_react.default.createElement("button", { className: "momo-auth-resend", type: "button", disabled: busy || !email.trim(), onClick: () => run({ type: "resendVerification", email: email.trim() }) }, "\u91CD\u65B0\u53D1\u9001\u9A8C\u8BC1\u90AE\u4EF6"), mode === "login" && /* @__PURE__ */ import_react.default.createElement("p", { className: "momo-note momo-auth-caption" }, "\u4F7F\u7528\u5DF2\u6709 MomoAI \u8D26\u6237\u767B\u5F55"), s.notice && /* @__PURE__ */ import_react.default.createElement("p", { className: "momo-note", role: "status" }, s.notice), error && /* @__PURE__ */ import_react.default.createElement("p", { className: "momo-banner", role: "alert" }, error)));
      const model = s.models.find((m) => m.id === s.model), balance = s.balance?.tokens.find((t) => Number(t.agent_id) === s.model);
      const filters = s.modelFilters || defaultModelFilters;
      const visibleModels = filterModels(s.models, filters, s.balance?.tokens, search), selectionVisible = visibleModels.some((m) => m.id === s.model);
      const rows = Object.values(s.usage).filter((u) => u.model === `momo_${s.model}`);
      async function checkPayment(o) {
        await run({ type: "paymentCheck", id: o.id });
      }
      return /* @__PURE__ */ import_react.default.createElement("section", { className: "momo-ui momo-panel" }, /* @__PURE__ */ import_react.default.createElement("style", null, styles), /* @__PURE__ */ import_react.default.createElement("header", { className: "momo-header" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-brand" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-logo" }, "m"), /* @__PURE__ */ import_react.default.createElement("div", null, /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-eyebrow" }, "MOMOAI FOR DSH"), /* @__PURE__ */ import_react.default.createElement("h2", null, "\u8D26\u6237\u4E0E\u4F59\u989D"))), /* @__PURE__ */ import_react.default.createElement("span", { className: "momo-tag" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "momo-dot" }), s.displayName || "\u5DF2\u8FDE\u63A5")), /* @__PURE__ */ import_react.default.createElement("nav", { className: "momo-tabs", "aria-label": "\u8D26\u6237\u9875\u9762" }, [["overview", "\u8D26\u6237\u6982\u89C8"], ["activity", "\u4EA4\u6613\u8BB0\u5F55"], ["account", "\u7528\u91CF\u4E0E\u8D26\u6237"]].map(([id, label]) => /* @__PURE__ */ import_react.default.createElement("button", { key: id, className: "momo-tab", "aria-pressed": tab === id, onClick: () => setTab(id) }, label))), (error || s.catalogError) && /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-banner", role: "alert" }, error || s.catalogError), tab === "overview" && /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-stack" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-grid" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-card momo-stat token" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-stat-label" }, /* @__PURE__ */ import_react.default.createElement("span", null, "\u5F53\u524D\u6A21\u578B \xB7 Token \u4F59\u989D"), /* @__PURE__ */ import_react.default.createElement(Icon, { name: "model" })), /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-number" }, s.balance ? number(balance?.token_balance ?? 0) : "\u2014", /* @__PURE__ */ import_react.default.createElement("span", null, "Token")), /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-stat-foot" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "momo-muted" }, "momo_", s.model, " \xB7 \u6302\u552E ", s.balance ? number(balance?.token_onsale ?? 0) : "\u2014"), /* @__PURE__ */ import_react.default.createElement("a", { href: `https://momoai.pro/zh/agents/${s.model}`, target: "_blank", rel: "noreferrer" }, "\u5356\u51FA\u591A\u4F59\u4F59\u989D \u2197"))), /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-card momo-stat" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-stat-label" }, /* @__PURE__ */ import_react.default.createElement("span", null, "\u8D26\u6237\u53EF\u7528\u79EF\u5206"), /* @__PURE__ */ import_react.default.createElement(Icon, { name: "wallet" })), /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-number" }, number(s.balance?.credits?.spendable_total), /* @__PURE__ */ import_react.default.createElement("span", null, "\u79EF\u5206")), /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-stat-foot" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "momo-muted" }, "\u7528\u4E8E\u8D2D\u4E70\u5404\u6A21\u578B Token"), /* @__PURE__ */ import_react.default.createElement("button", { className: "momo-quiet", onClick: () => {
        rechargeRef.current?.scrollIntoView({ block: "center" });
        rechargeRef.current?.focus();
      } }, "\u5145\u503C\u79EF\u5206 ", /* @__PURE__ */ import_react.default.createElement(Icon, { name: "plus", size: 14 }))))), /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-sync" }, /* @__PURE__ */ import_react.default.createElement("span", null, s.balanceError || `\u66F4\u65B0\u4E8E ${time(s.balanceAt)}`), /* @__PURE__ */ import_react.default.createElement("button", { className: "momo-quiet", "aria-label": "\u5237\u65B0\u4F59\u989D\u548C\u6A21\u578B", disabled: busy, onClick: () => run({ type: "refresh", force: true }) }, /* @__PURE__ */ import_react.default.createElement(Icon, { name: "refresh", size: 13 }), "\u5237\u65B0")), /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-card momo-model-card" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-model-heading" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-card-head" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "momo-icon" }, /* @__PURE__ */ import_react.default.createElement(Icon, { name: "model" })), /* @__PURE__ */ import_react.default.createElement("h3", null, "\u6A21\u578B\u4E0E\u8C03\u7528")), /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-search-wrap" }, /* @__PURE__ */ import_react.default.createElement(Icon, { name: "search", size: 15 }), /* @__PURE__ */ import_react.default.createElement("input", { "aria-label": "\u641C\u7D22\u6A21\u578B", placeholder: "\u641C\u7D22\u540D\u79F0\u6216 ID", value: search, onChange: (e) => setSearch(e.target.value) }))), /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-model-grid" }, /* @__PURE__ */ import_react.default.createElement("div", null, /* @__PURE__ */ import_react.default.createElement("label", { className: "momo-field" }, "\u5F53\u524D\u6A21\u578B", /* @__PURE__ */ import_react.default.createElement("select", { "aria-label": "MomoAI \u6A21\u578B", value: selectionVisible ? s.model : "", disabled: busy, onChange: (e) => run({ type: "select", id: Number(e.target.value) }) }, !selectionVisible && /* @__PURE__ */ import_react.default.createElement("option", { value: "", disabled: true }, !model ? "\u6A21\u578B\u4E0D\u53EF\u7528\uFF0C\u8BF7\u91CD\u65B0\u9009\u62E9" : "\u5F53\u524D\u6A21\u578B\u4E0D\u5728\u7B5B\u9009\u8303\u56F4\u5185"), visibleModels.map((m) => /* @__PURE__ */ import_react.default.createElement("option", { key: m.id, value: m.id }, m.name, " \xB7 momo_", m.id)))), /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-model-filters", role: "group", "aria-label": "\u6A21\u578B\u8303\u56F4" }, [["recommended", "\u63A8\u8350"], ["held", "\u6301\u6709"], ["all", "\u5168\u90E8"]].map(([key, label]) => /* @__PURE__ */ import_react.default.createElement("label", { key }, /* @__PURE__ */ import_react.default.createElement("input", { type: "checkbox", checked: filters[key], disabled: busy, onChange: (e) => run({ type: "modelFilters", filters: { ...filters, [key]: e.target.checked } }) }), /* @__PURE__ */ import_react.default.createElement(Icon, { name: "check", size: 12 }), label))), visibleModels.length === 0 && /* @__PURE__ */ import_react.default.createElement("small", { className: "momo-muted" }, "\u6CA1\u6709\u7B26\u5408\u6761\u4EF6\u7684\u6A21\u578B")), /* @__PURE__ */ import_react.default.createElement("div", null, /* @__PURE__ */ import_react.default.createElement("label", { className: "momo-field" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "momo-call-label" }, "\u8C03\u7528\u7C7B\u578B", /* @__PURE__ */ import_react.default.createElement("span", { className: "momo-auto-label" }, s.preferred === "auto" ? "\u81EA\u52A8\u9002\u914D" : "\u81EA\u9009\u534F\u8BAE")), /* @__PURE__ */ import_react.default.createElement("select", { "aria-label": "\u8C03\u7528\u7C7B\u578B", value: s.compat?.effective || "auto", disabled: busy || !model, onChange: (e) => run({ type: "select", id: s.model, preferred: e.target.value }) }, /* @__PURE__ */ import_react.default.createElement("option", { value: "auto" }, "\u81EA\u52A8"), /* @__PURE__ */ import_react.default.createElement("option", { value: "openai-completions" }, "OpenAI Chat Completions"), /* @__PURE__ */ import_react.default.createElement("option", { value: "anthropic-messages" }, "Anthropic Messages"))), /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-protocol-meta" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "momo-protocol-dot" }), model?.format === "google" ? "Google \xB7 \u5E73\u53F0\u8F6C\u6362" : model?.format === "anthropic" ? "Anthropic \u683C\u5F0F" : model?.format === "openai" ? "OpenAI \u683C\u5F0F" : "\u672A\u77E5\u683C\u5F0F"))), s.preferred !== "auto" && s.compat?.reason && /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-compat" }, s.compat.reason)), /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-grid" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-card momo-action-card" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-card-head" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "momo-icon" }, /* @__PURE__ */ import_react.default.createElement(Icon, { name: "wallet" })), /* @__PURE__ */ import_react.default.createElement("div", null, /* @__PURE__ */ import_react.default.createElement("h3", null, "\u5145\u503C\u79EF\u5206"), /* @__PURE__ */ import_react.default.createElement("small", null, "\u626B\u7801\u5145\u503C \xB7 \u79EF\u5206\u5B58\u5165\u8D26\u6237"))), /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-inline" }, /* @__PURE__ */ import_react.default.createElement("label", { className: "momo-field" }, "\u91D1\u989D\uFF08\u4EBA\u6C11\u5E01\uFF09", /* @__PURE__ */ import_react.default.createElement("input", { ref: rechargeRef, "aria-label": "\u5145\u503C\u91D1\u989D\uFF08\u5143\uFF09", type: "number", min: "1", max: "100000", step: "0.01", value: amount, onChange: (e) => amt(e.target.value), disabled: busy })), /* @__PURE__ */ import_react.default.createElement("label", { className: "momo-field" }, "\u652F\u4ED8\u65B9\u5F0F", /* @__PURE__ */ import_react.default.createElement("select", { "aria-label": "\u652F\u4ED8\u65B9\u5F0F", value: method, onChange: (e) => pay(e.target.value), disabled: busy }, /* @__PURE__ */ import_react.default.createElement("option", { value: "wechat" }, "\u5FAE\u4FE1\u652F\u4ED8"), /* @__PURE__ */ import_react.default.createElement("option", { value: "alipay" }, "\u652F\u4ED8\u5B9D")))), /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-chips" }, [1, 10, 50, 100].map((n) => /* @__PURE__ */ import_react.default.createElement("button", { key: n, className: "momo-chip", "aria-pressed": Number(amount) === n, disabled: busy, onClick: () => amt(String(n)) }, "\xA5", n))), /* @__PURE__ */ import_react.default.createElement("p", { className: "momo-note" }, "\u5145\u503C\u4E0D\u4F1A\u81EA\u52A8\u8D2D\u4E70 Token\u3002"), /* @__PURE__ */ import_react.default.createElement("button", { className: "momo-primary", disabled: busy || !Number.isFinite(Number(amount)) || Number(amount) < 1, onClick: async () => {
        const r = await run({ type: "recharge", amount: Number(amount), method, agentId: s.model });
        if (r) {
          setTab("activity");
          setPayment(r.orders.at(-1));
        }
      } }, busy ? "\u6B63\u5728\u751F\u6210\u2026" : "\u7ACB\u5373\u5145\u503C", /* @__PURE__ */ import_react.default.createElement(Icon, { name: "arrow", size: 16 }))), /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-card momo-action-card" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-card-head" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "momo-icon" }, /* @__PURE__ */ import_react.default.createElement(Icon, { name: "model" })), /* @__PURE__ */ import_react.default.createElement("div", null, /* @__PURE__ */ import_react.default.createElement("h3", null, "\u6309\u91CF\u8D2D\u4E70 Token"), /* @__PURE__ */ import_react.default.createElement("small", null, "\u4F7F\u7528\u79EF\u5206 \xB7 \u8D2D\u4E70 momo_", s.model))), /* @__PURE__ */ import_react.default.createElement("label", { className: "momo-field" }, "\u8D2D\u4E70\u6570\u91CF", /* @__PURE__ */ import_react.default.createElement("input", { ref: buyRef, "aria-label": "\u8D2D\u4E70 Token \u6570\u91CF", inputMode: "numeric", placeholder: "\u8F93\u5165 Token \u6570\u91CF", value: quantity, onChange: (e) => setQuantity(e.target.value), disabled: busy })), /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-chips" }, [1e4, 1e5, 1e6].map((n) => /* @__PURE__ */ import_react.default.createElement("button", { key: n, className: "momo-chip", "aria-pressed": Number(quantity) === n, disabled: busy, onClick: () => setQuantity(String(n)) }, n / 1e4, " \u4E07"))), /* @__PURE__ */ import_react.default.createElement("p", { className: "momo-note" }, "\u5148\u67E5\u770B\u62A5\u4EF7\uFF0C\u786E\u8BA4\u540E\u8D2D\u4E70\u3002"), /* @__PURE__ */ import_react.default.createElement("button", { className: "momo-primary", disabled: busy || !model || !quantity.trim(), onClick: async () => {
        const r = await run({ type: "purchaseQuote", agentId: s.model, tokens: Number(quantity) });
        if (r) setPurchase(r.purchaseQuote);
      } }, "\u67E5\u770B\u62A5\u4EF7", /* @__PURE__ */ import_react.default.createElement(Icon, { name: "arrow", size: 16 }))))), tab === "activity" && /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-stack" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-row" }, /* @__PURE__ */ import_react.default.createElement("h3", null, "\u5145\u503C\u8BB0\u5F55"), /* @__PURE__ */ import_react.default.createElement("small", null, s.orders.length, " \u7B14\u8BA2\u5355")), /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-card" }, !s.orders.length && /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-empty" }, /* @__PURE__ */ import_react.default.createElement(Icon, { name: "history", size: 30 }), /* @__PURE__ */ import_react.default.createElement("p", null, "\u8FD8\u6CA1\u6709\u5145\u503C\u8BB0\u5F55")), [...s.orders].reverse().map((o) => /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-record momo-order-row", key: o.id }, /* @__PURE__ */ import_react.default.createElement("span", { className: "momo-icon" }, /* @__PURE__ */ import_react.default.createElement(Icon, { name: "wallet" })), /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-order-title" }, /* @__PURE__ */ import_react.default.createElement("strong", null, o.method === "wechat" ? "\u5FAE\u4FE1\u652F\u4ED8" : "\u652F\u4ED8\u5B9D", " \xB7 \xA5", number(o.amount)), /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-id" }, o.id)), /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-order-actions" }, o.status === "complete" ? /* @__PURE__ */ import_react.default.createElement("span", { className: "momo-tag momo-success" }, "\u652F\u4ED8\u5B8C\u6210") : /* @__PURE__ */ import_react.default.createElement("button", { className: "momo-tag momo-pending momo-payment-status", title: "\u5C1A\u672A\u6536\u5230\u6B64\u8BA2\u5355\u7684\u652F\u4ED8\u5B8C\u6210\u786E\u8BA4\uFF1B\u70B9\u51FB\u6253\u5F00\u652F\u4ED8\u9875\u9762", disabled: busy, onClick: () => setPayment(o) }, "\u652F\u4ED8\u672A\u5B8C\u6210"), /* @__PURE__ */ import_react.default.createElement("button", { className: "momo-quiet", "aria-label": `\u5237\u65B0\u8BA2\u5355 ${o.id}`, title: "\u5237\u65B0\u79EF\u5206", disabled: busy, onClick: () => checkPayment(o) }, /* @__PURE__ */ import_react.default.createElement(Icon, { name: "refresh", size: 15 }), "\u5237\u65B0"))))), /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-row" }, /* @__PURE__ */ import_react.default.createElement("h3", null, "Token \u8D2D\u4E70\u8BB0\u5F55"), /* @__PURE__ */ import_react.default.createElement("small", null, s.purchases?.length || 0, " \u7B14\u4EA4\u6613")), /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-card" }, !s.purchases?.length && /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-empty" }, /* @__PURE__ */ import_react.default.createElement(Icon, { name: "model", size: 30 }), /* @__PURE__ */ import_react.default.createElement("p", null, "\u8FD8\u6CA1\u6709\u6309\u91CF\u8D2D\u4E70\u8BB0\u5F55")), [...s.purchases || []].reverse().map((p) => /* @__PURE__ */ import_react.default.createElement("div", { key: p.id, className: "momo-record" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-row" }, /* @__PURE__ */ import_react.default.createElement("strong", null, "momo_", p.agentId), /* @__PURE__ */ import_react.default.createElement("span", { className: `momo-tag ${p.status === "complete" ? "momo-success" : "momo-pending"}` }, labels[p.status])), /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-metrics" }, /* @__PURE__ */ import_react.default.createElement("div", null, /* @__PURE__ */ import_react.default.createElement("strong", null, number(p.actualTokens)), /* @__PURE__ */ import_react.default.createElement("span", null, "\u5B9E\u8D2D Token")), /* @__PURE__ */ import_react.default.createElement("div", null, /* @__PURE__ */ import_react.default.createElement("strong", null, number(p.used)), /* @__PURE__ */ import_react.default.createElement("span", null, "\u5DF2\u7528\u79EF\u5206"))), p.status === "uncertain" && /* @__PURE__ */ import_react.default.createElement("p", { className: "momo-banner" }, "\u8BF7\u5230\u7F51\u7AD9\u6838\u5B9E\u4EA4\u6613\uFF1B\u6B64\u7B14\u4E0D\u4F1A\u81EA\u52A8\u91CD\u8BD5\u3002"))))), tab === "account" && /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-stack" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-row" }, /* @__PURE__ */ import_react.default.createElement("h3", null, "momo_", s.model, " \u7528\u91CF"), /* @__PURE__ */ import_react.default.createElement("span", { className: "momo-tag" }, /* @__PURE__ */ import_react.default.createElement(Icon, { name: "chart", size: 13 }), "\u672C\u673A\u7EDF\u8BA1")), /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-grid" }, /* @__PURE__ */ import_react.default.createElement(Usage, { rows: rows.filter((u) => u.sessionId === s.sessionId), label: "\u5F53\u524D\u4F1A\u8BDD" }), /* @__PURE__ */ import_react.default.createElement(Usage, { rows, label: "\u5F53\u524D\u8D26\u6237\u7D2F\u8BA1" })), /* @__PURE__ */ import_react.default.createElement("p", { className: "momo-note" }, "\u8F93\u5165\u4E3A\u672A\u7F13\u5B58 Token\u3002\u672C\u673A\u7528\u91CF\u4E0D\u4EE3\u8868\u5E73\u53F0\u6263\u8D39\u8D26\u5355\u3002"), s.sessionProjection && /* @__PURE__ */ import_react.default.createElement("small", null, "DSH \u4F1A\u8BDD\u5408\u8BA1\uFF08\u542B\u5176\u4ED6\u6A21\u578B\uFF09\uFF1A\u8F93\u5165 ", number(s.sessionProjection.uncachedInputTokens), " / \u8F93\u51FA ", number(s.sessionProjection.outputTokens)), /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-card" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-row" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-brand" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "momo-icon" }, /* @__PURE__ */ import_react.default.createElement(Icon, { name: "user" })), /* @__PURE__ */ import_react.default.createElement("div", null, /* @__PURE__ */ import_react.default.createElement("h3", null, s.displayName || "MomoAI \u8D26\u6237"), /* @__PURE__ */ import_react.default.createElement("small", null, "\u767B\u5F55\u4E0E\u8FC1\u79FB\u4FE1\u606F"))), /* @__PURE__ */ import_react.default.createElement("button", { disabled: busy, onClick: async () => {
        const v = await run({ type: "credentials" });
        if (v) secret({ displayName: v.displayName, username: v.username, userId: v.userId, email: v.email, emailVerified: v.emailVerified, key: v.key });
      } }, "\u67E5\u770B\u8D26\u6237\u4FE1\u606F")))), payment && /* @__PURE__ */ import_react.default.createElement(Dialog, { title: "\u5145\u503C\u652F\u4ED8", busy, onClose: () => setPayment(null) }, /* @__PURE__ */ import_react.default.createElement("span", { className: "momo-icon" }, /* @__PURE__ */ import_react.default.createElement(Icon, { name: "wallet" })), /* @__PURE__ */ import_react.default.createElement("h3", null, payment.method === "wechat" ? "\u5FAE\u4FE1\u626B\u7801\u5145\u503C" : "\u652F\u4ED8\u5B9D\u5145\u503C"), /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-number" }, "\xA5", number(payment.amount), /* @__PURE__ */ import_react.default.createElement("span", null, number(payment.budget), " \u79EF\u5206")), payment.method === "wechat" && payment.qrDataUrl ? /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-payment-qr momo-qr" }, /* @__PURE__ */ import_react.default.createElement("img", { alt: "\u5FAE\u4FE1\u652F\u4ED8\u4E8C\u7EF4\u7801", src: payment.qrDataUrl })) : /* @__PURE__ */ import_react.default.createElement("a", { className: "momo-button momo-primary", href: payment.url, target: "_blank", rel: "noreferrer" }, /* @__PURE__ */ import_react.default.createElement(Icon, { name: "external" }), "\u6253\u5F00\u652F\u4ED8\u5B9D\u6536\u94F6\u53F0"), /* @__PURE__ */ import_react.default.createElement("p", { className: "momo-id", style: { marginTop: 16 } }, payment.id), /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-dialog-actions" }, /* @__PURE__ */ import_react.default.createElement("button", { disabled: busy, onClick: () => setPayment(null) }, "\u5173\u95ED"), /* @__PURE__ */ import_react.default.createElement("button", { className: "momo-primary", disabled: busy, onClick: () => checkPayment(payment) }, /* @__PURE__ */ import_react.default.createElement(Icon, { name: "refresh", size: 16 }), "\u5237\u65B0\u79EF\u5206"))), purchase && /* @__PURE__ */ import_react.default.createElement(Dialog, { title: "\u786E\u8BA4\u8D2D\u4E70 Token", busy, onClose: () => setPurchase(null) }, /* @__PURE__ */ import_react.default.createElement("span", { className: "momo-icon" }, /* @__PURE__ */ import_react.default.createElement(Icon, { name: "model" })), /* @__PURE__ */ import_react.default.createElement("h3", null, "\u786E\u8BA4\u8D2D\u4E70 Token"), /* @__PURE__ */ import_react.default.createElement("p", { className: "momo-muted" }, purchase.modelName, " \xB7 momo_", purchase.agentId), /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-number" }, number(purchase.tokens), /* @__PURE__ */ import_react.default.createElement("span", null, "Token")), purchase.tokens < purchase.requested && /* @__PURE__ */ import_react.default.createElement("p", { className: "momo-banner" }, "\u7533\u8BF7 ", number(purchase.requested), " Token\uFF0C\u5F53\u524D\u5E93\u5B58\u53EF\u8D2D ", number(purchase.tokens), "\u3002"), /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-dialog-list" }, /* @__PURE__ */ import_react.default.createElement("div", null, /* @__PURE__ */ import_react.default.createElement("span", null, "\u9884\u8BA1\u652F\u51FA"), /* @__PURE__ */ import_react.default.createElement("strong", null, number(purchase.estimate), " \u79EF\u5206")), /* @__PURE__ */ import_react.default.createElement("div", null, /* @__PURE__ */ import_react.default.createElement("span", null, "\u6700\u9AD8\u6388\u6743\u652F\u51FA"), /* @__PURE__ */ import_react.default.createElement("strong", null, number(purchase.ceiling), " \u79EF\u5206")), /* @__PURE__ */ import_react.default.createElement("div", null, /* @__PURE__ */ import_react.default.createElement("span", null, "\u6700\u9AD8\u5355\u4EF7 / \u5343 Token"), /* @__PURE__ */ import_react.default.createElement("strong", null, number(purchase.max_price), " \u79EF\u5206"))), /* @__PURE__ */ import_react.default.createElement("p", { className: "momo-note" }, "\u62A5\u4EF7\u6709\u6548\u671F 60 \u79D2\u3002\u6309\u5B9E\u9645\u6210\u4EA4\u6263\u8D39\uFF0C\u5E93\u5B58\u53D8\u5316\u53EF\u80FD\u5BFC\u81F4\u90E8\u5206\u6210\u4EA4\u3002"), /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-dialog-actions" }, /* @__PURE__ */ import_react.default.createElement("button", { disabled: busy, onClick: () => setPurchase(null) }, "\u53D6\u6D88"), /* @__PURE__ */ import_react.default.createElement("button", { className: "momo-primary", disabled: busy, onClick: async () => {
        const r = await run({ type: "purchase", id: purchase.id }, (text) => setNotice({ title: "\u8D2D\u4E70\u672A\u5B8C\u6210", text }));
        setPurchase(null);
        if (r) {
          setQuantity("");
          setNotice({ title: r.purchaseResult.status === "complete" ? "\u8D2D\u4E70\u6210\u529F" : "\u90E8\u5206\u6210\u4EA4", tokens: r.purchaseResult.actualTokens, used: r.purchaseResult.used, text: r.balanceError ? "\u4F59\u989D\u6682\u65F6\u65E0\u6CD5\u5237\u65B0\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002" : "\u79EF\u5206\u4E0E Token \u4F59\u989D\u5DF2\u66F4\u65B0\u3002" });
        }
      } }, busy ? "\u6B63\u5728\u8D2D\u4E70\u2026" : "\u786E\u8BA4\u8D2D\u4E70"))), notice && /* @__PURE__ */ import_react.default.createElement(Dialog, { title: notice.title, onClose: () => setNotice(null) }, /* @__PURE__ */ import_react.default.createElement("span", { className: "momo-icon" }, /* @__PURE__ */ import_react.default.createElement(Icon, { name: notice.title === "\u8D2D\u4E70\u672A\u5B8C\u6210" ? "info" : "check" })), /* @__PURE__ */ import_react.default.createElement("h3", null, notice.title), notice.tokens != null && /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-number" }, number(notice.tokens), /* @__PURE__ */ import_react.default.createElement("span", null, "Token")), /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-dialog-list" }, /* @__PURE__ */ import_react.default.createElement("div", null, /* @__PURE__ */ import_react.default.createElement("span", null, "\u5B9E\u9645\u652F\u51FA"), /* @__PURE__ */ import_react.default.createElement("strong", null, number(notice.used), " \u79EF\u5206")))), /* @__PURE__ */ import_react.default.createElement("p", { className: "momo-note" }, notice.text), /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-dialog-actions" }, /* @__PURE__ */ import_react.default.createElement("button", { className: "momo-primary", onClick: () => setNotice(null) }, "\u77E5\u9053\u4E86"))), secrets && /* @__PURE__ */ import_react.default.createElement(Dialog, { title: "\u8D26\u6237\u4FE1\u606F", onClose: () => {
        secret(null);
        copyState(false);
      } }, /* @__PURE__ */ import_react.default.createElement("span", { className: "momo-icon" }, /* @__PURE__ */ import_react.default.createElement(Icon, { name: "user" })), /* @__PURE__ */ import_react.default.createElement("h3", null, "\u8D26\u6237\u4FE1\u606F"), /* @__PURE__ */ import_react.default.createElement("p", { className: "momo-note" }, "API Key \u53EF\u8BBF\u95EE\u4F60\u7684\u8D26\u6237\uFF0C\u8BF7\u59A5\u5584\u4FDD\u5B58\u3002\u63D2\u4EF6\u4E0D\u4FDD\u5B58\u767B\u5F55\u5BC6\u7801\u3002"), /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-credentials" }, [["displayName", "\u6635\u79F0"], ["username", "\u7528\u6237\u540D"], ["userId", "\u8D26\u53F7 ID"], ["email", secrets.emailVerified ? "\u90AE\u7BB1\uFF08\u5DF2\u9A8C\u8BC1\uFF09" : "\u90AE\u7BB1\uFF08\u672A\u9A8C\u8BC1\uFF09"], ["key", "MomoAI Key"]].map(([key, label]) => /* @__PURE__ */ import_react.default.createElement("div", { key }, /* @__PURE__ */ import_react.default.createElement("small", null, label), /* @__PURE__ */ import_react.default.createElement("code", null, secrets[key] || "\u2014")))), /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-dialog-actions" }, /* @__PURE__ */ import_react.default.createElement("button", { onClick: () => {
        secret(null);
        copyState(false);
      } }, "\u9690\u85CF"), /* @__PURE__ */ import_react.default.createElement("button", { className: "momo-primary", onClick: async () => {
        try {
          await navigator.clipboard.writeText(JSON.stringify(secrets, null, 2));
          copyState(true);
        } catch {
          copyState(false);
        }
      } }, copied ? "\u5DF2\u590D\u5236" : "\u590D\u5236\u8D26\u6237\u4FE1\u606F"))));
    }
    function Footer({ wide = true }) {
      const { s } = useWallet();
      const [open, show] = (0, import_react.useState)(false);
      const balance = s?.balance?.tokens.find((t) => Number(t.agent_id) === s.model);
      return /* @__PURE__ */ import_react.default.createElement("div", { className: `momo-ui momo-footer-root ${wide ? "" : "momo-footer-collapsed"}` }, /* @__PURE__ */ import_react.default.createElement("style", null, styles), !wide ? /* @__PURE__ */ import_react.default.createElement("button", { className: "momo-rail-button", "aria-label": "MomoAI \u8D26\u6237\u4E0E\u4F59\u989D", title: "MomoAI \u8D26\u6237\u4E0E\u4F59\u989D", onClick: () => show(true) }, /* @__PURE__ */ import_react.default.createElement(Icon, { name: "wallet" })) : /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-footer" }, s?.connected ? /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-row" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-brand" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "momo-logo" }, "m"), "MomoAI"), /* @__PURE__ */ import_react.default.createElement("small", null, "momo_", s.model)), /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-footer-balance" }, s.balance ? number(balance?.token_balance ?? 0) : "\u2014", " ", /* @__PURE__ */ import_react.default.createElement("small", null, "Token")), /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-footer-actions" }, /* @__PURE__ */ import_react.default.createElement("small", null, number(s.balance?.credits?.spendable_total), " \u79EF\u5206"), /* @__PURE__ */ import_react.default.createElement("button", { className: "momo-primary", onClick: () => show(true) }, "\u5145\u503C / \u8D2D\u4E70")), /* @__PURE__ */ import_react.default.createElement("a", { className: "momo-footer-sell", href: `https://momoai.pro/zh/agents/${s.model}`, target: "_blank", rel: "noreferrer" }, "\u5356\u51FA\u591A\u4F59\u4F59\u989D ", /* @__PURE__ */ import_react.default.createElement(Icon, { name: "external", size: 12 }))) : /* @__PURE__ */ import_react.default.createElement("button", { className: "momo-primary", onClick: () => show(true) }, /* @__PURE__ */ import_react.default.createElement(Icon, { name: "wallet" }), "\u8FDE\u63A5 MomoAI")), open && /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-overlay", onKeyDown: (e) => {
        if (e.key === "Escape" && !document.querySelector(".momo-dialog-layer")) show(false);
      } }, /* @__PURE__ */ import_react.default.createElement("div", { className: "momo-window", role: "dialog", "aria-label": "MomoAI \u8D26\u6237\u4E0E\u4F59\u989D", "aria-modal": "true" }, /* @__PURE__ */ import_react.default.createElement("button", { className: "momo-close", "aria-label": "\u5173\u95ED\u8D26\u6237\u4E0E\u4F59\u989D", onClick: () => show(false) }, "\xD7"), /* @__PURE__ */ import_react.default.createElement(Panel, null))));
    }
    ctx2.slots.inject("sidebar.footer.action", () => ctx2.slots.register({ name: "sidebar.footer.action", id: "momoai-wallet" }, Footer));
    ctx2.slots.inject("settings.section", () => ctx2.slots.register({ name: "settings.section", id: "momoai", order: -9, label: () => "MomoAI \u8D26\u6237\u4E0E\u4F59\u989D" }, Panel));
  });
}

return module.exports;}});