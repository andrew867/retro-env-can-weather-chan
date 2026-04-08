import express from "express";
import { getInitHandler, getInitStreamHandler } from "lib/config";

/*
 * "/" here represents "/init"
 */

const router = express.Router();
router.get("/", getInitHandler);
router.get("/stream", getInitStreamHandler);

export default router;
