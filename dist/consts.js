"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CHECK_ALIVE_INTERVAL = exports.userAgent = exports.devtools = exports.qr = exports.config = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const configFile = fs_1.readFileSync(path_1.join('./', 'config.json'));
exports.config = JSON.parse(configFile.toString());
_a = exports.config.qr, exports.qr = _a === void 0 ? {
    name: '',
    mode: 'terminal',
    copyCmd: undefined,
} : _a, exports.devtools = exports.config.devtools;
exports.userAgent = exports.config.ua ??
    `Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.116 Safari/537.36 QBCore/4.0.1326.400 QQBrowser/9.0.2524.400 Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2875.116 Safari/537.36 NetType/WIFI MicroMessenger/7.0.20.1781(0x6700143B) WindowsWechat(0x63010200)`;
exports.CHECK_ALIVE_INTERVAL = 4; // request `/role` per a given amount of `/active_signs`
