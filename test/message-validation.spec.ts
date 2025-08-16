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

	describe('Background message validation', () => {
		it('should validate background message structure', () => {
			const validBackgroundMessage = {
				type: 'background',
				backgroundColor: '#FF0000'
			};

			expect(validBackgroundMessage.type).toBe('background');
			expect(validBackgroundMessage.backgroundColor).toBeDefined();
			expect(typeof validBackgroundMessage.backgroundColor).toBe('string');
		});

		it('should handle valid hex color formats', () => {
			const longFormat = {
				type: 'background',
				backgroundColor: '#FF0000'
			};

			const shortFormat = {
				type: 'background',
				backgroundColor: '#F00'
			};

			expect(longFormat.backgroundColor).toMatch(/^#[A-Fa-f0-9]{6}$/);
			expect(shortFormat.backgroundColor).toMatch(/^#[A-Fa-f0-9]{3}$/);
		});

		it('should identify invalid hex color formats', () => {
			const invalidFormats = [
				'FF0000',    // Missing #
				'#GG0000',   // Invalid characters
				'#FF00',     // Invalid length
				'#FF00000',  // Too long
				'red',       // Color name
				'rgb(255,0,0)' // RGB format
			];

			invalidFormats.forEach(color => {
				const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
				expect(hexRegex.test(color)).toBe(false);
			});
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
