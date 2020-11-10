"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var readline_sync_1 = require("readline-sync");
var node_notifier_1 = require("node-notifier");
var process_1 = require("process");
var requests_1 = require("./requests");
var consts_1 = require("./consts");
var QRSign_1 = require("./QRSign");
var extractOpenId = function (str) { var _a; return str.length === 32 ? str : (_a = str.match("openid=(.*)(?=&)")) === null || _a === void 0 ? void 0 : _a[1]; };
var sendNotificaition = function (message) {
    return node_notifier_1.notify({ message: message, title: "yatm" });
};
var openId = extractOpenId(process_1.env.OPEN_ID ? process_1.env.OPEN_ID : readline_sync_1.question("Paste openId or URL here: "));
var signedIdSet = new Set();
var lastSignId = 0;
var qrSign;
if (openId) {
    setInterval(function () {
        requests_1.activeSign(openId)
            .then(function (data) { return data.json(); })
            .then(function (data) {
            var signId = data.signId, courseId = data.courseId, isGPS = data.isGPS, isQR = data.isQR;
            if (!courseId || !signId) {
                qrSign === null || qrSign === void 0 ? void 0 : qrSign.destory();
                throw "No sign available";
            }
            if (signedIdSet.has(signId)) {
                throw "already signed";
            }
            sendNotificaition("Info: a sign is going on!");
            if (isQR) {
                if (signId === lastSignId) {
                    return;
                }
                lastSignId = signId;
                sendNotificaition("WARNING: QR sign is going on!");
                qrSign === null || qrSign === void 0 ? void 0 : qrSign.destory();
                qrSign = new QRSign_1.QRSign({ courseId: courseId, signId: signId });
                qrSign.start(function (result) {
                    console.log(result);
                    signedIdSet.add(signId);
                });
                console.warn("QR sign successfully. However, you need to re-run this script with NEW openid!");
            }
            else {
                console.log("current sign:", data);
                var signInQuery = { courseId: courseId, signId: signId };
                if (isGPS) {
                    signInQuery = __assign(__assign({}, signInQuery), { lat: 30, lon: 30 });
                }
                requests_1.signIn(openId, signInQuery)
                    .then(function (data) { return data.json(); })
                    .then(function (data) {
                    if (!data.errorCode || data.errorCode === 305) {
                        signedIdSet.add(signId);
                    }
                    console.log(data);
                })
                    .catch(function (e) {
                    console.log(e);
                    sendNotificaition("Error: failed to sign in. See output plz.");
                });
            }
        })
            .catch(function (e) {
            console.log(e);
        });
    }, consts_1.config.interval);
}
