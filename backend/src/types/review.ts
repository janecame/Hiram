export interface Review {
  id: string;
  requestId: string;
  reviewerId: string;
  reviewerName: string;
  itemId: string;
  itemTitle: string;
  rating: number;          // 1-5
  comment?: string;
  createdAt: string;
}

export interface NewReviewInput {
  requestId: string;
  rating: number;
  comment?: string;
}
