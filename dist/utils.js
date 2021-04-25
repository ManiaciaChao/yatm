"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeDebugLogger = exports.debugLogger = exports.urlParamsToObject = exports.sendNotificaition = exports.extractOpenId = exports.sleep = exports.pasteFromClipBoard = exports.copyToClipBoard = void 0;
const child_process_1 = require("child_process");
const node_notifier_1 = require("node-notifier");
const consts_1 = require("./consts");
const placeholder = '{}';
const copyToClipBoard = (text) => {
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
exports.copyToClipBoard = copyToClipBoard;
const pasteFromClipBoard = () => {
    if (!consts_1.config.clipboard?.paste) {
        return '';
    }
    const pasteCmd = consts_1.config.clipboard.paste;
    return child_process_1.execSync(pasteCmd).toString();
};
exports.pasteFromClipBoard = pasteFromClipBoard;
const sleep = (ms) => new Promise((reslove) => {
    setTimeout(reslove, ms);
});
exports.sleep = sleep;
const extractOpenId = (str) => str.length === 32 ? str : str.match('openid=(.*?)(?=&|$)')?.[1];
exports.extractOpenId = extractOpenId;
const sendNotificaition = (message) => node_notifier_1.notify({ message, title: 'yatm' });
exports.sendNotificaition = sendNotificaition;
const urlParamsToObject = (urlParams) => Object.fromEntries(new URLSearchParams(urlParams));
exports.urlParamsToObject = urlParamsToObject;
// verbose
const debugLogger = (...args) => consts_1.config.verbose && console.debug(...args);
exports.debugLogger = debugLogger;
const makeDebugLogger = (prefix) => (...args) => exports.debugLogger(prefix, ...args);
exports.makeDebugLogger = makeDebugLogger;
