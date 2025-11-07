import fs from "fs";

export default function handler(req, res) {
  const { file } = req.query;
  const filePath = `/tmp/${file}`;

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File not found");
  }

  res.setHeader("Content-Type", "application/x-subrip");
  res.setHeader("Content-Disposition", `attachment; filename="${file}"`);

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
}
