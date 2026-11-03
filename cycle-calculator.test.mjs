import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCycle } from './cycle-calculator.mjs';

test('classic four-week plan follows the app percentages and rep targets', () => {
  const weeks = calculateCycle(100, 2.5, 20);
  assert.deepEqual(weeks.map(week => week.main.map(set => set.weight)), [
    [65, 75, 85], [70, 80, 90], [75, 85, 95], [40, 50, 60],
  ]);
  assert.deepEqual(weeks.map(week => week.main.map(set => set.reps)), [
    [5, 5, 5], [3, 3, 3], [5, 3, 1], [5, 5, 5],
  ]);
  assert.deepEqual(weeks.map(week => week.main.map(set => set.amrap)), [
    [false, false, true], [false, false, true], [false, false, true], [false, false, false],
  ]);
});

test('warm-ups respect the empty bar and merge equal loads', () => {
  const weeks = calculateCycle(40, 2.5, 20);
  assert.deepEqual(weeks[0].warmups.map(set => set.weight), [20, 25]);
  assert.deepEqual(weeks[3].warmups, []);
});

test('5s Pro and first-set-last follow the same primary weights', () => {
  const weeks = calculateCycle(225, 5, 45, 'fivePro', true);
  assert.deepEqual(weeks[2].main.map(set => set.reps), [5, 5, 5]);
  assert.equal(weeks[2].main[2].amrap, false);
  assert.deepEqual(weeks.map(week => week.supplemental?.weight ?? null), [145, 160, 170, null]);
});

test('invalid or incomplete inputs produce no plan', () => {
  assert.equal(calculateCycle(0, 2.5, 20), null);
  assert.equal(calculateCycle(100, 0, 20), null);
  assert.equal(calculateCycle(100, 2.5, -1), null);
  assert.equal(calculateCycle(100, 2.5, 20, 'unknown'), null);
});
