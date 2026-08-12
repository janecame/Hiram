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
import { useNavigate } from "react-router-dom";
import { itemFormSchema, type ItemFormValues } from "../schemas/item-form";
import { useCreateItem } from "../hooks/useItems";
import { useAuth } from "../auth/AuthContext";
import { useUserByName } from "../hooks/useUser";
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

export function ListItemPage() {
  const navigate = useNavigate();
  const { isAuthenticated, login, currentUser, isLoading: authLoading } = useAuth();
  const { mutateAsync, isPending } = useCreateItem();
  const snackbar = useSnackbar();
  const { data: fullProfile } = useUserByName(currentUser?.name);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const pendingFileRef = useRef<File | null>(null);

  const [detectStatus, setDetectStatus] = useState<"idle" | "loading" | "granted" | "denied">("idle");

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
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
      province: "",
      city: "",
      barangay: "",
      provinceCode: "",
      cityCode: "",
      barangayCode: "",
      addressDetail: "",
      condition: "",
      lat: undefined,
      lng: undefined,
    } as unknown as ItemFormValues,
  });

  const lat = watch("lat");
  const lng = watch("lng");

  // Prefill location defaults from the user's profile settings once loaded.
  useEffect(() => {
    if (!fullProfile) return;
    if (fullProfile.defaultProvince) setValue("province", fullProfile.defaultProvince);
    if (fullProfile.defaultCity) setValue("city", fullProfile.defaultCity);
    if (fullProfile.defaultBarangay) setValue("barangay", fullProfile.defaultBarangay);
    if (fullProfile.defaultProvinceCode) setValue("provinceCode", fullProfile.defaultProvinceCode);
    if (fullProfile.defaultCityCode) setValue("cityCode", fullProfile.defaultCityCode);
    if (fullProfile.defaultBarangayCode) setValue("barangayCode", fullProfile.defaultBarangayCode);
    if (fullProfile.defaultAddressDetail) setValue("addressDetail", fullProfile.defaultAddressDetail);
    if (fullProfile.defaultLat != null && fullProfile.defaultLng != null) {
      setValue("lat", fullProfile.defaultLat);
      setValue("lng", fullProfile.defaultLng);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullProfile?.id]);

  // Revoke the object URL when it changes or the page unmounts.
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
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
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    pendingFileRef.current = file;
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    setValue("imageUrl", url, { shouldValidate: true });
  };

  const clearImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
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

  const onSubmit = handleSubmit(
    async (values) => {
      console.log("[ListItem] ✅ validation passed, submitting:", values);
      try {
    let imageUrl = values.imageUrl;
    if (pendingFileRef.current) {
      imageUrl = await uploadImage(pendingFileRef.current);
    }
    const area = [
      values.addressDetail?.trim(),
      values.barangay,
      values.city,
      values.province,
    ]
      .filter(Boolean)
      .join(", ");
    await mutateAsync({
      title: values.title,
      category: values.category as Category,
      description: values.description ?? "",
      brand: values.brand?.trim() ? values.brand : undefined,
      pricePerDay: values.pricePerDay,
      pricePerHour: values.pricePerHour,
      quantity: values.quantity,
      imageUrl,
      requirements: values.requirements?.trim()
        ? values.requirements
        : undefined,
      area,
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
        snackbar.success("Listing posted! Borrowers can now find your item.");
        navigate("/");
      } catch (err) {
        console.error("[ListItem] ❌ createItem failed:", err);
        snackbar.error(err instanceof Error ? err.message : "Failed to post listing. Please try again.");
      }
    },
    (formErrors) => {
      // Fires when zod validation blocks submission — this is the usual reason
      // clicking "Post listing" appears to do nothing.
      console.warn("[ListItem] ? validation failed � form not submitted.");
      console.table(
        Object.fromEntries(
          Object.entries(formErrors).map(([field, e]) => [
            field,
            (e as { message?: string } | undefined)?.message ?? "(invalid)",
          ])
        )
      );
      console.log("[ListItem] full error object:", formErrors);
    }
  );

  if (authLoading) {
    return (
      <Stack alignItems="center" sx={{ py: 10 }}>
        <CircularProgress color="primary" />
      </Stack>
    );
  }

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
        onClick={() => navigate(-1)}
        startIcon={<ArrowLeft size={18} />}
        sx={{ mb: 3 }}
        color="primary"
      >
        Back
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
            label="Description (optional)"
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

          <PHLocationPicker
            initialProvinceCode={fullProfile?.defaultProvinceCode}
            initialCityCode={fullProfile?.defaultCityCode}
            initialBarangayCode={fullProfile?.defaultBarangayCode}
            initialProvinceName={fullProfile?.defaultProvince}
            initialCityName={fullProfile?.defaultCity}
            initialBarangayName={fullProfile?.defaultBarangay}
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
              "Select the province, city, and barangay."
            }
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
              startIcon={
                detectStatus === "loading" ? (
                  <span style={{ display: "flex" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeDasharray="31.4" strokeDashoffset="10" style={{ animation: "spin 1s linear infinite", transformOrigin: "center" }} /></svg>
                  </span>
                ) : (
                  <LocateFixed size={16} />
                )
              }
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
            {isPending ? "Posting…" : "Post listing"}
          </Button>
        </Stack>
      </Box>
    </Container>
  );
}
