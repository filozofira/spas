// Example transformation functions

function transformInput(message) {
  // Add input transformation logic here
  return {
    ...message,
    _transformed: true,
    _transformed_at: new Date().toISOString(),
    _component: 'transformer-sidecar-input'
  };
}

function transformOutput(message) {
  // Add output transformation logic here
  return {
    ...message,
    _transformed: true,
    _transformed_at: new Date().toISOString(),
    _component: 'transformer-sidecar-output'
  };
}

module.exports = { transformInput, transformOutput };
