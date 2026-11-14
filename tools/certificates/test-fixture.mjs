import { DatabaseSync } from 'node:sqlite';
import { CERTIFICATE_PROFILES } from './profiles.ts';
import { catalogue } from '../../packages/content/src/authoring.ts';
import { createExamRun } from '../../packages/content/src/exam.ts';
import { evaluateExercise } from '../../packages/exercises/src/index.ts';
import { randomUUID } from 'node:crypto';
import { createCertificateService } from './service.mjs';
import { createCertificateServer } from './server.mjs';
import { createCertificatePaymentSimulation } from './payment-simulation.mjs';

export function createCertificateTestService(filename, options = {}) {
  return createCertificateService(filename, {
    ...options,
    paymentSimulation: createCertificatePaymentSimulation(),
  });
}
export function createCertificateTestServer(options = {}) {
  return createCertificateServer({
    ...options,
    paymentSimulation: createCertificatePaymentSimulation(),
  });
}

/** Explicitly fund a local synthetic purchase, never a production entitlement. */
export function startFixture(service, owner, payload) {
  const active = service.state(owner, payload.locale).attempts.find((a) => a.phase === 'active');
  let purchase = active?.profile === payload.profile ? active.purchaseId : null;
  if (!purchase) {
    const order = service.order(owner, { profile: payload.profile, requestId: randomUUID() });
    service.simulateSettlement(owner, { id: order.id, outcome: 'paid' });
    purchase = order.id;
  }
  return service.start(owner, { ...payload, purchase });
}

/** Test-only oracle reads the private fixture DB; no answer/seed endpoint exists. */
export function fixtureAnswers(filename, id) {
  const db = new DatabaseSync(filename);
  const row = db.prepare('select * from certificate_drafts where id=?').get(id);
  db.close();
  const profile = CERTIFICATE_PROFILES.find((p) => p.id === row.profile);
  const run = createExamRun(catalogue, [profile.template], profile.id, row.seed, row.started);
  return run.session.items.map((item) => ({
    right: item.choices.find((c) => evaluateExercise(item, c).correct),
    wrong: item.choices.find((c) => !evaluateExercise(item, c).correct),
    aural: item.type === 'INTERVAL_IDENTIFY_AURAL' || item.presentation === 'aural',
  }));
}
