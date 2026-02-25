import { Request, Response, NextFunction } from "express";
import { InvalidUrlError, UrlNotFoundError } from "../domain/errors";
import { ShortUrlsService } from "../services/shortUrls.service";

export class ShortUrlsController {
  constructor(private service: ShortUrlsService) {}

  shorten = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.shortenUrl(req.body?.url);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  };

  redirect = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const code = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;
      const longUrl = await this.service.resolveCode(code);

      res.redirect(302, longUrl);
    } catch (err) {
      next(err);
    }
  };

  meta = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const code = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;
      const rec = await this.service.getMeta(code);
      
      res.json(rec);
    } catch (err) {
      next(err);
    }
  };
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof InvalidUrlError) {
    return res.status(400).json({ error: err.name, message: err.message });
  }
  if (err instanceof UrlNotFoundError) {
    return res.status(404).json({ error: err.name, message: err.message });
  }

  // default
  const message = err instanceof Error ? err.message : "Unknown error";
  return res.status(500).json({ error: "InternalServerError", message });
}