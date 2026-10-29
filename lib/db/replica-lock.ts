import { createHash } from "node:crypto";
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, realpathSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

/** A crash leaves the lock in place: an operator must verify the process has stopped. */
export function reserveReplica(path: string, remote: string, encryptionKey: string) {
  const absolute = resolve(path);
  mkdirSync(dirname(absolute), { recursive: true, mode: 0o700 });
  const file = join(realpathSync(dirname(absolute)), basename(absolute));
  if (statSync(dirname(file)).mode & 0o077) throw new Error("Use a private replica directory (permissions 0700), such as .local/replica.");
  if (existsSync(file) && realpathSync(file) !== file) throw new Error("Replica files must not be symbolic links.");
  const lock = `${file}.lock`;
  let descriptor: number;
  try { descriptor = openSync(lock, "wx", 0o600); }
  catch { throw new Error("Replica is reserved by another process. Stop it before using this path; see docs/turso-replica.md for stale locks."); }
  const release = () => { closeSync(descriptor); unlinkSync(lock); };
  try {
    writeFileSync(descriptor, JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }));
    const identity = createHash("sha256").update(`${remote}\0${encryptionKey}`).digest("hex");
    const metadata = `${file}.identity`;
    if (existsSync(metadata)) {
      if (readFileSync(metadata, "utf8") !== identity) throw new Error("Replica belongs to another database or encryption key. Choose a new replica path.");
    } else {
      if (existsSync(file)) throw new Error("Refusing to reuse an existing database as a replica. Choose an unused path.");
      writeFileSync(metadata, identity, { flag: "wx", mode: 0o600 });
    }
    return { file, release };
  } catch (error) { release(); throw error; }
}
