export function validBp(bp: string): boolean {
  if (!bp || typeof bp !== 'string') {
    return false;
  }
  const [systolicStr, diastolicStr] = bp.split('/').map((v) => v.trim());
  const systolic = parseInt(systolicStr, 10);
  const diastolic = parseInt(diastolicStr, 10);

  return !isNaN(systolic) && !isNaN(diastolic);
}
export function bpScore(bp: string) {
  if (!validBp(bp)) {
    return 0;
  }
  const [systolicStr, diastolicStr] = bp.split('/').map((v) => v.trim());
  const systolic = parseInt(systolicStr, 10);
  const diastolic = parseInt(diastolicStr, 10);
  /*
   * Check for the most extreme BP first, that way we can just return 0 if none of the conditions are met.
   * We use early returns to avoid unnecessary conditions.
   */
  // Stage 2
  if (systolic >= 140 || diastolic >= 90) {
    return 3;
  }

  // Stage 1
  if (systolic >= 130 || diastolic >= 80) {
    return 2;
  }

  // Elevated
  if (systolic >= 120 && diastolic < 80) {
    return 1;
  }

  // Normal
  return 0;
}

export function validTemp(temp: number | string): boolean {
  if (!temp) {
    return false;
  }
  const temperature = typeof temp === 'number' ? temp : parseFloat(temp);
  return !isNaN(temperature);
}
export function tempScore(temp: number | string) {
  if (!validTemp(temp)) {
    return 0;
  }
  const temperature = typeof temp === 'number' ? temp : parseFloat(temp);

  if (temperature >= 101) {
    return 2;
  }

  if (temperature >= 99.6) {
    return 1;
  }

  return 0;
}

export function validAge(age: number | string): boolean {
  if (!age) {
    return false;
  }
  const ageNum = typeof age === 'number' ? age : parseInt(age, 10);

  return !isNaN(ageNum);
}
export function ageScore(age: number | string) {
  if (!validAge(age)) {
    return 0;
  }
  const ageNum = typeof age === 'number' ? age : parseInt(age, 10);

  if (ageNum >= 65) {
    return 2;
  }

  if (ageNum >= 40) {
    return 1;
  }

  return 0;
}
