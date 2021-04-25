import { activeSign, ISignInQuery, signIn } from './requests';
import { config } from './consts';
import { QRSign } from './QRSign';
import { sendNotificaition, sleep } from './utils';
import { WechatDevtools } from './cdp';

export interface IContext {
  openId: string;
  studentName: string;
  devtools?: WechatDevtools;
  lastSignId: number;
  qrSign?: QRSign;
  signedIdSet: Set<number>;
  openIdSet: Set<string>;
}

export const signOnce = async (ctx: IContext) => {
  return await activeSign(ctx.openId)
    .then(async (data) => {
      if (!data.length) {
        ctx.qrSign?.destory();
        throw 'No sign-in available';
      }
      const queue = [
        ...data.filter((sign) => !sign.isQR),
        ...data.filter((sign) => sign.isQR),
      ];

      for (const sign of queue) {
        const { signId, courseId, isGPS, isQR, name } = sign;
        console.log('current sign-in:', sign.name);

        if (ctx.signedIdSet.has(signId)) {
          throw `${name} already signed in`;
        }

        sendNotificaition(`INFO: ${name} sign-in is going on!`);

        if (isQR) {
          if (signId === ctx.lastSignId) {
            return;
          }
          ctx.lastSignId = signId;
          sendNotificaition(`WARNING: ${name} QR sign-in is going on!`);
          ctx.qrSign?.destory();
          ctx.qrSign = new QRSign(ctx, { courseId, signId });
          ctx.qrSign.start().then((result) => {
            ctx.signedIdSet.add(signId);
            console.log(`QRSign:: result`, result);
            if (!config.devtools) {
              const prompt =
                'Signed in successfully. However, you need to submit new openid!';
              sendNotificaition(prompt);
              console.warn(prompt);
              ctx.openId = '';
            }
            ctx.qrSign?.destory();
          });
        } else {
          let signInQuery: ISignInQuery = { courseId, signId };
          if (isGPS) {
            const { lat, lon } = config;
            signInQuery = { ...signInQuery, lat, lon };
          }
          await sleep(config.wait);
          await signIn(ctx.openId, signInQuery)
            .then((data) => {
              if (!data.errorCode || data.errorCode === 305) {
                ctx.signedIdSet.add(signId);
              }
              console.log(data);
            })
            .catch((e) => {
              console.log(e);
              sendNotificaition(
                `Error: failed to ${name} sign in. See output plz.`
              );
            });
        }
      }
    })
    .catch((e) => {
      console.log(e);
    });
};
