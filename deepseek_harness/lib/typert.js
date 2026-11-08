// src/typert.ts
import { z } from "zod";
import { createTypertRemoteInfo } from "@deepseek-ai/dsh-typert-protocol/remote-info";
var codec = { mode: "strict", typeSymbol: "dsh-plugin-momoai#Json", create: () => z.string().max(1e6), jsonSchema: { type: "string" } };
var TYPERT_REMOTE = createTypertRemoteInfo({ package: "dsh-plugin-momoai", methods: { "momoai/execute": { service: "momoai", description: "Owner-only account operations", invocation: { kind: "direct" }, parameters: [{ name: "command", source: "json", codec, strictCodec: codec }], result: codec } } }, z);
var TYPERT = { package: "dsh-plugin-momoai", face: "host", schemas: [], get invocations() {
  return TYPERT_REMOTE.descriptors;
}, model: { services: [], events: [], objects: [] } };
var typert_default = TYPERT_REMOTE;
export {
  TYPERT,
  TYPERT_REMOTE,
  typert_default as default
};
