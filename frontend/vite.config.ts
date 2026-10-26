import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';

function cloudSyncPlugin(): Plugin {
  return {
    name: 'cloud-sync-plugin',
    configureServer(server) {
      setupCloudSyncMiddlewares(server);
    },
    configurePreviewServer(server) {
      setupCloudSyncMiddlewares(server);
    }
  };
}

function setupCloudSyncMiddlewares(server: any) {
  const usersDir = path.resolve(process.cwd(), 'data/users');
  if (!fs.existsSync(usersDir)) {
    fs.mkdirSync(usersDir, { recursive: true });
  }

  const getUserFile = (email: string) => {
    const clean = email.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return path.join(usersDir, `${clean}.json`);
  };

  const parseJsonBody = (req: any): Promise<any> => {
    return new Promise((resolve) => {
      let body = '';
      req.on('data', (chunk: any) => { body += chunk; });
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch {
          resolve({});
        }
      });
    });
  };

  server.middlewares.use(async (req: any, res: any, next: any) => {
    const url = req.url || '';

    // 1. Auth Register
    if (url === '/api/auth/register' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { name, email, password, goal } = body;
      if (!email) {
        res.statusCode = 400;
        res.end(JSON.stringify({ ok: false, error: 'Email requerido' }));
        return;
      }
      const file = getUserFile(email);
      const userData = {
        user: {
          id: `user_${email.replace(/[^a-z0-9]/g, '_')}`,
          name: name || email.split('@')[0],
          email,
          goal: goal || 'hypertrophy',
          created_at: new Date().toISOString()
        },
        password,
        snapshot: null,
        updated_at: new Date().toISOString()
      };
      fs.writeFileSync(file, JSON.stringify(userData, null, 2), 'utf-8');
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: true, user: userData.user, snapshot: null }));
      return;
    }

    // 2. Auth Login
    if (url === '/api/auth/login' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { email, password } = body;
      if (!email) {
        res.statusCode = 400;
        res.end(JSON.stringify({ ok: false, error: 'Email requerido' }));
        return;
      }
      const file = getUserFile(email);
      if (fs.existsSync(file)) {
        const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
        if (data.password && data.password !== password) {
          res.statusCode = 401;
          res.end(JSON.stringify({ ok: false, error: 'Contraseña incorrecta' }));
          return;
        }
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true, user: data.user, snapshot: data.snapshot || null }));
        return;
      }
      // Auto create account for frictionless experience
      const userData = {
        user: {
          id: `user_${email.replace(/[^a-z0-9]/g, '_')}`,
          name: email.split('@')[0],
          email,
          goal: 'hypertrophy',
          created_at: new Date().toISOString()
        },
        password,
        snapshot: null,
        updated_at: new Date().toISOString()
      };
      fs.writeFileSync(file, JSON.stringify(userData, null, 2), 'utf-8');
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: true, user: userData.user, snapshot: null }));
      return;
    }

    // 3. Cloud Sync Save & Pull
    if (url.startsWith('/api/sync')) {
      if (req.method === 'POST') {
        const body = await parseJsonBody(req);
        const { email, snapshot } = body;
        if (email && snapshot) {
          const file = getUserFile(email);
          let existing: any = {};
          if (fs.existsSync(file)) {
            try { existing = JSON.parse(fs.readFileSync(file, 'utf-8')); } catch {}
          }
          existing.snapshot = snapshot;
          existing.updated_at = new Date().toISOString();
          fs.writeFileSync(file, JSON.stringify(existing, null, 2), 'utf-8');
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: true, updated_at: existing.updated_at }));
          return;
        }
      } else if (req.method === 'GET') {
        const parsedUrl = new URL(url, 'http://localhost');
        const email = parsedUrl.searchParams.get('email');
        if (email) {
          const file = getUserFile(email);
          if (fs.existsSync(file)) {
            try {
              const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true, snapshot: data.snapshot || null }));
              return;
            } catch {}
          }
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: true, snapshot: null }));
          return;
        }
      }
    }

    next();
  });
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    cloudSyncPlugin()
  ],
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
    hmr: {
      clientPort: 443
    }
  },
  preview: {
    host: true,
    port: 5173,
    allowedHosts: true
  }
});
