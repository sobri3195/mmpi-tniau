import type { AssessmentResult, ParticipantIdentity, RHForm } from '../types';

export const RH_HEALTH_ITEMS = [
  'Pusing-pusing / sakit kepala', 'Sakit kepala sebelah', 'Gegar otak', 'Luka di kepala', 'Berat badan turun/naik > 2 kg sebulan terakhir', 'Luka akibat kecelakaan berat', 'Sakit sendi-sendi', 'Patah tulang', 'Buang air besar berdarah', 'Sakit panas lebih dari 7 hari', 'Kembung / sakit perut', 'Luka di lambung', 'Radang usus buntu', 'Sakit di usus besar', 'Sakit batu empedu', 'Bengek / asma', 'Batuk kering lebih dari 2 minggu', 'Sesak / sakit dada waktu bernapas', 'Nyeri dada', 'Batuk berdarah / batuk lebih dari 1 bulan', 'Sesak waktu berjalan', 'Batuk darah / muntah darah', 'Keringat malam', 'Sering sakit hidung atau tenggorokan', 'Keluar cairan dari telinga', 'Kencing batu / darah', 'Kencing manis', 'Sakit bila kencing', 'Penyakit kelamin', 'Biduran / bentol-bentol / bisul', 'Sakit kuning', 'Malaria', 'Gondok', 'Lumpuh', 'Bengkak di kaki', 'Ayan / epilepsi', 'Pingsan / kejang', 'Sukar bicara / gagap', 'Sering merasa sedih / pelupa', 'Menghisap rokok > 20 batang/hari', 'Suka minum minuman keras', 'Jika luka, darah sukar berhenti', 'Alergi makanan atau obat tertentu', 'Mendengar suara tanpa sumber', 'Melihat bayangan', 'Kecurigaan berlebihan pada orang lain', 'Pernah ingin bunuh diri', 'Sering mengigau atau tidur sambil berjalan', 'Senang atau marah-marah berlebihan', 'Dirawat inap',
] as const;

export const EDUCATION_ROWS = ['SD', 'SLTP', 'SLTA', 'Akademi', 'Universitas', 'Lainnya'];

const value = (identity: Partial<ParticipantIdentity> | undefined, key: keyof ParticipantIdentity) => String(identity?.[key] ?? '');

export const createRHForm = (result: AssessmentResult): RHForm => {
  const identity = result.participant || result.identity;
  const now = new Date().toISOString();
  return {
    rhFormId: crypto.randomUUID(),
    resultId: result.id,
    tokenId: String((result as unknown as { tokenId?: string }).tokenId ?? ''),
    participantId: identity.participantNumber || result.id,
    createdAt: now,
    submittedAt: '',
    status: 'draft',
    consent: {
      noTest: identity.participantNumber || '', name: identity.name || '', birthPlaceDate: identity.birthDateInput || identity.dateOfBirth || '', unit: identity.unit || identity.originWorkUnit || '', homeAddress: '', phone: '', institutionRequest: 'TNI Angkatan Udara', statementAccepted: false, createdPlace: '', createdDate: now.slice(0, 10), signatureName: identity.name || '',
    },
    identity: { fullName: identity.name || '', birthPlace: '', birthDateInput: identity.birthDateInput || identity.dateOfBirth || '', birthDateISO: identity.birthDateISO || identity.dateOfBirth || '', homeAddress: '', phone: '', religion: '', gender: identity.gender || '', examPurpose: value(identity, 'assessmentDate') ? 'Pemeriksaan kesehatan jiwa' : '' },
    healthHistory: { items: RH_HEALTH_ITEMS.map((complaint, index) => ({ no: index + 1, complaint, answer: '', note: '', ...(index === 49 ? { hospitalization: { date: '', place: '', duration: '', disease: '' } } : {}) })), physicalCondition: '', mentalCondition: '', routineMedication: { answer: '', medicineType: '', startDate: '' }, sleepDifficulty: { answer: '', needsMedication: '' } },
    educationHistory: EDUCATION_ROWS.map((education) => ({ education, schoolName: '', years: '', graduationStatus: '' })),
    workHistory: [{ workplace: '', year: '', description: '' }],
    workQuestions: { hasWorkDifficulty: '', workDifficultyExplanation: '', positiveAspects: '', negativeAspects: '', willingToWork: '', willingToWorkExplanation: '' },
    familyHistory: { spouses: [{ name: '', education: '', description: '' }], children: [{ name: '', education: '', description: '' }], livingWithFamily: '', livingWithFamilyReason: '', hasFamilyProblem: '', familyProblemExplanation: '', spouseSupportsCareer: '', spouseSupportExplanation: '' },
    socialHistory: { hasSeriousProblem: '', seriousProblemExplanation: '', receivedTreatmentForProblem: '', makingFriendsStyle: '', difficultyWithFamily: '', difficultyWithSchoolFriends: '', difficultyWithCoworkers: '', freeTimeActivities: '', substanceUseHistory: '', substanceUseExplanation: '', legalProblemHistory: '', legalProblemExplanation: '' },
    riskFlags: [], reviewNotes: '',
  };
};

export const ensureRHFormShape = (form: RHForm, result: AssessmentResult): RHForm => {
  const fresh = createRHForm(result);
  return {
    ...fresh,
    ...form,
    consent: { ...fresh.consent, ...form.consent },
    identity: { ...fresh.identity, ...form.identity },
    healthHistory: { ...fresh.healthHistory, ...form.healthHistory, routineMedication: { ...fresh.healthHistory.routineMedication, ...form.healthHistory?.routineMedication }, sleepDifficulty: { ...fresh.healthHistory.sleepDifficulty, ...form.healthHistory?.sleepDifficulty }, items: form.healthHistory?.items?.length === 50 ? form.healthHistory.items : fresh.healthHistory.items },
    educationHistory: form.educationHistory?.length ? form.educationHistory : fresh.educationHistory,
    workHistory: form.workHistory?.length ? form.workHistory : fresh.workHistory,
    workQuestions: { ...fresh.workQuestions, ...form.workQuestions },
    familyHistory: { ...fresh.familyHistory, ...form.familyHistory },
    socialHistory: { ...fresh.socialHistory, ...form.socialHistory },
  };
};
