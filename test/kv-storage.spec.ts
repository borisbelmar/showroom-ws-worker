import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect, beforeEach } from 'vitest';
import worker from '../src/index';

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe('KV Storage Integration', () => {
	// Clear KV before each test
	beforeEach(async () => {
		await env.SHOWROOM_KV.delete('last_card');
	});

	describe('Last Card API', () => {
		it('should return 404 when no card exists', async () => {
			const request = new IncomingRequest('http://example.com/api/last-card');
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			
			expect(response.status).toBe(404);
			const body = await response.json() as { message: string; card: null; timestamp: null };
			expect(body.message).toBe('No card found');
			expect(body.card).toBeNull();
			expect(body.timestamp).toBeNull();
		});

		it('should store and retrieve a card via KV', async () => {
			// First, manually store a card
			const testCard = { id: 1, name: 'Test Card', power: 100 };
			const cardData = {
				card: testCard,
				timestamp: new Date().toISOString(),
				version: 1
			};
			await env.SHOWROOM_KV.put('last_card', JSON.stringify(cardData));

			// Then retrieve it via API
			const request = new IncomingRequest('http://example.com/api/last-card');
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			
			expect(response.status).toBe(200);
			const body = await response.json() as { 
				message: string; 
				card: any; 
				timestamp: string;
				version: number;
			};
			expect(body.message).toBe('Last card retrieved successfully');
			expect(body.card).toEqual(testCard);
			expect(body.version).toBe(1);
			expect(typeof body.timestamp).toBe('string');
		});

		it('should handle malformed data in KV gracefully', async () => {
			// Store malformed JSON
			await env.SHOWROOM_KV.put('last_card', 'invalid json');

			const request = new IncomingRequest('http://example.com/api/last-card');
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			
			expect(response.status).toBe(500);
			const body = await response.json() as { error: string; message: string };
			expect(body.error).toBe('Failed to retrieve last card');
			expect(body.message).toBe('Internal server error');
		});
	});

	describe('Clear Last Card API', () => {
		it('should clear last card from KV', async () => {
			// First, store a card
			const testCard = { id: 1, name: 'Test Card' };
			const cardData = {
				card: testCard,
				timestamp: new Date().toISOString(),
				version: 1
			};
			await env.SHOWROOM_KV.put('last_card', JSON.stringify(cardData));

			// Verify it exists
			const getResponse1 = await SELF.fetch('https://example.com/api/last-card');
			expect(getResponse1.status).toBe(200);

			// Clear it
			const deleteRequest = new IncomingRequest('http://example.com/api/last-card', {
				method: 'DELETE'
			});
			const ctx = createExecutionContext();
			const deleteResponse = await worker.fetch(deleteRequest, env, ctx);
			await waitOnExecutionContext(ctx);
			
			expect(deleteResponse.status).toBe(200);
			const body = await deleteResponse.json() as { message: string; timestamp: string };
			expect(body.message).toBe('Last card cleared successfully');
			expect(typeof body.timestamp).toBe('string');

			// Verify it's gone
			const getResponse2 = await SELF.fetch('https://example.com/api/last-card');
			expect(getResponse2.status).toBe(404);
		});
	});

	describe('Integration tests', () => {
		it('should work with integration style requests', async () => {
			// Test GET when no card exists
			const getResponse1 = await SELF.fetch('https://example.com/api/last-card');
			expect(getResponse1.status).toBe(404);

			// Manually add a card
			const testCard = { id: 2, name: 'Integration Test Card', type: 'Fire' };
			const cardData = {
				card: testCard,
				timestamp: new Date().toISOString(),
				version: 1
			};
			await env.SHOWROOM_KV.put('last_card', JSON.stringify(cardData));

			// Test GET when card exists
			const getResponse2 = await SELF.fetch('https://example.com/api/last-card');
			expect(getResponse2.status).toBe(200);
			const getBody = await getResponse2.json() as { card: any };
			expect(getBody.card).toEqual(testCard);

			// Test DELETE
			const deleteResponse = await SELF.fetch('https://example.com/api/last-card', {
				method: 'DELETE'
			});
			expect(deleteResponse.status).toBe(200);

			// Verify deletion
			const getResponse3 = await SELF.fetch('https://example.com/api/last-card');
			expect(getResponse3.status).toBe(404);
		});
	});
});
