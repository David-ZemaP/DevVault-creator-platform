// Reuse the repository's Mocha/ts-node toolchain without compiling contracts or contacting RPCs.
const Module = require('node:module');
const path = require('node:path');
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (name, ...rest) {
  return originalResolve.call(this, name.startsWith('@/') ? path.join(process.cwd(), name.slice(2)) : name, ...rest);
};
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node' } });
const Mocha = require('mocha');
const mocha = new Mocha({ timeout: 10000 });
mocha.addFile('tests/Marketplace.test.ts');
mocha.run(failures => { process.exitCode = failures ? 1 : 0; });
