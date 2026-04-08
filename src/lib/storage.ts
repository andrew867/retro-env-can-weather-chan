import fs from "fs";
import { rwcMinDiskFreeMib } from "consts/reliability.consts";
import Logger from "./logger";

const logger = new Logger("Storage");

const REQUIRED_DIRECTORIES = ["cfg", "cfg/flavours", "db", "music"];

export function validateDirectories() {
  logger.log("Validating directory structure");

  REQUIRED_DIRECTORIES.forEach((dir) => {
    const requiredDirectoryExists: boolean = fs.existsSync(dir);
    if (requiredDirectoryExists) return;

    logger.warn(`"${dir}" directory doesn\'t exist and will be created`);
    fs.mkdirSync(dir);
  });

  logger.log("Validated directory structure");
}

/** One-shot WARN when the working directory has less free space than `RWC_MIN_DISK_FREE_MIB` (requires Node `fs.statfsSync`). */
export function warnIfLowDiskFreeMib(): void {
  const minMib = rwcMinDiskFreeMib();
  if (minMib <= 0) return;

  const statfsSync = (fs as typeof fs & { statfsSync?: (path: string) => { bavail: number; bsize: number } })
    .statfsSync;
  if (typeof statfsSync !== "function") return;

  try {
    const s = statfsSync(".");
    const freeMib = (Number(s.bavail) * Number(s.bsize)) / (1024 * 1024);
    if (Number.isFinite(freeMib) && freeMib < minMib) {
      logger.warn(
        `Low disk space: ~${Math.round(freeMib)} MiB free (threshold ${minMib} MiB from RWC_MIN_DISK_FREE_MIB)`
      );
    }
  } catch {
    // ignore
  }
}
