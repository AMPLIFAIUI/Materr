import React from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function PrivacyToggle() {
  const [isPrivate, setIsPrivate] = React.useState(false);
  return (
    <div className="flex items-center gap-2 ml-0 mr-2">
      <Label htmlFor="privacy-mode" className="text-sm text-blue-100 whitespace-nowrap">
        Private Mode
      </Label>
      <Switch 
        id="privacy-mode" 
        checked={isPrivate}
        onCheckedChange={setIsPrivate}
        className="ml-1"
      />
    </div>
  );
}
