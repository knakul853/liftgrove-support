const presets = {
  kg: { bar: 20, plates: [[25, 2], [20, 2], [15, 1], [10, 2], [5, 2], [2.5, 1], [1.25, 1], [1, 0], [0.5, 0]] },
  lb: { bar: 45, plates: [[45, 2], [35, 1], [25, 1], [10, 2], [5, 2], [2.5, 1], [1.25, 0]] }
};

const units = value => {
  const scaled = value * 1000;
  return Number.isFinite(scaled) && Math.abs(scaled - Math.round(scaled)) < 0.000001
    ? Math.round(scaled) : null;
};

const isBetter = (candidate, existing) => {
  if (!existing) return true;
  const candidateCount = candidate.reduce((sum, count) => sum + count, 0);
  const existingCount = existing.reduce((sum, count) => sum + count, 0);
  if (candidateCount !== existingCount) return candidateCount < existingCount;
  for (const [index, count] of candidate.entries()) {
    if (count !== existing[index]) return count > existing[index];
  }
  return false;
};

export function calculatePlateLoad(target, bar, inventory) {
  if (![target, bar].every(Number.isFinite) || bar < 0 || target < bar || target > 1000 ||
      !Array.isArray(inventory) || inventory.length > 20) return null;
  const targetUnits = units(target);
  const barUnits = units(bar);
  if (targetUnits === null || barUnits === null) return null;

  const plates = inventory.map(([weight, pairs]) => ({ weight, value: units(weight), pairs }));
  if (plates.some(({ weight, value, pairs }) => value === null || weight <= 0 ||
      !Number.isInteger(pairs) || pairs < 0 || pairs > 20)) return null;
  plates.sort((a, b) => b.value - a.value);
  const limit = Math.floor((targetUnits - barUnits) / 2);
  let states = new Map([[0, Array(plates.length).fill(0)]]);

  for (const [index, plate] of plates.entries()) {
    const next = new Map(states);
    for (const [amount, counts] of states) {
      for (let count = 1; count <= plate.pairs; count++) {
        const total = amount + count * plate.value;
        if (total > limit) break;
        const candidate = counts.slice();
        candidate[index] = count;
        if (isBetter(candidate, next.get(total))) next.set(total, candidate);
      }
    }
    states = next;
  }

  let best = 0;
  for (const amount of states.keys()) if (amount > best) best = amount;
  const plateCounts = states.get(best);
  return {
    platesPerSide: plates.flatMap((plate, index) => Array(plateCounts[index]).fill(plate.weight)),
    achieved: (barUnits + 2 * best) / 1000,
    gap: (targetUnits - barUnits - 2 * best) / 1000
  };
}

const targetInput = typeof document === 'undefined' ? null : document.querySelector('#target-weight');
if (targetInput) {
  const barInput = document.querySelector('#bar-weight');
  const unitInput = document.querySelector('#plate-unit');
  const inventoryFields = document.querySelector('#plate-inventory');
  const prompt = document.querySelector('#plate-result-prompt');
  const values = document.querySelector('#plate-result-values');
  const error = document.querySelector('#plate-result-error');
  const format = value => new Intl.NumberFormat('en', { maximumFractionDigits: 3 }).format(value);

  const inventory = () => [...inventoryFields.querySelectorAll('input')].map(input =>
    [Number(input.dataset.weight), Number(input.value)]);
  const update = () => {
    const empty = targetInput.value.trim() === '';
    const missing = barInput.value.trim() === '' ||
      [...inventoryFields.querySelectorAll('input')].some(input => input.value.trim() === '');
    const result = empty || missing ? null : calculatePlateLoad(Number(targetInput.value), Number(barInput.value), inventory());
    prompt.hidden = !empty;
    values.hidden = !result;
    error.hidden = empty || !!result;
    if (!empty && !result) error.textContent = 'Enter a target at least as heavy as the bar, up to 1,000, with whole plate-pair counts from 0 to 20.';
    if (!result) return;

    document.querySelector('#plate-result-load').value = format(result.achieved);
    document.querySelector('#plate-result-unit').textContent = unitInput.value;
    document.querySelector('#plate-result-stack').textContent = result.platesPerSide.length
      ? result.platesPerSide.map(format).join(' + ') + ` ${unitInput.value}` : 'Empty bar';
    document.querySelector('#plate-result-gap').textContent = result.gap > 0
      ? `${format(result.gap)} ${unitInput.value} below your target` : 'Exact target';
  };

  const renderInventory = () => {
    inventoryFields.replaceChildren();
    for (const [weight, pairs] of presets[unitInput.value].plates) {
      const label = document.createElement('label');
      label.className = 'inventory-field';
      const name = document.createElement('span');
      name.textContent = `${weight} ${unitInput.value} plates`;
      const input = document.createElement('input');
      input.type = 'number';
      input.inputMode = 'numeric';
      input.min = '0';
      input.max = '20';
      input.step = '1';
      input.value = String(pairs);
      input.dataset.weight = String(weight);
      input.setAttribute('aria-label', `${weight} ${unitInput.value} plate pairs`);
      input.addEventListener('input', update);
      label.append(name, input);
      inventoryFields.append(label);
    }
    update();
  };

  targetInput.addEventListener('input', update);
  barInput.addEventListener('input', update);
  unitInput.addEventListener('change', () => {
    const factor = unitInput.value === 'lb' ? 2.2046226218 : 1 / 2.2046226218;
    if (targetInput.value.trim() !== '') targetInput.value = (Number(targetInput.value) * factor).toFixed(2);
    barInput.value = String(presets[unitInput.value].bar);
    renderInventory();
  });
  renderInventory();
}
