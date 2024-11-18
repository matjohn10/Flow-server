import express from "express";
import { Request, Response } from "express";
import {
  generate_game,
  getFullPlayerTelestration,
  simulate_game,
} from "../tests/game_tests";
const tests = express.Router();

tests.get("/", (req: Request, res: Response) => {
  //   const game = generate_game(4);
  //   res.json(JSON.stringify(game, null, 2));
  //simulate_game(4);
  const str = getFullPlayerTelestration(3);
  res.send(str);
});

export default tests;
