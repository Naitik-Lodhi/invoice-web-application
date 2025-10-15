import { Card, CardContent, Typography, Box } from "@mui/material";
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext: string;
  trend?: number; // optional: percentage change
  icon?: React.ReactNode; // optional: icon for the card
}

const StatCard = ({ title, value, subtext, trend, icon }: StatCardProps) => {
  return (
    <Card
      sx={{
        height: { xs: "160px", sm: "180px", md: "214px" },
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
        cursor: "pointer",
      }}
    >
      <CardContent
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          p: { xs: 2, sm: 2.5, md: 3 },
        }}
      >
        {/* Top Section: Title with optional icon */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Typography
            color="#737373"
            sx={{
              fontSize: { xs: "0.75rem", sm: "0.8rem", md: "0.85rem" },
              fontWeight: 500,
              lineHeight: 1.2,
              maxWidth: "80%",
            }}
          >
            {title}
          </Typography>
          {icon && (
            <Box sx={{ color: "#A3A3A3", opacity: 0.6 }}>
              {icon}
            </Box>
          )}
        </Box>

        {/* Middle Section: Main Value */}
        <Box sx={{ my: { xs: 1, sm: 1.5 } }}>
          <Typography
            variant="h4"
            component="div"
            sx={{
              fontWeight: 600,
              color: "#171717",
              fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2.125rem", lg: "2.25rem" },
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}
          >
            {value}
          </Typography>
        </Box>

        {/* Bottom Section: Subtext with optional trend */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography
            variant="caption"
            sx={{
              color: "#A3A3A3",
              fontSize: { xs: "0.7rem", sm: "0.75rem" },
            }}
          >
            {subtext}
          </Typography>
          {trend !== undefined && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                color: trend >= 0 ? "#10b981" : "#ef4444",
              }}
            >
              {trend >= 0 ? (
                <TrendingUpIcon sx={{ fontSize: "1rem" }} />
              ) : (
                <TrendingDownIcon sx={{ fontSize: "1rem" }} />
              )}
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 600 }}>
                {Math.abs(trend)}%
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatCard;