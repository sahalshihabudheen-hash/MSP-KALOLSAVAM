// Auth via admission number only — no Google, no password
// Session stored in localStorage

import { getSampoornaStudentByAdmission } from './db';

const SESSION_KEY = 'kal_student_session';

export interface StudentProfile {
  uid: string; // same as admissionNumber for compatibility
  admissionNumber: string;
  fullName: string;
  classGrade: string;
  division: string;
  photoURL?: string;
}

type AuthListener = (user: StudentProfile | null, profile: StudentProfile | null) => void;
const listeners: AuthListener[] = [];

const notifyListeners = (profile: StudentProfile | null) => {
  listeners.forEach(fn => fn(profile, profile));
};

export const loginWithAdmissionNumber = async (admissionNumber: string): Promise<StudentProfile> => {
  const student = await getSampoornaStudentByAdmission(admissionNumber.trim());
  if (!student) {
    throw new Error(`Admission number "${admissionNumber}" was not found in the student database.`);
  }
  const profile: StudentProfile = {
    uid: student.admissionNumber,
    admissionNumber: student.admissionNumber,
    fullName: student.fullName,
    classGrade: student.classGrade,
    division: student.division,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(profile));
  notifyListeners(profile);
  return profile;
};

export const logoutStudent = async () => {
  localStorage.removeItem(SESSION_KEY);
  notifyListeners(null);
};

export const getStudentProfile = async (admissionNumber: string): Promise<StudentProfile | null> => {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const profile = JSON.parse(raw) as StudentProfile;
    if (profile.admissionNumber === admissionNumber) return profile;
  } catch {}
  return null;
};

export const getCurrentProfile = (): StudentProfile | null => {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as StudentProfile; } catch { return null; }
};

// Subscribes to auth changes — fires immediately with current state
export const subscribeToAuthChanges = (callback: AuthListener): (() => void) => {
  listeners.push(callback);
  // Fire immediately with current session
  const current = getCurrentProfile();
  callback(current, current);
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx > -1) listeners.splice(idx, 1);
  };
};
