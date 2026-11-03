import assert from 'node:assert/strict';
import test from 'node:test';
import { calculatePlateLoad } from './plate-calculator.mjs';

test('loads the pictured kilogram example on each side', () => {
  const result = calculatePlateLoad(57.5, 20, [[25, 2], [20, 2], [15, 1], [10, 2], [5, 2], [2.5, 1], [1.25, 1]]);
  assert.deepEqual(result, { platesPerSide: [15, 2.5, 1.25], achieved: 57.5, gap: 0 });
});

test('respects finite pairs and returns a lower achievable load', () => {
  const result = calculatePlateLoad(100, 20, [[20, 1], [10, 1], [5, 1]]);
  assert.deepEqual(result, { platesPerSide: [20, 10, 5], achieved: 90, gap: 10 });
});

test('uses the fewest plates for an exact load', () => {
  const result = calculatePlateLoad(44, 20, [[10, 2], [6, 2], [1, 2]]);
  assert.deepEqual(result, { platesPerSide: [6, 6], achieved: 44, gap: 0 });
});

test('supports pound plates and an empty bar', () => {
  assert.deepEqual(calculatePlateLoad(225, 45, [[45, 2]]),
    { platesPerSide: [45, 45], achieved: 225, gap: 0 });
  assert.deepEqual(calculatePlateLoad(22.5, 20, [[5, 1]]),
    { platesPerSide: [], achieved: 20, gap: 2.5 });
});

test('rejects invalid targets and inventory', () => {
  assert.equal(calculatePlateLoad(19, 20, [[5, 1]]), null);
  assert.equal(calculatePlateLoad(100, 20, [[5, -1]]), null);
  assert.equal(calculatePlateLoad(1001, 20, [[5, 1]]), null);
});
