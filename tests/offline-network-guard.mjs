// Test/build preload only. No requests are attempted: any TCP/TLS/DNS/fetch call
// fails locally before network access. Never import this file into production.
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import tls from 'node:tls';
import dns from 'node:dns';
import { syncBuiltinESMExports } from 'node:module';
function deny() { throw new Error('OFFLINE_CHECK_NETWORK_FORBIDDEN'); }
net.Socket.prototype.connect = deny;
net.connect = deny;
net.createConnection = deny;
tls.connect = deny;
dns.lookup = deny;
dns.resolve = deny;
for (const name of ['lookup', 'resolve', 'resolve4', 'resolve6']) dns.promises[name] = deny;
globalThis.fetch = async () => deny();

// Next automatically loads dotenv files during builds. Hide them from offline
// checks before reading bytes; use only explicit nonsecret test environment.
const isEnvFile = value => {
  const name = value instanceof URL ? path.basename(value.pathname) : typeof value === 'string' || Buffer.isBuffer(value) ? path.basename(String(value)) : '';
  return name === '.env' || name.startsWith('.env.');
};
function unavailable(file) {
  const error = new Error('OFFLINE_CHECK_ENV_FILE_HIDDEN');
  error.code = 'ENOENT';
  error.path = String(file);
  return error;
}
const readSync = fs.readFileSync;
fs.readFileSync = function(file, ...args) { if (isEnvFile(file)) throw unavailable(file); return readSync.call(this, file, ...args); };
const readAsync = fs.readFile;
fs.readFile = function(file, ...args) {
  if (isEnvFile(file)) { const callback = args.at(-1); queueMicrotask(() => callback(unavailable(file))); return; }
  return readAsync.call(this, file, ...args);
};
const readPromise = fs.promises.readFile;
fs.promises.readFile = async function(file, ...args) { if (isEnvFile(file)) throw unavailable(file); return readPromise.call(this, file, ...args); };
syncBuiltinESMExports();
