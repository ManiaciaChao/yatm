import CDP = require('chrome-remote-interface');
import { userAgent } from './consts';
import { extractOpenId, sleep, urlParamsToObject } from './utils';

const baseConfig = {
  port: 8000,
  local: true,
  host: '127.0.0.1',
};

export interface IWechatDevtoolOptions {
  host: string;
  port: number;
  local: boolean;
}

const generateOpenWeixinRedirectURL = (url: string) =>
  `https://open.weixin.qq.com/connect/oauth2/authorize?appid=wxa153455f3ef1d9f9&redirect_uri=${url}&response_type=code&scope=snsapi_userinfo&state=#wechat_redirect`;

export class WechatDevtools {
  private host: string;
  private port: number;
  private local: boolean;
  private _cdp: any = null;
  private api = 'https://v18.teachermate.cn/api/v1/wechat/r';
  private throttle: Promise<unknown> | null = null;

  constructor(options?: Partial<IWechatDevtoolOptions>) {
    const opt = { ...baseConfig, ...options };
    this.host = opt.host;
    this.port = opt.port;
    this.local = opt.local;
  }

  get cdp() {
    if (!this._cdp) throw 'cdp: uninitialized';
    return this._cdp;
  }

  set cdp(val: any) {
    if (this._cdp) throw 'cdp: already connected';
    this._cdp = val;
  }

  public init = async () => {
    const { host, port, local } = this;
    this.cdp = await CDP({
      host,
      port,
      local,
      target: (targets: any) => {
        const target = targets[0];
        if (target) {
          if (target.id && !target.webSocketDebuggerUrl) {
            target.webSocketDebuggerUrl = `ws://${this.host}:${this.port}/devtools/page/${target.id}`;
          }
          return target;
        } else {
          throw new Error('No inspectable targets');
        }
      },
    });

    const { Network, Page, Runtime } = this.cdp;
    await Network.enable();
    await Page.enable();
    await this.cdp.Network.setUserAgentOverride({ userAgent });

    return this.cdp;
  };

  public destroy = () => this.cdp?.close();

  public navigateTo = (url: string) =>
    this.cdp.Page.navigate({
      url,
    });

  public fetchNextOpenIDFromRequest = (filter = 'openid=') =>
    this.waitForNextRequestUrl(filter).then(extractOpenId);

  public waitForNextRequestUrl = (filter: string) =>
    new Promise<string>((resolve) => {
      const cleaner = this.cdp.Network.requestWillBeSent((params: any) => {
        const url = params.request.url as string;
        if (url.includes(filter)) {
          this.throttle = sleep(10 * 1000);
          cleaner();
          resolve(url);
        }
      });
    });

  public generateOpenId = async () => {
    await this.throttle;
    this.navigateTo(generateOpenWeixinRedirectURL(`${this.api}?m=ssr_hub`));
    return this.fetchNextOpenIDFromRequest();
  };

  public finishQRSign = async (qrSignUrl: string) => {
    await this.throttle;
    // const url = generateOpenWeixinRedirectURL(
    //   `${this.api}?isTeacher=0&m=s_qr_sign&extra=${qrSignId}`
    // );
    this.navigateTo(qrSignUrl);
    const resultUrl = await this.waitForNextRequestUrl('signresult?openid=');
    const result = urlParamsToObject(resultUrl.split('?').pop()!) as Record<
      'openid' | 'success' | 'signRank' | 'studentRank',
      string
    >;
    return {
      success: result.success === '1',
      openId: result.openid,
      rank: +result.studentRank,
    };
  };
}

// (async () => {
//   const devtool = new WechatDevtools();
//   await devtool.init();
//   // console.log(await devtool.generateOpenId());
//   await devtool.navigateTo("");
//   await devtool.destroy();
// })();
