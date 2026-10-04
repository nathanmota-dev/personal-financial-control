#!/usr/bin/env node
"use strict";
const C = require("./config.js");
const { selectProjects } = require("./pr-validation.js");
function runCli(args = process.argv.slice(2)) {
  try {
    const options = C.argumentsFor(args), config = C.loadConfig(options);
    if (!process.env.PR_BASE_SHA || !process.env.PR_HEAD_SHA) throw new C.InputError("PR_BASE_SHA and PR_HEAD_SHA are required.");
    const ancestor = C.mergeBase(options.root, process.env.PR_BASE_SHA, process.env.PR_HEAD_SHA);
    const result = C.execute(["git", "diff", "--no-renames", "--name-only", ancestor, process.env.PR_HEAD_SHA], options.root);
    if (result.status !== 0) throw new C.InputError(result.stderr);
    process.stdout.write(`projects=${selectProjects(config, result.stdout.split("\n").filter(Boolean)).join(",")}\n`);
    return 0;
  } catch (error) { process.stderr.write(error.message + "\n"); return 2; }
}
module.exports = { runCli };
if (require.main === module) process.exitCode = runCli();
