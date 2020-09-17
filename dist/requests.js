"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signIn = exports.activeSign = void 0;
var node_fetch_1 = __importDefault(require("node-fetch"));
exports.activeSign = function (openId) {
    return node_fetch_1.default("https://v18.teachermate.cn/wechat-api/v1/class-attendance/active_sign", {
        headers: {
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:80.0) Gecko/20100101 Firefox/80.0",
            Accept: "*/*",
            "Accept-Language": "zh-CN,en-US;q=0.7,en;q=0.3",
            "Content-Type": "application/json",
            openId: openId,
            "If-None-Match": '"38-djBNGTNDrEJXNs9DekumVQ"',
            Referrer: "https://v18.teachermate.cn/wechat-pro-ssr/student/sign?openid=613600e8b9693641a8f6237ec44c20cf",
        },
        method: "GET",
    });
};
exports.signIn = function (openId, query) {
    return node_fetch_1.default("https://v18.teachermate.cn/wechat-api/v1/class-attendance/student-sign-in", {
        headers: {
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:80.0) Gecko/20100101 Firefox/80.0",
            Accept: "*/*",
            "Accept-Language": "zh-CN,en-US;q=0.7,en;q=0.3",
            "Content-Type": "application/json",
            openId: openId,
            Referrer: "https://v18.teachermate.cn/wechat-pro-ssr/student/sign?openid=613600e8b9693641a8f6237ec44c20cf",
        },
        body: JSON.stringify(query),
        method: "POST",
    });
};
