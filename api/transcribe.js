// api/transcribe.js (Node.js serverless for Vercel)

const formidable = require('formidable');

const fs = require('fs');


module.exports = async (req, res) => {

if (req.method !== 'POST') return res.status(405).send('Method not allowed');

const form = new formidable.IncomingForm({ multiples: false });

form.parse(req, async (err, fields, files) => {

if (err) return res.status(400).json({ error: err.message });

const file = files.file;

if (!file) return res.status(400).json({ error: 'No file uploaded' });


try{

// 1) Upload file to Replicate

const token = process.env.REPLICATE_API_TOKEN;

if(!token) return res.status(500).json({ error: 'Replicate token not configured' });


const formData = new (require('form-data'))();

formData.append('file', fs.createReadStream(file.path), { filename: file.name });


const uploadRes = await fetch('https://api.replicate.com/v1/files', {

method: 'POST',

headers: { 'Authorization': `Bearer ${token}` },

body: formData

});

const up = await uploadRes.json();

if (!up || !up?.urls?.get) throw new Error('Upload to Replicate failed');


const videoUrl = up.urls.get;


// 2) Create prediction with faster-whisper (use a public version id)

// Version chosen from douwantech/faster-whisper (example version id: 338fae14)

const version = 'douwantech/faster-whisper:338fae1406dd5ddd578aed6b6ce96a85a10f030b8101c5a155eb630b06b8b424';


const body = {

version: version,

input: {

audio: videoUrl,

language: fields.language ? (fields.language === 'auto' ? null : fields.language) : null,

output_format: 'srt'

}

};


const predRes = await fetch('https://api.replicate.com/v1/predictions', {

method: 'POST',

headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },

body: JSON.stringify(body)

});

const pred = await predRes.json();

if(!pred || !pred.id) throw new Error('Prediction request failed');


// 3) Poll until finished

let status = pred;

while(status.status !== 'succeeded' && status.status !== 'failed'){

await new Promise(r=>setTimeout(r,2000));

const check = await fetch(`https://api.replicate.com/v1/predictions/${pred.id}`, { headers: { 'Authorization': `Bearer ${token}` } });

status = await check.json();

}


if(status.status === 'failed') return res.status(500).json({ error: status.error || 'Prediction failed' });


// status.output usually contains output file URL(s)

const output = status.output;

// return json with srt_url or stream file directly

return res.json({ srt_url: Array.isArray(output)? output[0] : output });


}catch(e){

console.error(e);

return res.status(500).json({ error: e.message });

}

});

};

