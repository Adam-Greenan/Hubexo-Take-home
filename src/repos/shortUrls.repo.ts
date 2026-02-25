import { ShortUrlRecord } from "../domain/shortUrl";

export interface ShortUrlsRepo {
  getByCode(code: string): Promise<ShortUrlRecord | null>;

  getByLongUrl(longUrl: string): Promise<ShortUrlRecord | null>;

  save(record: ShortUrlRecord): Promise<void>;
  
  incrementClicks(code: string): Promise<void>;
}