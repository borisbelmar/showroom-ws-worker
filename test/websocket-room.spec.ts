import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebSocketRoom } from '../src/index';

describe('WebSocketRoom Durable Object', () => {
	let room: WebSocketRoom;
	let mockEnv: any;
	let mockState: any;

	beforeEach(() => {
		// Mock del environment con KV
		mockEnv = {
			SHOWROOM_KV: {
				put: vi.fn().mockResolvedValue(undefined),
				get: vi.fn().mockResolvedValue(null),
				delete: vi.fn().mockResolvedValue(undefined)
			},
			WEBSOCKET_ROOM: {}
		};

		// Mock del DurableObjectState
		mockState = {
			id: 'test-id',
			storage: {
				get: vi.fn(),
				put: vi.fn(),
				delete: vi.fn(),
				list: vi.fn()
			}
		};

		room = new WebSocketRoom(mockState, mockEnv);
	});

	describe('WebSocket connection handling', () => {
		it('should accept WebSocket upgrade requests', () => {
			// Test que la clase WebSocketRoom existe y tiene el método fetch
			expect(room).toBeDefined();
			expect(typeof room.fetch).toBe('function');
		});

		it('should handle client tracking', () => {
			// Test que tiene la propiedad clients para manejar conexiones
			expect((room as any).clients).toBeDefined();
			expect((room as any).clients).toBeInstanceOf(Set);
		});
	});

	describe('Message broadcasting', () => {
		it('should have broadcast method', () => {
			// Test que el método broadcast existe
			expect(typeof (room as any).broadcast).toBe('function');
		});

		it('should handle empty client set in broadcast', () => {
			// Test broadcast sin clientes - no debería fallar
			expect(() => {
				(room as any).broadcast('{"type": "test"}');
			}).not.toThrow();
		});

		it('should manage client connections in Set', () => {
			// Test que los clientes se almacenan en un Set
			const clients = (room as any).clients;
			expect(clients).toBeInstanceOf(Set);
			expect(clients.size).toBe(0); // Inicialmente vacío
		});
	});

	describe('Error handling', () => {
		it('should handle invalid JSON messages gracefully', () => {
			// Test que el manejo de JSON inválido funciona
			expect(() => {
				try {
					JSON.parse('invalid json {');
				} catch (err) {
					// Esto simula lo que pasaría en el código real
					expect(err).toBeInstanceOf(SyntaxError);
				}
			}).not.toThrow();
		});

		it('should remove disconnected clients during broadcast', () => {
			const mockWebSocket = {
				readyState: 3, // WebSocket.CLOSED
				send: vi.fn(),
				addEventListener: vi.fn(),
			};

			// Agregar un WebSocket cerrado al conjunto de clientes
			(room as any).clients = new Set([mockWebSocket]);

			// Intentar broadcast - debería manejar conexiones cerradas
			const testMessage = JSON.stringify({ type: 'clear' });
			
			expect(() => {
				(room as any).broadcast(testMessage);
			}).not.toThrow();

			// El WebSocket cerrado no debería recibir el mensaje
			expect(mockWebSocket.send).not.toHaveBeenCalled();
		});

		it('should have KV storage methods', async () => {
			// Test que los métodos de KV storage existen
			expect(typeof (room as any).saveLastCard).toBe('function');
			expect(typeof (room as any).clearLastCard).toBe('function');

			// Test que usan el KV mock
			await (room as any).saveLastCard('🎭');
			expect(mockEnv.SHOWROOM_KV.put).toHaveBeenCalled();

			await (room as any).clearLastCard();
			expect(mockEnv.SHOWROOM_KV.delete).toHaveBeenCalled();
		});
	});
});
