import { Request, Response } from "express";
import { initializeCrawler } from "./crawler";

const crawler = initializeCrawler();

export function getCrawlerData(req: Request, res: Response) {
  res.json(crawler);
}