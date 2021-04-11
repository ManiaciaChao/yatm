"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkInvaild = exports.signIn = exports.activeSign = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const consts_1 = require("./consts");
const baseHeaders = {
    "User-Agent": consts_1.userAgent,
    "Content-Type": "application/json",
    Accept: "*/*",
    "Accept-Language": "zh-CN,en-US;qbaseHeaders=0.7,en;q=0.3",
};
const request = (url, init) => node_fetch_1.default(url, init).then((data) => data.json());
exports.activeSign = (openId) => request("https://v18.teachermate.cn/wechat-api/v1/class-attendance/student/active_signs", {
    headers: {
        ...baseHeaders,
        openId,
        "If-None-Match": '"38-djBNGTNDrEJXNs9DekumVQ"',
        Referrer: `https://v18.teachermate.cn/wechat-pro-ssr/student/sign?openid=${openId}`,
    },
    method: "GET",
});
exports.signIn = (openId, query) => request("https://v18.teachermate.cn/wechat-api/v1/class-attendance/student-sign-in", {
    headers: {
        ...baseHeaders,
        openId,
        Referrer: `https://v18.teachermate.cn/wechat-pro-ssr/student/sign?openid=${openId}`,
    },
    body: JSON.stringify(query),
    method: "POST",
});
const studentsRole = (openId) => request("https://v18.teachermate.cn/wechat-api/v2/students/role", {
    headers: {
        ...baseHeaders,
        openid: openId,
        Referrer: `https://v18.teachermate.cn/wechat-pro/student/archive/lists?openid=${openId}`,
    },
    method: "GET",
});
exports.checkInvaild = async (openId) => {
    const data = await studentsRole(openId);
    return "message" in data || data.length === 0;
};
