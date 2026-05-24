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
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    function App() {
      const [uploading, setUploading] = React.useState(false);
      const [result, setResult] = React.useState(null);
      const [copied, setCopied] = React.useState(false);
      const fileRef = React.useRef(null);

      const handleUpload = async (file) => {
        setUploading(true);
        setResult(null);
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/', { method: 'POST', body: fd });
        const data = await res.json();
        setResult(data.url);
        setUploading(false);
      };

      const handleCopy = async () => {
        await navigator.clipboard.writeText(result);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      };

      return (
        <div>
          <div className="w-full bg-white p-8">
            {!uploading && (
              <div
                onClick={() => !result && fileRef.current?.click()}
                className={"cursor-pointer border-2 border-dashed border-black/20 hover:border-black transition-all rounded-xl py-12 flex flex-col items-center justify-center gap-3" + (result ? " opacity-50 pointer-events-none" : "")}
              >
                <span className="text-sm font-medium text-black">Upload File</span>
                <input type="file" ref={fileRef} className="hidden" onChange={(e) => e.target.files[0] && handleUpload(e.target.files[0])} />
              </div>
            )}
            {uploading && (
              <div className="py-16 flex items-center justify-center border-2 border-dashed border-black/20 rounded-xl">
                <span className="text-sm text-black animate-pulse">Uploading...</span>
              </div>
            )}
            <div className="mt-6 flex flex-col gap-4">
              <div className="bg-black rounded-xl p-4 flex items-center justify-between gap-3">
                <span className="truncate font-mono text-xs text-white flex-1">{result || 'Convert : ZIP, PNG, JPEG, WEBP, JPG'}</span>
                <button onClick={handleCopy} disabled={!result} className={"shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all " + (!result ? "bg-white/10 text-white/30 cursor-not-allowed" : "bg-white text-black hover:bg-white/90")}>
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              {result && (
                <button onClick={() => setResult(null)} className="w-full text-xs text-neutral-400 hover:text-black py-1">
                  Upload another file
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    ReactDOM.createRoot(document.getElementById('root')).render(<App />);
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
