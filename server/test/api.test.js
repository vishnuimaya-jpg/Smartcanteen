import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';

const testSecret = 'test-only-secret-that-is-at-least-32-chars';
process.env.JWT_SECRET = testSecret;
process.env.DB_HOST = '127.0.0.1';
process.env.DB_USER = 'test';
process.env.DB_NAME = 'smartcanteen_test';

let server;
let baseUrl;

before(async () => {
  const { default: app } = await import('../src/app.js');
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test('health endpoint responds without exposing configuration', async () => {
  const response = await fetch(`${baseUrl}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
});

test('CORS preflight allows the configured local frontend origin', async () => {
  const response = await fetch(`${baseUrl}/auth/login`, {
    method: 'OPTIONS',
    headers: {
      origin: 'http://localhost:5173',
      'access-control-request-method': 'POST',
      'access-control-request-headers': 'content-type'
    }
  });
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:5173');
});

test('registration rejects invalid input before database access', async () => {
  const response = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'A', email: 'not-an-email', password: 'short' })
  });
  assert.equal(response.status, 400);
  assert.match((await response.json()).message, /Name must|valid email|at least 8/i);
});

test('login rejects malformed credentials before database access', async () => {
  const response = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'not-an-email', password: '' })
  });
  assert.equal(response.status, 400);
});

test('student order and admin APIs reject unauthenticated requests', async () => {
  for (const [url, options] of [
    [`${baseUrl}/orders/mine`, {}],
    [`${baseUrl}/orders`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({}) }],
    [`${baseUrl}/admin/orders`, {}],
    [`${baseUrl}/foods`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({}) }]
  ]) {
    const response = await fetch(url, options);
    assert.equal(response.status, 401, `${url} should require authentication`);
  }
});

test('student JWTs cannot access administrator APIs', async () => {
  const token = jwt.sign({ email: 'student@example.edu', role: 'student' }, testSecret, { subject: '1' });
  const response = await fetch(`${baseUrl}/admin/orders`, { headers: { authorization: `Bearer ${token}` } });
  assert.equal(response.status, 403);
  assert.match((await response.json()).message, /Administrator access/);
});

test('food detail rejects malformed IDs before database access', async () => {
  const response = await fetch(`${baseUrl}/foods/0`);
  assert.equal(response.status, 400);
});
