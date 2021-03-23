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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
var readline_sync_1 = require("readline-sync");
var node_notifier_1 = require("node-notifier");
var process_1 = require("process");
var requests_1 = require("./requests");
var consts_1 = require("./consts");
var QRSign_1 = require("./QRSign");
var utils_1 = require("./utils");
var extractOpenId = function (str) { var _a; return str.length === 32 ? str : (_a = str.match("openid=(.*?)(?=&|$)")) === null || _a === void 0 ? void 0 : _a[1]; };
var sendNotificaition = function (message) {
    return node_notifier_1.notify({ message: message, title: "yatm" });
};
var openId = extractOpenId((_a = process_1.env.OPEN_ID) !== null && _a !== void 0 ? _a : readline_sync_1.question("Paste openId or URL here: "));
var signedIdSet = new Set();
if (!openId) {
    throw "Error: invalid openId or URL";
}
var lastSignId = 0;
var qrSign;
var main = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, requests_1.activeSign(openId)
                    .then(function (data) { return __awaiter(void 0, void 0, void 0, function () {
                    var queue, _loop_1, _i, queue_1, sign, state_1;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                if (!data.length) {
                                    qrSign === null || qrSign === void 0 ? void 0 : qrSign.destory();
                                    throw "No sign-in available";
                                }
                                queue = __spreadArrays(data.filter(function (sign) { return !sign.isQR; }), data.filter(function (sign) { return sign.isQR; }));
                                _loop_1 = function (sign) {
                                    var signId, courseId, isGPS, isQR, name_1, result, prompt_1, signInQuery, lat, lon;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                signId = sign.signId, courseId = sign.courseId, isGPS = sign.isGPS, isQR = sign.isQR, name_1 = sign.name;
                                                console.log("current sign-in:", sign.name);
                                                if (signedIdSet.has(signId)) {
                                                    throw name_1 + " already signed in";
                                                }
                                                sendNotificaition("INFO: " + name_1 + " sign-in is going on!");
                                                if (!isQR) return [3 /*break*/, 2];
                                                if (signId === lastSignId) {
                                                    return [2 /*return*/, { value: void 0 }];
                                                }
                                                lastSignId = signId;
                                                sendNotificaition("WARNING: " + name_1 + " QR sign-in is going on!");
                                                qrSign === null || qrSign === void 0 ? void 0 : qrSign.destory();
                                                qrSign = new QRSign_1.QRSign({ courseId: courseId, signId: signId });
                                                return [4 /*yield*/, qrSign.start()];
                                            case 1:
                                                result = _a.sent();
                                                prompt_1 = "Signed in successfully. However, you need to re-run this script with NEW openid!";
                                                console.log(result);
                                                signedIdSet.add(signId);
                                                sendNotificaition(prompt_1);
                                                console.warn(prompt_1);
                                                process.exit(0);
                                                return [3 /*break*/, 5];
                                            case 2:
                                                signInQuery = { courseId: courseId, signId: signId };
                                                if (isGPS) {
                                                    lat = consts_1.config.lat, lon = consts_1.config.lon;
                                                    signInQuery = __assign(__assign({}, signInQuery), { lat: lat, lon: lon });
                                                }
                                                return [4 /*yield*/, utils_1.sleep(consts_1.config.wait)];
                                            case 3:
                                                _a.sent();
                                                return [4 /*yield*/, requests_1.signIn(openId, signInQuery)
                                                        .then(function (data) {
                                                        if (!data.errorCode || data.errorCode === 305) {
                                                            signedIdSet.add(signId);
                                                        }
                                                        console.log(data);
                                                    })
                                                        .catch(function (e) {
                                                        console.log(e);
                                                        sendNotificaition("Error: failed to " + name_1 + " sign in. See output plz.");
                                                    })];
                                            case 4:
                                                _a.sent();
                                                _a.label = 5;
                                            case 5: return [2 /*return*/];
                                        }
                                    });
                                };
                                _i = 0, queue_1 = queue;
                                _a.label = 1;
                            case 1:
                                if (!(_i < queue_1.length)) return [3 /*break*/, 4];
                                sign = queue_1[_i];
                                return [5 /*yield**/, _loop_1(sign)];
                            case 2:
                                state_1 = _a.sent();
                                if (typeof state_1 === "object")
                                    return [2 /*return*/, state_1.value];
                                _a.label = 3;
                            case 3:
                                _i++;
                                return [3 /*break*/, 1];
                            case 4: return [2 /*return*/];
                        }
                    });
                }); })
                    .catch(function (e) {
                    console.log(e);
                })];
            case 1: return [2 /*return*/, _a.sent()];
        }
    });
}); };
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var i, _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                i = 0;
                _b.label = 1;
            case 1:
                _a = i === 0;
                if (!_a) return [3 /*break*/, 3];
                return [4 /*yield*/, requests_1.checkInvaild(openId)];
            case 2:
                _a = (_b.sent());
                _b.label = 3;
            case 3:
                if (_a) {
                    sendNotificaition("Error: expired or invaild openId");
                    return [3 /*break*/, 7];
                }
                return [4 /*yield*/, main()];
            case 4:
                _b.sent();
                return [4 /*yield*/, utils_1.sleep(consts_1.config.interval)];
            case 5:
                _b.sent();
                _b.label = 6;
            case 6:
                i = (i + 1) % consts_1.CHECK_ALIVE_INTERVAL;
                return [3 /*break*/, 1];
            case 7: return [2 /*return*/];
        }
    });
}); })();
