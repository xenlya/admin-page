import {
  fetchSemester,
  type SemesterResponse,
} from './semester';

import {
  fetchEmulatedStudentProfile,
  type EmulatedStudentProfile,
} from './student-profile';

export interface CombinedReportData
  extends SemesterResponse {

  profile: EmulatedStudentProfile;

  profileSource: 'STUDENT_PROFILE_EMULATOR';
}

export async function fetchCombinedReportData(
  sisId: string
): Promise<CombinedReportData> {

  const [attendance, profile] = await Promise.all([
    fetchSemester(sisId),
    fetchEmulatedStudentProfile(sisId),
  ]);

  if (attendance.student.sisId !== profile.sisId) {
    throw new Error(
      'Attendance and Student Profile SIS IDs do not match.'
    );
  }

  return {
    ...attendance,
    profile,
    profileSource: 'STUDENT_PROFILE_EMULATOR',
  };
}