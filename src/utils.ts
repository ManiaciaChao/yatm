import { execSync } from 'child_process';
import { notify } from 'node-notifier';
import { config, qr } from './consts';

const placeholder = '{}';
export const copyToClipBoard = (text?: string) => {
  if (!text || !config.clipboard?.copy) return;
  const copyCmd = config.clipboard.copy;
  if (copyCmd.includes(placeholder)) {
    execSync(copyCmd.replace(placeholder, `"${text}"`));
  } else {
    throw 'wrong format for copyCmd!';
  }
};

export const pasteFromClipBoard = () => {
  if (!config.clipboard?.paste) {
    return '';
  }
  const pasteCmd = config.clipboard.paste;
  return execSync(pasteCmd).toString();
};

export const sleep = (ms: number) =>
  new Promise((reslove) => {
    setTimeout(reslove, ms);
  });

export const extractOpenId = (str: string) =>
  str.length === 32 ? str : str.match('openid=(.*?)(?=&|$)')?.[1];

export const sendNotificaition = (message: string) =>
  notify({ message, title: 'yatm' });

export const urlParamsToObject = (urlParams: string) =>
  Object.fromEntries(new URLSearchParams(urlParams));

// verbose
export const debugLogger = (...args: any[]) =>
  config.verbose && console.debug(...args);

export const makeDebugLogger = (prefix: string) => (...args: any[]) =>
  debugLogger(prefix, ...args);
