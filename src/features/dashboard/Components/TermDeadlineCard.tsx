"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";

type TermDeadlineCardProps = {
  nextDeadline: Date;
  termLabel: string;
  status: string;
};

export function TermDeadlineCard({
  nextDeadline,
  termLabel,
  status,
}: TermDeadlineCardProps) {
  const now = new Date();
  const diff = nextDeadline.getTime() - now.getTime();
  const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
  const isOverdue = daysLeft < 0;

  return (
    <Card className={isOverdue ? "border-red-500/50" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {termLabel}
          </CardTitle>
          <Badge
            variant={
              status === "SUBMITTED"
                ? "default"
                : isOverdue
                  ? "destructive"
                  : "secondary"
            }
          >
            {status === "SUBMITTED"
              ? "Levert"
              : isOverdue
                ? "Forfalt"
                : "Utkast"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-lg font-semibold">
          Frist: {formatDate(nextDeadline)}
        </p>
        {status !== "SUBMITTED" && (
          <p
            className={`text-sm ${isOverdue ? "text-red-600" : "text-muted-foreground"}`}
          >
            {isOverdue
              ? `${Math.abs(daysLeft)} dager over frist`
              : `${daysLeft} dager igjen`}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
