"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { config } from "@/lib/config";

interface SurveyStats {
  totalSurveys: number;
  currentParticipants: number;
}

export function useSurveyStats(enableRealtime = false) {
  const [stats, setStats] = useState<SurveyStats>({
    totalSurveys: 0,
    currentParticipants: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const [totalResponse, ongoingResponse] = await Promise.all([
        fetch(`${config.apiBaseUrl}/surveys/count`, { cache: "no-store" }),
        fetch(`${config.apiBaseUrl}/surveys/count?status=started`, { cache: "no-store" }),
      ]);

      if (totalResponse.ok && ongoingResponse.ok) {
        const [totalData, ongoingData] = await Promise.all([
          totalResponse.json(),
          ongoingResponse.json(),
        ]);

        setStats({
          totalSurveys: totalData.count || 0,
          currentParticipants: ongoingData.count || 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch survey stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    if (enableRealtime) {
      const interval = setInterval(fetchStats, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [enableRealtime]);

  return { ...stats, isLoading, refresh: fetchStats };
}

export function LiveStats() {
  const { totalSurveys, currentParticipants } = useSurveyStats(true);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <Card className="py-2">
        <CardContent className="p-1">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{currentParticipants}</div>
            <p className="text-sm text-muted-foreground">People currently taking the quiz</p>
          </div>
        </CardContent>
      </Card>

      <Card className="py-2">
        <CardContent className="p-1">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{totalSurveys.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">Total couples who&apos;ve taken the quiz</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
