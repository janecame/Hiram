import {
  Box,
  Button,
  Container,
  MenuItem,
  Stack,
  TextField,
  Typography,
  InputAdornment,
} from "@mui/material";
import { ArrowLeft } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { itemFormSchema, type ItemFormValues } from "../schemas/item-form";
import { useCreateItem } from "../hooks/useItems";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  CONDITIONS,
  CONDITION_LABELS,
  type Category,
  type Condition,
} from "../types/item";

export function ListItemPage() {
  const navigate = useNavigate();
  const { mutateAsync, isPending } = useCreateItem();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      title: "",
      category: "",
      description: "",
      pricePerDay: undefined,
      area: "",
      condition: "",
      owner: "",
    } as unknown as ItemFormValues,
  });

  const onSubmit = handleSubmit(async (values) => {
    await mutateAsync({
      title: values.title,
      category: values.category as Category,
      description: values.description,
      pricePerDay: values.pricePerDay,
      area: values.area,
      condition: values.condition as Condition,
      owner: values.owner,
    });
    navigate("/");
  });

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 3, md: 5 } }}>
      <Button
        component={RouterLink}
        to="/"
        startIcon={<ArrowLeft size={18} />}
        sx={{ mb: 3 }}
        color="primary"
      >
        Back to browse
      </Button>

      <Stack spacing={1} sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1">
          List an item
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Share something you own and earn from it while it sits idle.
        </Typography>
      </Stack>

      <Box component="form" onSubmit={onSubmit} noValidate>
        <Stack spacing={2.5}>
          <TextField
            label="Title"
            fullWidth
            placeholder="e.g. Bosch Cordless Drill Kit"
            error={Boolean(errors.title)}
            helperText={errors.title?.message}
            {...register("title")}
          />

          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <TextField
                select
                label="Category"
                fullWidth
                error={Boolean(errors.category)}
                helperText={errors.category?.message}
                {...field}
              >
                {CATEGORIES.map((c) => (
                  <MenuItem key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          <TextField
            label="Description"
            fullWidth
            multiline
            minRows={4}
            placeholder="What is it, what's included, and what condition is it in?"
            error={Boolean(errors.description)}
            helperText={errors.description?.message}
            {...register("description")}
          />

          <TextField
            label="Price per day"
            type="number"
            fullWidth
            error={Boolean(errors.pricePerDay)}
            helperText={errors.pricePerDay?.message}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">₱</InputAdornment>
              ),
            }}
            {...register("pricePerDay")}
          />

          <TextField
            label="Area"
            fullWidth
            placeholder="e.g. Bacolod City"
            error={Boolean(errors.area)}
            helperText={errors.area?.message}
            {...register("area")}
          />

          <Controller
            name="condition"
            control={control}
            render={({ field }) => (
              <TextField
                select
                label="Condition"
                fullWidth
                error={Boolean(errors.condition)}
                helperText={errors.condition?.message}
                {...field}
              >
                {CONDITIONS.map((c) => (
                  <MenuItem key={c} value={c}>
                    {CONDITION_LABELS[c]}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          <TextField
            label="Your name"
            fullWidth
            placeholder="Shown to borrowers"
            error={Boolean(errors.owner)}
            helperText={errors.owner?.message}
            {...register("owner")}
          />

          <Button
            type="submit"
            variant="contained"
            color="secondary"
            size="large"
            disabled={isPending}
          >
            {isPending ? "Posting…" : "Post listing"}
          </Button>
        </Stack>
      </Box>
    </Container>
  );
}
