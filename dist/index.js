"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const readline_sync_1 = require("readline-sync");
const process_1 = require("process");
const requests_1 = require("./requests");
const consts_1 = require("./consts");
const utils_1 = require("./utils");
const cdp_1 = require("./cdp");
const sign_1 = require("./sign");
const getOpenId = async ({ devtools, openIdSet }) => {
    let openId;
    if (devtools) {
        openId = await devtools.generateOpenId();
    }
    // else if (consts_1.config.clipboard?.paste) {
    //     while (true) {
    //         openId = utils_1.extractOpenId(utils_1.pasteFromClipBoard());
    //         if (openId) {
    //             if (openIdSet.has(openId)) {
    //                 continue;
    //             }
    //             openIdSet.add(openId);
    //             break;
    //         }
    //         await utils_1.sleep(consts_1.config.wait);
    //     }
    // }
    else {
        openId = utils_1.extractOpenId(process_1.env.OPEN_ID ?? readline_sync_1.question('Paste openId or URL here: '));
    }
    if (!openId) {
        throw 'Error: invalid openId or URL';
    }
    return openId;
};
(async () => {
    const ctx = {
        openId: '',
        studentName: '',
        lastSignId: 0,
        signedIdSet: new Set(),
        openIdSet: new Set(),
    };
    if (consts_1.config.devtools) {
        ctx.devtools = new cdp_1.WechatDevtools();
        await ctx.devtools.init();
    }
    for (;;) {
        try {
            if (!ctx.openId.length || (await requests_1.checkInvaild(ctx.openId))) {
                let prompt = 'Error: expired or invaild openId!';
                if (consts_1.config.clipboard) {
                    prompt = `${prompt} Waiting for new openId from clipboard...`;
                }
                else if (ctx.devtools) {
                    prompt = `${prompt} Generating new openId via devtools...`;
                }
                utils_1.sendNotificaition(prompt);
                console.warn(prompt);
                if (!ctx.openIdSet.has(ctx.openId)) {
                    ctx.openIdSet.add(ctx.openId);
                }
                ctx.openId = await getOpenId(ctx);
                console.log('Applied new openId:', ctx.openId);
                ctx.studentName = await requests_1.getStudentName(ctx.openId);
                console.log(ctx.studentName);
            }
            await sign_1.signOnce(ctx);
            await utils_1.sleep(consts_1.config.interval);
        }
        catch (err) {
            console.warn('Error:', err);
        }
    }
})();
