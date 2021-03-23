"use strict";
var _a;
var _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CHECK_ALIVE_INTERVAL = exports.userAgent = exports.qr = exports.config = void 0;
var fs_1 = require("fs");
var path_1 = require("path");
var configFile = fs_1.readFileSync(path_1.join("./", "config.json"));
exports.config = JSON.parse(configFile.toString());
exports.qr = (_a = exports.config.qr, _a === void 0 ? {
    name: "",
    mode: "terminal",
    copyCmd: undefined,
} : _a);
exports.userAgent = (_b = exports.config.ua) !== null && _b !== void 0 ? _b : "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4427.5 Safari/537.36";
exports.CHECK_ALIVE_INTERVAL = 4; // request `/role` per a given amount of `/active_signs`
