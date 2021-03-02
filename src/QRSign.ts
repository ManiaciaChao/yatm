import WebSocket from "ws";
import { toString as toQR } from "qrcode";
import { IBasicSignInfo } from "./requests";
import { config } from "./consts";

interface IServerMessage {
  id: string;
  channel: string;
  version: string;
  successful: boolean;
  advice: {
    reconnect: string;
    interval: number;
    timeout: number;
  };
  supportedConnectionTypes?: string[];
}

interface IHandShakeMessage extends IServerMessage {
  clientId: string;
}

enum QRType {
  default,
  code,
  unknown,
  result,
}

interface IQRStudentResult {
  id: number;
  name: string;
  studentNumber: string;
  rank: number;
  // teamId: 0;
  // isNew: false;
  // distance: 0;
  // isOutOfBound: -1;
}

interface IQRMessage {
  channel: string;
  data: {
    type: number; // 1 for code; 3 for student
    qrUrl?: string; // for type 1
    student?: IQRStudentResult; // for type 3
  };
  id: string;
}

type successCallback = (result: IQRStudentResult) => void;

export class QRSign {
  // static
  static endpoint = "wss://www.teachermate.com.cn/faye";
  // fields
  private _seqId = 0;
  private courseId: number;
  private signId: number;
  private clientId = "";
  private client: WebSocket | null = null;
  private interval: number = 0;
  private onSuccess: successCallback | null = null;

  constructor(info: IBasicSignInfo) {
    this.courseId = info.courseId;
    this.signId = info.signId;
  }

  start(cb: successCallback) {
    this.onSuccess = cb;
    this.client = new WebSocket(QRSign.endpoint);
    this.client.on("open", () => {
      this.handshake();
    });
    this.client.on("message", (data) => {
      // console.log(data);
      this.handleMessage(data.toString());
    });
  }

  destory() {
    clearInterval(this.interval);
    this.client?.close();
  }

  // getters
  private get seqId() {
    return `${this._seqId++}`;
  }
  //

  private sendMessage = (msg?: object) => {
    const raw = JSON.stringify(msg ? [msg] : []);
    this.client?.send(raw);
  };

  private handleMessage = (data: string) => {
    try {
      const messages = JSON.parse(data);

      // heartbeat response
      if (Array.isArray(messages) && messages.length === 0) {
        return;
      }
      const message = messages[0];
      const { channel, successful } = message as IServerMessage;
      if (!successful) {
        // qr subscription
        if (/attendance\/\d+\/\d+\/qr/.test(channel)) {
          // console.log(`${channel}: successful!`);
          const { data } = message as IQRMessage;
          switch (data.type) {
            case QRType.code: {
              console.log(`${channel}: successful!`, message);
              toQR(data.qrUrl!, { type: "terminal" }).then(console.log);
              break;
            }
            case QRType.result: {
              const { student } = data;
              if (student && student.name === config.name) {
                this.onSuccess?.(student);
              }
              break;
            }
            default:
              break;
          }
        } else {
          throw `${channel}: failed!`;
        }
      } else {
        console.log(`${channel}: successful!`);
        switch (message.channel) {
          case "/meta/handshake": {
            const { clientId } = message as IHandShakeMessage;
            this.clientId = clientId;
            this.connect();
            break;
          }
          case "/meta/connect": {
            const {
              advice: { timeout },
            } = message as IServerMessage;
            this.startHeartbeat(timeout);
            this.subscribe();
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
    } catch (err) {
      console.log(`QR: ${err}`);
    }
  };

  private handshake = () =>
    this.sendMessage({
      channel: "/meta/handshake",
      version: "1.0",
      supportedConnectionTypes: [
        "websocket",
        "eventsource",
        "long-polling",
        "cross-origin-long-polling",
        "callback-polling",
      ],
      id: this.seqId,
    });

  private connect = () =>
    this.sendMessage({
      channel: "/meta/connect",
      clientId: this.clientId,
      connectionType: "long-polling",
      id: this.seqId,
      advice: {
        timeout: 0,
      },
    });

  private startHeartbeat = (timeout: number) => {
    this.sendMessage();
    this.interval = setInterval(this.sendMessage, timeout);
  };

  private subscribe = () =>
    this.sendMessage({
      channel: "/meta/subscribe",
      clientId: this.clientId,
      subscription: `/attendance/${this.courseId}/${this.signId}/qr`,
      id: this.seqId,
    });
}
