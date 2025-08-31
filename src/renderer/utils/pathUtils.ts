export function truncateDynamicPath(
  filePath: string | null | undefined,
  maxChars: number,
): string {
  if (!filePath || filePath === '' || typeof filePath !== 'string') return '';

  try {
    const parts = filePath.split('\\');
    const fileName = parts.pop();
    const driveLetter = parts.shift();

    if (!fileName || !driveLetter) return filePath;

    let truncatedPath = `${driveLetter}`;
    let currentChars = driveLetter.length + 1 + fileName.length;

    parts.reduce((acc, part) => {
      if (currentChars + part.length + 1 <= maxChars) {
        truncatedPath = `${acc}\\${part}`;
        currentChars += part.length + 1;
      } else if (!truncatedPath.endsWith('\\.....')) {
        truncatedPath += '\\.....';
      }
      return truncatedPath;
    }, driveLetter);

    return `${truncatedPath}\\${fileName}`;
  } catch (error) {
    // If any error occurs during path processing, return empty string.
    return '';
  }
}
