import type { AlgorithmInputField } from '@/lib/types';

function parseCsvNumbers(input: string): number[] {
  return input
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value));
}

export function stringifyPresetValue(value: unknown, type: AlgorithmInputField['type']): string {
  if (type === 'number_list' && Array.isArray(value)) return value.join(', ');
  if (type === 'string_list' && Array.isArray(value)) return value.map(String).join(', ');
  if (type === 'edge_list' && Array.isArray(value)) {
    return value
      .map((edge) => (Array.isArray(edge) ? `${edge[0]}-${edge[1]}` : ''))
      .filter(Boolean)
      .join(', ');
  }
  if (type === 'weighted_edge_list' && Array.isArray(value)) {
    return value
      .map((edge) => (Array.isArray(edge) ? `${edge[0]}-${edge[1]}:${edge[2]}` : ''))
      .filter(Boolean)
      .join(', ');
  }
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return '';
}

export function parseFieldInput(type: AlgorithmInputField['type'], rawInput: string): unknown {
  const value = rawInput.trim();
  if (!value) return undefined;
  if (type === 'number') return Number(value);
  if (type === 'number_list') return parseCsvNumbers(value);
  if (type === 'string_list') return value.split(',').map((part) => part.trim()).filter(Boolean);
  if (type === 'edge_list') {
    return value
      .split(',')
      .map((pair) => pair.trim())
      .filter(Boolean)
      .map((pair) => pair.split('-').map((node) => node.trim()));
  }
  if (type === 'weighted_edge_list') {
    return value
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [pair, weight] = part.split(':');
        const [from, to] = pair.split('-').map((node) => node.trim());
        return [from, to, Number(weight)];
      });
  }
  return value;
}

export function validateFieldInput(field: AlgorithmInputField, rawInput: string): string | null {
  const value = rawInput.trim();
  if (!value) return field.required ? `Required. Example: ${field.example ?? 'see placeholder'}` : null;
  if (field.type === 'number' && Number.isNaN(Number(value))) return `Please enter a number. Example: ${field.example ?? '9'}`;
  if (field.type === 'number_list' && parseCsvNumbers(value).length === 0) {
    return `Use comma-separated numbers. Example: ${field.example ?? '3, 9, 1'}`;
  }
  if (field.type === 'edge_list') {
    const ok = value.split(',').every((part) => part.includes('-'));
    if (!ok) return `Use u-v pairs separated by commas. Example: ${field.example ?? 'A-B, A-C'}`;
  }
  if (field.type === 'weighted_edge_list') {
    const ok = value
      .split(',')
      .every((part) => part.includes('-') && part.includes(':') && !Number.isNaN(Number(part.split(':')[1])));
    if (!ok) return `Use u-v:w format. Example: ${field.example ?? 'A-B:4, B-C:2'}`;
  }
  return null;
}
