"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils/ui";
import { X } from "lucide-react";

type InvitationStatus = "empty" | "pending" | "accepted" | "rejected";

interface UserAvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  status?: InvitationStatus;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function UserAvatar({
  src,
  alt,
  fallback,
  status = "accepted",
  className,
  size = "md",
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
      {/* Circular loading ring for pending status */}
      {status === "pending" && (
        <div className={cn(
          "absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin",
          avatarSize
        )} />
      )}
      
      <Avatar className={cn(
        avatarSize,
        status === "rejected" && "grayscale opacity-60"
      )}>
        <AvatarImage src={src} alt={alt} />
        <AvatarFallback className={cn(
          status === "rejected" && "bg-muted-foreground/20"
        )}>
          {fallback || "?"}
        </AvatarFallback>
      </Avatar>

      {/* Small X overlay for rejected status */}
      {status === "rejected" && (
        <div className="absolute -top-1 -right-1 bg-destructive rounded-full p-1">
          <X className="size-3 text-destructive-foreground" />
        </div>
      )}
    </div>
  );
}