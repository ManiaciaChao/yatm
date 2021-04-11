"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const readline_sync_1 = require("readline-sync");
const node_notifier_1 = require("node-notifier");
const process_1 = require("process");
const requests_1 = require("./requests");
const consts_1 = require("./consts");
const QRSign_1 = require("./QRSign");
const utils_1 = require("./utils");
const extractOpenId = (str) => str.length === 32 ? str : str.match('openid=(.*?)(?=&|$)')?.[1];
const sendNotificaition = (message) => node_notifier_1.notify({ message, title: 'yatm' });
const getOpenId = async () => {
    let openId;
    if (consts_1.config.clipboard?.paste) {
        while (1) {
            const str = utils_1.pasteFromClipBoard();
            openId = extractOpenId(str);
            if (openId) {
                openId = extractOpenId(str);
                break;
            }
            await utils_1.sleep(consts_1.config.wait);
        }
    }
    else {
        openId = extractOpenId(process_1.env.OPEN_ID ?? readline_sync_1.question('Paste openId or URL here: '));
    }
    if (!openId) {
        throw 'Error: invalid openId or URL';
    }
    return openId;
};
const signedIdSet = new Set();
let lastSignId = 0;
let qrSign;
const main = async () => {
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
            sendNotificaition(`INFO: ${name} sign-in is going on!`);
            if (isQR) {
                if (signId === lastSignId) {
                    return;
                }
                lastSignId = signId;
                sendNotificaition(`WARNING: ${name} QR sign-in is going on!`);
                qrSign?.destory();
                qrSign = new QRSign_1.QRSign({ courseId, signId });
                const result = await qrSign.start();
                const prompt = 'Signed in successfully. However, you need to submit new openid!';
                console.log(result);
                signedIdSet.add(signId);
                sendNotificaition(prompt);
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
                    sendNotificaition(`Error: failed to ${name} sign in. See output plz.`);
                });
            }
        }
    })
        .catch((e) => {
        console.log(e);
    });
};
let openId = '';
(async () => {
    openId = await getOpenId();
    for (;;) {
        if (!openId.length || (await requests_1.checkInvaild(openId))) {
            openId = await getOpenId();
            // const prompt = `Error: expired or invaild openId`;
            // sendNotificaition(prompt);
            // throw prompt;
        }
        await main();
        await utils_1.sleep(consts_1.config.interval);
    }
})();
