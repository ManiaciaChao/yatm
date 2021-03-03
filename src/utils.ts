import { exec } from "child_process";
import { qr } from "./consts";

const placeholder = "{}";
export const copyToPasteBoard = (text?: string) => {
  if (!text) return;
  if (qr.copyCmd?.includes(placeholder)) {
    exec(qr.copyCmd.replace(placeholder, `"${text}"`), (err, stdout, stderr) => {
      if (err || stderr) {
        throw err || stderr;
      }
    });
  } else {
    throw "wrong format for copyCmd!";
  }
};
