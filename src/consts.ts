import { readFileSync } from 'fs';
import { join } from 'path';

interface IDevtoolsConfig {
  host?: string;
  port?: number;
  local?: boolean;
}
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
  devtools?: IDevtoolsConfig;
  verbose?: boolean;
  qr: {
    name?: string;
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
  `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4427.5 Safari/537.36`;

export const CHECK_ALIVE_INTERVAL = 4; // request `/role` per a given amount of `/active_signs`
