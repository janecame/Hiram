import { Avatar, Box, Divider, Rating, Stack, Typography } from "@mui/material";
import { Star } from "lucide-react";

interface ReviewsSectionProps {
  /** 0–5 average rating from the item, if any. */
  rating?: number;
}

/**
 * Phase 1 MOCK UI — there is no review data model yet.
 * This placeholder list is hard-coded here on purpose (no `data/` file,
 * no new type) and is purely presentational. Real reviews land in a later phase.
 */
const MOCK_REVIEWS: { id: string; author: string; stars: number; comment: string }[] = [
  {
    id: "r1",
    author: "Maria S.",
    stars: 5,
    comment: "Item was exactly as described and the owner was easy to coordinate with. Smooth meetup!",
  },
  {
    id: "r2",
    author: "Jun P.",
    stars: 4,
    comment: "Worked great for my weekend project. A little dusty but cleaned up fine.",
  },
  {
    id: "r3",
    author: "Liza T.",
    stars: 5,
    comment: "Super friendly lender. Would borrow again.",
  },
];

/** Feedback / reviews block for the item detail page. */
export function ReviewsSection({ rating }: ReviewsSectionProps) {
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

      <Stack spacing={2} divider={<Divider flexItem />}>
        {MOCK_REVIEWS.map((review) => (
          <Stack key={review.id} direction="row" spacing={1.5} alignItems="flex-start">
            <Avatar sx={{ width: 36, height: 36, bgcolor: "primary.main" }}>
              {review.author.charAt(0)}
            </Avatar>
            <Box>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="subtitle2">{review.author}</Typography>
                <Rating
                  value={review.stars}
                  readOnly
                  size="small"
                  icon={<Star size={14} fill="currentColor" />}
                  emptyIcon={<Star size={14} />}
                />
              </Stack>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {review.comment}
              </Typography>
            </Box>
          </Stack>
        ))}
      </Stack>

      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        Demo reviews — feedback collection is coming in a later phase.
      </Typography>
    </Stack>
  );
}
