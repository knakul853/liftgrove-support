const phases = [
  { name: '5s', percentages: [0.65, 0.75, 0.85], reps: [5, 5, 5] },
  { name: '3s', percentages: [0.70, 0.80, 0.90], reps: [3, 3, 3] },
  { name: '5 / 3 / 1', percentages: [0.75, 0.85, 0.95], reps: [5, 3, 1] },
  { name: 'Deload', percentages: [0.40, 0.50, 0.60], reps: [5, 5, 5] },
];

export function calculateCycle(trainingMax, increment, barWeight, scheme = 'classic', firstSetLast = false) {
  if (![trainingMax, increment, barWeight].every(Number.isFinite) ||
      trainingMax <= 0 || increment <= 0 || barWeight < 0 || barWeight > 500 ||
      !['classic', 'fivePro'].includes(scheme)) return null;

  const rounded = value => Math.round(Math.round(value / increment) * increment * 1000) / 1000;
  return phases.map((phase, index) => {
    const warmups = [];
    if (index < 3) {
      for (const [percentage, reps] of [[0.40, 5], [0.50, 5], [0.60, 3]]) {
        const weight = Math.max(rounded(trainingMax * percentage), barWeight);
        if (warmups.at(-1)?.weight !== weight) warmups.push({ percentage, reps, weight });
      }
    }

    const main = phase.percentages.map((percentage, setIndex) => ({
      percentage,
      reps: index === 3 || scheme === 'fivePro' ? 5 : phase.reps[setIndex],
      weight: rounded(trainingMax * percentage),
      amrap: index < 3 && scheme === 'classic' && setIndex === 2,
    }));
    const supplemental = firstSetLast && index < 3
      ? { sets: 5, reps: 5, percentage: phase.percentages[0], weight: main[0].weight }
      : null;

    return { week: index + 1, name: phase.name, warmups, main, supplemental };
  });
}

const maxInput = typeof document === 'undefined' ? null : document.querySelector('#training-max');
if (maxInput) {
  const unitInput = document.querySelector('#unit');
  const incrementInput = document.querySelector('#increment');
  const barInput = document.querySelector('#bar-weight');
  const schemeInput = document.querySelector('#scheme');
  const fslInput = document.querySelector('#fsl');
  const prompt = document.querySelector('#cycle-prompt');
  const error = document.querySelector('#cycle-error');
  const result = document.querySelector('#cycle-result');
  const summary = document.querySelector('#cycle-summary');
  const format = value => new Intl.NumberFormat('en', { maximumFractionDigits: 2 }).format(value);
  const unit = () => unitInput.value;

  const update = () => {
    const empty = maxInput.value.trim() === '';
    const weeks = calculateCycle(Number(maxInput.value), Number(incrementInput.value),
      Number(barInput.value), schemeInput.value, fslInput.checked);
    prompt.hidden = !empty;
    error.hidden = empty || !!weeks;
    summary.hidden = !weeks;
    result.hidden = !weeks;
    if (!weeks) {
      if (!empty) error.textContent = 'Enter a positive training max and increment, plus a bar weight from 0 to 500.';
      return;
    }

    summary.textContent = `${format(Number(maxInput.value))} ${unit()} training max · ${schemeInput.value === 'fivePro' ? '5s Pro' : 'Classic'}${fslInput.checked ? ' + first-set-last' : ''}`;
    const cards = weeks.map(week => {
      const card = document.createElement('article');
      card.className = 'cycle-week';
      const heading = document.createElement('h3');
      heading.textContent = `Week ${week.week} · ${week.name}`;
      card.append(heading);
      if (week.warmups.length) {
        const warmup = document.createElement('p');
        warmup.className = 'cycle-warmups';
        warmup.textContent = `Warm-up · ${week.warmups.map(set => `${format(set.weight)} ${unit()} × ${set.reps}`).join(' · ')}`;
        card.append(warmup);
      }
      const list = document.createElement('ol');
      list.className = 'cycle-sets';
      for (const set of week.main) {
        const row = document.createElement('li');
        const load = document.createElement('strong');
        load.textContent = `${format(set.weight)} ${unit()}`;
        const detail = document.createElement('span');
        detail.textContent = `${Math.round(set.percentage * 100)}% · ${set.reps}${set.amrap ? '+' : ''} reps`;
        row.append(load, detail);
        list.append(row);
      }
      card.append(list);
      if (week.supplemental) {
        const extra = document.createElement('p');
        extra.className = 'cycle-extra';
        extra.textContent = `First-set-last · 5 × 5 at ${format(week.supplemental.weight)} ${unit()}`;
        card.append(extra);
      }
      return card;
    });
    result.replaceChildren(...cards);
  };

  for (const input of [maxInput, incrementInput, barInput]) input.addEventListener('input', update);
  for (const input of [schemeInput, fslInput]) input.addEventListener('change', update);
  unitInput.addEventListener('change', () => {
    const toLb = unit() === 'lb';
    if (maxInput.value.trim() !== '') {
      const max = Number(maxInput.value);
      if (Number.isFinite(max) && max > 0) maxInput.value = (max * (toLb ? 2.2046226218 : 1 / 2.2046226218)).toFixed(2);
    }
    incrementInput.value = toLb ? '5' : '2.5';
    barInput.value = toLb ? '45' : '20';
    update();
  });
  update();
}
