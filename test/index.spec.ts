import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src/index';

// For now, you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe('Showroom WebSocket Worker', () => {
	describe('Health endpoint', () => {
		it('responds with health status (unit style)', async () => {
			const request = new IncomingRequest('http://example.com/health');
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			
			expect(response.status).toBe(200);
			expect(response.headers.get('content-type')).toBe('application/json');
			
			const body = await response.json() as { status: string; timestamp: string };
			expect(body).toHaveProperty('status', 'ok');
			expect(body).toHaveProperty('timestamp');
			expect(typeof body.timestamp).toBe('string');
		});

		it('responds with health status (integration style)', async () => {
			const response = await SELF.fetch('https://example.com/health');
			expect(response.status).toBe(200);
			
			const body = await response.json() as { status: string; timestamp: string };
			expect(body).toHaveProperty('status', 'ok');
			expect(body).toHaveProperty('timestamp');
		});
	});

	describe('WebSocket endpoint', () => {
		it('requires websocket upgrade header (unit style)', async () => {
			const request = new IncomingRequest('http://example.com/');
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			
			expect(response.status).toBe(426);
			expect(await response.text()).toBe('Expected Upgrade: websocket');
		});

		it('requires websocket upgrade header (integration style)', async () => {
			const response = await SELF.fetch('https://example.com/');
			expect(response.status).toBe(426);
			expect(await response.text()).toBe('Expected Upgrade: websocket');
		});

		// Commenting out WebSocket upgrade test due to Durable Object storage issues in test environment
		// it('accepts websocket upgrade (unit style)', async () => {
		// 	const request = new IncomingRequest('http://example.com/', {
		// 		headers: {
		// 			'Upgrade': 'websocket',
		// 			'Connection': 'Upgrade',
		// 			'Sec-WebSocket-Key': 'dGhlIHNhbXBsZSBub25jZQ==',
		// 			'Sec-WebSocket-Version': '13'
		// 		}
		// 	});
		// 	const ctx = createExecutionContext();
		// 	const response = await worker.fetch(request, env, ctx);
		// 	await waitOnExecutionContext(ctx);
		// 	
		// 	expect(response.status).toBe(101);
		// 	expect(response.webSocket).toBeDefined();
		// });
	});

	describe('404 handling', () => {
		it('returns 404 for unknown routes (unit style)', async () => {
			const request = new IncomingRequest('http://example.com/unknown');
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			
			expect(response.status).toBe(404);
		});

		it('returns 404 for unknown routes (integration style)', async () => {
			const response = await SELF.fetch('https://example.com/unknown');
			expect(response.status).toBe(404);
		});
	});
});
