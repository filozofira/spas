/**
 * Unit tests for BackboneNormalizer
 */

import {
  BackboneNormalizer,
  BACKBONE_DEFAULTS,
  REDIS_HEALTHCHECK,
} from "../../../src/services/backbone-normalizer.js";

describe("BackboneNormalizer", () => {
  let normalizer: BackboneNormalizer;

  beforeEach(() => {
    normalizer = new BackboneNormalizer();
  });

  describe("normalizeImage", () => {
    describe("event backbone", () => {
      it("should return default redis image when input is undefined", () => {
        const result = normalizer.normalizeImage(undefined, "event");
        expect(result).toBe(BACKBONE_DEFAULTS.event.image);
      });

      it("should return default redis image when input is empty string", () => {
        const result = normalizer.normalizeImage("", "event");
        expect(result).toBe(BACKBONE_DEFAULTS.event.image);
      });

      it("should return input as-is for redis images", () => {
        const result = normalizer.normalizeImage("redis:6.2", "event");
        expect(result).toBe("redis:6.2");
      });

      it("should return input as-is for full image paths", () => {
        const result = normalizer.normalizeImage("bitnami/redis:7.0", "event");
        expect(result).toBe("bitnami/redis:7.0");
      });
    });

    describe("observability backbone", () => {
      it("should return default zipkin image when input is undefined", () => {
        const result = normalizer.normalizeImage(undefined, "observability");
        expect(result).toBe(BACKBONE_DEFAULTS.observability.image);
      });

      it("should return default zipkin image when input is empty string", () => {
        const result = normalizer.normalizeImage("", "observability");
        expect(result).toBe(BACKBONE_DEFAULTS.observability.image);
      });

      it("should return input as-is for full image paths", () => {
        const result = normalizer.normalizeImage(
          "openzipkin/zipkin:2.24",
          "observability",
        );
        expect(result).toBe("openzipkin/zipkin:2.24");
      });
    });
  });

  describe("buildConfig", () => {
    it("should return default config when no options provided", () => {
      const config = normalizer.buildConfig({});

      expect(config.eventBackbone).toEqual({
        enabled: true,
        image: BACKBONE_DEFAULTS.event.image,
        containerName: BACKBONE_DEFAULTS.event.containerName,
        port: BACKBONE_DEFAULTS.event.port,
        healthcheck: REDIS_HEALTHCHECK,
      });

      expect(config.observabilityBackbone).toEqual({
        enabled: true,
        image: BACKBONE_DEFAULTS.observability.image,
        containerName: BACKBONE_DEFAULTS.observability.containerName,
        type: BACKBONE_DEFAULTS.observability.type,
        ports: expect.arrayContaining([
          expect.objectContaining({ host: 9411, container: 9411 }),
        ]),
      });
    });

    it("should include redis health check in default config", () => {
      const config = normalizer.buildConfig({});

      expect(config.eventBackbone.healthcheck).toEqual({
        test: ["CMD", "redis-cli", "ping"],
        interval: "5s",
        timeout: "3s",
        retries: 3,
      });
    });

    it("should use default event backbone image", () => {
      const config = normalizer.buildConfig({});
      expect(config.eventBackbone.image).toBe("redis:7-alpine");
    });

    it("should use default observability backbone image", () => {
      const config = normalizer.buildConfig({});
      expect(config.observabilityBackbone.image).toBe(
        "openzipkin/zipkin:latest",
      );
    });

    it("should set default container names", () => {
      const config = normalizer.buildConfig({});
      expect(config.eventBackbone.containerName).toBe("spas-redis");
      expect(config.observabilityBackbone.containerName).toBe("spas-zipkin");
    });

    it("should set default ports", () => {
      const config = normalizer.buildConfig({});
      expect(config.eventBackbone.port).toBe(6379);
      expect(config.observabilityBackbone.ports).toContainEqual({
        host: 9411,
        container: 9411,
      });
    });
  });
});
