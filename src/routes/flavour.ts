import express from "express";
import { initializeConfig } from "lib/config";
import { putFlavourHandler, getFlavourHandler, safeFlavourName, saveFlavour } from "lib/flavour";
import { Flavour } from "types";

/*
 * "/" here represents "/flavour"
 */

const config = initializeConfig();
const router = express.Router();
router.put("/", (req, res) => {
  const createdFlavour = putFlavourHandler(req, res);
  if (!createdFlavour) return;
  config.regenerateAvailableFlavours();
  res.json({ flavour: createdFlavour, flavours: [...config.flavours, safeFlavourName(createdFlavour.name)] });
});
router.post("/", (req, res) => {
  const flavour = req?.body?.flavour;
  try {
    if (!flavour?.name?.length) throw "Flavour doesn't have a name";
    if (!flavour?.screens?.length) throw "Flavour doesn't have any screens";
    saveFlavour(flavour as Flavour);
    config.regenerateAvailableFlavours();
    res.status(200).json({ flavour, flavours: config.flavours });
  } catch (e) {
    res.status(500).json({ error: e });
  }
});
router.get("/:flavour", getFlavourHandler);

export default router;
