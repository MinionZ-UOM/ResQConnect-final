import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface FeedbackCardProps {
  title: string;
  goodValue: number;
  badValue: number;
  description: string;
  icon: LucideIcon;
  className?: string;
}

export default function FeedbackCard({
  title,
  goodValue,
  badValue,
  description,
  icon: Icon,
  className,
}: FeedbackCardProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-md font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          {/* Green Rectangle with Good Value */}
          <div className="bg-green-500 bg-opacity-45 text-black p-4 rounded-lg text-center text-lg font-semibold w-24">
            {goodValue}
          </div>
          {/* Red Rectangle with Bad Value */}
          <div className="bg-red-500 bg-opacity-45 text-black p-4 rounded-lg text-center text-lg font-semibold w-24">
            {badValue}
          </div>
        </div>
        <p className="text-sm xs:text-base text-slate-700 mt-2">{description}</p>
      </CardContent>
    </Card>
  );
}
