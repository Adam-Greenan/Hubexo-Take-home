import express from "express";
import { ShortUrlsService } from "./services/shortUrls.service";
import { ShortUrlsController, errorHandler } from "./controllers/shortUrls.controller";
import { shortUrlsRoutes } from "./routes/shortUrls.routes";
import { ExistingShortUrlsRepo } from "./repos/existingShortUrls.repo";

export function createApp() {
  const app = express();
  app.use(express.json());

  const repo = new ExistingShortUrlsRepo();
  const service = new ShortUrlsService(repo);
  const controller = new ShortUrlsController(service);

  app.use(shortUrlsRoutes(controller));

  app.use(errorHandler);

  return app;
}