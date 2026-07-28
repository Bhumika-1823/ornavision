import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import fs from 'fs';

const dbPath = path.resolve(import.meta.dirname, 'db.json');

const readDb = () => {
  try {
    const data = fs.readFileSync(dbPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { users: [], carts: {}, orders: [] };
  }
};

const writeDb = (data: any) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

function apiPlugin() {
  return {
    name: 'api-plugin',
    configureServer(server: any) {
      server.middlewares.use('/api', (req: any, res: any, next: any) => {
        if (!req.url) return next();
        
        let body = '';
        req.on('data', (chunk: any) => { body += chunk; });
        req.on('end', () => {
          const parsedBody = body ? JSON.parse(body) : {};
          const db = readDb();
          
          res.setHeader('Content-Type', 'application/json');
          
          if (req.method === 'POST' && req.url === '/auth/login') {
            const email = typeof parsedBody.email === 'string' ? parsedBody.email.toLowerCase() : parsedBody.email;
            const user = db.users.find((u: any) => u.email.toLowerCase() === email && u.password === parsedBody.password);
            if (user) {
              return res.end(JSON.stringify({ success: true, user: { name: user.name, email: user.email } }));
            }
            res.statusCode = 401;
            return res.end(JSON.stringify({ success: false, error: 'Invalid credentials' }));
          }
          
          if (req.method === 'POST' && req.url === '/auth/register') {
            const email = typeof parsedBody.email === 'string' ? parsedBody.email.toLowerCase() : parsedBody.email;
            const exists = db.users.find((u: any) => u.email.toLowerCase() === email);
            if (exists) {
              res.statusCode = 400;
              return res.end(JSON.stringify({ success: false, error: 'User exists' }));
            }
            const normalizedUser = { ...parsedBody, email };
            db.users.push(normalizedUser);
            writeDb(db);
            return res.end(JSON.stringify({ success: true, user: { name: normalizedUser.name, email: normalizedUser.email } }));
          }
          
          if (req.method === 'GET' && req.url.startsWith('/cart')) {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const email = url.searchParams.get('email');
            if (email) {
              return res.end(JSON.stringify(db.carts[email] || []));
            }
            return res.end(JSON.stringify([]));
          }
          
          if (req.method === 'POST' && req.url === '/cart') {
            const { email, cart } = parsedBody;
            db.carts[email] = cart;
            writeDb(db);
            return res.end(JSON.stringify({ success: true }));
          }

          if (req.method === 'GET' && req.url.startsWith('/orders')) {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const email = url.searchParams.get('email');
            if (email) {
              return res.end(JSON.stringify(db.orders.filter((o: any) => o.email === email)));
            }
            return res.end(JSON.stringify(db.orders || []));
          }
          
          if (req.method === 'POST' && req.url === '/orders') {
            const { order } = parsedBody;
            db.orders.push(order);
            writeDb(db);
            return res.end(JSON.stringify({ success: true }));
          }

          if (req.method === 'PUT' && req.url === '/orders') {
            const { order } = parsedBody;
            db.orders = db.orders.map((existing: any) =>
              existing.id === order.id ? order : existing,
            );
            writeDb(db);
            return res.end(JSON.stringify({ success: true }));
          }
          
          next();
        });
      });
    }
  };
}

// Standalone config (de-coupled from the original Replit monorepo).
// PORT and BASE_PATH are now optional, with sane local-dev defaults,
// instead of throwing if unset.
const port = Number(process.env.PORT) || 5173;
const basePath = process.env.BASE_PATH || '/';

export default defineConfig({
  base: basePath,
  plugins: [react(), tailwindcss(), apiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist'),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: false,
    host: '0.0.0.0',
  },
  preview: {
    port,
    host: '0.0.0.0',
  },
});
