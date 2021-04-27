"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WechatDevtools = void 0;
const CDP = require("chrome-remote-interface");
const consts_1 = require("./consts");
const utils_1 = require("./utils");
const baseConfig = {
    port: 8000,
    local: true,
    host: '127.0.0.1',
};
const generateOpenWeixinRedirectURL = (url) => `https://open.weixin.qq.com/connect/oauth2/authorize?appid=wxa153455f3ef1d9f9&redirect_uri=${url}&response_type=code&scope=snsapi_userinfo&state=#wechat_redirect`;
class WechatDevtools {
    constructor(options) {
        this._cdp = null;
        this.api = 'https://v18.teachermate.cn/api/v1/wechat/r';
        this.throttle = null;
        this.init = async () => {
            const { host, port, local } = this;
            this.cdp = await CDP({
                host,
                port,
                local,
                target: (targets) => {
                    const target = targets[0];
                    if (target) {
                        if (target.id && !target.webSocketDebuggerUrl) {
                            target.webSocketDebuggerUrl = `ws://${this.host}:${this.port}/devtools/page/${target.id}`;
                        }
                        return target;
                    }
                    else {
                        throw new Error('No inspectable targets');
                    }
                },
            });
            const { Network, Page, Runtime } = this.cdp;
            await Network.enable();
            await Page.enable();
            await this.cdp.Network.setUserAgentOverride({ userAgent: consts_1.userAgent });
            return this.cdp;
        };
        this.destroy = () => this.cdp?.close();
        this.navigateTo = (url) => this.cdp.Page.navigate({
            url,
        });
        this.fetchNextOpenIDFromRequest = (filter = 'openid=') => this.waitForNextRequestUrl(filter).then(utils_1.extractOpenId);
        this.waitForNextRequestUrl = (filter) => new Promise((resolve) => {
            const cleaner = this.cdp.Network.requestWillBeSent((params) => {
                const url = params.request.url;
                if (url.includes(filter)) {
                    this.throttle = utils_1.sleep(10 * 1000);
                    cleaner();
                    resolve(url);
                }
            });
        });
        this.generateOpenId = async () => {
            await this.throttle;
            this.navigateTo(generateOpenWeixinRedirectURL(`${this.api}?m=ssr_hub`));
            return this.fetchNextOpenIDFromRequest();
        };
        this.finishQRSign = async (qrSignUrl) => {
            await this.throttle;
            // const url = generateOpenWeixinRedirectURL(
            //   `${this.api}?isTeacher=0&m=s_qr_sign&extra=${qrSignId}`
            // );
            this.navigateTo(qrSignUrl);
            const resultUrl = await this.waitForNextRequestUrl('signresult?openid=');
            const result = utils_1.urlParamsToObject(resultUrl.split('?').pop());
            return {
                success: result.success === '1',
                openId: result.openid,
                rank: +result.studentRank,
            };
        };
        const opt = { ...baseConfig, ...options };
        this.host = opt.host;
        this.port = opt.port;
        this.local = opt.local;
    }
    get cdp() {
        if (!this._cdp)
            throw 'cdp: uninitialized';
        return this._cdp;
    }
    set cdp(val) {
        if (this._cdp)
            throw 'cdp: already connected';
        this._cdp = val;
    }
}
exports.WechatDevtools = WechatDevtools;
// (async () => {
//   const devtool = new WechatDevtools();
//   await devtool.init();
//   // console.log(await devtool.generateOpenId());
//   await devtool.navigateTo("");
//   await devtool.destroy();
// })();
