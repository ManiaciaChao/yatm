import { readFileSync } from "fs";
import { join } from "path";

const configFile = readFileSync(join("./", "config.json"));
export const config = JSON.parse(configFile.toString());
