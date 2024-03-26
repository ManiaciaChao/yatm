import { question } from 'readline-sync';
import { env } from 'process';
import { checkInvaild, getStudentName } from './requests';
import { config } from './consts';
import {
  extractOpenId,
  sendNotificaition,
  sleep,
  pasteFromClipBoard,
} from './utils';
import { WechatDevtools } from './cdp';
import { IContext, signOnce } from './sign';

const getOpenId = async ({ devtools, openIdSet }: IContext) => {
  let openId: string | undefined;
  if (devtools) {
    openId = await devtools.generateOpenId();
  } else if (config.clipboard?.paste) {
    while (true) {
      openId = extractOpenId(pasteFromClipBoard());
      if (openId) {
        if (openIdSet.has(openId)) {
          continue;
        }
        openIdSet.add(openId);
        break;
      }
      await sleep(config.wait);
    }
  } else {
    openId = extractOpenId(
      env.OPEN_ID ?? question('Paste openId or URL here: ')
    );
  }
  if (!openId) {
    throw 'Error: invalid openId or URL';
  }
  return openId;
};

(async () => {
  const ctx: IContext = {
    openId: '',
    studentName: '',
    lastSignId: 0,
    signedIdSet: new Set(),
    openIdSet: new Set(),
  };
  if (config.devtools) {
    ctx.devtools = new WechatDevtools(config.devtools);
    await ctx.devtools.init();
  }
  for (;;) {
    try {
      if (!ctx.openId.length || (await checkInvaild(ctx.openId))) {
        let prompt = 'Error: expired or invaild openId!';
        if (config.clipboard) {
          prompt = `${prompt} Waiting for new openId from clipboard...`;
        } else if (ctx.devtools) {
          prompt = `${prompt} Generating new openId via devtools...`;
        }
        sendNotificaition(prompt);
        console.warn(prompt);
        if (!ctx.openIdSet.has(ctx.openId)) {
          ctx.openIdSet.add(ctx.openId);
        }
        ctx.openId = await getOpenId(ctx);
        console.log('Applied new openId:', ctx.openId);
        ctx.studentName = await getStudentName(ctx.openId);
        console.log(ctx.studentName);
      }
      await signOnce(ctx);
      await sleep(config.interval);
    } catch (err) {
      console.warn('Error:', err);
    }
  }
})();
