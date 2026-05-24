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

app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Upload</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div id="root"></div>
  <script type="module">
    import { createElement as h, useState, useRef } from 'https://esm.sh/react@18';
    import { createRoot } from 'https://esm.sh/react-dom@18/client';
    import { Upload, Check, Loader2, Copy } from 'https://esm.sh/lucide-react@latest';

    function App() {
      const [uploading, setUploading] = useState(false);
      const [result, setResult] = useState(null);
      const [copied, setCopied] = useState(false);
      const fileInputRef = useRef(null);

      const handleUpload = async (fileToUpload) => {
        setUploading(true);
        setResult(null);
        const formData = new FormData();
        formData.append('file', fileToUpload);
        const response = await fetch('/', { method: 'POST', body: formData });
        const data = await response.json();
        setResult(data.url);
        setUploading(false);
      };

      const handleCopy = async () => {
        if (result) {
          await navigator.clipboard.writeText(result);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      };

      return h('div', { className: 'min-h-screen bg-neutral-50 flex items-center justify-center p-4 font-sans' },
        h('div', { className: 'w-full max-w-sm bg-white border border-black p-8 rounded-2xl shadow-sm' },
          !uploading && h('div', {
            onClick: () => !result && fileInputRef.current?.click(),
            className: \`cursor-pointer border-2 border-dashed border-black/20 hover:border-black transition-all rounded-xl py-12 flex flex-col items-center justify-center gap-3 \${result ? 'opacity-50 pointer-events-none' : ''}\`
          },
            h(Upload, { className: 'w-5 h-5 text-black/50' }),
            h('span', { className: 'text-sm font-medium text-black' }, 'Upload File'),
            h('input', { type: 'file', ref: fileInputRef, className: 'hidden', onChange: (e) => e.target.files[0] && handleUpload(e.target.files[0]) })
          ),
          uploading && h('div', { className: 'py-16 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-black/20 rounded-xl' },
            h(Loader2, { className: 'w-6 h-6 animate-spin text-black' })
          ),
          h('div', { className: 'mt-6 flex flex-col gap-4' },
            h('div', { className: 'bg-neutral-100 p-3 rounded-lg border border-black/10 flex items-center justify-between gap-2' },
              h('span', { className: 'truncate font-mono text-[11px] text-neutral-600 flex-1' }, result ? result : 'pending upload...'),
              h('button', { onClick: handleCopy, disabled: !result, className: \`p-2 rounded-md transition-colors \${!result ? 'text-neutral-300 cursor-not-allowed' : 'text-black hover:bg-black/5'}\` },
                copied ? h(Check, { className: 'w-4 h-4 text-green-600' }) : h(Copy, { className: 'w-4 h-4' })
              )
            ),
            result && h('button', { onClick: () => setResult(null), className: 'w-full text-[11px] text-neutral-400 hover:text-black transition-colors py-1' }, 'Upload another file')
          )
        )
      );
    }

    createRoot(document.getElementById('root')).render(h(App));
  </script>
</body>
</html>`);
});

app.post('/', (req, res) => {
  const busboy = Busboy({ headers: req.headers });

  busboy.on('file', async (name, stream, info) => {
    const form = new FormData();
    form.append(name, stream, info.filename);
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
