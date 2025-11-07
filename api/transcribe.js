import formidable from "formidable";
import fs from "fs";
import Replicate from "replicate";

export const config = {
  api: { bodyParser: false }
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = formidable({ uploadDir: "/tmp", keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    try {
      if (err) return res.status(500).json({ error: "Parse upload failed" });

      const video = files.file;
      const language = fields.language || "auto";
      const translate = fields.translate || "none";

      const replicate = new Replicate({
        auth: process.env.REPLICATE_API_TOKEN,
      });

      // upload video
      const uploadResult = await replicate.files.upload(video.filepath);

      const output = await replicate.run(
        "guillaumekln/faster-whisper:latest",
        {
          input: {
            audio: uploadResult.url,
            language: language === "auto" ? null : language,
            task: translate !== "none" ? "translate" : "transcribe",
            output_format: "srt"
          }
        }
      );

      const fileName = `sub-${Date.now()}.srt`;
      const savePath = `/tmp/${fileName}`;

      fs.writeFileSync(savePath, output);

      return res.status(200).json({
        success: true,
        srt_url: `/api/download?file=${fileName}`
      });

    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "SERVER FAILED: " + e.message });
    }
  });
}
