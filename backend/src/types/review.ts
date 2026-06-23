export type ReviewType = 'borrower_to_lister' | 'lister_to_borrower';

export interface Review {
  id: string;
  requestId: string;
  reviewerId: string;
  reviewerName: string;
  revieweeId: string;
  itemId: string;
  itemTitle: string;
  reviewType: ReviewType;
  rating: number;          // 1-5
  comment?: string;
  createdAt: string;
}

export interface NewReviewInput {
  requestId: string;
  rating: number;
  comment?: string;
}
