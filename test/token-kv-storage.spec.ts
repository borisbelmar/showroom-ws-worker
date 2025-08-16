import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect, beforeEach } from 'vitest';
import worker from '../src/index';

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe('KV Storage Integration with Tokens', () => {
	const testToken = 'test-token-123';
	const testToken2 = 'test-token-456';

	beforeEach(async () => {
		// Limpiar el storage antes de cada test para ambos tokens
		await env.SHOWROOM_KV.delete(`last_card:${testToken}`);
		await env.SHOWROOM_KV.delete(`last_card:${testToken2}`);
	});

	describe('Last Card API with Token', () => {
		it('should return no card found initially', async () => {
			const response = await SELF.fetch(`https://example.com/api/${testToken}/last-card`);
			
			expect(response.status).toBe(200);
			const body = await response.json() as any;
			expect(body.message).toBe('No card found');
			expect(body.card).toBe(null);
			expect(body.timestamp).toBe(null);
		});

		it('should require token parameter', async () => {
			const response = await SELF.fetch('https://example.com/api//last-card');
			expect(response.status).toBe(404); // No token provided
		});

		it('should store and retrieve cards with TTL per token', async () => {
			// Simular almacenamiento directo en KV con TTL para token 1
			const cardData1 = {
				card: '🎭',
				timestamp: new Date().toISOString(),
				version: 1
			};

			// Simular almacenamiento directo en KV con TTL para token 2
			const cardData2 = {
				card: '🃏',
				timestamp: new Date().toISOString(),
				version: 1
			};

			// Almacenar con TTL de 1 día (86400 segundos)
			await env.SHOWROOM_KV.put(
				`last_card:${testToken}`, 
				JSON.stringify(cardData1),
				{ expirationTtl: 86400 }
			);

			await env.SHOWROOM_KV.put(
				`last_card:${testToken2}`, 
				JSON.stringify(cardData2),
				{ expirationTtl: 86400 }
			);

			// Verificar que cada token tiene su propia carta
			const response1 = await SELF.fetch(`https://example.com/api/${testToken}/last-card`);
			expect(response1.status).toBe(200);
			const body1 = await response1.json() as any;
			expect(body1.card).toBe('🎭');

			const response2 = await SELF.fetch(`https://example.com/api/${testToken2}/last-card`);
			expect(response2.status).toBe(200);
			const body2 = await response2.json() as any;
			expect(body2.card).toBe('🃏');
		});

		it('should clear last card for specific token only', async () => {
			// Almacenar cartas para ambos tokens
			const cardData1 = { card: '🎭', timestamp: new Date().toISOString(), version: 1 };
			const cardData2 = { card: '🃏', timestamp: new Date().toISOString(), version: 1 };

			await env.SHOWROOM_KV.put(`last_card:${testToken}`, JSON.stringify(cardData1));
			await env.SHOWROOM_KV.put(`last_card:${testToken2}`, JSON.stringify(cardData2));

			// Eliminar solo la carta del primer token
			const deleteResponse = await SELF.fetch(`https://example.com/api/${testToken}/last-card`, {
				method: 'DELETE'
			});
			
			expect(deleteResponse.status).toBe(200);
			const deleteBody = await deleteResponse.json() as any;
			expect(deleteBody.message).toBe('Last card cleared successfully');

			// Verificar que el primer token ya no tiene carta
			const getResponse1 = await SELF.fetch(`https://example.com/api/${testToken}/last-card`);
			const getBody1 = await getResponse1.json() as any;
			expect(getBody1.message).toBe('No card found');

			// Verificar que el segundo token sigue teniendo su carta
			const getResponse2 = await SELF.fetch(`https://example.com/api/${testToken2}/last-card`);
			const getBody2 = await getResponse2.json() as any;
			expect(getBody2.card).toBe('🃏');
		});

		it('should handle malformed data in KV gracefully', async () => {
			// Insertar datos malformados
			await env.SHOWROOM_KV.put(`last_card:${testToken}`, 'invalid json');

			const response = await SELF.fetch(`https://example.com/api/${testToken}/last-card`);
			
			expect(response.status).toBe(500);
			const body = await response.json() as any;
			expect(body.error).toBe('Invalid card data found');
		});
	});

	describe('Token Isolation', () => {
		it('should maintain separate states for different tokens', async () => {
			// Almacenar diferentes cartas para cada token
			const cardData1 = { card: '♠️', timestamp: new Date().toISOString(), version: 1 };
			const cardData2 = { card: '♥️', timestamp: new Date().toISOString(), version: 1 };

			await env.SHOWROOM_KV.put(`last_card:${testToken}`, JSON.stringify(cardData1));
			await env.SHOWROOM_KV.put(`last_card:${testToken2}`, JSON.stringify(cardData2));

			// Verificar que cada token mantiene su estado independiente
			const response1 = await SELF.fetch(`https://example.com/api/${testToken}/last-card`);
			const body1 = await response1.json() as any;
			expect(body1.card).toBe('♠️');

			const response2 = await SELF.fetch(`https://example.com/api/${testToken2}/last-card`);
			const body2 = await response2.json() as any;
			expect(body2.card).toBe('♥️');

			// Modificar solo un token
			const deleteResponse = await SELF.fetch(`https://example.com/api/${testToken}/last-card`, {
				method: 'DELETE'
			});
			expect(deleteResponse.status).toBe(200);

			// Verificar que solo se afectó el token específico
			const afterDelete1 = await SELF.fetch(`https://example.com/api/${testToken}/last-card`);
			const afterDeleteBody1 = await afterDelete1.json() as any;
			expect(afterDeleteBody1.message).toBe('No card found');

			const afterDelete2 = await SELF.fetch(`https://example.com/api/${testToken2}/last-card`);
			const afterDeleteBody2 = await afterDelete2.json() as any;
			expect(afterDeleteBody2.card).toBe('♥️'); // Sin cambios
		});
	});

	describe('Background Color API with Token', () => {
		it('should return no background found initially', async () => {
			const response = await SELF.fetch(`https://example.com/api/${testToken}/last-background`);
			
			expect(response.status).toBe(200);
			const body = await response.json() as any;
			expect(body.message).toBe('No background found');
			expect(body.backgroundColor).toBe(null);
			expect(body.timestamp).toBe(null);
		});

		it('should store and retrieve background colors with TTL per token', async () => {
			// Simular almacenamiento directo en KV con TTL para background
			const backgroundData1 = {
				backgroundColor: '#FF0000',
				timestamp: new Date().toISOString(),
				version: 1
			};

			const backgroundData2 = {
				backgroundColor: '#00FF00',
				timestamp: new Date().toISOString(),
				version: 1
			};

			// Almacenar con TTL de 1 día (86400 segundos)
			await env.SHOWROOM_KV.put(
				`last_background:${testToken}`, 
				JSON.stringify(backgroundData1),
				{ expirationTtl: 86400 }
			);

			await env.SHOWROOM_KV.put(
				`last_background:${testToken2}`, 
				JSON.stringify(backgroundData2),
				{ expirationTtl: 86400 }
			);

			// Verificar que cada token tiene su propio background
			const response1 = await SELF.fetch(`https://example.com/api/${testToken}/last-background`);
			expect(response1.status).toBe(200);
			const body1 = await response1.json() as any;
			expect(body1.backgroundColor).toBe('#FF0000');

			const response2 = await SELF.fetch(`https://example.com/api/${testToken2}/last-background`);
			expect(response2.status).toBe(200);
			const body2 = await response2.json() as any;
			expect(body2.backgroundColor).toBe('#00FF00');
		});

		it('should clear background for specific token only', async () => {
			// Almacenar backgrounds para ambos tokens
			const backgroundData1 = { backgroundColor: '#FF0000', timestamp: new Date().toISOString(), version: 1 };
			const backgroundData2 = { backgroundColor: '#00FF00', timestamp: new Date().toISOString(), version: 1 };

			await env.SHOWROOM_KV.put(`last_background:${testToken}`, JSON.stringify(backgroundData1));
			await env.SHOWROOM_KV.put(`last_background:${testToken2}`, JSON.stringify(backgroundData2));

			// Eliminar solo el background del primer token
			const deleteResponse = await SELF.fetch(`https://example.com/api/${testToken}/last-background`, {
				method: 'DELETE'
			});
			
			expect(deleteResponse.status).toBe(200);
			const deleteBody = await deleteResponse.json() as any;
			expect(deleteBody.message).toBe('Last background cleared successfully');

			// Verificar que el primer token ya no tiene background
			const getResponse1 = await SELF.fetch(`https://example.com/api/${testToken}/last-background`);
			const getBody1 = await getResponse1.json() as any;
			expect(getBody1.message).toBe('No background found');

			// Verificar que el segundo token sigue teniendo su background
			const getResponse2 = await SELF.fetch(`https://example.com/api/${testToken2}/last-background`);
			const getBody2 = await getResponse2.json() as any;
			expect(getBody2.backgroundColor).toBe('#00FF00');
		});
	});
});
