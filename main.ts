// console.clear();

import { categorizePatients, getAllPatientData, submit } from './lib/service.ts';

(async () => {
  const data = await getAllPatientData();
  const categorized = await categorizePatients(data.patients);

  if (!data) {
    console.error('No data fetched');
    return;
  }
  // console.log('Patients:', data);
  console.log('Categorized Patients:', categorized);
  const response = await submit(categorized);
  console.dir(response);
})();
