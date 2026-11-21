/**
 * Один Remotion-проект на все ролики канала.
 * publicDir = reels/, поэтому ассеты ролика лежат в reels/<id>/public/
 * и подключаются как staticFile("<id>/public/<file>").
 */
import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setDefaultPremountInSeconds(2);
Config.setPublicDir("reels");
Config.setEntryPoint("src/index.ts");
// В облачном контейнере Chrome не скачивается — используем предустановленный headless shell.
// Локально у Атаке строку можно удалить (Remotion скачает свой браузер сам).
if (require("fs").existsSync("/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell")) {
  Config.setBrowserExecutable("/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell");
}
