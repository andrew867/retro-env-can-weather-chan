import fs from "fs";
import Logger from "lib/logger";

const INFOSCREEN_PATH = {
  FOLDER: "./cfg",
  FILE: "infoscreen.txt",
};
const INFOSCREEN_ABSOLUTE_PATH = `${INFOSCREEN_PATH.FOLDER}/${INFOSCREEN_PATH.FILE}`;
const logger = new Logger("infoscreen");

export class InfoScreen {
  private _messages: string[] | null = [];

  public toJSON() {
    return {messages: this.messages};
  }

  constructor() {
    try {
      if (process.env.NODE_ENV === "test") {
        this._messages = null;
        return;
      }
      this.messages = this.loadInfoScreenMessages();
    } catch (err) {
      logger.error("Constructor error:", err);
      this._messages = null;
    }
  }

  get messages(): string[] | null {
    return this._messages;
  }

  set messages(data: string[] | null) {
    if (data == null) {
      this._messages = null;
      logger.log("Messages set to null");
    } else if (!Array.isArray(data)) {
      logger.error("Invalid messages data: not an array");
      return;
    } else {
      // Filter out non-string elements
      const validMessages = data.filter((msg): msg is string => typeof msg === "string");
      if (!validMessages.length) {
        this._messages = null;
        logger.log("No valid messages, set to null");
      } else {
        this._messages = validMessages
          .map((message) => message.trim())
          .filter((message) => message.length);
        logger.log("Set messages:", this._messages);
      }
    }
    try {
      this.saveInfoScreenMessages(this._messages);
    } catch (err) {
      logger.error("Error saving messages:", err);
    }
  }

  get InfoScreen() {
    return {
      messages: this.messages,
    };
  }

  set InfoScreen(data: { messages?: unknown }) {
    try {
      if (data.messages != null) {
        if (!Array.isArray(data.messages)) {
          logger.error("Invalid InfoScreen.messages: not an array");
          return;
        }
        this._messages = data.messages;
      }
    } catch (err) {
      logger.error("Error in InfoScreen setter:", err);
    }
  }

  private loadInfoScreenMessages(): string[] | null {
    logger.log("Loading InfoScreen messages from", INFOSCREEN_ABSOLUTE_PATH);
    try {
      const data = fs.readFileSync(INFOSCREEN_ABSOLUTE_PATH, "utf8");
      const messages = data
        .split("\n")
        .map((message) => message.trim())
        .filter((message) => message.length);
      logger.log("Loaded", messages.length, "InfoScreen messages:", messages);
      return messages.length ? messages : null;
    } catch (err) {
      if (err.code === "ENOENT") {
        logger.error("No InfoScreen file found");
        return null;
      } else {
        logger.error("Unable to load from InfoScreen file:", err);
        return null;
      }
    }
  }

  private saveInfoScreenMessages(messages: string[] | null) {
    logger.log("Saving InfoScreen messages to", INFOSCREEN_ABSOLUTE_PATH);
    try {
      if (messages == null) {
        logger.log("No messages to save (null) creating empty file");
        fs.mkdirSync(INFOSCREEN_PATH.FOLDER, { recursive: true });
        fs.writeFileSync(INFOSCREEN_ABSOLUTE_PATH, "", "utf8");
        return;
      }
      fs.mkdirSync(INFOSCREEN_PATH.FOLDER, { recursive: true });
      fs.writeFileSync(INFOSCREEN_ABSOLUTE_PATH, messages.join("\n"), "utf8");
      logger.log("Saved", messages.length, "InfoScreen messages");
    } catch (err) {
      if (err.code === "ENOENT") {
        logger.error("No InfoScreen file found");
      } else {
        logger.error("Unable to save to InfoScreen file:", err);
      }
    }
  }

}

let infoscreen: InfoScreen = null;
export function initializeInfoScreen(): InfoScreen {
  if (infoscreen) return infoscreen;
  infoscreen = new InfoScreen();
  return infoscreen;
}