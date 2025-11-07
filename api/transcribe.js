import Replicate from "replicate";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "500mb",  // allow large uploads
    },
  },
};

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_KEY,
    });

    const { fileUrl, language, translateTo } = req.body;

    if (!fileUrl) {
      return res.status(400).json({ error: "No file url provided" });
    }

    const output = await replicate.run(
      "guillaumekln/faster-whisper:latest",
      {
        input: {
          audio: fileUrl,
          language: language || "auto",
          task: translateTo ? "translate" : "transcribe",
          translate_to: translateTo || "none",
          output_format: "srt"
        }
      }
    );

    res.status(200).json({ subtitle: output });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).json({
      error: "Server failed to generate subtitle",
      details: err.message || err.toString()
    });
  }
}
