// Path alias resolver for ts-node tests — maps @/* to project root
const path = require('path');
const Module = require('module');
const root = path.resolve(__dirname, '..');
const original = Module._resolveFilename.bind(Module);
Module._resolveFilename = function(request, parent, isMain, options) {
  if (request.startsWith('@/')) {
    return original(path.join(root, request.slice(2)), parent, isMain, options);
  }
  return original(request, parent, isMain, options);
};
