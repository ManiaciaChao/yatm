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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
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
            if (!data.length) {
                qrSign === null || qrSign === void 0 ? void 0 : qrSign.destory();
                throw "No sign-in available";
            }
            var queue = __spreadArrays(data.filter(function (sign) { return !sign.isQR; }), data.filter(function (sign) { return sign.isQR; }));
            var _loop_1 = function (sign) {
                var signId = sign.signId, courseId = sign.courseId, isGPS = sign.isGPS, isQR = sign.isQR, name_1 = sign.name;
                console.log("current sign-in:", sign.name);
                if (signedIdSet.has(signId)) {
                    throw name_1 + " already signed in";
                }
                sendNotificaition("INFO: " + name_1 + " sign-in is going on!");
                if (isQR) {
                    if (signId === lastSignId) {
                        return { value: void 0 };
                    }
                    lastSignId = signId;
                    sendNotificaition("WARNING: " + name_1 + " QR sign-in is going on!");
                    qrSign === null || qrSign === void 0 ? void 0 : qrSign.destory();
                    qrSign = new QRSign_1.QRSign({ courseId: courseId, signId: signId });
                    qrSign.start(function (result) {
                        var prompt = "Signed in successfully. However, you need to re-run this script with NEW openid!";
                        console.log(result);
                        signedIdSet.add(signId);
                        sendNotificaition(prompt);
                        console.warn(prompt);
                        process.exit(0);
                    });
                }
                else {
                    var signInQuery = { courseId: courseId, signId: signId };
                    if (isGPS) {
                        var lat = consts_1.config.lat, lon = consts_1.config.lon;
                        signInQuery = __assign(__assign({}, signInQuery), { lat: lat, lon: lon });
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
                        sendNotificaition("Error: failed to " + name_1 + " sign in. See output plz.");
                    });
                }
            };
            for (var _i = 0, queue_1 = queue; _i < queue_1.length; _i++) {
                var sign = queue_1[_i];
                var state_1 = _loop_1(sign);
                if (typeof state_1 === "object")
                    return state_1.value;
            }
        })
            .catch(function (e) {
            console.log(e);
        });
    }, consts_1.config.interval);
}
