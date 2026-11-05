import type { AccessStatus } from '../../packages/content/src/access.ts';
import type { ActorKey } from './protocol.ts';
import type { AssignmentView } from './assignment-protocol.ts';
export interface LicenseInvoice {
  id: string;
  org: string;
  organization: string;
  reference: string;
  seats: number;
  unitCents: number;
  totalCents: number;
  currency: 'EUR';
  startsAt: string;
  endsAt: string;
  state: 'draft' | 'paid' | 'void';
  createdAt: string;
  used: number;
}
export interface LicenseAccess {
  grants: { id: string; organization: string; endsAt: string }[];
  status: AccessStatus;
}
export interface LicenseOverview extends LicenseAccess {
  operator: boolean;
  organizations: { id: string; label: string }[];
  invoices: LicenseInvoice[];
  candidates: { id: string; key: ActorKey | null; label: string | null; org: string }[];
  requests: { org: string; organization: string; requested: boolean; label: string | null }[];
  seats: { invoice: string; member: string }[];
  events: {
    invoice: string;
    kind: 'created' | 'paid' | 'void' | 'assigned' | 'released';
    at: string;
  }[];
}
export interface LicensePractice {
  id: string;
  source: string;
  question: NonNullable<AssignmentView['question']>;
  result: { correct: boolean; total: number } | null;
}
