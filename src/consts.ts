import { readFileSync } from "fs";
import { join } from "path";

interface IConfig {
  interval: number, // ms
  wait: number, // ms
  lat: number,
  lon: number,
  name?: string,
  ua?: string,
}

const configFile = readFileSync(join("./", "config.json"));
export const config: IConfig = JSON.parse(configFile.toString());

export const userAgent =
  config.ua ??
  `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4427.5 Safari/537.36`;
