const express = require('express');
const Busboy = require('busboy');
const FormData = require('form-data');
const fetch = require('node-fetch');

const app = express();

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.post('/', (req, res) => {
  const busboy = Busboy({ headers: req.headers });
  const form = new FormData();

  busboy.on('file', (name, stream, info) => {
    form.append(name, stream, info.filename);
  });

  busboy.on('finish', async () => {
    const upstream = await fetch(process.env.WORKER_URL, {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
    });
    const data = await upstream.json();
    res.json(data);
  });

  req.pipe(busboy);
});

app.listen(process.env.PORT, () => {
  console.log(`listening on ${process.env.PORT}`);
});
