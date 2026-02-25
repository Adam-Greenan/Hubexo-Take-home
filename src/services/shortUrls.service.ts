import { config } from "../config";
import { UrlNotFoundError } from "../domain/errors";
import { ShortUrlRecord } from "../domain/shortUrl";
import { validateUrl } from "../domain/validators";
import { ShortUrlsRepo } from "../repos/shortUrls.repo";
import { generateCode } from "../utils/generateCode";

export class ShortUrlsService {
  constructor(private repo: ShortUrlsRepo) {}

  async shortenUrl(inputUrl: unknown): Promise<{ 
        code: string; 
        shortUrl: string; 
        longUrl: string 
    }> {

    const longUrl = validateUrl(inputUrl);

    const existing = await this.repo.getByLongUrl(longUrl);

    if (existing) {
        
      return {
        code: existing.code,
        longUrl: existing.longUrl,
        shortUrl: `${config.baseUrl}/${existing.code}`,
      };
    }

    let code = "";

    for (let i = 0; i < 10; i++) {
      code = generateCode(config.codeLength);
      const taken = await this.repo.getByCode(code);
      if (!taken) break;
      code = "";
    }

    if (!code) {
      throw new Error("Failed to allocate short code");
    }

    const record: ShortUrlRecord = {
      code,
      longUrl,
      createdAt: Date.now(),
      clicks: 0,
    };

    await this.repo.save(record);

    return { code, longUrl, shortUrl: `${config.baseUrl}/${code}` };
  }

  async resolveCode(code: string): Promise<string> {
    const rec = await this.repo.getByCode(code);
    if (!rec) throw new UrlNotFoundError("short code not found");

    await this.repo.incrementClicks(code);

    return rec.longUrl;
  }

  async getMeta(code: string): Promise<ShortUrlRecord> {
    const rec = await this.repo.getByCode(code);
    if (!rec) throw new UrlNotFoundError("short code not found");

    return rec;
  }
}