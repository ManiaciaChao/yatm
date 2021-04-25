"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QRSign = void 0;
const ws_1 = __importDefault(require("ws"));
const qrcode_1 = require("qrcode");
const consts_1 = require("./consts");
const utils_1 = require("./utils");
const debugLogger = utils_1.makeDebugLogger('QRSign::');
var QRType;
(function (QRType) {
    QRType[QRType["default"] = 0] = "default";
    QRType[QRType["code"] = 1] = "code";
    QRType[QRType["unknown"] = 2] = "unknown";
    QRType[QRType["result"] = 3] = "result";
})(QRType || (QRType = {}));
class QRSign {
    constructor(ctx, info) {
        // fields
        this._seqId = 0;
        this.clientId = '';
        this.client = null;
        this.onError = null;
        this.onSuccess = null;
        this.currentQRUrl = '';
        this.start = () => new Promise((resolve, reject) => {
            this.startSync(resolve, reject);
        });
        this.sendMessage = (msg) => {
            debugLogger(`sendMessage`, msg);
            const raw = JSON.stringify(msg ? [msg] : []);
            this.client?.send(raw);
        };
        this.handleQRSubscription = async (message) => {
            const { data } = message;
            switch (data.type) {
                case QRType.code: {
                    const { qrUrl } = data;
                    if (!qrUrl || qrUrl === this.currentQRUrl) {
                        return;
                    }
                    this.currentQRUrl = qrUrl;
                    // TODO: should devtools conflict with printer?
                    if (this.ctx.devtools) {
                        // automation via devtools
                        const { openId } = await this.ctx.devtools.finishQRSign(qrUrl);
                        // reset openId is mandatory, for scanning QR code triggering another oauth
                        this.ctx.openId = openId;
                        // Currently, QRType.result is still used for more infomations
                        // if (result.success) {
                        //   this.onSuccess?.({} as IQRStudentResult);
                        // }
                    }
                    // manually print or execute command
                    switch (consts_1.qr.mode) {
                        case 'terminal': {
                            qrcode_1.toString(this.currentQRUrl, { type: 'terminal' }).then(console.log);
                            break;
                        }
                        case 'copy': {
                            utils_1.copyToClipBoard(this.currentQRUrl);
                        }
                        case 'plain': {
                            console.log(this.currentQRUrl);
                            break;
                        }
                        default:
                            break;
                    }
                    break;
                }
                case QRType.result: {
                    const { student } = data;
                    // TODO: get student info from devtools
                    if (student && student.name === this.ctx.studentName) {
                        this.onSuccess?.(student);
                    }
                    break;
                }
                default:
                    break;
            }
        };
        this.handleMessage = (data) => {
            try {
                const messages = JSON.parse(data);
                // heartbeat response
                if (Array.isArray(messages) && messages.length === 0) {
                    return;
                }
                const message = messages[0];
                const { channel, successful } = message;
                if (!successful) {
                    // qr subscription
                    if (QRSign.testQRSubscription(message)) {
                        debugLogger(`${channel}: successful!`);
                        this.handleQRSubscription(message);
                    }
                    else {
                        throw `${channel}: failed!`;
                    }
                }
                else {
                    debugLogger(`${channel}: successful!`);
                    switch (message.channel) {
                        case '/meta/handshake': {
                            const { clientId } = message;
                            this.clientId = clientId;
                            this.connect();
                            break;
                        }
                        case '/meta/connect': {
                            const { advice: { timeout }, } = message;
                            this.startHeartbeat(timeout);
                            this.subscribe();
                            break;
                        }
                        case '/meta/subscribe': {
                            break;
                        }
                        default: {
                            break;
                        }
                    }
                }
            }
            catch (err) {
                console.error(`QR: ${err}`);
            }
        };
        this.handshake = () => this.sendMessage({
            channel: '/meta/handshake',
            version: '1.0',
            supportedConnectionTypes: [
                'websocket',
                'eventsource',
                'long-polling',
                'cross-origin-long-polling',
                'callback-polling',
            ],
            id: this.seqId,
        });
        this.connect = () => {
            this.sendMessage({
                channel: '/meta/connect',
                clientId: this.clientId,
                connectionType: 'websocket',
                id: this.seqId,
            });
        };
        this.startHeartbeat = (timeout) => {
            this.sendMessage();
            this.interval = setInterval(() => {
                this.sendMessage();
                this.connect();
            }, timeout / 2);
        };
        this.subscribe = () => this.sendMessage({
            channel: '/meta/subscribe',
            clientId: this.clientId,
            subscription: `/attendance/${this.courseId}/${this.signId}/qr`,
            id: this.seqId,
        });
        this.courseId = info.courseId;
        this.signId = info.signId;
        this.ctx = ctx;
    }
    startSync(cb, err) {
        this.onError = err ?? null;
        this.onSuccess = cb ?? null;
        this.client = new ws_1.default(QRSign.endpoint);
        this.client.on('open', () => {
            this.handshake();
        });
        this.client.on('message', (data) => {
            debugLogger(`receiveMessage`, data);
            this.handleMessage(data.toString());
        });
        this.onError && this.client.on('error', this.onError);
    }
    destory() {
        if (this.interval) {
            clearInterval(this.interval);
        }
        this.client?.close();
    }
    // getters
    get seqId() {
        return `${this._seqId++}`;
    }
}
exports.QRSign = QRSign;
// static
QRSign.endpoint = 'wss://www.teachermate.com.cn/faye';
QRSign.testQRSubscription = (msg) => /attendance\/\d+\/\d+\/qr/.test(msg.channel);
