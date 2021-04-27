"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeDebugLogger = exports.debugLogger = exports.urlParamsToObject = exports.sendNotificaition = exports.extractOpenId = exports.sleep = exports.pasteFromClipBoard = exports.copyToClipBoard = void 0;
const child_process_1 = require("child_process");
const node_notifier_1 = require("node-notifier");
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
exports.extractOpenId = (str) => str.length === 32 ? str : str.match('openid=(.*?)(?=&|$)')?.[1];
exports.sendNotificaition = (message) => node_notifier_1.notify({ message, title: 'yatm' });
exports.urlParamsToObject = (urlParams) => Object.fromEntries(new URLSearchParams(urlParams));
// verbose
exports.debugLogger = (...args) => consts_1.config.verbose && console.debug(...args);
exports.makeDebugLogger = (prefix) => (...args) => exports.debugLogger(prefix, ...args);
