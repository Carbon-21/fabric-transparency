#!/usr/bin/env node
"use strict";
// Run after init so IPNS points to an "empty" publication and the UI shows
// "There are no publications on IPFS. Consider publishing under the tab IPFS!"
// IPNS key ID is read from Kubo (key "transparency") at runtime.
require("dotenv").config();
const ipfs = require("../util/ipfs");

(async () => {
  const client = await ipfs.createClient();
  await ipfs.publishEmptyPlaceholder(client);
  console.log("IPNS reset to empty placeholder.");
  process.exit(0);
})().catch((err) => {
  console.error("Failed to publish empty IPNS placeholder:", err);
  process.exit(1);
});
