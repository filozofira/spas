// Transformation functions for SPAS Sidecar
// These functions are applied to messages as they flow through the pipeline

function transformInput(message) {
  // Transform input messages (from service to publish)
  return {
    ...message,
    _transformed: true,
    _transformed_at: new Date().toISOString(),
    _component: 'spas-sidecar-input'
  };
}

function transformOutput(message) {
  // Transform output messages (from subscribe to service invocation)
  return {
    ...message,
    _transformed: true,
    _transformed_at: new Date().toISOString(),
    _component: 'spas-sidecar-output'
  };
}

module.exports = { transformInput, transformOutput };
