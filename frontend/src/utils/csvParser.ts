import Papa from 'papaparse';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseEmailsFromCSV(file: File): Promise<{ valid: string[]; invalid: number }> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      complete: (results) => {
        const allValues: string[] = [];

        results.data.forEach((row: any) => {
          if (Array.isArray(row)) {
            row.forEach((cell: any) => {
              if (typeof cell === 'string') allValues.push(cell.trim());
            });
          } else if (typeof row === 'object') {
            Object.values(row).forEach((val: any) => {
              if (typeof val === 'string') allValues.push(val.trim());
            });
          }
        });

        const valid = allValues.filter((v) => EMAIL_REGEX.test(v));
        const invalid = allValues.filter((v) => v.length > 0 && !EMAIL_REGEX.test(v)).length;

        resolve({ valid: Array.from(new Set(valid)), invalid });
      },
      error: reject,
      skipEmptyLines: true,
    });
  });
}

export function parseEmailsFromText(text: string): { valid: string[]; invalid: number } {
  const lines = text.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);
  const valid = lines.filter((v) => EMAIL_REGEX.test(v));
  const invalid = lines.filter((v) => !EMAIL_REGEX.test(v)).length;
  return { valid: Array.from(new Set(valid)), invalid };
}