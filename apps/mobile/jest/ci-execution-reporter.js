// Report suite/worker failures too; the built-in reporter annotates individual assertions.
const { relative, sep } = require('node:path');
const escapeProperty = (value) =>
  value
    .replaceAll('%', '%25')
    .replaceAll('\r', '%0D')
    .replaceAll('\n', '%0A')
    .replaceAll(',', '%2C')
    .replaceAll(':', '%3A');
function executionAnnotation(
  file,
  error,
  workspace = process.env.GITHUB_WORKSPACE ?? process.cwd(),
) {
  const message = typeof error?.message === 'string' ? error.message : '';
  const reason = /SIGKILL/i.test(message)
    ? 'worker_sigkill'
    : /heap|out of memory|allocation failed/i.test(message)
      ? 'worker_memory_limit'
      : /SIGABRT/i.test(message)
        ? 'worker_sigabrt'
        : /child process exceptions|retry limit/i.test(message)
          ? 'worker_retries_exhausted'
          : /cannot find module|module not found/i.test(message)
            ? 'module_resolution'
            : 'suite_execution_error';
  const path = relative(workspace, file).split(sep).join('/');
  const properties = ['title=App test runner'];
  if (path && !path.startsWith('../')) properties.unshift('file=' + escapeProperty(path));
  return '::error ' + properties.join(',') + '::Suite execution failed (' + reason + ').';
}
class ExecutionReporter {
  onTestResult(test, result) {
    if (process.env.GITHUB_ACTIONS === 'true' && result.testExecError)
      process.stderr.write('\n' + executionAnnotation(test.path, result.testExecError) + '\n');
  }
}
module.exports = ExecutionReporter;
module.exports.executionAnnotation = executionAnnotation;
