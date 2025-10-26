"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils/ui";
import { X } from "lucide-react";

type InvitationStatus = "empty" | "pending" | "accepted" | "rejected";
type SurveyStatus = "selecting" | "submitted" | "waiting";

interface UserAvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  status?: InvitationStatus;
  surveyStatus?: SurveyStatus;
  className?: string;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
  tooltipText?: string;
  pulseAnimation?: boolean;
}

export function UserAvatar({
  src,
  alt,
  fallback,
  status = "accepted",
  surveyStatus,
  className,
  size = "md",
  showTooltip = false,
  tooltipText,
  pulseAnimation = false,
  ...props
}: UserAvatarProps) {
  const sizeClasses = {
    sm: "size-8",
    md: "size-12",
    lg: "size-16"
  };

  const avatarSize = sizeClasses[size];

  // Handle empty state with dashed circle placeholder
  if (status === "empty") {
    return (
      <div className={cn("relative inline-block", className)} {...props}>
        <div className={cn(
          "rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center",
          avatarSize
        )}>
          <p className="text-xs text-muted-foreground">?</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative inline-block", className)} {...props}>
      <Avatar className={cn(
        avatarSize,
        (status === "pending" || status === "rejected") && "saturate-30 opacity-90",
        surveyStatus === "selecting" && "border-2 border-blue-400",
        surveyStatus === "submitted" && "border-2 border-green-400",
        surveyStatus === "waiting" && "border-2 border-yellow-400",
      )}>
        <AvatarImage src={src} alt={alt} />
        <AvatarFallback className={cn(
          (status === "rejected" || status === "pending") && "bg-muted-foreground/20",
          surveyStatus === "selecting" && "bg-blue-50 text-blue-600",
          surveyStatus === "submitted" && "bg-green-50 text-green-600",
          surveyStatus === "waiting" && "bg-yellow-50 text-yellow-600",
        )}>
          {fallback || "?"}
        </AvatarFallback>
      </Avatar>

      {/* Circular loading ring for pending status - positioned above avatar */}
      {status === "pending" && (
        <div className={cn(
          "absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin pointer-events-none",
          avatarSize
        )} />
      )}

      {/* Pulse animation for survey partner selection */}
      {(pulseAnimation || surveyStatus === "selecting") && (
        <div className={cn(
          "absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-75 pointer-events-none",
          avatarSize
        )} />
      )}

      {/* Small X overlay for rejected status */}
      {status === "rejected" && (
        <div className="absolute -top-1 -right-1 bg-destructive rounded-full p-1">
          <X className="size-3 text-destructive-foreground" />
        </div>
      )}

      {/* Tooltip for survey context */}
      {showTooltip && tooltipText && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
          <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded shadow-lg">
            {tooltipText}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent border-t-blue-600" />
          </div>
        </div>
      )}
    </div>
  );
}