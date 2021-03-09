"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QRSign = void 0;
var ws_1 = __importDefault(require("ws"));
var qrcode_1 = require("qrcode");
var consts_1 = require("./consts");
var utils_1 = require("./utils");
var QRType;
(function (QRType) {
    QRType[QRType["default"] = 0] = "default";
    QRType[QRType["code"] = 1] = "code";
    QRType[QRType["unknown"] = 2] = "unknown";
    QRType[QRType["result"] = 3] = "result";
})(QRType || (QRType = {}));
var QRSign = /** @class */ (function () {
    function QRSign(info) {
        var _this = this;
        // fields
        this._seqId = 0;
        this.clientId = "";
        this.client = null;
        this.interval = 0;
        this.onError = null;
        this.onSuccess = null;
        this.currentQRUrl = "";
        this.start = function () {
            return new Promise(function (resolve, reject) {
                _this.startSync(resolve, reject);
            });
        };
        //
        this.sendMessage = function (msg) {
            var _a;
            var raw = JSON.stringify(msg ? [msg] : []);
            (_a = _this.client) === null || _a === void 0 ? void 0 : _a.send(raw);
        };
        this.handleQRSubscription = function (message) {
            var _a;
            var data = message.data;
            switch (data.type) {
                case QRType.code: {
                    var qrUrl = data.qrUrl;
                    if (!qrUrl || qrUrl === _this.currentQRUrl) {
                        return;
                    }
                    _this.currentQRUrl = qrUrl;
                    switch (consts_1.qr.mode) {
                        case "terminal": {
                            qrcode_1.toString(_this.currentQRUrl, { type: "terminal" }).then(console.log);
                            break;
                        }
                        case "copy": {
                            utils_1.copyToPasteBoard(_this.currentQRUrl);
                        }
                        case "plain": {
                            console.log(_this.currentQRUrl);
                            break;
                        }
                        default:
                            break;
                    }
                    break;
                }
                case QRType.result: {
                    var student = data.student;
                    if (student && student.name === consts_1.qr.name) {
                        (_a = _this.onSuccess) === null || _a === void 0 ? void 0 : _a.call(_this, student);
                    }
                    break;
                }
                default:
                    break;
            }
        };
        this.handleMessage = function (data) {
            try {
                var messages = JSON.parse(data);
                // heartbeat response
                if (Array.isArray(messages) && messages.length === 0) {
                    return;
                }
                var message = messages[0];
                var channel = message.channel, successful = message.successful;
                if (!successful) {
                    // qr subscription
                    if (QRSign.testQRSubscription(message)) {
                        console.log(channel + ": successful!");
                        _this.handleQRSubscription(message);
                    }
                    else {
                        throw channel + ": failed!";
                    }
                }
                else {
                    console.log(channel + ": successful!");
                    switch (message.channel) {
                        case "/meta/handshake": {
                            var clientId = message.clientId;
                            _this.clientId = clientId;
                            _this.connect();
                            break;
                        }
                        case "/meta/connect": {
                            var timeout = message.advice.timeout;
                            _this.startHeartbeat(timeout);
                            _this.subscribe();
                            break;
                        }
                        case "/meta/subscribe": {
                            break;
                        }
                        default: {
                            break;
                        }
                    }
                }
            }
            catch (err) {
                console.log("QR: " + err);
            }
        };
        this.handshake = function () {
            return _this.sendMessage({
                channel: "/meta/handshake",
                version: "1.0",
                supportedConnectionTypes: [
                    "websocket",
                    "eventsource",
                    "long-polling",
                    "cross-origin-long-polling",
                    "callback-polling",
                ],
                id: _this.seqId,
            });
        };
        this.connect = function () {
            return _this.sendMessage({
                channel: "/meta/connect",
                clientId: _this.clientId,
                connectionType: "long-polling",
                id: _this.seqId,
                advice: {
                    timeout: 0,
                },
            });
        };
        this.startHeartbeat = function (timeout) {
            _this.sendMessage();
            _this.interval = setInterval(_this.sendMessage, timeout);
        };
        this.subscribe = function () {
            return _this.sendMessage({
                channel: "/meta/subscribe",
                clientId: _this.clientId,
                subscription: "/attendance/" + _this.courseId + "/" + _this.signId + "/qr",
                id: _this.seqId,
            });
        };
        this.courseId = info.courseId;
        this.signId = info.signId;
    }
    QRSign.prototype.startSync = function (cb, err) {
        var _this = this;
        this.onError = err !== null && err !== void 0 ? err : null;
        this.onSuccess = cb !== null && cb !== void 0 ? cb : null;
        this.client = new ws_1.default(QRSign.endpoint);
        this.client.on("open", function () {
            _this.handshake();
        });
        this.client.on("message", function (data) {
            // console.log(data);
            _this.handleMessage(data.toString());
        });
        this.onError && this.client.on("error", this.onError);
    };
    QRSign.prototype.destory = function () {
        var _a;
        clearInterval(this.interval);
        (_a = this.client) === null || _a === void 0 ? void 0 : _a.close();
    };
    Object.defineProperty(QRSign.prototype, "seqId", {
        // getters
        get: function () {
            return "" + this._seqId++;
        },
        enumerable: false,
        configurable: true
    });
    // static
    QRSign.endpoint = "wss://www.teachermate.com.cn/faye";
    QRSign.testQRSubscription = function (msg) {
        return /attendance\/\d+\/\d+\/qr/.test(msg.channel);
    };
    return QRSign;
}());
exports.QRSign = QRSign;
