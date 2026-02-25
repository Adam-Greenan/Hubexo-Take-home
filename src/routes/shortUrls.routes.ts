import { Router } from "express";
import { ShortUrlsController } from "../controllers/shortUrls.controller";

export function shortUrlsRoutes(controller: ShortUrlsController) {
  const router = Router();

  router.post("/api/shorten", controller.shorten);
  
  router.get("/api/:code", controller.meta);

  router.get("/:code", controller.redirect);

  return router;
}