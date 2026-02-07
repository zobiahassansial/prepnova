export interface Flashcard {
  id: string;
  front: string;
  back: string;
  interval: number;
  repetition: number;
  easeFactor: number;
  nextReviewDate: any;
  status: 'learning' | 'review' | 'mastered';
}

export interface Deck {
  id: string;
  title: string;
  sourceFileId?: string;
  cards: Flashcard[];
  createdAt: any;
  lastStudied?: any;
}

export function calculateNextReview(card: Flashcard, rating: number) {
  let { interval, repetition, easeFactor } = card;

  // Rating: 1=Again (Fail), 2=Hard, 3=Good, 4=Easy

  if (rating === 1) { 
    // FAIL: Reset everything
    repetition = 0;
    interval = 0; // 0 means "Do it again today"
  } else {
    // PASS (Hard/Good/Easy)
    if (repetition === 0) {
      // First time passing
      if (rating === 2) interval = 1;      // Hard -> 1 day
      if (rating === 3) interval = 3;      // Good -> 3 days
      if (rating === 4) interval = 7;      // Easy -> 7 days
    } else {
      // Subsequent reviews (SM-2 Logic)
      if (rating === 4) {
          // Bonus for easy
          interval = Math.round(interval * easeFactor * 1.3);
      } else {
          interval = Math.round(interval * easeFactor);
      }
    }
    repetition += 1;
  }

  // Ease Factor update
  easeFactor = easeFactor + (0.1 - (4 - rating) * (0.08 + (4 - rating) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + interval);

  // Status Update Logic for Progress Bar
  let status: 'learning' | 'review' | 'mastered' = 'learning';
  if (interval > 10) status = 'mastered';
  else if (interval > 0) status = 'review';

  return {
    interval,
    repetition,
    easeFactor,
    nextReviewDate: nextDate,
    status
  };
}