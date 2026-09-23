// StudyAI backend — connects your website's AI Tutor to the real Gemini API.
// Run locally: npm install && npm start
// Deploy free: Render.com / Railway.app (see README.md)

const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());              // allow your website (any origin) to call this server
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // set this in your host's environment variables — NEVER in code
const MODEL = "gemini-flash-latest";

app.post("/api/chat", async (req, res) => {
  try {
    const { message, class: studentClass, screenContext, systemPrompt } = req.body || {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ reply: "Message missing. Kuch likh ke bhejo." });
    }
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ reply: "Server par GEMINI_API_KEY set nahi hai. README.md dekho." });
    }

    const system =
      (systemPrompt && systemPrompt.trim()) ||
      "You are a friendly school tutor for Indian Classes 6–12. Explain clearly and step-by-step. Adapt to the student's class. Reply in the same language mix (Hindi/English) the student uses.";

    const contextNote = [
      studentClass ? `Student is in Class ${studentClass}.` : null,
      screenContext ? `They are currently on this app screen: ${screenContext}.` : null,
    ].filter(Boolean).join(" ");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: contextNote ? `${system}\n\n${contextNote}` : system }],
        },
        contents: [{ role: "user", parts: [{ text: message }] }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);
      return res.status(502).json({ reply: "AI backend se error aaya. Server logs check karo." });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("\n") ||
      "Koi reply nahi mila.";

    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "Server error aaya. Thodi der baad try karo." });
  }
});

app.get("/", (_req, res) => res.send("StudyAI backend is running ✅"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`StudyAI backend listening on port ${PORT}`));
