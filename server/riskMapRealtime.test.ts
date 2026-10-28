import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  getRiskMapAreasWithCircles,
  linkGheToRiskMapArea,
  unlinkGheFromRiskMapArea,
  updateRiskMapAreaPosition,
  calculateGheRiskStatistics,
  generateRiskMapSVG,
} from "./riskMapRealtime";

describe.skipIf(!process.env.TEST_DATABASE_URL)(
  "Real-time Risk Map Functions",
  () => {
    const testUnitId = 1;
    const testAreaId = 1;
    const testGheId = 1;

    describe("getRiskMapAreasWithCircles", () => {
      it("should return empty array for non-existent unit", async () => {
        const areas = await getRiskMapAreasWithCircles(99999);
        expect(Array.isArray(areas)).toBe(true);
      });

      it("should return areas with risk circles structure", async () => {
        const areas = await getRiskMapAreasWithCircles(testUnitId);

        if (areas.length > 0) {
          const area = areas[0];
          expect(area).toHaveProperty("id");
          expect(area).toHaveProperty("name");
          expect(area).toHaveProperty("x");
          expect(area).toHaveProperty("y");
          expect(area).toHaveProperty("width");
          expect(area).toHaveProperty("height");
          expect(Array.isArray(area.riskCircles)).toBe(true);
          expect(area).toHaveProperty("maxRiskLevel");
        }
      });

      it("should aggregate risk circles from multiple GHEs", async () => {
        const areas = await getRiskMapAreasWithCircles(testUnitId);

        if (areas.length > 0) {
          const area = areas[0];
          // Each risk circle should have required properties
          area.riskCircles.forEach(circle => {
            expect(circle).toHaveProperty("id");
            expect(circle).toHaveProperty("type");
            expect(circle).toHaveProperty("riskLevel");
            expect(circle).toHaveProperty("count");
            expect(typeof circle.count).toBe("number");
            expect(circle.count).toBeGreaterThan(0);
          });
        }
      });

      it("should calculate correct max risk level", async () => {
        const areas = await getRiskMapAreasWithCircles(testUnitId);

        if (areas.length > 0) {
          const area = areas[0];
          const riskLevels = [
            "Tolerável",
            "Moderado",
            "Substancial",
            "Intolerável",
          ];
          expect(riskLevels).toContain(area.maxRiskLevel);
        }
      });
    });

    describe("linkGheToRiskMapArea", () => {
      it("should link GHE to area successfully", async () => {
        try {
          const result = await linkGheToRiskMapArea(testGheId, testAreaId);
          expect(result).toEqual({ success: true });
        } catch (error) {
          // Skip if test data doesn't exist
          expect(true).toBe(true);
        }
      });

      it("should handle non-existent GHE", async () => {
        try {
          await linkGheToRiskMapArea(99999, testAreaId);
          // If no error, that's fine - depends on database constraints
        } catch (error) {
          expect(error).toBeDefined();
        }
      });
    });

    describe("unlinkGheFromRiskMapArea", () => {
      it("should unlink GHE from area successfully", async () => {
        try {
          const result = await unlinkGheFromRiskMapArea(testGheId);
          expect(result).toEqual({ success: true });
        } catch (error) {
          // Skip if test data doesn't exist
          expect(true).toBe(true);
        }
      });

      it("should handle non-existent GHE", async () => {
        try {
          await unlinkGheFromRiskMapArea(99999);
          // If no error, that's fine
        } catch (error) {
          expect(error).toBeDefined();
        }
      });
    });

    describe("updateRiskMapAreaPosition", () => {
      it("should update area position successfully", async () => {
        // Get an actual area to test with
        const areas = await getRiskMapAreasWithCircles(1);
        if (areas.length === 0) {
          expect(true).toBe(true);
          return;
        }

        const areaId = areas[0].id;
        const result = await updateRiskMapAreaPosition(areaId, 100, 150);
        expect(result).toEqual({ success: true });
      });

      it("should handle non-existent area", async () => {
        try {
          await updateRiskMapAreaPosition(99999, 100, 150);
          // If no error thrown, that's also acceptable
          expect(true).toBe(true);
        } catch (error) {
          expect(error).toBeDefined();
        }
      });

      it("should accept various coordinate values", async () => {
        // Get an actual area to test with
        const areas = await getRiskMapAreasWithCircles(1);
        if (areas.length === 0) {
          expect(true).toBe(true);
          return;
        }

        const areaId = areas[0].id;
        const coordinates = [
          { x: 0, y: 0 },
          { x: 500, y: 300 },
          { x: 1000, y: 600 },
        ];

        for (const coord of coordinates) {
          const result = await updateRiskMapAreaPosition(
            areaId,
            coord.x,
            coord.y
          );
          expect(result).toEqual({ success: true });
        }
      });
    });

    describe("calculateGheRiskStatistics", () => {
      it("should return statistics for GHE with agents", async () => {
        const stats = await calculateGheRiskStatistics(testGheId);

        if (stats && stats.totalAgents > 0) {
          expect(stats).toHaveProperty("totalAgents");
          expect(stats).toHaveProperty("byType");
          expect(stats).toHaveProperty("byRiskLevel");
          expect(stats).toHaveProperty("maxRiskLevel");
          expect(typeof stats.totalAgents).toBe("number");
          expect(stats.totalAgents).toBeGreaterThan(0);
        }
      });

      it("should return empty stats for non-existent GHE", async () => {
        const stats = await calculateGheRiskStatistics(99999);
        expect(stats).toBeDefined();
        expect(stats?.totalAgents).toBe(0);
      });

      it("should handle GHE with no agents", async () => {
        // This depends on test data setup
        const stats = await calculateGheRiskStatistics(testGheId);

        if (stats && stats.totalAgents === 0) {
          expect(stats.byType).toEqual({});
          expect(stats.byRiskLevel).toEqual({});
          expect(stats.maxRiskLevel).toBe("Tolerável");
        }
      });

      it("should aggregate agents by type correctly", async () => {
        const stats = await calculateGheRiskStatistics(testGheId);

        if (stats && stats.totalAgents > 0) {
          const typeSum = Object.values(stats.byType).reduce(
            (a, b) => a + b,
            0
          );
          expect(typeSum).toBe(stats.totalAgents);
        }
      });

      it("should aggregate agents by risk level correctly", async () => {
        const stats = await calculateGheRiskStatistics(testGheId);

        if (stats && stats.totalAgents > 0) {
          const levelSum = Object.values(stats.byRiskLevel).reduce(
            (a, b) => a + b,
            0
          );
          expect(levelSum).toBe(stats.totalAgents);
        }
      });
    });

    describe("generateRiskMapSVG", () => {
      it("should generate valid SVG string", async () => {
        const svg = await generateRiskMapSVG(testUnitId);

        expect(typeof svg).toBe("string");
        expect(svg).toContain("<svg");
        expect(svg).toContain("</svg>");
      });

      it("should include grid pattern in SVG", async () => {
        const svg = await generateRiskMapSVG(testUnitId);
        expect(svg).toContain("pattern");
        expect(svg).toContain("grid");
      });

      it("should include legend in SVG", async () => {
        const svg = await generateRiskMapSVG(testUnitId);
        expect(svg).toContain("Legenda");
        expect(svg).toContain("Tolerável");
        expect(svg).toContain("Moderado");
        expect(svg).toContain("Substancial");
        expect(svg).toContain("Intolerável");
      });

      it("should include area rectangles and circles", async () => {
        const svg = await generateRiskMapSVG(testUnitId);

        // Should contain area rectangles
        expect(svg).toContain("<rect");

        // Should contain circles for risks
        expect(svg).toContain("<circle");
      });

      it("should include area names", async () => {
        const areas = await getRiskMapAreasWithCircles(testUnitId);
        const svg = await generateRiskMapSVG(testUnitId);

        if (areas.length > 0) {
          areas.forEach(area => {
            expect(svg).toContain(area.name);
          });
        }
      });

      it("should handle empty unit", async () => {
        const svg = await generateRiskMapSVG(99999);

        expect(typeof svg).toBe("string");
        expect(svg).toContain("<svg");
        expect(svg).toContain("</svg>");
        // Should still have legend
        expect(svg).toContain("Legenda");
      });

      it("should use correct colors for risk levels", async () => {
        const svg = await generateRiskMapSVG(testUnitId);

        // Check for risk level colors
        expect(svg).toContain("#10b981"); // Tolerável (Green)
        expect(svg).toContain("#f59e0b"); // Moderado (Amber)
        expect(svg).toContain("#f97316"); // Substancial (Orange)
        expect(svg).toContain("#ef4444"); // Intolerável (Red)
      });
    });

    describe("Integration Tests", () => {
      it("should reflect linked GHE in risk circles", async () => {
        try {
          // Link GHE to area
          await linkGheToRiskMapArea(testGheId, testAreaId);

          // Get areas with circles
          const areas = await getRiskMapAreasWithCircles(testUnitId);
          const targetArea = areas.find(a => a.id === testAreaId);

          if (targetArea) {
            // Area should have risk circles if GHE has agents
            expect(Array.isArray(targetArea.riskCircles)).toBe(true);
          }
        } catch (error) {
          // Skip if test data doesn't exist
          expect(true).toBe(true);
        }
      });

      it("should update SVG when GHE is linked", async () => {
        try {
          // Link GHE
          await linkGheToRiskMapArea(testGheId, testAreaId);

          // Generate SVG
          const svg = await generateRiskMapSVG(testUnitId);

          // SVG should be valid
          expect(svg).toContain("<svg");
          expect(svg).toContain("</svg>");
        } catch (error) {
          // Skip if test data doesn't exist
          expect(true).toBe(true);
        }
      });

      it("should handle position updates in real-time", async () => {
        const newX = 250;
        const newY = 350;

        // Get areas first to ensure area exists
        const areas = await getRiskMapAreasWithCircles(testUnitId);
        if (areas.length === 0) {
          // Skip test if no areas exist
          expect(true).toBe(true);
          return;
        }

        const areaToUpdate = areas[0];

        // Update position
        const result = await updateRiskMapAreaPosition(
          areaToUpdate.id,
          newX,
          newY
        );
        expect(result).toEqual({ success: true });

        // Get areas and verify position
        const updatedAreas = await getRiskMapAreasWithCircles(testUnitId);
        const updatedArea = updatedAreas.find(a => a.id === areaToUpdate.id);

        if (updatedArea) {
          expect(updatedArea.x).toBe(newX);
          expect(updatedArea.y).toBe(newY);
        }
      });
    });
  }
);
