import {
  Alert,
  Box,
  Button,
  CircularProgress,
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
import { Link as RouterLink, Navigate, useNavigate, useParams } from "react-router-dom";
import { itemFormSchema, type ItemFormValues } from "../schemas/item-form";
import { useItem } from "../hooks/useItem";
import { useUpdateItem } from "../hooks/useItems";
import { useAuth } from "../auth/AuthContext";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  CONDITIONS,
  CONDITION_LABELS,
  type Category,
  type Condition,
} from "../types/item";
import { EmptyState } from "../components/EmptyState";

export function EditItemPage() {
  const { id } = useParams<{ id: string }>();
  const { data: item, isLoading } = useItem(id);
  const { currentUser, isAuthenticated } = useAuth();

  if (!isAuthenticated || !currentUser) return <Navigate to="/" replace />;

  if (isLoading) {
    return (
      <Stack alignItems="center" sx={{ py: 10 }}>
        <CircularProgress color="primary" />
      </Stack>
    );
  }

  if (!item) {
    return (
      <Container maxWidth="sm" sx={{ py: { xs: 3, md: 5 } }}>
        <EmptyState title="Item not found" message="This listing may have been removed." />
      </Container>
    );
  }

  if (item.owner !== currentUser.name) {
    return <Navigate to={`/item/${id}`} replace />;
  }

  return <EditForm itemId={item.id} defaultValues={{
    title: item.title,
    category: item.category,
    description: item.description,
    brand: item.brand ?? "",
    pricePerDay: item.pricePerDay,
    pricePerHour: item.pricePerHour,
    quantity: item.quantity ?? 1,
    imageUrl: item.imageUrl,
    requirements: item.requirements ?? "",
    area: item.area,
    condition: item.condition,
  }} />;
}

function EditForm({
  itemId,
  defaultValues,
}: {
  itemId: string;
  defaultValues: ItemFormValues;
}) {
  const navigate = useNavigate();
  const { mutateAsync, isPending } = useUpdateItem(itemId);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    defaultValues.imageUrl ?? null
  );

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues,
  });

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:"))
        URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    setValue("imageUrl", url, { shouldValidate: true });
  };

  const clearImage = () => {
    if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setValue("imageUrl", undefined, { shouldValidate: true });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await mutateAsync({
        title: values.title,
        category: values.category as Category,
        description: values.description,
        brand: values.brand?.trim() ? values.brand : undefined,
        pricePerDay: values.pricePerDay,
        pricePerHour: values.pricePerHour,
        quantity: values.quantity,
        imageUrl: values.imageUrl,
        requirements: values.requirements?.trim() ? values.requirements : undefined,
        area: values.area,
        condition: values.condition as Condition,
      });
      navigate(`/item/${itemId}`);
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : "Something went wrong");
    }
  });

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 3, md: 5 } }}>
      <Button
        component={RouterLink}
        to={`/item/${itemId}`}
        startIcon={<ArrowLeft size={18} />}
        sx={{ mb: 3 }}
        color="primary"
      >
        Back to item
      </Button>

      <Stack spacing={1} sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1">
          Edit listing
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Update the details of your item.
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
              startAdornment: <InputAdornment position="start">₱</InputAdornment>,
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
              startAdornment: <InputAdornment position="start">₱</InputAdornment>,
            }}
            {...register("pricePerHour")}
          />

          <TextField
            label="Quantity"
            type="number"
            fullWidth
            error={Boolean(errors.quantity)}
            helperText={
              errors.quantity?.message ?? "How many of this item you can rent out at once."
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
                  sx={{ display: "block", width: "100%", height: 220, objectFit: "cover" }}
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

          {submitError && <Alert severity="error">{submitError}</Alert>}

          <Button
            type="submit"
            variant="contained"
            color="secondary"
            size="large"
            disabled={isPending}
          >
            {isPending ? "Saving…" : "Save changes"}
          </Button>
        </Stack>
      </Box>
    </Container>
  );
}
