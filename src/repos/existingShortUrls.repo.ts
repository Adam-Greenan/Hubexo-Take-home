import { ShortUrlRecord } from "../domain/shortUrl";
import { ShortUrlsRepo } from "./shortUrls.repo";

export class ExistingShortUrlsRepo implements ShortUrlsRepo {
  private byCode = new Map<string, ShortUrlRecord>();
  private byLongUrl = new Map<string, string>();

  async getByCode(code: string): Promise<ShortUrlRecord | null> {
    return this.byCode.get(code) ?? null;
  }

  async getByLongUrl(longUrl: string): Promise<ShortUrlRecord | null> {
    const code = this.byLongUrl.get(longUrl);
    if (!code) return null;

    return this.byCode.get(code) ?? null;
  }

  async save(record: ShortUrlRecord): Promise<void> {
    this.byCode.set(record.code, record);
    this.byLongUrl.set(record.longUrl, record.code);
  }

  async incrementClicks(code: string): Promise<void> {
    const rec = this.byCode.get(code);
    if (!rec) return;

    this.byCode.set(code, { ...rec, clicks: rec.clicks + 1 });
  }
}