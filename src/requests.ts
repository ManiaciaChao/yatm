import fetch from "node-fetch";

export interface IActiveSignResp {
  courseId: number;
  signId: number;
  isGPS?: 1 | 0;
  isQR?: 1 | 0;
}

export const activeSign = (openId: string) =>
  fetch(
    "https://v18.teachermate.cn/wechat-api/v1/class-attendance/active_sign",
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (X11; Linux x86_64; rv:80.0) Gecko/20100101 Firefox/80.0",
        Accept: "*/*",
        "Accept-Language": "zh-CN,en-US;q=0.7,en;q=0.3",
        "Content-Type": "application/json",
        openId,
        "If-None-Match": '"38-djBNGTNDrEJXNs9DekumVQ"',
        Referrer:
          "https://v18.teachermate.cn/wechat-pro-ssr/student/sign?openid=613600e8b9693641a8f6237ec44c20cf",
      },
      method: "GET",
    }
  );

export interface ISignInQuery {
  courseId: number;
  signId: number;
  lon?: number;
  lat?: number;
}

export const signIn = (openId: string, query: ISignInQuery) =>
  fetch(
    "https://v18.teachermate.cn/wechat-api/v1/class-attendance/student-sign-in",
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (X11; Linux x86_64; rv:80.0) Gecko/20100101 Firefox/80.0",
        Accept: "*/*",
        "Accept-Language": "zh-CN,en-US;q=0.7,en;q=0.3",
        "Content-Type": "application/json",
        openId,
        Referrer:
          "https://v18.teachermate.cn/wechat-pro-ssr/student/sign?openid=613600e8b9693641a8f6237ec44c20cf",
      },
      body: JSON.stringify(query),
      method: "POST",
    }
  );