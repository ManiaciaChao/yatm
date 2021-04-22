import WebSocket from 'ws';
import { toString as toQR } from 'qrcode';
import { IBasicSignInfo } from './requests';
import { qr } from './consts';
import { copyToClipBoard, debug } from './utils';
import { WechatDevtools } from './cdp';

interface IChannelMessage {
  id: string;
  channel: string;
  successful?: boolean;
}
interface IServerMessage extends IChannelMessage {
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
type errorCallback = (err: any) => void;

interface IQRSignOptions extends IBasicSignInfo {
  setOpenId?: (openId: string) => void;
  devtools?: WechatDevtools;
}

export class QRSign {
  // static
  static endpoint = 'wss://www.teachermate.com.cn/faye';
  // fields
  private _seqId = 0;
  private courseId: number;
  private signId: number;
  private clientId = '';
  private client: WebSocket | null = null;
  private devtools: WechatDevtools | null = null;
  private interval: NodeJS.Timeout | undefined;
  private onError: errorCallback | null = null;
  private onSuccess: successCallback | null = null;
  private setOpenId: ((openId: string) => void) | null = null;
  private currentQRUrl = '';

  static testQRSubscription = (msg: IChannelMessage): msg is IQRMessage =>
    /attendance\/\d+\/\d+\/qr/.test(msg.channel);

  constructor(info: IQRSignOptions) {
    this.courseId = info.courseId;
    this.signId = info.signId;
    this.setOpenId = info.setOpenId ?? null;
    this.devtools = info.devtools ?? null;
  }

  startSync(cb?: successCallback, err?: (err: any) => void) {
    this.onError = err ?? null;
    this.onSuccess = cb ?? null;

    this.client = new WebSocket(QRSign.endpoint);
    this.client.on('open', () => {
      this.handshake();
    });
    this.client.on('message', (data) => {
      debug(data);
      this.handleMessage(data.toString());
    });
    this.onError && this.client.on('error', this.onError);
  }

  start = () =>
    new Promise<IQRStudentResult>((resolve, reject) => {
      this.startSync(resolve, reject);
    });

  destory() {
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.client?.close();
  }

  // getters
  private get seqId() {
    return `${this._seqId++}`;
  }
  //

  private sendMessage = (msg?: object) => {
    debug(`QRSign::sendMessage`, msg);
    const raw = JSON.stringify(msg ? [msg] : []);
    this.client?.send(raw);
  };

  private handleQRSubscription = async (message: IQRMessage) => {
    const { data } = message;
    switch (data.type) {
      case QRType.code: {
        const { qrUrl } = data;
        if (!qrUrl || qrUrl === this.currentQRUrl) {
          return;
        }
        this.currentQRUrl = qrUrl;
        if (this.devtools) {
          const result = await this.devtools.finishQRSign(qrUrl);
          this.setOpenId?.(result.openId);
          if (result.success) {
            this.onSuccess?.({} as IQRStudentResult);
          }
        } else {
          switch (qr.mode) {
            case 'terminal': {
              toQR(this.currentQRUrl, { type: 'terminal' }).then(console.log);
              break;
            }
            case 'copy': {
              copyToClipBoard(this.currentQRUrl);
            }
            case 'plain': {
              console.log(this.currentQRUrl);
              break;
            }
            default:
              break;
          }
        }

        break;
      }
      case QRType.result: {
        const { student } = data;
        if (student && student.name === qr.name) {
          this.onSuccess?.(student);
        }
        break;
      }
      default:
        break;
    }
  };

  private handleMessage = (data: string) => {
    try {
      const messages = JSON.parse(data);

      // heartbeat response
      if (Array.isArray(messages) && messages.length === 0) {
        return;
      }
      const message = messages[0] as IChannelMessage;
      const { channel, successful } = message;
      if (!successful) {
        // qr subscription
        if (QRSign.testQRSubscription(message)) {
          debug(`QRSign:: ${channel}: successful!`);
          this.handleQRSubscription(message);
        } else {
          throw `${channel}: failed!`;
        }
      } else {
        debug(`QRSign:: ${channel}: successful!`);
        switch (message.channel) {
          case '/meta/handshake': {
            const { clientId } = message as IHandShakeMessage;
            this.clientId = clientId;
            this.connect();
            break;
          }
          case '/meta/connect': {
            const {
              advice: { timeout },
            } = message as IServerMessage;
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
    } catch (err) {
      console.error(`QR: ${err}`);
    }
  };

  private handshake = () =>
    this.sendMessage({
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

  private connect = () => {
    this.sendMessage({
      channel: '/meta/connect',
      clientId: this.clientId,
      connectionType: 'websocket',
      id: this.seqId,
    });
  };

  private startHeartbeat = (timeout: number) => {
    this.sendMessage();
    this.interval = setInterval(() => {
      this.sendMessage();
      this.connect();
    }, timeout / 2);
  };

  private subscribe = () =>
    this.sendMessage({
      channel: '/meta/subscribe',
      clientId: this.clientId,
      subscription: `/attendance/${this.courseId}/${this.signId}/qr`,
      id: this.seqId,
    });
}
