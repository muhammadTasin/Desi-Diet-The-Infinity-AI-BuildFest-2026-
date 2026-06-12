import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { trackActivityEvent } from "@/lib/activity-tracking";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addStoredHealthSignal, type HealthSignalKind } from "@/lib/health-signals";
import { Activity } from "lucide-react";
import { toast } from "sonner";

export function ManualHealthSignalModal({ onSaved }: { onSaved?: () => void }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<HealthSignalKind>("steps");
  const [value, setValue] = useState("");

  useEffect(() => {
    if (open) {
      trackActivityEvent({
        eventName: "manual_signal_opened",
        page: "dashboard",
        feature: "health_signals"
      });
    }
  }, [open]);
  
  const handleSave = () => {
    if (!value) {
      toast.error("Please enter a value");
      return;
    }
    let unit = "";
    if (kind === "steps") unit = "steps";
    if (kind === "water_glasses") unit = "glasses";
    if (kind === "sleep_hours") unit = "hours";
    if (kind === "activity_minutes") unit = "minutes";
    if (kind === "weight_kg") unit = "kg";
    if (kind === "heart_rate") unit = "bpm";
    if (kind === "blood_pressure") unit = "mmHg";
    if (kind === "blood_glucose") unit = "mg/dL";

    addStoredHealthSignal({
      kind,
      value: Number(value),
      unit,
      source: "manual",
      recordedAt: new Date().toISOString(),
      confidence: "medium"
    });
    
    toast.success("Health signal saved manually.");
    setOpen(false);
    setValue("");
    if (onSaved) onSaved();
  };

  const isAdvanced = kind === "blood_pressure" || kind === "blood_glucose" || kind === "heart_rate";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Activity className="mr-2 h-4 w-4" /> Add manual signal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Manual Health Signal</DialogTitle>
          <DialogDescription>
            You can manually log basic health metrics to improve your dashboard insights.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-right text-sm">Signal Type</span>
            <div className="col-span-3">
              <Select value={kind} onValueChange={(val) => setKind(val as HealthSignalKind)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="steps">Steps</SelectItem>
                  <SelectItem value="water_glasses">Water (glasses)</SelectItem>
                  <SelectItem value="sleep_hours">Sleep (hours)</SelectItem>
                  <SelectItem value="activity_minutes">Activity (minutes)</SelectItem>
                  <SelectItem value="weight_kg">Weight (kg)</SelectItem>
                  <SelectItem value="heart_rate">Heart Rate (bpm)</SelectItem>
                  <SelectItem value="blood_pressure">Blood Pressure (mmHg)</SelectItem>
                  <SelectItem value="blood_glucose">Blood Glucose (mg/dL)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-right text-sm">Value</span>
            <Input
              id="value"
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="col-span-3"
              placeholder="Enter value"
            />
          </div>
          {isAdvanced && (
            <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
              Only enter this if you already measure it. This is not diagnostic.
            </p>
          )}
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave}>Save Signal</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
