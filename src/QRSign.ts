import WebSocket from 'ws';
import { toString as toQR } from 'qrcode';
import { IBasicSignInfo } from './requests';
import { qr } from './consts';
import { copyToClipBoard, makeDebugLogger } from './utils';
import { WechatDevtools } from './cdp';
import { IContext } from './sign';

const debugLogger = makeDebugLogger('QRSign::');

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
  id?: number;
  name?: string;
  studentNumber?: string;
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
  private interval: NodeJS.Timeout | undefined;
  private onError: errorCallback | null = null;
  private onSuccess: successCallback | null = null;
  private ctx: IContext;
  private currentQRUrl = '';

  static testQRSubscription = (msg: IChannelMessage): msg is IQRMessage =>
    /attendance\/\d+\/\d+\/qr/.test(msg.channel);

  constructor(ctx: IContext, info: IQRSignOptions) {
    this.courseId = info.courseId;
    this.signId = info.signId;
    this.ctx = ctx;
  }

  startSync(cb?: successCallback, err?: (err: any) => void) {
    this.onError = err ?? null;
    this.onSuccess = cb ?? null;

    this.client = new WebSocket(QRSign.endpoint);
    this.client.on('open', () => {
      this.handshake();
    });
    this.client.on('message', (data) => {
      debugLogger(`receiveMessage`, data);
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

  private sendMessage = (msg?: object) => {
    debugLogger(`sendMessage`, msg);
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
        // TODO: should devtools conflict with printer?
        if (this.ctx.devtools) {
          // automation via devtools
          const result = await this.ctx.devtools.finishQRSign(qrUrl);
          // reset openId is mandatory, for scanning QR code triggering another oauth
          this.ctx.openId = result.openId;
          // race with QRType.result
          if (result.success) {
            this.onSuccess?.(result as IQRStudentResult);
          }
        }
        // manually print or execute command
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
          debugLogger(`${channel}: successful!`);
          this.handleQRSubscription(message);
        } else {
          throw `${channel}: failed!`;
        }
      } else {
        debugLogger(`${channel}: successful!`);
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
