import { execSync } from 'child_process';
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

export const pasteFromClipBoard = (): string => {
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
