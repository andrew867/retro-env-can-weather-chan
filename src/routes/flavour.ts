import express from "express";
import { initializeConfig } from "lib/config";
import {
  putFlavourHandler,
  getFlavourHandler,
  safeFlavourName,
  saveFlavour,
  deleteFlavourJsonFile,
} from "lib/flavour";
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
router.delete("/:flavour", (req, res) => {
  const raw = req.params.flavour ?? "";
  const safe = safeFlavourName(raw);
  if (!safe.length) {
    res.status(400).json({ error: "Missing flavour name" });
    return;
  }
  const removed = deleteFlavourJsonFile(safe);
  if (!removed) {
    res.status(404).json({ error: "Flavour not found" });
    return;
  }
  if (config.lookAndFeel.flavour === safe) {
    config.updateAndSaveConfigOption(() => config.setLookAndFeelSettings({ flavour: "default" }));
  }
  config.syncFlavoursFromDisk();
  res.status(200).json({ flavours: config.flavours });
});
router.get("/:flavour", getFlavourHandler);

export default router;
