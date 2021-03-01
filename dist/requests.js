"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signIn = exports.activeSign = void 0;
var node_fetch_1 = __importDefault(require("node-fetch"));
var consts_1 = require("./consts");
var baseHeaders = {
    "User-Agent": consts_1.userAgent,
    Accept: "*/*",
    "Accept-Language": "zh-CN,en-US;q=0.7,en;q=0.3",
};
exports.activeSign = function (openId) {
    return node_fetch_1.default("https://v18.teachermate.cn/wechat-api/v1/class-attendance/student/active_signs", {
        headers: __assign(__assign({}, baseHeaders), { "Content-Type": "application/json", openId: openId, "If-None-Match": '"38-djBNGTNDrEJXNs9DekumVQ"', Referrer: "https://v18.teachermate.cn/wechat-pro-ssr/student/sign?openid=" + openId }),
        method: "GET",
    });
};
exports.signIn = function (openId, query) {
    return node_fetch_1.default("https://v18.teachermate.cn/wechat-api/v1/class-attendance/student-sign-in", {
        headers: __assign(__assign({}, baseHeaders), { "Content-Type": "application/json", openId: openId, Referrer: "https://v18.teachermate.cn/wechat-pro-ssr/student/sign?openid=" + openId }),
        body: JSON.stringify(query),
        method: "POST",
    });
};
// export const tryShortenURL = async (url: string) => {
//   try {
//     const resp = await fetch(
//       `https://v1.alapi.cn/api/url?url=${encodeURIComponent(url)}`
//     );
//     const json = await resp.json();
//     return json.data.short_url;
//   } catch (err) {
//     console.log(err)
//     return url;
//   }
// };
