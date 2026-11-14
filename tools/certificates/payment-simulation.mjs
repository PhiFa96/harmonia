// Diese Fähigkeit erlaubt ausschließlich lokale Testvorgänge, niemals echte Zahlungen.
const capabilities = new WeakSet();
function localContext() {
  return (
    [undefined, 'preview'].includes(process.env.APP_VARIANT) &&
    [undefined, 'development', 'test'].includes(process.env.NODE_ENV)
  );
}
export function createCertificatePaymentSimulation() {
  if (!localContext()) throw Error('Payment simulation configuration is not local');
  const capability = Object.freeze({});
  capabilities.add(capability);
  return capability;
}
export function paymentSimulationEnabled(capability) {
  return (
    capability !== null &&
    typeof capability === 'object' &&
    capabilities.has(capability) &&
    localContext()
  );
}
export function validatePaymentSimulation(capability) {
  if (capability !== null && !paymentSimulationEnabled(capability))
    throw Error('Invalid payment simulation configuration');
}
