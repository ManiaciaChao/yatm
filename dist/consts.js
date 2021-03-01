"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.userAgent = exports.config = void 0;
var fs_1 = require("fs");
var path_1 = require("path");
var configFile = fs_1.readFileSync(path_1.join("./", "config.json"));
exports.config = JSON.parse(configFile.toString());
exports.userAgent = (_a = exports.config.ua) !== null && _a !== void 0 ? _a : "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4427.5 Safari/537.36";
