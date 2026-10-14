export interface LegalReadiness {
  operator: {
    name: string | null;
    address: string | null;
    email: string | null;
    legalForm: string | null;
  };
  documents: Record<string, { reviewed: boolean; reviewReference: string | null } | undefined>;
  approvals: Record<string, { approved: boolean; evidenceReference: string | null } | undefined>;
}
export function legalReleaseMissing(input: LegalReadiness) {
  const missing: string[] = [];
  for (const [key, value] of Object.entries(input.operator))
    if (!value?.trim()) missing.push('operator.' + key);
  for (const key of [
    'imprint',
    'privacyDe',
    'privacyEn',
    'termsDe',
    'termsEn',
    'withdrawalDe',
    'withdrawalEn',
  ])
    if (!input.documents[key]?.reviewed || !input.documents[key].reviewReference)
      missing.push('documents.' + key);
  for (const key of [
    'supabaseDpa',
    'anthropicDpa',
    'revenuecatDpa',
    'expoDpa',
    'transferReview',
    'processingRegister',
    'retentionReview',
    'dpiaAssessment',
    'ageReview',
    'storePrivacy',
    'subscriptionCancellation',
    'consentReview',
    'taxReview',
    'licensesReview',
  ])
    if (!input.approvals[key]?.approved || !input.approvals[key].evidenceReference)
      missing.push('approvals.' + key);
  return missing;
}
