import express from "express";
import { getInfoScreenData } from "lib/infoscreen";

/*
 * "/" here represents "/init"
 */

const router = express.Router();
router.get("/infoScreenData", getInfoScreenData);

export default router;
