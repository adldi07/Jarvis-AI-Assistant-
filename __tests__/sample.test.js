describe('Sample Test Suite', () => {
  test('basic arithmetic', () => {
    expect(1 + 1).toBe(2);
  });

  test('string matching', () => {
    expect('hello').toContain('ell');
  });

  test('array includes', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(arr).toContain(3);
  });
});
