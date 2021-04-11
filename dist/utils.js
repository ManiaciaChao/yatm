"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = exports.pasteFromClipBoard = exports.copyToClipBoard = void 0;
const child_process_1 = require("child_process");
const consts_1 = require("./consts");
const placeholder = '{}';
exports.copyToClipBoard = (text) => {
    if (!text || !consts_1.config.clipboard?.copy)
        return;
    const copyCmd = consts_1.config.clipboard.copy;
    if (copyCmd.includes(placeholder)) {
        child_process_1.execSync(copyCmd.replace(placeholder, `"${text}"`));
    }
    else {
        throw 'wrong format for copyCmd!';
    }
};
exports.pasteFromClipBoard = () => {
    if (!consts_1.config.clipboard?.paste) {
        return '';
    }
    const pasteCmd = consts_1.config.clipboard.paste;
    return child_process_1.execSync(pasteCmd).toString();
};
exports.sleep = (ms) => new Promise((reslove) => {
    setTimeout(reslove, ms);
});
