#!/usr/bin/env node
/** Applies db/schema.sql. Idempotent — safe to re-run. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";
import { loadEnv } from "./env.mjs";
import { pgConfig } from "./pgconfig.mjs";

loadEnv();
const here = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(here, "..", "db", "schema.sql"), "utf8");

const client = new pg.Client(pgConfig());

await client.connect();
try {
  await client.query(sql);
  console.log("schema applied");
} finally {
  await client.end();
}
