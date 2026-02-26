import { ShortUrlsService } from "../services/shortUrls.service";
import { UrlNotFoundError, InvalidUrlError } from "../domain/errors";
import type { ShortUrlsRepo } from "../repos/shortUrls.repo";

// Make config deterministic for assertions
jest.mock("../config", () => ({
  config: { baseUrl: "http://short.ly", codeLength: 6 },
}));

// Mock generateCode so we can control collisions & outputs
jest.mock("../utils/generateCode", () => ({
  generateCode: jest.fn(),
}));

import { generateCode } from "../utils/generateCode";

describe("ShortUrlsService", () => {
  const makeRepo = (): jest.Mocked<ShortUrlsRepo> => ({
    getByLongUrl: jest.fn(),
    getByCode: jest.fn(),
    save: jest.fn(),
    incrementClicks: jest.fn(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("shorten the url", () => {
    it("throws InvalidUrlError for empty url", async () => {
      const repo = makeRepo();
      const service = new ShortUrlsService(repo);

      await expect(service.shortenUrl("")).rejects.toBeInstanceOf(InvalidUrlError);

      expect(repo.getByLongUrl).not.toHaveBeenCalled();
      expect(repo.save).not.toHaveBeenCalled();
    });

    it("returns existing code if longUrl already in memory", async () => {
      const repo = makeRepo();
      repo.getByLongUrl.mockResolvedValue({
        code: "123456",
        longUrl: "https://www.google.com",
        createdAt: 123,
        clicks: 7,
      });

      const service = new ShortUrlsService(repo);

      const res = await service.shortenUrl("https://www.google.com");

      expect(repo.getByLongUrl).toHaveBeenCalledWith(expect.stringContaining("https://www.google.com"));

      expect(repo.getByCode).not.toHaveBeenCalled();

      expect(repo.save).not.toHaveBeenCalled();

      expect(res).toEqual({
        code: "123456",
        longUrl: "https://www.google.com",
        shortUrl: "http://short.ly/123456",
      });
    });

    it("creates a new code when none exists", async () => {
      const repo = makeRepo();

      repo.getByLongUrl.mockResolvedValue(null);

      (generateCode as jest.Mock).mockReturnValue("234567");

      repo.getByCode.mockResolvedValue(null);

      const service = new ShortUrlsService(repo);

      const res = await service.shortenUrl("https://www.google.com/new");

      expect(generateCode).toHaveBeenCalledWith(6);
      expect(repo.getByCode).toHaveBeenCalledWith("234567");
      expect(repo.save).toHaveBeenCalledTimes(1);

      const saved = repo.save.mock.calls[0][0];
      expect(saved.code).toBe("234567");
      expect(saved.longUrl).toBe("https://www.google.com/new");
      expect(saved.clicks).toBe(0);
      expect(typeof saved.createdAt).toBe("number");

      expect(res).toEqual({
        code: "234567",
        longUrl: "https://www.google.com/new",
        shortUrl: "http://short.ly/234567",
      });
    });

    it("retries when a generated code collides", async () => {
      const repo = makeRepo();
      repo.getByLongUrl.mockResolvedValue(null);

      // mock two codes where the first one is taken already
      (generateCode as jest.Mock)
        .mockReturnValueOnce("aaaaaa")
        .mockReturnValueOnce("bbbbbb");

      repo.getByCode
        .mockResolvedValueOnce({
          code: "aaaaaa",
          longUrl: "https://www.google.com",
          createdAt: 1,
          clicks: 0,
        })
        .mockResolvedValueOnce(null);

      const service = new ShortUrlsService(repo);

      const res = await service.shortenUrl("https://www.google.com/collide");

      expect(generateCode).toHaveBeenCalledTimes(2);

      expect(repo.getByCode).toHaveBeenNthCalledWith(1, "aaaaaa");

      expect(repo.getByCode).toHaveBeenNthCalledWith(2, "bbbbbb");

      expect(repo.save).toHaveBeenCalledTimes(1);

      expect(res.code).toBe("bbbbbb");
      expect(res.longUrl).toBe("https://www.google.com/collide");
      expect(res.shortUrl).toBe("http://short.ly/bbbbbb");
    });

    it("throws if it cannot allocate a code after retries", async () => {
      const repo = makeRepo();
      repo.getByLongUrl.mockResolvedValue(null);

      (generateCode as jest.Mock).mockReturnValue("cccccc");
      // Always taken
      repo.getByCode.mockResolvedValue({
        code: "cccccc",
        longUrl: "https://www.google.com",
        createdAt: 1,
        clicks: 0,
      });

      const service = new ShortUrlsService(repo);

      await expect(service.shortenUrl("https://www.google.com/fail")).rejects.toThrow(
        "Failed to allocate short code"
      );

      // 10 attempts max
      expect(generateCode).toHaveBeenCalledTimes(10);
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe("resolveCode", () => {
    it("returns long url and increments clicks", async () => {
      const repo = makeRepo();
      repo.getByCode.mockResolvedValue({
        code: "abc123",
        longUrl: "https://www.google.com/x",
        createdAt: 1,
        clicks: 0,
      });

      const service = new ShortUrlsService(repo);

      const longUrl = await service.resolveCode("abc123");

      expect(repo.getByCode).toHaveBeenCalledWith("abc123");
      expect(repo.incrementClicks).toHaveBeenCalledWith("abc123");
      expect(longUrl).toBe("https://www.google.com/x");
    });

    it("throws UrlNotFoundError for unknown code", async () => {
      const repo = makeRepo();
      repo.getByCode.mockResolvedValue(null);

      const service = new ShortUrlsService(repo);

      await expect(service.resolveCode("nope")).rejects.toBeInstanceOf(UrlNotFoundError);
      expect(repo.incrementClicks).not.toHaveBeenCalled();
    });
  });

  describe("getMeta", () => {
    it("returns record for known code", async () => {
      const repo = makeRepo();
      const record = {
        code: "abc123",
        longUrl: "https://www.google.com/meta",
        createdAt: 10,
        clicks: 5,
      };
      repo.getByCode.mockResolvedValue(record);

      const service = new ShortUrlsService(repo);

      await expect(service.getMeta("abc123")).resolves.toEqual(record);
    });

    it("throws UrlNotFoundError for unknown code", async () => {
      const repo = makeRepo();
      repo.getByCode.mockResolvedValue(null);

      const service = new ShortUrlsService(repo);

      await expect(service.getMeta("missing")).rejects.toBeInstanceOf(UrlNotFoundError);
    });
  });
});