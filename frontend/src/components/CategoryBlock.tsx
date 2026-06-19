import { Box } from "@mui/material";
import type { Category } from "../types/item";
import { CATEGORY_VISUALS } from "../lib/format";

interface CategoryBlockProps {
  category: Category;
  height?: number | string;
  iconSize?: number;
}

/**
 * Photo-less "image" block — a category-tinted panel with a lucide icon.
 * Used instead of stock photos for item visuals.
 */
export function CategoryBlock({
  category,
  height = 160,
  iconSize = 56,
}: CategoryBlockProps) {
  const { icon: Icon, tint } = CATEGORY_VISUALS[category];
  return (
    <Box
      sx={{
        height,
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(135deg, ${tint}22, ${tint}10)`,
        color: tint,
        position: "relative",
        overflow: "hidden",
        "&::after": {
          content: '""',
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
          backgroundSize: "16px 16px",
          opacity: 0.12,
        },
      }}
    >
      <Icon size={iconSize} strokeWidth={1.5} />
    </Box>
  );
}
