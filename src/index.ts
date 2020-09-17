import { activeSign, IActiveSignResp, ISignInQuery, signIn } from "./requests";
import { question } from "readline-sync";
import { config } from "./consts";

const extractOpenId = (str: string) =>
  str.length === 32 ? str : str.match("openid=(.*)(?=&)")?.[1];

const openId = extractOpenId(question("Paste openId or URL here: "));
const signIdSet = new Set<number>();

if (openId) {
  setInterval(() => {
    activeSign(openId)
      .then((data) => data.json())
      .then((data: IActiveSignResp) => {
        const { signId, courseId, isGPS, isQR } = data;
        if (!courseId || !signId) {
          throw "No sign available";
        }
        if (signIdSet.has(signId)) {
          throw "already signed";
        }
        console.log("current sign:", data);
        let signInQuery: ISignInQuery = { courseId, signId };
        if (data.isGPS) {
          signInQuery = { ...signInQuery, lat: 30, lon: 30 };
        }
        signIn(openId, signInQuery)
          .then((data) => data.json())
          .then((data) => {
            if (!data.errorCode || data.errorCode === 305) {
              signIdSet.add(signId);
            }
            console.log(data);
          });
      })
      .catch((e) => console.log(e));
  }, config.interval);
}
