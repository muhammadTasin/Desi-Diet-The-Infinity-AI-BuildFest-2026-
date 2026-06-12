import { Badge } from "@/components/ui/badge";
import { Camera, Edit2, MessageCircle, Activity, Smartphone, Clock, Bluetooth, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";

export type DataSource = 
  | "photo_scan" 
  | "manual_log" 
  | "chat_confirmed" 
  | "manual_signal" 
  | "demo_sample" 
  | "future_wearable"
  | "bluetooth"
  | "wifi_endpoint";

interface DataSourceBadgeProps {
  source: DataSource;
  className?: string;
}

export function DataSourceBadge({ source, className }: DataSourceBadgeProps) {
  const getProps = () => {
    switch (source) {
      case "photo_scan":
        return { label: "Photo scan", icon: <Camera className="h-3 w-3 mr-1" />, cls: "bg-blue-50 text-blue-700 border-blue-200" };
      case "manual_log":
        return { label: "Manual meal log", icon: <Edit2 className="h-3 w-3 mr-1" />, cls: "bg-orange-50 text-orange-700 border-orange-200" };
      case "chat_confirmed":
        return { label: "Chat-confirmed meal", icon: <MessageCircle className="h-3 w-3 mr-1" />, cls: "bg-purple-50 text-purple-700 border-purple-200" };
      case "manual_signal":
        return { label: "Manual health signal", icon: <Edit2 className="h-3 w-3 mr-1" />, cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "demo_sample":
        return { label: "Demo sample", icon: <Activity className="h-3 w-3 mr-1" />, cls: "bg-amber-50 text-amber-700 border-amber-200" };
      case "future_wearable":
        return { label: "Future wearable connector", icon: <Smartphone className="h-3 w-3 mr-1" />, cls: "bg-slate-50 text-slate-700 border-slate-200" };
      case "bluetooth":
        return { label: "Bluetooth", icon: <Bluetooth className="h-3 w-3 mr-1" />, cls: "bg-blue-50 text-blue-700 border-blue-200" };
      case "wifi_endpoint":
        return { label: "WiFi Endpoint", icon: <Wifi className="h-3 w-3 mr-1" />, cls: "bg-teal-50 text-teal-700 border-teal-200" };
      default:
        return { label: "Unknown", icon: <Clock className="h-3 w-3 mr-1" />, cls: "bg-gray-50 text-gray-700 border-gray-200" };
    }
  };

  const { label, icon, cls } = getProps();

  return (
    <Badge variant="outline" className={cn("text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 border flex items-center", cls, className)}>
      {icon}
      {label}
    </Badge>
  );
}
