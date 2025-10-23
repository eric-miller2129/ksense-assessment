import axios from 'axios';
import { API_KEY, BASE_API_URL } from '../env.ts';
import { ageScore, bpScore, tempScore, validAge, validBp, validTemp } from './patient-parser.ts';

type Pagination = {
  count: number;
  total_records: number;
  current_page: number;
  per_page: number;
};

export type Patient = {
  patient_id: string;
  name: string;
  age: number;
  gender: 'M' | 'F';
  blood_pressure: string;
  temperature: number;
  visit_date: string;
  diagnosis: string;
  medications: string;
  risk_score: number;
};

type ResponseA = {
  patients: Patient[];
} & Pagination;

type ResponseB = {
  data: Patient[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  metadata: {
    timestamp: string;
    version: string;
    requestId: string;
  };
};

export const apiService = axios.create({
  baseURL: BASE_API_URL,
  headers: {
    'x-api-key': API_KEY,
  },
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function retry<T>(fn: () => Promise<T>, retries = 5, delay = 3000) {
  let tried = 0;

  while (tried < retries) {
    try {
      return await fn();
    } catch (e) {
      if (tried > retries - 1) {
        throw e;
      }
      console.warn(`Retrying... (${tried}/${retries})`);
      await sleep(delay);
    }
    tried++;
  }
}

// Normalized response format
type NormalizedPatientResponse = {
  patients: Patient[];
  pagination: {
    current_page: number;
    per_page: number;
    total_records: number;
    count: number;
  };
};

function isResponseB(data: any): data is ResponseB {
  return data && typeof data === 'object' && 'data' in data && Array.isArray(data.data);
}

function normalizePatientResponse(data: ResponseA | ResponseB): NormalizedPatientResponse {
  if (isResponseB(data)) {
    return {
      patients: data.data.map((patient) => ({
        ...patient,
      })),
      pagination: {
        current_page: data.pagination.page,
        per_page: data.pagination.limit,
        total_records: data.pagination.total,
        count: data.data.length,
      },
    };
  }

  // ResponseA format
  return {
    patients: data.patients,
    pagination: {
      current_page: data.current_page,
      per_page: data.per_page,
      total_records: data.total_records,
      count: data.count,
    },
  };
}

async function getPatientData(page = 1, limit = 10): Promise<NormalizedPatientResponse> {
  try {
    const response = await retry<any>(() =>
      apiService.get(`patients`, {
        params: { page, limit },
      })
    );

    return normalizePatientResponse(response?.data);
  } catch (error) {
    console.error('Error fetching patient data.');
    throw error;
  }
}

export async function getAllPatientData(limit = 10): Promise<NormalizedPatientResponse> {
  const allPatients: Patient[] = [];
  let currentPage = 1;
  let totalRecords = 0;

  while (true) {
    const pageData = await getPatientData(currentPage, limit);
    allPatients.push(...pageData.patients);
    totalRecords = pageData.pagination.total_records;

    // Check if we've fetched all records
    if (allPatients.length >= totalRecords) {
      break;
    }

    currentPage++;
  }

  return {
    patients: allPatients.map((patient) => ({
      ...patient,
      risk_score: ageScore(patient.age) + bpScore(patient.blood_pressure) + tempScore(patient.temperature),
    })),
    pagination: {
      current_page: currentPage - 1,
      per_page: limit,
      total_records: totalRecords,
      count: allPatients.length,
    },
  };
}

export async function categorizePatients(patients: Patient[]) {
  const highRiskPatients = patients.filter((p) => p.risk_score >= 4);
  const feverPatients = patients.filter((p) => p.temperature >= 99.6);
  const dataQualityIssues = patients.filter(
    (p) => !validBp(p.blood_pressure) || !validAge(p.age) || !validTemp(p.temperature)
  );

  return {
    high_risk_patients: highRiskPatients.map((p) => p.patient_id),
    fever_patients: feverPatients.map((p) => p.patient_id),
    data_quality_issues: dataQualityIssues.map((p) => p.patient_id),
  };
}

export async function submit(list: {
  high_risk_patients: string[];
  fever_patients: string[];
  data_quality_issues: string[];
}) {
  try {
    console.log(list);
    return await retry<any>(() => apiService.post('submit-assessment', list));
  } catch (error) {
    console.error('Error submitting assessment.');
    throw error;
  }
}
