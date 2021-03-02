"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QRSign = void 0;
var ws_1 = __importDefault(require("ws"));
var qrcode_1 = require("qrcode");
var consts_1 = require("./consts");
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
        this.onSuccess = null;
        //
        this.sendMessage = function (msg) {
            var _a;
            var raw = JSON.stringify(msg ? [msg] : []);
            (_a = _this.client) === null || _a === void 0 ? void 0 : _a.send(raw);
        };
        this.handleMessage = function (data) {
            var _a;
            try {
                var messages = JSON.parse(data);
                // heartbeat response
                if (Array.isArray(messages) && messages.length === 0) {
                    return;
                }
                var message = messages[0];
                var _b = message, channel = _b.channel, successful = _b.successful;
                if (!successful) {
                    // qr subscription
                    if (/attendance\/\d+\/\d+\/qr/.test(channel)) {
                        // console.log(`${channel}: successful!`);
                        var data_1 = message.data;
                        switch (data_1.type) {
                            case QRType.code: {
                                console.log(channel + ": successful!", message);
                                qrcode_1.toString(data_1.qrUrl, { type: "terminal" }).then(console.log);
                                break;
                            }
                            case QRType.result: {
                                var student = data_1.student;
                                if (student && student.name === consts_1.config.name) {
                                    (_a = _this.onSuccess) === null || _a === void 0 ? void 0 : _a.call(_this, student);
                                }
                                break;
                            }
                            default:
                                break;
                        }
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
    QRSign.prototype.start = function (cb) {
        var _this = this;
        this.onSuccess = cb;
        this.client = new ws_1.default(QRSign.endpoint);
        this.client.on("open", function () {
            _this.handshake();
        });
        this.client.on("message", function (data) {
            // console.log(data);
            _this.handleMessage(data.toString());
        });
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
    return QRSign;
}());
exports.QRSign = QRSign;
