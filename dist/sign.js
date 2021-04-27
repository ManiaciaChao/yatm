"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signOnce = void 0;
const requests_1 = require("./requests");
const consts_1 = require("./consts");
const QRSign_1 = require("./QRSign");
const utils_1 = require("./utils");
exports.signOnce = async (ctx) => {
    return await requests_1.activeSign(ctx.openId)
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
            utils_1.sendNotificaition(`INFO: ${name} sign-in is going on!`);
            if (isQR) {
                if (signId === ctx.lastSignId) {
                    return;
                }
                ctx.lastSignId = signId;
                utils_1.sendNotificaition(`WARNING: ${name} QR sign-in is going on!`);
                ctx.qrSign?.destory();
                ctx.qrSign = new QRSign_1.QRSign(ctx, { courseId, signId });
                ctx.qrSign.start().then((result) => {
                    ctx.signedIdSet.add(signId);
                    console.log(`QRSign:: result`, result);
                    if (!consts_1.config.devtools) {
                        const prompt = 'Signed in successfully. However, you need to submit new openid!';
                        utils_1.sendNotificaition(prompt);
                        console.warn(prompt);
                        ctx.openId = '';
                    }
                    ctx.qrSign?.destory();
                });
            }
            else {
                let signInQuery = { courseId, signId };
                if (isGPS) {
                    const { lat, lon } = consts_1.config;
                    signInQuery = { ...signInQuery, lat, lon };
                }
                await utils_1.sleep(consts_1.config.wait);
                await requests_1.signIn(ctx.openId, signInQuery)
                    .then((data) => {
                    if (!data.errorCode || data.errorCode === 305) {
                        ctx.signedIdSet.add(signId);
                    }
                    console.log(data);
                })
                    .catch((e) => {
                    console.log(e);
                    utils_1.sendNotificaition(`Error: failed to ${name} sign in. See output plz.`);
                });
            }
        }
    })
        .catch((e) => {
        console.log(e);
    });
};
