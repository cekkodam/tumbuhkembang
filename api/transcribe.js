// Buat folder:  /api/transcribe.js  di Vercel project kamu
import Replicate from "replicate";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    const boundary = req.headers["content-type"].split("boundary=")[1];
    const form = buffer.toString();

    const filename = uuidv4() + ".mp4";
    const tempPath = path.join("/tmp", filename);

    const fileData = buffer.slice(buffer.indexOf("\r\n\r\n") + 4);
    await writeFile(tempPath, fileData);

    const language = form.match(/name="language"\r\n\r\n(.+?)\r/)[1];
    const translate = form.match(/name="translate"\r\n\r\n(.+?)\r/)[1];

    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

    const output = await replicate.run(
      "guillaumekln/faster-whisper:latest",
      {
        input: {
          audio: tempPath,
          language: language === "auto" ? null : language,
          task: translate !== "none" ? "translate" : "transcribe",
          output_format: "srt",
        },
      }
    );

    await unlink(tempPath);

    res.status(200).json({ srt_url: output });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}
