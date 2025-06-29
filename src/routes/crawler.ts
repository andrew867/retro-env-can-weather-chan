import express from "express";
import { getCrawlerMessages } from "lib/config";

/*
 * "/" here represents "/init"
 */

const router = express.Router();
router.get("/crawlerMessages", getCrawlerMessages);

export default router;
