import { question } from "readline-sync";
import { notify } from "node-notifier";
import { env } from "process";
import { activeSign, IActiveSignResp, ISignInQuery, signIn } from "./requests";
import { config } from "./consts";
import { QRSign } from "./QRSign";

const extractOpenId = (str: string) =>
  str.length === 32 ? str : str.match("openid=(.*)(?=&)")?.[1];
const sendNotificaition = (message: string) =>
  notify({ message, title: "yatm" });

const openId = extractOpenId(
  env.OPEN_ID ? env.OPEN_ID : question("Paste openId or URL here: ")
);
const signedIdSet = new Set<number>();

let lastSignId = 0;
let qrSign: QRSign;

if (openId) {
  setInterval(() => {
    activeSign(openId)
      .then((data) => data.json())
      .then((data: IActiveSignResp) => {
        const { signId, courseId, isGPS, isQR } = data;
        if (!courseId || !signId) {
          qrSign?.destory();
          throw "No sign-in available";
        }
        if (signedIdSet.has(signId)) {
          throw "already signed in";
        }

        sendNotificaition("Info: a sign-in is going on!");

        if (isQR) {
          if (signId === lastSignId) {
            return;
          }
          lastSignId = signId;
          sendNotificaition("WARNING: QR sign-in is going on!");
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
          console.log("current sign-in:", data);
          let signInQuery: ISignInQuery = { courseId, signId };
          if (isGPS) {
            signInQuery = { ...signInQuery, lat: 30, lon: 30 };
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
              sendNotificaition("Error: failed to sign in. See output plz.");
            });
        }
      })
      .catch((e) => {
        console.log(e);
      });
  }, config.interval);
}
