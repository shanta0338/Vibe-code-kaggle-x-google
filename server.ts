/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

// Configure dotenv
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = 3000;

// Raise body limit significantly to handle PDF uploads converted to Base64 in JSON format
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize the Google Gen AI client safely
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

/**
 * Summarize a PDF document directly by leveraging Gemini's native PDF understanding capabilities.
 */
app.post('/api/summarize-pdf', async (req, res) => {
  const { fileBase64, fileName, fileSize } = req.body;

  if (!fileBase64) {
    return res.status(400).json({ error: 'Missing PDF file base64 data.' });
  }

  try {
    // Strip headers if full data URL was sent
    const base64DataOnly = fileBase64.includes(',') 
      ? fileBase64.split(',')[1] 
      : fileBase64;

    const pdfPart = {
      inlineData: {
        data: base64DataOnly,
        mimeType: 'application/pdf',
      },
    };

    const promptText = `
      You are an expert accessibility coordinator and educational assistant.
      Your task is to analyze the attached PDF and produce an extremely thorough, highly organized study guide and accessibility summary.
      
      Generate a clean response following the schema instructions.
      In the 'summaryMarkdown' field, write a comprehensive overview using elegant markdown with headings, bold terms, summaries of major chapters, bullet points, and key quotes helper annotations.
      Auto-categorize the document (e.g. Legal, Technical Manual, Academic Research, Business QBR, Medical Report, General).
      Estimate the physical reading time in minutes.
      Formulate 4-6 most important, actionable 'keyTakeaways'.
      Compile 3-5 'flashcards' that map core facts or glossary items to interactive Q&As for studying.
    `;

    // Query Gemini 3.5 Flash for PDF document understanding with JSON responseSchema matching our needs
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [pdfPart, promptText],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { 
              type: Type.STRING, 
              description: "Deeply descriptive, clean document title or main topic extracted from the content." 
            },
            summaryMarkdown: { 
              type: Type.STRING, 
              description: "Exhaustive, robust section-by-section summary of the PDF in gorgeous markdown styling. Include clear headings, bulleted concepts, and bold important terms. Do not include duplicate headings of the main title." 
            },
            category: { 
              type: Type.STRING, 
              description: "Autoclassified sector: e.g. Academic Research, Corporate Audit, Legal Brief, Technical Guideline, Creative, Medical, Other" 
            },
            readingTime: { 
              type: Type.INTEGER, 
              description: "Estimated original document reading time in minutes based on total page volume and density." 
            },
            keyTakeaways: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "4-6 powerful, bite-sized direct takeaways or conclusions from the document."
            },
            flashcards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING, description: "Quiz question highlighting a critical term or definition." },
                  answer: { type: Type.STRING, description: "A crisp, educational answer teaching the reader about the term." }
                },
                required: ['question', 'answer']
              },
              description: "3-5 key flashcards for revising main concepts."
            }
          },
          required: ['title', 'summaryMarkdown', 'category', 'readingTime', 'keyTakeaways', 'flashcards']
        }
      }
    });

    const outputText = response.text;
    if (!outputText) {
      throw new Error('Gemini model response was empty.');
    }

    // Parse structured JSON
    const payload = JSON.parse(outputText.trim());
    res.json({ success: true, data: payload });

  } catch (err: any) {
    console.error('Error in /api/summarize-pdf:', err);
    res.status(500).json({ 
      error: 'Failed to process and summarize PDF.', 
      details: err.message || err 
    });
  }
});

/**
 * Text-to-Speech endpoint that generates premium voice narration using Gemini's native voice model.
 */
app.post('/api/generate-tts', async (req, res) => {
  const { text, voiceName } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Missing narrative text component to convert to audio.' });
  }

  const selectedVoice = voiceName || 'Zephyr'; // Default prebuilt voice

  try {
    // Call the dedicated gemini-3.1-flash-tts-preview model to compile studio quality speech audio
    const speechResponse = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [{ parts: [{ text: text.substring(0, 1500) }] }], // Chunk safe limits
      config: {
        responseModalities: ['AUDIO'], // Request native PCM audio modality
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: selectedVoice }, 
          },
        },
      },
    });

    const base64Audio = speechResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      throw new Error('No audio byte stream was returned by the voice service.');
    }

    res.json({ success: true, base64Audio });

  } catch (err: any) {
    console.error('Error in /api/generate-tts:', err);
    res.status(500).json({ 
      error: 'Failed to synthesize premium narration.', 
      details: err.message || err 
    });
  }
});

// Configure Vite Assets Serving & Route Handling for SPA fallback
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    // Development Mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    
    app.use(vite.middlewares);
  } else {
    // Production Mode
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // Express v4 fallback to single-page client entry
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server successfully started. Listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
