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
var requests_1 = require("./requests");
var readline_sync_1 = require("readline-sync");
var consts_1 = require("./consts");
var extractOpenId = function (str) { var _a; return str.length === 32 ? str : (_a = str.match("openid=(.*)(?=&)")) === null || _a === void 0 ? void 0 : _a[1]; };
var args = process.argv.slice(2);
var openId = 'undefined';
if (args.length > 0){
    openId = extractOpenId(args[0]);
}
var signIdSet = new Set();
if (openId) {
    setInterval(function () {
        requests_1.activeSign(openId)
            .then(function (data) { return data.json(); })
            .then(function (data) {
            var signId = data.signId, courseId = data.courseId, isGPS = data.isGPS, isQR = data.isQR;
            if (!courseId || !signId) {
                throw "No sign available";
            }
            if (signIdSet.has(signId)) {
                throw "already signed";
            }
            console.log("current sign:", data);
            var signInQuery = { courseId: courseId, signId: signId };
            if (data.isGPS) {
                signInQuery = __assign(__assign({}, signInQuery), { lat: 30, lon: 30 });
            }
            requests_1.signIn(openId, signInQuery)
                .then(function (data) { return data.json(); })
                .then(function (data) {
                if (!data.errorCode || data.errorCode === 305) {
                    signIdSet.add(signId);
                }
                console.log(data);
            });
        })
            .catch(function (e) { return console.log(e); });
    }, consts_1.config.interval);
}
