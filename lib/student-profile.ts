import { validSisId } from './semester';

export interface EmulatedStudentProfile {
  studentId: string;
  sisId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  studentType: string;
  campus: string;
  faculty: string;

  programme: {
    code: string;
    name: string;
    durationYears: number;
  };

  yearOfStudy: number;
  semester: string;
  academicStatus: string;

  enrolments: Array<{
    unitId: string;
    code: string;
    name: string;
    semester: string;
    enrolmentStatus: string;
    source: string;
  }>;

  visa: {
    applicable: boolean;
    status: string;
    expiryDate: string | null;
    reviewRequired: boolean;
    isSynthetic: boolean;
    note: string;
  };

  isSynthetic: boolean;
}

interface StudentProfileResponse {
  success: boolean;
  student: EmulatedStudentProfile;
  isSynthetic: boolean;
}

export async function fetchEmulatedStudentProfile(
  sisId: string
): Promise<EmulatedStudentProfile> {

  if (!validSisId(sisId)) {
    throw new Error('Invalid Student SIS ID.');
  }

  const baseUrl =
    process.env.STUDENT_PROFILE_WEBHOOK_URL;

  if (!baseUrl) {
    throw new Error(
      'STUDENT_PROFILE_WEBHOOK_URL is missing.'
    );
  }

  const url = new URL(baseUrl);

  if (
    url.protocol !== 'https:' &&
    !(
      url.protocol === 'http:' &&
      url.hostname === 'localhost'
    )
  ) {
    throw new Error('Student Profile URL must use HTTPS.');
  }

  url.searchParams.set('sis_id', sisId);

  const response = await fetch(url.toString(), {
    method: 'GET',
    cache: 'no-store',
    signal: AbortSignal.timeout(12000),
  });

  if (!response.ok) {
    throw new Error(
      `Student Profile API returned HTTP ${response.status}`
    );
  }

  const data: StudentProfileResponse =
    await response.json();

  if (!data.success || !data.student) {
    throw new Error(
      'Student Profile API returned an invalid response.'
    );
  }

  if (data.student.sisId !== sisId) {
    throw new Error(
      'Student Profile SIS ID does not match.'
    );
  }

  if (!data.student.fullName) {
    throw new Error('Student full name is missing.');
  }

  if (!data.student.programme?.name) {
    throw new Error('Student programme is missing.');
  }

  if (
    data.isSynthetic !== true ||
    data.student.isSynthetic !== true
  ) {
    throw new Error(
      'Unexpected profile source: emulator data must be marked synthetic.'
    );
  }

  return data.student;
}