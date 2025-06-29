import fs from "fs";
import Logger from "lib/logger";

const CRAWLER_DEFAULT_SPEED = 125;
const CRAWLER_PATH = {
    FOLDER: "./cfg",
    FILE: "crawler.txt",
  };
const CRAWLER_ABSOLUTE_PATH = `${CRAWLER_PATH.FOLDER}/${CRAWLER_PATH.FILE}`;
const logger = new Logger("crawler");

export class Crawler {
    messages: string[] = [];
    speed: number = CRAWLER_DEFAULT_SPEED;

    constructor() {
      try {
        this.messages = this.loadCrawlerMessages();
      } catch (err){
        this.messages = null;
      }
    }
    
    get crawler() {
      return {
          messages: this.messages,
          speed: this.speed,
      };
    }

    set crawler(data: any) {
      try {
        this.setCrawlerMessages(data.messages);
      } catch (err){
        return;
      }
    }

    private loadCrawlerMessages(): string[] {
      logger.log("Loading crawler messages from", CRAWLER_ABSOLUTE_PATH);
      try {
        const data = fs.readFileSync(CRAWLER_ABSOLUTE_PATH, "utf8");
        const messages = data
          .split("\n")
          .map((message) => message.trim())
          .filter((message) => message.length);
        logger.log("Loaded", messages.length, "crawler messages");
        return messages;
      } catch (err) {
        if (err.code === "ENOENT") {
          // handle no file found
          logger.error("No crawler file found");
          return null;
        } else {
          // handle any other error
          logger.error("Unable to load from crawler file");
          return null;
        }
      }
    }
    
    private saveCrawlerMessages(messages: string[]) {
      logger.log("Saving crawler messages to", CRAWLER_ABSOLUTE_PATH);
      try {
          fs.writeFileSync(CRAWLER_ABSOLUTE_PATH, messages.join("\n"), "utf8");
          logger.log("Saved", messages.length, "crawler messages");
      } catch (err) {
          if (err.code === "ENOENT") {
              // handle no file found
              logger.error("No crawler file found");
          } else {
              // handle any other error
              logger.error("Unable to save to crawler file");
          }
      }
    }
    
    private setCrawlerMessages(crawler: string[]) {
      this.messages.splice(
        0,
        this.messages.length,
        ...crawler.map((message) => message.trim()).filter((message) => message.length)
      );
      this.saveCrawlerMessages(this.messages);
    }
}


let crawler: Crawler = null;
export function initializeCrawler(): Crawler {
  if (process.env.NODE_ENV === "test") return new Crawler();
  if (crawler) return crawler;

  crawler = new Crawler();
  return crawler;
}
