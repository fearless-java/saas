import { app } from '@/lib/hono';
import { readFile } from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

app.get('/api/uploads/:filename', async (c) => {
  const filename = c.req.param('filename');
  
  try {
    const filepath = path.join(UPLOAD_DIR, filename);
    const buffer = await readFile(filepath);
    
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.webp') contentType = 'image/webp';
    
    return new Response(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    return c.json({ success: false, error: 'File not found' }, 404);
  }
});