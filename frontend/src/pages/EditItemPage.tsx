import {
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
import { ArrowLeft, ImagePlus, LocateFixed, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PHLocationPicker } from "../components/PHLocationPicker";
import { LocationPicker } from "../components/LocationPicker";
import { Link as RouterLink, Navigate, useNavigate, useParams } from "react-router-dom";
import { itemFormSchema, type ItemFormValues } from "../schemas/item-form";
import { useItem } from "../hooks/useItem";
import { useUpdateItem } from "../hooks/useItems";
import { useAuth } from "../auth/AuthContext";
import { uploadImage } from "../api/upload";
import { validateImageFile } from "../lib/uploadValidation";
import { useSnackbar } from "../context/SnackbarContext";
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
    province: item.province ?? "",
    city: item.city ?? "",
    barangay: item.barangay ?? "",
    provinceCode: item.provinceCode ?? "",
    cityCode: item.cityCode ?? "",
    barangayCode: item.barangayCode ?? "",
    addressDetail: item.addressDetail ?? "",
    condition: item.condition,
    lat: item.lat,
    lng: item.lng,
  } as ItemFormValues} />;
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
  const snackbar = useSnackbar();
  const [detectStatus, setDetectStatus] = useState<"idle" | "loading" | "granted" | "denied">("idle");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    defaultValues.imageUrl ?? null
  );
  const pendingFileRef = useRef<File | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues,
  });

  const lat = watch("lat");
  const lng = watch("lng");

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:"))
        URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validationError = validateImageFile(file);
    if (validationError) {
      snackbar.error(validationError);
      e.target.value = "";
      return;
    }
    if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    pendingFileRef.current = file;
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    setValue("imageUrl", url, { shouldValidate: true });
  };

  const clearImage = () => {
    if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    pendingFileRef.current = null;
    setImagePreview(null);
    setValue("imageUrl", undefined, { shouldValidate: true });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  function handleDetectLocation() {
    if (!navigator.geolocation) {
      setDetectStatus("denied");
      return;
    }
    setDetectStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue("lat", pos.coords.latitude, { shouldValidate: true });
        setValue("lng", pos.coords.longitude, { shouldValidate: true });
        setDetectStatus("granted");
      },
      () => setDetectStatus("denied")
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      let imageUrl = values.imageUrl;
      if (pendingFileRef.current) {
        imageUrl = await uploadImage(pendingFileRef.current);
      }
      await mutateAsync({
        title: values.title,
        category: values.category as Category,
        description: values.description,
        brand: values.brand?.trim() ? values.brand : undefined,
        pricePerDay: values.pricePerDay,
        pricePerHour: values.pricePerHour,
        quantity: values.quantity,
        imageUrl,
        requirements: values.requirements?.trim() ? values.requirements : undefined,
        area: [
          values.addressDetail?.trim(),
          values.barangay,
          values.city,
          values.province,
        ]
          .filter(Boolean)
          .join(", "),
        province: values.province,
        city: values.city,
        barangay: values.barangay,
        provinceCode: values.provinceCode || undefined,
        cityCode: values.cityCode || undefined,
        barangayCode: values.barangayCode || undefined,
        addressDetail: values.addressDetail?.trim()
          ? values.addressDetail
          : undefined,
        condition: values.condition as Condition,
        lat: values.lat,
        lng: values.lng,
      });
      snackbar.success("Listing updated successfully.");
      navigate(`/item/${itemId}`);
    } catch (e: unknown) {
      snackbar.error(e instanceof Error ? e.message : "Failed to update listing. Please try again.");
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

          <PHLocationPicker
            initialProvinceCode={defaultValues.provinceCode || undefined}
            initialCityCode={defaultValues.cityCode || undefined}
            initialBarangayCode={defaultValues.barangayCode || undefined}
            initialProvinceName={defaultValues.province || undefined}
            initialCityName={defaultValues.city || undefined}
            initialBarangayName={defaultValues.barangay || undefined}
            onChange={({ province, city, barangay, provinceCode, cityCode, barangayCode }) => {
              setValue("province", province, { shouldValidate: true });
              setValue("city", city, { shouldValidate: true });
              setValue("barangay", barangay, { shouldValidate: true });
              setValue("provinceCode", provinceCode);
              setValue("cityCode", cityCode);
              setValue("barangayCode", barangayCode);
            }}
            error={Boolean(errors.province || errors.city || errors.barangay)}
            helperText={
              errors.province?.message ??
              errors.city?.message ??
              errors.barangay?.message ??
              "Re-select to change the province, city, and barangay."
            }
            currentArea={defaultValues.area}
          />

          <TextField
            label="Address detail"
            fullWidth
            placeholder="Block / lot / street / landmark (optional)"
            error={Boolean(errors.addressDetail)}
            helperText={
              errors.addressDetail?.message ??
              "Help borrowers find the exact pickup spot."
            }
            {...register("addressDetail")}
          />

          <Stack spacing={1}>
            <Button
              type="button"
              variant="outlined"
              color="primary"
              size="small"
              startIcon={<LocateFixed size={16} />}
              onClick={handleDetectLocation}
              disabled={detectStatus === "loading"}
              sx={{ alignSelf: "flex-start" }}
            >
              {detectStatus === "loading"
                ? "Detecting…"
                : detectStatus === "granted"
                ? "Location detected — re-detect"
                : "Use my current location"}
            </Button>
            {detectStatus === "denied" && (
              <Typography variant="caption" color="error.main">
                Location permission denied. Drop the pin on the map manually.
              </Typography>
            )}
            <LocationPicker
              lat={lat}
              lng={lng}
              onChange={(la, ln) => {
                setValue("lat", la, { shouldValidate: true });
                setValue("lng", ln, { shouldValidate: true });
              }}
              error={Boolean(errors.lat || errors.lng)}
              helperText={
                errors.lat?.message ??
                errors.lng?.message ??
                "Drop the pin on the exact pickup location."
              }
            />
          </Stack>

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
            {isPending ? "Saving…" : "Save changes"}
          </Button>
        </Stack>
      </Box>
    </Container>
  );
}
