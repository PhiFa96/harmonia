export function cleanPrivateExports() {
  /* Browser downloads are under the user's control. */
}
export function erasePrivateExports() {
  /* User-owned browser downloads cannot be recalled. */
}
export function downloadPrivateFile(text: string, name: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
  return Promise.resolve();
}
