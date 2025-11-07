import fs from "fs";

export default function handler(req, res) {
  const { file } = req.query;
  const path = `/tmp/${file}`;

  if (!fs.existsSync(path)) {
    return res.status(404).json({ error: "File not found" });
  }

  res.setHeader("Content-Type", "application/x-subrip");
  res.setHeader("Content-Disposition", `attachment; filename="${file}"`);

  fs.createReadStream(path).pipe(res);
}
