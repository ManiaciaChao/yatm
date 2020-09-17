"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
var fs_1 = require("fs");
var path_1 = require("path");
var configFile = fs_1.readFileSync(path_1.join("./", "config.json"));
exports.config = JSON.parse(configFile.toString());
