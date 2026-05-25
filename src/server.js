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
  body { background: transparent; font-family: sans-serif; }
</style>
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
        fd.append('customerId', window.__CUSTOMER__);
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
        <div style={{width:'100%'}}>
          {!uploading && (
            <div
              onClick={() => !result && fileRef.current?.click()}
              style={{
                cursor: result ? 'default' : 'pointer',
                border: '2px dashed #ccc',
                boxShadow: '0 0 18px 2px rgba(0,0,0,0.18)',
                borderRadius: '12px',
                padding: '48px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: result ? 0.4 : 1,
                pointerEvents: result ? 'none' : 'auto',
                transition: 'border-color 0.2s',
                background: '#fff',
              }}
            >
              <span style={{fontSize:'14px',fontWeight:'600',color:'#000',fontFamily:'Orbitron,sans-serif'}}>Upload File</span>
              <input type="file" ref={fileRef} style={{display:'none'}} onChange={(e) => e.target.files[0] && handleUpload(e.target.files[0])} />
            </div>
          )}
          {uploading && (
            <div style={{border:'2px dashed #ccc',borderRadius:'12px',padding:'48px 16px',display:'flex',alignItems:'center',justifyContent:'center',background:'#fff'}}>
              <span style={{fontSize:'14px',color:'#000',fontFamily:'Orbitron,sans-serif'}}>Uploading...</span>
            </div>
          )}
          <div style={{marginTop:'60px',display:'flex',flexDirection:'column',gap:'12px'}}>
            <div style={{border:'2px solid #000',borderRadius:'12px',padding:'14px 16px',display:'flex',alignItems:'center',gap:'12px',minWidth:0,background:'#fff'}}>
              <span style={{fontFamily:'Orbitron,sans-serif',fontSize:'14px',color:'#000',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                {result || ''}
              </span>
              <button
                onClick={handleCopy}
                disabled={!result}
                style={{
                  flexShrink:0,
                  padding:'4px',
                  border:'none',
                  background:'none',
                  cursor: result ? 'pointer' : 'not-allowed',
                  color: result ? '#000' : '#ccc',
                  display:'flex',
                  alignItems:'center',
                }}
              >
                {copied
                  ? <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  : <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                }
              </button>
            </div>
            {result && (
              <button
                onClick={() => setResult(null)}
                style={{width:'100%',padding:'10px',fontSize:'14px',color:'#000',fontWeight:'600',background:'none',border:'none',cursor:'pointer'}}
              >
                Upload another file
              </button>
            )}
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
