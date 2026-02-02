# Testing Guide for Jarvis AI Assistant

## Setup

Jest has been configured for this project. All tests should be placed in the `__tests__` directory or named with `.test.js` or `.spec.js` extensions.

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-run on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

Tests are organized in the `__tests__` directory. Example:

```
__tests__/
├── sample.test.js
├── controllers/
│   └── JarvisController.test.js
├── services/
│   └── geminiService.test.js
└── models/
    └── ProjectPlanner.test.js
```

## Writing Tests

### Basic Test Example

```javascript
describe('Feature Name', () => {
  test('should do something', () => {
    expect(1 + 1).toBe(2);
  });
});
```

### Testing Controllers

```javascript
describe('JarvisController', () => {
  let controller;

  beforeEach(() => {
    controller = new JarvisController();
  });

  test('should initialize properly', () => {
    expect(controller).toBeDefined();
  });

  test('should have start method', () => {
    expect(typeof controller.start).toBe('function');
  });
});
```

### Testing Services with Mocks

```javascript
describe('GeminiService', () => {
  test('should call API with correct parameters', async () => {
    const mockResponse = { data: 'test' };
    
    // Mock the API call
    jest.mock('../services/geminiService');
    
    const result = await geminiService.generateProject('test');
    expect(result).toEqual(mockResponse);
  });
});
```

### Common Jest Matchers

```javascript
// Equality
expect(value).toBe(5);                    // Strict equality
expect(value).toEqual({});                // Deep equality

// Truthiness
expect(value).toBeNull();
expect(value).toBeUndefined();
expect(value).toBeDefined();
expect(value).toBeTruthy();
expect(value).toBeFalsy();

// Numbers
expect(value).toBeGreaterThan(5);
expect(value).toBeGreaterThanOrEqual(5);
expect(value).toBeLessThan(5);
expect(value).toBeCloseTo(0.1 + 0.2);

// Strings
expect(string).toMatch(/pattern/);
expect(string).toContain('substring');

// Arrays
expect(array).toContain(item);
expect(array).toHaveLength(3);

// Objects
expect(object).toHaveProperty('key');

// Functions
expect(func).toThrow();
expect(func).toThrow(ErrorType);

// Async
await expect(promise).resolves.toBe(value);
await expect(promise).rejects.toThrow();
```

## Coverage Threshold

The project is configured with a 50% coverage threshold. Aim to increase this over time:

- **Branches**: 50%
- **Functions**: 50%
- **Lines**: 50%
- **Statements**: 50%

## CI Integration

Tests run automatically on:
- Every push to `main` and `develop` branches
- Every pull request

Coverage reports are uploaded to Codecov automatically.

## Next Steps

1. Create test files for each module
2. Aim for 70%+ code coverage
3. Run `npm run test:coverage` to see coverage reports
4. Update tests when adding new features
