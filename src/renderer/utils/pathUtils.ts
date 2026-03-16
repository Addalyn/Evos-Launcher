function truncateDynamicPath(
  filePath: string | null | undefined,
  maxChars: number,
): string {
  if (!filePath || filePath === '' || typeof filePath !== 'string') return '';

  try {
    // Detect if we should use \ or / based on the input path
    const isWindowsPath = filePath.includes('\\');
    const sep = isWindowsPath ? '\\' : '/';

    // Split by either \ or /
    const parts = filePath.split(/[\\/]/);
    const fileName = parts.pop();
    const driveLetter = parts.shift();

    if (!fileName || !driveLetter) return filePath;

    let truncatedPath = `${driveLetter}`;
    let currentChars = driveLetter.length + 1 + fileName.length;

    parts.reduce((acc, part) => {
      if (currentChars + part.length + 1 <= maxChars) {
        truncatedPath = `${acc}${sep}${part}`;
        currentChars += part.length + 1;
      } else if (!truncatedPath.endsWith(`${sep}.....`)) {
        truncatedPath += `${sep}.....`;
      }
      return truncatedPath;
    }, driveLetter);

    return `${truncatedPath}${sep}${fileName}`;
  } catch (error) {
    // If any error occurs during path processing, return empty string.
    return '';
  }
}
export default truncateDynamicPath;
