import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import express from "express";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/ocr", express.json({ limit: "20mb" }), async (req: Request, res: Response) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: "imageBase64 is required" });
      }

      const response = await openai.chat.completions.create({
        model: "gpt-5-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `You are a medicine label reading assistant. Look at this image of a medicine strip, bottle, or packaging.
Extract ONLY the medicine/drug name (brand name or generic name).
Respond with ONLY the medicine name and dosage (e.g. "Metformin 500mg" or "Paracetamol 500mg").
Do NOT include manufacturer, lot number, expiry, instructions, or any other information.
If you cannot identify a medicine name clearly, respond with "Unknown".`,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                  detail: "high",
                },
              },
            ],
          },
        ],
        max_completion_tokens: 60,
      });

      const extracted = response.choices[0]?.message?.content?.trim() ?? "Unknown";
      return res.json({ medicineName: extracted });
    } catch (err: any) {
      console.error("OCR error:", err?.message);
      return res.status(500).json({ error: "Failed to analyze image" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
