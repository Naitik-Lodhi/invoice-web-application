// src/components/dashboard/DashboardGrid.skeleton.tsx
import { Grid, Card, CardContent, Skeleton } from "@mui/material";

export const DashboardGridSkeleton = () => {
  return (
    <Grid container spacing={3}>
      {/* Create 4 skeleton cards */}
      {[...Array(4)].map((_, index) => (
        <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
          <Card sx={{ boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",}}>
            <CardContent>
              <Skeleton
                variant="text"
                width="60%"
                sx={{ fontSize: "0.8rem" }}
              />
              <Skeleton variant="text" width="80%" sx={{ fontSize: "2rem" }} />
              <Skeleton
                variant="text"
                width="40%"
                sx={{ fontSize: "0.75rem" }}
              />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};
