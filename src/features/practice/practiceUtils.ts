import type { PracticeQuestion } from './types';

const CHOICE_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

export { CHOICE_LABELS };

export function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

export function getChoices(q: PracticeQuestion): { id: string; text: string }[] {
  const raw = [q.option_a, q.option_b, q.option_c, q.option_d, q.option_e, q.option_f];
  return raw
    .map((text, i) => (text ? { id: CHOICE_LABELS[i], text } : null))
    .filter(Boolean) as { id: string; text: string }[];
}

export function getDifficultyLabel(d: string | null): { label: string; cls: string } {
  if (d === 'easy')
    return {
      label: 'Dễ',
      cls: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
    };
  if (d === 'hard')
    return {
      label: 'Khó',
      cls: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
    };
  return {
    label: 'Trung bình',
    cls: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
  };
}
