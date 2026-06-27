# Project Overview: Lumen (AudioBook.ai)
Lumen (also referred to as AudioBook.ai) is a full-stack web application designed to bridge the gap between complex document formats and interactive, auditory accessibility. Specifically curated for users requiring educational modifications, screenreaders, or alternative learning modalities, Lumen transforms static, complex PDF documents (such as academic research papers, corporate briefs, legal manuals, and medical files) into structured, highly readable summaries and natural, studio-quality speech.
Key Architectural Pillars
- Elegant Aesthetic ("Artistic Flair")
Following a custom minimalist visual design, the interface employs the Artistic Flair layout:
Typography: Immersive typography featuring editorial display pairing with standard high-contrast elements. Clean displays use Playfair Display serif italics alongside Inter for robust utility elements.
Color Scheme: Uses a warm, high-contrast, eye-safe canvas featuring soft off-whites (#FDFCFB), warm gray panel regions (#F7F5F2), refined dividing accents (#E8E4E1), and soft charcoal styling.
Composition: A dense yet uncluttered master dashboard featuring a unified dual-column view. The left-hand panel hosts document uploading utilities and a searchable list library, while the main workspace reveals detailed summaries, study tools, and an integrated audio narrative controller.
- Server-Authoritative Document Pipeline (Gemini 3.5 Flash)
Upon dragging and dropping a PDF, the file is read locally as base64 bytes and pushed to a secure, server-side Node.js proxy endpoint. This shields sensitive API credentials and coordinates the multi-stage document processing:
Native PDF OCR & Layout Reading: Leverages Gemini’s native multimodal capabilities to analyze pages directly, circumventing basic, fragile text-extractors.
Structured Layout Generation: Instructs the model using strict output schema parameters to parse content into an elegant, comprehensive markdown study guide, extract a smart title, auto-classify the document sector, compute physical reading times, and identify key takeaways.
Smart Revision Cards: Generates interactive study flashcards mapping key vocabulary, glossary lists, or major arguments into clickable front-to-back testing prompts for active retrieval study.
- Dual-Engine Audio Player (Text-to-Speech)
Lumen implements an accessible narrative reader equipped with:
Browser Speech Synthesis: An offline-ready engine that taps into your computer's native system voices, supporting multiple accents and variable reading speeds (
 to 
).
Gemini Studio Voices: Interfaces directly with the preview Text-to-Speech models, translating document paragraphs on-demand into highly expressive, studio-quality vocal tracks. Users can switch between prebuilt persona voices like Zephyr (Warm), Kore (Cheerful), Charon (Academic), Puck (Animated), or Fenrir (Deep).
Subtitles & Interactive Tracking: Displays highlighted reading blocks synchronously with playback, keeping visual and auditory signals perfectly aligned.
- Dual-State Database and Sync Storage
The platform is built with a reliable dual-storage architecture:
Authorized Cloud Backup: Integrating Firebase Firestore and Google Identity Authentication, signed-in users can securely back up their documents, parsed summaries, and custom cards across devices.
Zero-Delay Browser Fallback: For guest sessions or offline situations, the app immediately writes and reads data from the browser’s localized storage engine. This provides full functional access without forcing an immediate sign-in.
Technical Implementation & File Structure
/server.ts: Configures the Express proxy server, mounts Vite development middlewares, handles high-limit base64 streams, and routes API payloads to the Google Gen AI SDK.
/src/components/Dashboard.tsx: Coordinates authentications, file library state, and the active document workspace.
/src/components/AudioPlayer.tsx: Orchestrates speech playback states, paragraph cue arrays, and Web Audio buffer outputs.
/src/components/SummaryViewer.tsx: Displays markdown text, key takeaways, and flashcard active-recall nodes.
/src/components/PdfUploader.tsx: Manages touch-friendly drop-zones, local file validations, and processing steps.
/src/lib/storage.ts: Handles offline fallbacks and Firestore collection rules safely.


# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/a4b9fcd0-7159-499a-8516-f8e5f2afe630

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
