import {
  Avatar,
  Box,
  CircularProgress,
  Divider,
  Rating,
  Stack,
  Typography,
} from "@mui/material";
import { Star } from "lucide-react";
import { useReviews } from "../hooks/useReviews";
import type { Review } from "../types/review";

interface ReviewsSectionProps {
  /** Item whose reviews are shown. */
  itemId: string;
  /** 0–5 average rating from the item, if any. */
  rating?: number;
}

function formatReviewDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
}

/** Feedback / reviews block for the item detail page. */
export function ReviewsSection({ itemId, rating }: ReviewsSectionProps) {
  const { data: reviews, isLoading } = useReviews(itemId);

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Typography variant="h6" component="h2">
          Reviews
        </Typography>
        {typeof rating === "number" && (
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Rating
              value={rating}
              precision={0.1}
              readOnly
              size="small"
              icon={<Star size={16} fill="currentColor" />}
              emptyIcon={<Star size={16} />}
            />
            <Typography
              variant="overline"
              sx={{ color: "text.secondary", lineHeight: 1 }}
            >
              {rating.toFixed(1)}
            </Typography>
          </Stack>
        )}
      </Stack>

      {isLoading ? (
        <Stack alignItems="center" sx={{ py: 3 }}>
          <CircularProgress color="primary" size={28} />
        </Stack>
      ) : !reviews || reviews.length === 0 ? (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          No reviews yet
        </Typography>
      ) : (
        <Stack spacing={2} divider={<Divider flexItem />}>
          {reviews.map((review: Review) => (
            <Stack
              key={review.id}
              direction="row"
              spacing={1.5}
              alignItems="flex-start"
            >
              <Avatar sx={{ width: 36, height: 36, bgcolor: "primary.main" }}>
                {review.reviewerName.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  flexWrap="wrap"
                  useFlexGap
                >
                  <Typography variant="subtitle2">
                    {review.reviewerName}
                  </Typography>
                  <Rating
                    value={review.rating}
                    readOnly
                    size="small"
                    icon={<Star size={14} fill="currentColor" />}
                    emptyIcon={<Star size={14} />}
                  />
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {formatReviewDate(review.createdAt)}
                  </Typography>
                </Stack>
                {review.comment && (
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {review.comment}
                  </Typography>
                )}
              </Box>
            </Stack>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
