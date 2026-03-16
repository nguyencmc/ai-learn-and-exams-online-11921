import type { Recommendation, UserStats } from './types';

export function buildRecommendations(stats: UserStats): Recommendation[] {
  const recs: Recommendation[] = [];

  if (stats.inProgressSession) {
    recs.push({ type: 'exam', title: 'Tiếp tục bài đang làm', description: 'Bạn có bài thi chưa hoàn thành', priority: 'high', href: '/practice', icon: 'target' });
  }

  if (stats.wrongAnswerCount >= 5) {
    recs.push({ type: 'review', title: 'Ôn lại câu sai', description: `${stats.wrongAnswerCount} câu sai cần củng cố ngay`, priority: 'high', href: '/practice/review', icon: 'trending' });
  } else if (stats.wrongAnswerCount > 0) {
    recs.push({ type: 'review', title: 'Ôn lại câu sai', description: `${stats.wrongAnswerCount} câu sai cần xem lại`, priority: 'medium', href: '/practice/review', icon: 'trending' });
  }

  if (stats.flashcardsDue >= 10) {
    recs.push({ type: 'flashcard', title: 'Ôn flashcard hôm nay', description: `${stats.flashcardsDue} thẻ đến hạn, ôn ngay để không quên`, priority: 'high', href: '/flashcards/today', icon: 'brain' });
  } else if (stats.flashcardsDue > 0) {
    recs.push({ type: 'flashcard', title: 'Ôn flashcard', description: `${stats.flashcardsDue} thẻ đến hạn ôn tập`, priority: 'medium', href: '/flashcards/today', icon: 'brain' });
  }

  if (stats.totalAttempts >= 10 && stats.recentAccuracy7d < 50) {
    recs.push({ type: 'practice', title: 'Luyện câu dễ để lấy đà', description: `Tỉ lệ đúng gần đây ${stats.recentAccuracy7d.toFixed(0)}% — ôn lại nền tảng`, priority: 'high', href: '/practice?difficulty=easy', icon: 'star' });
  }

  if (stats.totalAttempts >= 20 && stats.recentAccuracy7d >= 80) {
    recs.push({ type: 'practice', title: 'Thử thách nâng cao', description: `Tỉ lệ đúng ${stats.recentAccuracy7d.toFixed(0)}% — bạn sẵn sàng câu khó!`, priority: 'medium', href: '/practice?difficulty=hard', icon: 'trophy' });
  }

  if (stats.unpracticedSets.length > 0) {
    const set = stats.unpracticedSets[0];
    recs.push({ type: 'practice', title: `Khám phá: ${set.title}`, description: 'Bộ đề bạn chưa thử lần nào', priority: stats.totalAttempts === 0 ? 'high' : 'low', href: `/practice/setup/${set.id}`, icon: 'book' });
  }

  if (!stats.streakToday && stats.daysActiveLast7 >= 3) {
    recs.push({ type: 'practice', title: 'Giữ vững chuỗi học tập', description: 'Học ít nhất 5 câu hôm nay để không mất streak', priority: 'high', href: '/practice', icon: 'flame' });
  }

  if (stats.totalAttempts < 5) {
    recs.push({ type: 'practice', title: 'Bắt đầu luyện tập ngay', description: 'Thử 10 câu đầu tiên để khám phá', priority: 'high', href: '/practice', icon: 'target' });
  }

  const seen = new Set<string>();
  return recs
    .filter(r => { if (seen.has(r.title)) return false; seen.add(r.title); return true; })
    .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority]))
    .slice(0, 3);
}

export function buildSummary(stats: UserStats): string {
  if (stats.totalAttempts === 0) return 'Bắt đầu luyện tập để nhận gợi ý cá nhân hoá! 🚀';
  if (stats.recentAccuracy7d >= 80) return `Tuyệt vời! Tỉ lệ đúng 7 ngày gần nhất ${stats.recentAccuracy7d.toFixed(0)}% 🎉`;
  if (stats.recentAccuracy7d >= 60) return `Khá tốt! Tỉ lệ đúng ${stats.recentAccuracy7d.toFixed(0)}% — tiếp tục duy trì nhé 💪`;
  if (stats.totalAttempts >= 10) return `Tỉ lệ đúng ${stats.recentAccuracy7d.toFixed(0)}% — ôn lại câu sai để cải thiện 📚`;
  return `Đã làm ${stats.totalAttempts} câu — luyện đều mỗi ngày để tiến bộ nhanh hơn!`;
}

export const isToday = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toDateString() === new Date().toDateString();
};

export const isWithinDays = (dateStr: string, days: number) => {
  return new Date(dateStr) >= new Date(Date.now() - days * 86400000);
};
