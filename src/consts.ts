import { readFileSync } from 'fs';
import { join } from 'path';
import { IWechatDevtoolOptions } from './cdp';
interface IConfig {
  interval: number; // ms
  wait: number; // ms
  lat: number;
  lon: number;
  ua?: string;
  clipboard?: {
    paste: string;
    copy: string;
  };
  devtools?: Partial<IWechatDevtoolOptions>;
  verbose?: boolean;
  qr: {
    mode: 'terminal' | 'plain' | 'copy';
  };
}

const configFile = readFileSync(join('./', 'config.json'));
export const config: IConfig = JSON.parse(configFile.toString());

export const {
  qr = {
    name: '',
    mode: 'terminal',
    copyCmd: undefined,
  },
  devtools,
} = config;

export const userAgent =
  config.ua ??
  `Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.116 Safari/537.36 QBCore/4.0.1326.400 QQBrowser/9.0.2524.400 Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2875.116 Safari/537.36 NetType/WIFI MicroMessenger/7.0.20.1781(0x6700143B) WindowsWechat(0x63010200)`;

export const CHECK_ALIVE_INTERVAL = 4; // request `/role` per a given amount of `/active_signs`
