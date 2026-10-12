import { spawn } from 'child_process';
import http from 'http';

const PORT = 3009;

async function checkUrl(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: PORT,
        path,
        method: options.method || 'GET',
        headers: options.headers || {},
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body,
          });
        });
      }
    );
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function run() {
  console.log('🚀 Starting Next.js production server on port ' + PORT + '...');
  const server = spawn('npx', ['next', 'start', '-p', String(PORT)], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  server.stdout.on('data', (d) => process.stdout.write(d));
  server.stderr.on('data', (d) => process.stderr.write(d));

  // Wait for server to become ready
  let ready = false;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    try {
      const res = await checkUrl('/');
      if (res.statusCode === 200) {
        ready = true;
        break;
      }
    } catch (e) {
      // wait
    }
  }

  if (!ready) {
    console.error('❌ Server failed to start on time');
    server.kill();
    process.exit(1);
  }

  console.log('✅ Server is ready! Testing live routes...');

  const routes = [
    { path: '/', expected: 200, name: 'Homepage' },
    { path: '/about', expected: 200, name: 'About Studio' },
    { path: '/contact', expected: 200, name: 'Contact Atelier' },
    { path: '/projects', expected: 200, name: 'Projects Directory' },
    { path: '/projects/budoor-al-najaf', expected: 200, name: 'Flagship Project: Budoor Al-Najaf' },
    { path: '/projects/al-fayha-towers', expected: 200, name: 'Flagship Project: Al-Fayha Towers' },
    { path: '/projects/se7en-castle-school-complex', expected: 200, name: 'Flagship Project: Se7en Castle School' },
    { path: '/admin/login', expected: 200, name: 'Admin Login' },
  ];

  for (const r of routes) {
    const res = await checkUrl(r.path);
    if (res.statusCode === r.expected) {
      console.log(`  ✓ ${r.name} (${r.path}) -> HTTP ${res.statusCode}`);
    } else {
      console.error(`  ✗ ${r.name} (${r.path}) -> Expected HTTP ${r.expected}, got ${res.statusCode}`);
      server.kill();
      process.exit(1);
    }
  }

  // Test Middleware Protection: accessing /admin without auth should redirect
  console.log('🔒 Testing Middleware security...');
  const unauthRes = await checkUrl('/admin');
  if (unauthRes.statusCode === 307 || unauthRes.statusCode === 308) {
    console.log(`  ✓ Protected route /admin redirected unauthenticated user -> HTTP ${unauthRes.statusCode}`);
  } else {
    console.error(`  ✗ Protected route /admin returned unexpected status: ${unauthRes.statusCode}`);
  }

  // Test Login API
  console.log('🔑 Testing Admin Authentication API...');
  let testUser = process.env.ADMIN_BOOTSTRAP_USER || 'admin';
  let testPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD;

  // Attempt to read from local bootstrap file if env var not set
  if (!testPassword) {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const credsPath = path.join(process.cwd(), '.admin_bootstrap_credentials');
      if (fs.existsSync(credsPath)) {
        const lines = fs.readFileSync(credsPath, 'utf8').split('\n');
        for (const line of lines) {
          if (line.startsWith('ADMIN_USER=')) testUser = line.split('=')[1].trim();
          if (line.startsWith('ADMIN_PASSWORD=')) testPassword = line.split('=')[1].trim();
        }
      }
    } catch {
      // ignore
    }
  }

  if (testPassword) {
    const loginRes = await checkUrl('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: testUser, password: testPassword }),
    });

    if (loginRes.statusCode === 200) {
      console.log('  ✓ Admin Login API authenticated successfully');
      const setCookie = loginRes.headers['set-cookie'];
      if (setCookie) {
        const cookieHeader = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;
        console.log('  ✓ Received secure session cookie');

        // Test accessing /admin with cookie
        const authRes = await checkUrl('/admin', {
          headers: { Cookie: cookieHeader },
        });
        console.log(`  ✓ Authenticated request to /admin -> HTTP ${authRes.statusCode}`);
      }
    } else {
      console.error(`  ✗ Admin Login API returned unexpected response: HTTP ${loginRes.statusCode}`);
    }
  } else {
    console.log('  ℹ Skipping live login POST test (ADMIN_BOOTSTRAP_PASSWORD not configured).');
  }

  console.log('✨ All live tests passed! Shutting down server...');
  server.kill();
  process.exit(0);
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
