import { Request, Response } from "express";
import { initializeInfoScreen } from "./infoscreen";

export function getInfoScreenData(req: Request, res: Response) {
  res.json(initializeInfoScreen());
}