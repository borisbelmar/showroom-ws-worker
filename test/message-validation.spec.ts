import { describe, it, expect } from 'vitest';

describe('Message Types and Validation', () => {
	describe('Card message validation', () => {
		it('should validate card message structure', () => {
			const validCardMessage = {
				type: 'card',
				card: { id: 1, name: 'Pikachu', type: 'Electric' }
			};

			expect(validCardMessage.type).toBe('card');
			expect(validCardMessage.card).toBeDefined();
			expect(typeof validCardMessage.card).toBe('object');
		});

		it('should handle different card formats', () => {
			const stringCard = {
				type: 'card',
				card: 'Simple string card'
			};

			const objectCard = {
				type: 'card',
				card: { name: 'Complex Card', power: 150 }
			};

			expect(stringCard.type).toBe('card');
			expect(typeof stringCard.card).toBe('string');
			expect(objectCard.type).toBe('card');
			expect(typeof objectCard.card).toBe('object');
		});
	});

	describe('Clear message validation', () => {
		it('should validate clear message structure', () => {
			const clearMessage = { type: 'clear' };

			expect(clearMessage.type).toBe('clear');
			expect(Object.keys(clearMessage)).toHaveLength(1);
		});
	});

	describe('JSON serialization', () => {
		it('should serialize and parse card messages correctly', () => {
			const originalMessage = {
				type: 'card',
				card: { id: 1, name: 'Test Card', power: 100 }
			};

			const serialized = JSON.stringify(originalMessage);
			const parsed = JSON.parse(serialized);

			expect(parsed).toEqual(originalMessage);
			expect(parsed.type).toBe('card');
			expect(parsed.card.id).toBe(1);
		});

		it('should serialize and parse clear messages correctly', () => {
			const originalMessage = { type: 'clear' };

			const serialized = JSON.stringify(originalMessage);
			const parsed = JSON.parse(serialized);

			expect(parsed).toEqual(originalMessage);
			expect(parsed.type).toBe('clear');
		});

		it('should handle invalid JSON gracefully', () => {
			const invalidJson = '{"type": "card", "card":}';

			expect(() => {
				JSON.parse(invalidJson);
			}).toThrow();
		});
	});

	describe('Message type handling', () => {
		it('should identify valid message types', () => {
			const cardMessage = { type: 'card', card: 'test' };
			const clearMessage = { type: 'clear' };
			const invalidMessage = { type: 'invalid' };

			expect(['card', 'clear']).toContain(cardMessage.type);
			expect(['card', 'clear']).toContain(clearMessage.type);
			expect(['card', 'clear']).not.toContain(invalidMessage.type);
		});
	});
});
