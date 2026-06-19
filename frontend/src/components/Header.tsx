import { AppBar, Box, Button, Container, Toolbar, Typography } from "@mui/material";
import { Plus, Package } from "lucide-react";
import { Link as RouterLink, useLocation } from "react-router-dom";

export function Header() {
  const { pathname } = useLocation();
  const onList = pathname === "/list";

  return (
    <AppBar
      position="sticky"
      sx={{
        backdropFilter: "blur(8px)",
        backgroundColor: "rgba(250,247,242,0.85)",
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ gap: 2 }}>
          <Box
            component={RouterLink}
            to="/"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              textDecoration: "none",
              color: "primary.main",
            }}
          >
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                border: "2px dashed",
                borderColor: "secondary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "secondary.main",
              }}
            >
              <Package size={18} />
            </Box>
            <Box>
              <Typography
                variant="h6"
                sx={{ lineHeight: 1, fontSize: 22 }}
                color="primary"
              >
                Hiram
              </Typography>
              <Typography
                variant="caption"
                sx={{ fontSize: 9, color: "text.secondary" }}
              >
                borrow what's near
              </Typography>
            </Box>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Button
            component={RouterLink}
            to="/"
            color="primary"
            sx={{ fontWeight: pathname === "/" ? 700 : 500 }}
          >
            Browse
          </Button>
          <Button
            component={RouterLink}
            to="/list"
            variant={onList ? "contained" : "outlined"}
            color="secondary"
            startIcon={<Plus size={18} />}
          >
            List an item
          </Button>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
