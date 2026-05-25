const express = require('express');
const Busboy = require('busboy');
const FormData = require('form-data');
const fetch = require('node-fetch');

const app = express();

const ZOHO_MCP = 'https://dc2-920682947.zohomcp.com/mcp/f8d2c6cb3b9eea6a7f1394e76c7bd095/message';

async function logToZoho({ timestamp, fileName, fileType, status, url, customerId }) {
  const zipUrl   = fileType === 'zip' ? url : '';
  const imageUrl = fileType !== 'zip' ? url : '';

  const response = await fetch(ZOHO_MCP, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: 'ZohoSheet_add_records_to_worksheet',
        arguments: {
          path_variables: {
            addrecordstoworksheet: 'v2',
            resource_id: process.env.RSRC_ID,
          },
          query_params: {
            method: 'worksheet.records.add',
            worksheet_name: 'Sheet1',
            json_data: [
              {
                'Timestamp': timestamp,
                'file_name_upload': fileName,
                'file_type_upload': fileType,
                'stat_upload': status,
                'zip_url_upload': zipUrl,
                'image_url_upload': imageUrl,
                'Customer ID': customerId,
                'Source ID': process.env.SOURCE_ID,
              },
            ],
          },
        },
      },
    }),
  });
  const text = await response.text();
  console.log('Zoho log response:', text);
}

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.get('/', (req, res) => {
  const customer = req.query.customer || 'guest';
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Upload</title>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700&display=swap" rel="stylesheet" />
  <script>window.__CUSTOMER__ = "${customer}";</script>
</head>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 100%; overflow: hidden; }
  body { background: transparent; font-family: sans-serif; }
  #root { width: 100%; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .drag-hint { display: none; }
  @media (hover: hover) { .drag-hint { display: block; } }
</style>
<body>
  <div id="root"></div>
  <script type="text/babel">
    function App() {
      const [uploading, setUploading] = React.useState(false);
      const [result, setResult] = React.useState(null);
      const [error, setError] = React.useState(null);
      const [copied, setCopied] = React.useState(false);
      const [dragging, setDragging] = React.useState(false);
      const fileRef = React.useRef(null);

      const handleUpload = async (file) => {
        setUploading(true);
        setResult(null);
        setError(null);
        const fd = new FormData();
        fd.append('customerId', window.__CUSTOMER__);
        fd.append('file', file);
        try {
          const res = await fetch('/', { method: 'POST', body: fd });
          if (!res.ok) throw new Error();
          const data = await res.json();
          setResult(data.url);
        } catch (e) {
          setError('Upload failed. Try again.');
        } finally {
          setUploading(false);
        }
      };

      const handleCopy = async () => {
        await navigator.clipboard.writeText(result);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      };

      const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        if (uploading) return;
        const file = e.dataTransfer.files[0];
        if (file) handleUpload(file);
      };

      const reset = () => { setResult(null); setError(null); if (fileRef.current) fileRef.current.value = ''; };

      return (
        <div style={{width:'100%', padding:'20px', boxSizing:'border-box'}}>

          {!result && (
            <div
              onClick={() => !uploading && fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); if (!uploading) setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              style={{
                cursor: uploading ? 'default' : 'pointer',
                border: dragging ? '2px solid #000' : '2px dashed #ccc',
                boxShadow: '0 0 18px 2px rgba(0,0,0,0.18)',
                borderRadius: '12px',
                padding: '48px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                background: dragging ? '#f9f9f9' : '#fff',
                transition: 'border-color 0.2s, background 0.2s',
                userSelect: 'none',
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
              }}
            >
              {uploading ? (
                <>
                  <div style={{width:'22px',height:'22px',border:'2px solid #eee',borderTopColor:'#000',borderRadius:'50%',animation:'spin 0.7s linear infinite'}} />
                  <span style={{fontSize:'12px',fontWeight:'600',color:'#000',fontFamily:'Orbitron,sans-serif',letterSpacing:'0.05em'}}>UPLOADING...</span>
                </>
              ) : (
                <>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={dragging ? '#000' : '#ccc'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{transition:'stroke 0.2s'}}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <span style={{fontSize:'14px',fontWeight:'600',color:'#000',fontFamily:'Orbitron,sans-serif'}}>
                    {dragging ? 'DROP FILE' : 'UPLOAD FILE'}
                  </span>
                  <span className="drag-hint" style={{fontSize:'11px',color:'#ccc',fontFamily:'Orbitron,sans-serif'}}>or drag and drop</span>
                </>
              )}
              <input type="file" ref={fileRef} style={{display:'none'}} onChange={(e) => e.target.files[0] && handleUpload(e.target.files[0])} />
            </div>
          )}

          {error && (
            <div style={{marginTop:'12px',padding:'12px 16px',border:'1px solid #fca5a5',borderRadius:'8px',background:'#fff5f5',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:'11px',color:'#dc2626',fontFamily:'Orbitron,sans-serif'}}>{error}</span>
              <button onClick={reset} style={{fontSize:'11px',color:'#999',fontFamily:'Orbitron,sans-serif',background:'none',border:'none',cursor:'pointer',textDecoration:'underline'}}>RETRY</button>
            </div>
          )}

          {result && (
            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              <div style={{border:'2px solid #000',borderRadius:'12px',padding:'14px 16px',display:'flex',alignItems:'center',gap:'12px',minWidth:0,background:'#fff',boxShadow:'0 0 18px 2px rgba(0,0,0,0.18)'}}>
                <span style={{fontFamily:'Orbitron,sans-serif',fontSize:'14px',color:'#000',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                  {result}
                </span>
                <button
                  onClick={handleCopy}
                  style={{flexShrink:0,padding:'4px',border:'none',background:'none',cursor:'pointer',color:copied ? '#16a34a' : '#000',display:'flex',alignItems:'center'}}
                >
                  {copied
                    ? <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    : <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  }
                </button>
              </div>
              <button
                onClick={reset}
                style={{width:'100%',padding:'10px',fontSize:'14px',color:'#000',fontWeight:'600',fontFamily:'Orbitron,sans-serif',background:'none',border:'none',cursor:'pointer',WebkitTapHighlightColor:'transparent',touchAction:'manipulation'}}
              >
                Upload another file
              </button>
            </div>
          )}

        </div>
      );
    }

    ReactDOM.createRoot(document.getElementById('root')).render(<App />);
  </script>
  <script>
    const sendHeight = () => window.parent.postMessage({ iframeHeight: document.body.scrollHeight + 24 }, '*');
    new MutationObserver(sendHeight).observe(document.body, { childList: true, subtree: true, attributes: true });
    window.addEventListener('load', sendHeight);
  </script>
</body>
</html>`);
});

app.post('/', (req, res) => {
  const busboy = Busboy({ headers: req.headers });
  let customerId = 'guest';

  busboy.on('field', (name, value) => {
    if (name === 'customerId') customerId = value;
  });

  busboy.on('file', async (name, stream, info) => {
    const fileName = info.filename;
    const ext = fileName.split('.').pop().toLowerCase();
    const fileType = ext === 'zip' ? 'zip' : ext;
    const timestamp = new Date().toISOString();

    const form = new FormData();
    form.append(name, stream, fileName);

    let status, url;
    try {
      const upstream = await fetch(process.env.WORKER_URL, {
        method: 'POST',
        body: form,
        headers: form.getHeaders(),
      });
      const data = await upstream.json();
      url = data.url;
      status = 'success';
      res.json(data);
    } catch (err) {
      status = `error: ${err.message}`;
      console.error('Upload failed:', err.message);
      res.status(500).json({ error: err.message });
    }

    logToZoho({ timestamp, fileName, fileType, status, url: url || '', customerId })
      .catch(err => console.error('Zoho log failed:', err.message));
  });

  req.pipe(busboy);
});

app.listen(process.env.PORT, () => {
  console.log(`listening on ${process.env.PORT}`);
});
