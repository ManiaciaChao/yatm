import { question } from "readline-sync";
import { notify } from "node-notifier";
import { env } from "process";
import { activeSign, ActiveSignResp, ISignInQuery, signIn } from "./requests";
import { config } from "./consts";
import { QRSign } from "./QRSign";
const extractOpenId = (str: string) =>
  str.length === 32 ? str : str.match("openid=(.*?)(?=&|$)")?.[1];
const sendNotificaition = (message: string) =>
  notify({ message, title: "yatm" });

const openId = extractOpenId(
  env.OPEN_ID ?? question("Paste openId or URL here: ")
);
const signedIdSet = new Set<number>();

let lastSignId = 0;
let qrSign: QRSign;

if (openId) {
  setInterval(() => {
    activeSign(openId)
      .then((data) => data.json())
      .then((data: ActiveSignResp) => {
        if (!data.length) {
          qrSign?.destory();
          throw "No sign-in available";
        }
        const queue = [
          ...data.filter((sign) => !sign.isQR),
          ...data.filter((sign) => sign.isQR),
        ];

        for (const sign of queue) {
          const { signId, courseId, isGPS, isQR, name } = sign;
          console.log("current sign-in:", sign.name);

          if (signedIdSet.has(signId)) {
            throw `${name} already signed in`;
          }

          sendNotificaition(`INFO: ${name} sign-in is going on!`);

          if (isQR) {
            if (signId === lastSignId) {
              return;
            }
            lastSignId = signId;
            sendNotificaition(`WARNING: ${name} QR sign-in is going on!`);
            qrSign?.destory();
            qrSign = new QRSign({ courseId, signId });
            qrSign.start((result) => {
              const prompt =
                "Signed in successfully. However, you need to re-run this script with NEW openid!";

              console.log(result);
              signedIdSet.add(signId);

              sendNotificaition(prompt);
              console.warn(prompt);
              process.exit(0);
            });
          } else {
            let signInQuery: ISignInQuery = { courseId, signId };
            if (isGPS) {
              const { lat, lon } = config;
              signInQuery = { ...signInQuery, lat, lon };
            }
            signIn(openId, signInQuery)
              .then((data) => data.json())
              .then((data) => {
                if (!data.errorCode || data.errorCode === 305) {
                  signedIdSet.add(signId);
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
  }, config.interval);
} else {
  throw 'Error: invalid openId or URL';
}
