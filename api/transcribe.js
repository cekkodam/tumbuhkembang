import formidable from "formidable";
import fs from "fs";
import OpenAI from "openai";

export const config = {
  api: {
    bodyParser: false,  // <--- WAJIB untuk upload file
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = new formidable.IncomingForm({ uploadDir: "/tmp", keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    try {
      if (err) {
        console.error("Formidable error:", err);
        return res.status(500).json({ error: "Upload form parsing failed" });
      }

      const file = files.file?.[0] || files.file;
      const language = fields.language?.[0] || "auto";

      if (!file) return res.status(400).json({ error: "No file uploaded" });

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(file.filepath),
        model: "gpt-4o-transcribe",
        response_format: "srt",
        language: language === "auto" ? undefined : language,
      });

      const fileName = `${Date.now()}.srt`;
      const savePath = `/tmp/${fileName}`;
      fs.writeFileSync(savePath, transcription);

      return res.status(200).json({
        success: true,
        srt_url: `/api/download?file=${fileName}`,
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }
  });
}
