export type ActorKey =
  | 'adminA'
  | 'teacherA'
  | 'teacherB'
  | 'adminB'
  | 'teacherC'
  | 'learnerA'
  | 'learnerB'
  | 'learnerC'
  | 'operator';
export interface Actor {
  id: string;
  key: ActorKey;
  kind: 'staff' | 'learner';
}
export interface SchoolClass {
  id: string;
  org_id: string;
  label: string;
  archived: boolean;
  teaches: boolean;
}
export interface SchoolState {
  actor: Actor;
  actors: Actor[];
  organizations: { id: string; label: string; role: 'admin' | 'teacher' }[];
  colleagues: { org_id: string; actor_id: string; role: 'admin' | 'teacher' }[];
  classes: SchoolClass[];
  teachers: { org_id: string; class_id: string; actor_id: string }[];
  memberships: {
    class_id: string;
    actor_id: string;
    alias: string;
    sharing: boolean;
    changed_at: string;
  }[];
}
export interface Evidence {
  area: 'notation' | 'intervals' | 'rhythm';
  correct: number;
  total: number;
  completed: number;
  at: string;
}
export interface Learner {
  actor: string;
  alias: string;
  sharing: boolean;
  areas: Evidence[];
}
export interface ClassReport {
  id: string;
  label: string;
  learners: Learner[];
}
