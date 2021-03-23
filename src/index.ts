import { question } from "readline-sync";
import { notify } from "node-notifier";
import { env } from "process";
import {
  activeSign,
  checkInvaild,
  ISignInQuery,
  signIn,
} from "./requests";
import { CHECK_ALIVE_INTERVAL, config } from "./consts";
import { QRSign } from "./QRSign";
import { sleep } from "./utils";

const extractOpenId = (str: string) =>
  str.length === 32 ? str : str.match("openid=(.*?)(?=&|$)")?.[1];
const sendNotificaition = (message: string) =>
  notify({ message, title: "yatm" });

const openId = extractOpenId(
  env.OPEN_ID ?? question("Paste openId or URL here: ")
);
const signedIdSet = new Set<number>();

if (!openId) {
  throw "Error: invalid openId or URL";
}

let lastSignId = 0;
let qrSign: QRSign;

const main = async () => {
  return await activeSign(openId)
    .then(async (data) => {
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
          const result = await qrSign.start();
          const prompt =
            "Signed in successfully. However, you need to re-run this script with NEW openid!";

          console.log(result);
          signedIdSet.add(signId);

          sendNotificaition(prompt);
          console.warn(prompt);
          process.exit(0);
        } else {
          let signInQuery: ISignInQuery = { courseId, signId };
          if (isGPS) {
            const { lat, lon } = config;
            signInQuery = { ...signInQuery, lat, lon };
          }
          await sleep(config.wait);
          await signIn(openId, signInQuery)
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
};

(async () => {
  for (let i = 0; ; i = (i + 1) % CHECK_ALIVE_INTERVAL) {
    if (i === 0 && (await checkInvaild(openId))) {
      sendNotificaition(`Error: expired or invaild openId`);
      break;
    }
    await main();
    await sleep(config.interval);
  }
})();
