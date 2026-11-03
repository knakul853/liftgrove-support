export function calculateTrainingMax(weight, reps, ratio, increment) {
  if (![weight, reps, ratio, increment].every(Number.isFinite) || weight <= 0 ||
      !Number.isInteger(reps) || reps < 1 || reps > 30 ||
      (ratio !== 0.85 && ratio !== 0.9) || increment <= 0) return null;

  const estimatedMax = reps === 1 ? weight : weight * (1 + reps / 30);
  const trainingMax = Math.round(estimatedMax * ratio / increment) * increment;
  return { estimatedMax, trainingMax };
}

const weightInput = typeof document === 'undefined' ? null : document.querySelector('#weight');
if (weightInput) {
  const repsInput = document.querySelector('#reps');
  const ratioInput = document.querySelector('#ratio');
  const incrementInput = document.querySelector('#increment');
  const unitInput = document.querySelector('#unit');
  const prompt = document.querySelector('#result-prompt');
  const values = document.querySelector('#result-values');
  const error = document.querySelector('#result-error');

  const format = value => new Intl.NumberFormat('en', { maximumFractionDigits: 2 }).format(value);
  const update = () => {
    const weight = Number(weightInput.value);
    const reps = Number(repsInput.value);
    const increment = Number(incrementInput.value);
    const result = calculateTrainingMax(weight, reps, Number(ratioInput.value), increment);
    const empty = weightInput.value.trim() === '';
    prompt.hidden = !empty;
    values.hidden = !result;
    error.hidden = empty || !!result;
    if (!empty && !result) error.textContent = 'Enter a positive weight, 1–30 whole reps, and a positive rounding increment.';
    if (!result) return;

    document.querySelector('#estimated-max').value = format(result.estimatedMax);
    document.querySelector('#training-max').value = format(result.trainingMax);
    document.querySelector('#estimate-unit').textContent = unitInput.value;
    document.querySelector('#result-unit').textContent = unitInput.value;
  };

  for (const input of [weightInput, repsInput, ratioInput, incrementInput]) {
    input.addEventListener('input', update);
  }
  unitInput.addEventListener('change', () => {
    const toLb = unitInput.value === 'lb';
    const weight = Number(weightInput.value);
    if (weightInput.value.trim() !== '' && Number.isFinite(weight) && weight > 0) {
      weightInput.value = (weight * (toLb ? 2.2046226218 : 1 / 2.2046226218)).toFixed(2);
    }
    incrementInput.value = toLb ? '5' : '2.5';
    update();
  });
  update();
}
