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
import { ArrowLeft, ImagePlus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { itemFormSchema, type ItemFormValues } from "../schemas/item-form";
import { useCreateItem } from "../hooks/useItems";
import { useAuth } from "../auth/AuthContext";
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
  const { isAuthenticated, login } = useAuth();
  const { mutateAsync, isPending } = useCreateItem();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      title: "",
      category: "",
      description: "",
      brand: "",
      pricePerDay: undefined,
      pricePerHour: undefined,
      quantity: 1,
      imageUrl: undefined,
      requirements: "",
      area: "",
      condition: "",
    } as unknown as ItemFormValues,
  });

  // Revoke the object URL when it changes or the page unmounts.
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    setValue("imageUrl", url, { shouldValidate: true });
  };

  const clearImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setValue("imageUrl", undefined, { shouldValidate: true });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = handleSubmit(async (values) => {
    await mutateAsync({
      title: values.title,
      category: values.category as Category,
      description: values.description,
      brand: values.brand?.trim() ? values.brand : undefined,
      pricePerDay: values.pricePerDay,
      pricePerHour: values.pricePerHour,
      quantity: values.quantity,
      imageUrl: values.imageUrl,
      requirements: values.requirements?.trim()
        ? values.requirements
        : undefined,
      area: values.area,
      condition: values.condition as Condition,
    });
    navigate("/");
  });

  if (!isAuthenticated) {
    return (
      <Container maxWidth="sm" sx={{ py: { xs: 3, md: 5 }, textAlign: "center" }}>
        <Typography variant="h4" gutterBottom>Log in to list an item</Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          You need an account to post a listing on Hiram.
        </Typography>
        <Button variant="contained" color="secondary" size="large" onClick={login}>
          Log in or sign up
        </Button>
      </Container>
    );
  }

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
            label="Brand"
            fullWidth
            placeholder="e.g. Bosch (optional)"
            error={Boolean(errors.brand)}
            helperText={errors.brand?.message}
            {...register("brand")}
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
            label="Price per hour"
            type="number"
            fullWidth
            placeholder="Optional"
            error={Boolean(errors.pricePerHour)}
            helperText={errors.pricePerHour?.message}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">₱</InputAdornment>
              ),
            }}
            {...register("pricePerHour")}
          />

          <TextField
            label="Quantity"
            type="number"
            fullWidth
            placeholder="How many identical units do you have?"
            error={Boolean(errors.quantity)}
            helperText={
              errors.quantity?.message ??
              "How many of this item you can rent out at once."
            }
            inputProps={{ min: 1, step: 1 }}
            {...register("quantity")}
          />

          <Stack spacing={1}>
            <Typography variant="overline" color="text.secondary">
              Photo
            </Typography>
            {imagePreview ? (
              <Box
                sx={{
                  position: "relative",
                  borderRadius: 2,
                  overflow: "hidden",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Box
                  component="img"
                  src={imagePreview}
                  alt="Item preview"
                  sx={{
                    display: "block",
                    width: "100%",
                    height: 220,
                    objectFit: "cover",
                  }}
                />
                <Button
                  type="button"
                  onClick={clearImage}
                  size="small"
                  variant="contained"
                  color="secondary"
                  startIcon={<X size={16} />}
                  sx={{ position: "absolute", top: 8, right: 8 }}
                >
                  Remove
                </Button>
              </Box>
            ) : (
              <Button
                type="button"
                variant="outlined"
                color="primary"
                startIcon={<ImagePlus size={18} />}
                onClick={() => fileInputRef.current?.click()}
                sx={{ py: 2, borderStyle: "dashed" }}
              >
                Upload a photo
              </Button>
            )}
            <Box
              component="input"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              sx={{ display: "none" }}
            />
            <Typography variant="caption" color="text.secondary">
              Optional — no photo falls back to the category icon.
            </Typography>
          </Stack>

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
            label="Requirements to borrow"
            fullWidth
            multiline
            minRows={3}
            placeholder="e.g. Valid ID, ₱500 deposit, pick-up only (optional)"
            error={Boolean(errors.requirements)}
            helperText={errors.requirements?.message}
            {...register("requirements")}
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
