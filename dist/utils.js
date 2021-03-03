"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.copyToPasteBoard = void 0;
var child_process_1 = require("child_process");
var consts_1 = require("./consts");
var placeholder = "{}";
exports.copyToPasteBoard = function (text) {
    var _a;
    if (!text)
        return;
    if ((_a = consts_1.qr.copyCmd) === null || _a === void 0 ? void 0 : _a.includes(placeholder)) {
        child_process_1.exec(consts_1.qr.copyCmd.replace(placeholder, "\"" + text + "\""), function (err, stdout, stderr) {
            if (err || stderr) {
                throw err || stderr;
            }
        });
    }
    else {
        throw "wrong format for copyCmd!";
    }
};
