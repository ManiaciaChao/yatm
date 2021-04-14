"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const readline_sync_1 = require("readline-sync");
const process_1 = require("process");
const requests_1 = require("./requests");
const consts_1 = require("./consts");
const QRSign_1 = require("./QRSign");
const utils_1 = require("./utils");
const getOpenId = async () => {
    let openId;
    if (consts_1.config.clipboard?.paste) {
        while (true) {
            openId = utils_1.extractOpenId(utils_1.pasteFromClipBoard());
            if (openId) {
                if (openIdSet.has(openId)) {
                    continue;
                }
                openIdSet.add(openId);
                break;
            }
            await utils_1.sleep(consts_1.config.wait);
        }
    }
    else {
        openId = utils_1.extractOpenId(process_1.env.OPEN_ID ?? readline_sync_1.question('Paste openId or URL here: '));
    }
    if (!openId) {
        throw 'Error: invalid openId or URL';
    }
    return openId;
};
const signedIdSet = new Set();
const openIdSet = new Set();
let lastSignId = 0;
let qrSign;
const main = async (openId) => {
    return await requests_1.activeSign(openId)
        .then(async (data) => {
        if (!data.length) {
            qrSign?.destory();
            throw 'No sign-in available';
        }
        const queue = [
            ...data.filter((sign) => !sign.isQR),
            ...data.filter((sign) => sign.isQR),
        ];
        for (const sign of queue) {
            const { signId, courseId, isGPS, isQR, name } = sign;
            console.log('current sign-in:', sign.name);
            if (signedIdSet.has(signId)) {
                throw `${name} already signed in`;
            }
            utils_1.sendNotificaition(`INFO: ${name} sign-in is going on!`);
            if (isQR) {
                if (signId === lastSignId) {
                    return;
                }
                lastSignId = signId;
                utils_1.sendNotificaition(`WARNING: ${name} QR sign-in is going on!`);
                qrSign?.destory();
                qrSign = new QRSign_1.QRSign({ courseId, signId });
                const result = await qrSign.start();
                const prompt = 'Signed in successfully. However, you need to submit new openid!';
                console.log(result);
                signedIdSet.add(signId);
                utils_1.sendNotificaition(prompt);
                console.warn(prompt);
                openId = '';
                // process.exit(0);
            }
            else {
                let signInQuery = { courseId, signId };
                if (isGPS) {
                    const { lat, lon } = consts_1.config;
                    signInQuery = { ...signInQuery, lat, lon };
                }
                await utils_1.sleep(consts_1.config.wait);
                await requests_1.signIn(openId, signInQuery)
                    .then((data) => {
                    if (!data.errorCode || data.errorCode === 305) {
                        signedIdSet.add(signId);
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
(async () => {
    let openId = '';
    for (;;) {
        if (!openId.length || (await requests_1.checkInvaild(openId))) {
            const prompt = 'Error: expired or invaild openId! Waiting for new openId from clipboard...';
            utils_1.sendNotificaition(prompt);
            console.warn(prompt);
            if (!openIdSet.has(openId)) {
                openIdSet.add(openId);
            }
            openId = await getOpenId();
        }
        await main(openId);
        await utils_1.sleep(consts_1.config.interval);
    }
})();
