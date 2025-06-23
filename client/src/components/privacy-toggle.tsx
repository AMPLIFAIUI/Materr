import React from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function PrivacyToggle() {
  const [isPrivate, setIsPrivate] = React.useState(false);

  return (
    <div className="flex items-center space-x-2">
      <Switch 
        id="privacy-mode" 
        checked={isPrivate}
        onCheckedChange={setIsPrivate}
      />
      <Label htmlFor="privacy-mode" className="text-sm">
        Private Mode
      </Label>
    </div>
  );
}
