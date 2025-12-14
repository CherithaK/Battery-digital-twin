import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, analyzeCSV } from "./storage";
import type { UploadCSVRequest, AnalysisResponse } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post("/api/analyze", async (req, res) => {
    try {
      const { fileContent, fileName } = req.body as UploadCSVRequest;

      if (!fileContent || typeof fileContent !== "string") {
        const response: AnalysisResponse = {
          success: false,
          error: "Missing or invalid file content",
        };
        return res.status(400).json(response);
      }

      if (!fileName || typeof fileName !== "string") {
        const response: AnalysisResponse = {
          success: false,
          error: "Missing file name",
        };
        return res.status(400).json(response);
      }

      const result = analyzeCSV(fileContent, fileName);
      await storage.storeAnalysis(result);

      const response: AnalysisResponse = {
        success: true,
        data: result,
      };

      return res.json(response);
    } catch (error) {
      console.error("Analysis error:", error);
      const response: AnalysisResponse = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
      return res.status(500).json(response);
    }
  });

  app.get("/api/analysis/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const result = await storage.getAnalysis(sessionId);

      if (!result) {
        return res.status(404).json({
          success: false,
          error: "Analysis not found",
        });
      }

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Get analysis error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to retrieve analysis",
      });
    }
  });

  app.get("/api/analyses", async (req, res) => {
    try {
      const analyses = await storage.getAllAnalyses();
      return res.json({
        success: true,
        data: analyses,
      });
    } catch (error) {
      console.error("Get analyses error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to retrieve analyses",
      });
    }
  });

  return httpServer;
}
