import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Bluetooth, Wifi, PlusCircle, Link2, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { addStoredHealthSignal, type HealthSignal } from "@/lib/health-signals";
import { getAvailableIoTConnectors } from "@/lib/iot-connectors";
import { DataSourceBadge } from "@/components/DataSourceBadge";

export function ConnectHealthDeviceModal({ onSaved }: { onSaved?: () => void }) {
  const [open, setOpen] = useState(false);
  const connectors = getAvailableIoTConnectors();
  const futureConnectors = connectors.filter(c => c.status === "future_integration");

  // Bluetooth State
  const [btSupported, setBtSupported] = useState(true);
  const [btConnecting, setBtConnecting] = useState(false);
  const [btDevice, setBtDevice] = useState<any>(null);
  const [btSignals, setBtSignals] = useState<HealthSignal[]>([]);

  // WiFi State
  const [wifiUrl, setWifiUrl] = useState("");
  const [wifiTesting, setWifiTesting] = useState(false);
  const [wifiSignals, setWifiSignals] = useState<HealthSignal[]>([]);
  const [wifiError, setWifiError] = useState("");

  useEffect(() => {
    import("@/lib/bluetooth-health-device.client").then(m => {
      setBtSupported(m.isWebBluetoothSupported());
    }).catch(() => setBtSupported(false));
  }, []);

  const handleConnectBluetooth = async () => {
    try {
      setBtConnecting(true);
      const { requestBluetoothHealthDevice, parseBluetoothHealthSignal } = await import("@/lib/bluetooth-health-device.client");
      const device = await requestBluetoothHealthDevice();
      setBtDevice(device);
      const signals = await parseBluetoothHealthSignal(device);
      if (signals.length > 0) {
        setBtSignals(signals);
        toast.success(`Connected to ${device.name || 'Bluetooth Device'}. Found ${signals.length} signals.`);
      } else {
        toast.info("Device connected but no standard readable health signals found.");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to connect Bluetooth device.");
    } finally {
      setBtConnecting(false);
    }
  };

  const handleImportBluetooth = () => {
    btSignals.forEach(addStoredHealthSignal);
    toast.success("Bluetooth signals imported successfully.");
    if (onSaved) onSaved();
    setOpen(false);
  };

  const handleDisconnectBluetooth = async () => {
    const { disconnectBluetoothDevice } = await import("@/lib/bluetooth-health-device.client");
    disconnectBluetoothDevice(btDevice);
    setBtDevice(null);
    setBtSignals([]);
  };

  const handleTestWifi = async () => {
    const { validateHealthEndpointUrl, fetchHealthSignalsFromEndpoint, normalizeEndpointSignals } = await import("@/lib/wifi-health-endpoint.client");
    if (!validateHealthEndpointUrl(wifiUrl)) {
      setWifiError("Invalid URL format. Use http:// or https://");
      return;
    }
    setWifiError("");
    setWifiTesting(true);
    try {
      const raw = await fetchHealthSignalsFromEndpoint(wifiUrl);
      const signals = normalizeEndpointSignals(raw, wifiUrl);
      if (signals.length > 0) {
        setWifiSignals(signals);
        toast.success(`Successfully retrieved ${signals.length} signals from endpoint.`);
      } else {
        setWifiError("Endpoint returned no valid signals.");
      }
    } catch (e: any) {
      setWifiError(e.message || "Failed to fetch from endpoint.");
    } finally {
      setWifiTesting(false);
    }
  };

  const handleImportWifi = () => {
    wifiSignals.forEach(addStoredHealthSignal);
    toast.success("WiFi/API signals imported successfully.");
    if (onSaved) onSaved();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary" className="font-bold">
          <Link2 className="mr-2 h-4 w-4" /> Connect device
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] overflow-hidden rounded-[2rem]">
        <DialogHeader>
          <DialogTitle>Connect Health Device</DialogTitle>
          <DialogDescription>
            Import optional health signals to provide better context for your meal patterns.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 text-xs mb-2">
          <div className="flex items-start gap-2 text-foreground/80 font-medium">
            <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p>Desi Digest does not secretly collect device data. Device signals are imported only after your action and are used as optional context for nudges and Care Companion.</p>
              <div className="mt-2 pt-2 border-t border-primary/10">
                <p className="font-bold mb-0.5">How does Desi Digest know today's meals?</p>
                <p className="text-muted-foreground">Meals come from user-submitted photo scans, manual logs, chat-confirmed entries, or saved meal history. Device signals only add optional context like steps, water, sleep, or heart rate.</p>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="bluetooth" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4 bg-muted/50">
            <TabsTrigger value="bluetooth" className="rounded-xl"><Bluetooth className="h-4 w-4 mr-1.5"/> Bluetooth</TabsTrigger>
            <TabsTrigger value="wifi" className="rounded-xl"><Wifi className="h-4 w-4 mr-1.5"/> WiFi/API</TabsTrigger>
            <TabsTrigger value="future" className="rounded-xl"><Activity className="h-4 w-4 mr-1.5"/> Future</TabsTrigger>
          </TabsList>

          <TabsContent value="bluetooth" className="space-y-4">
            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
              <h4 className="font-bold text-sm text-blue-900 mb-1">Web Bluetooth Connector</h4>
              <p className="text-xs text-blue-800/80 mb-3">Experimental. Connect nearby Bluetooth health devices. Requires browser permission.</p>
              
              {!btSupported ? (
                <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded-xl text-xs font-medium border border-destructive/20">
                  <AlertTriangle className="h-4 w-4" />
                  Your browser does not support Web Bluetooth. Try Chrome on Desktop/Android.
                </div>
              ) : btDevice ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-blue-100 shadow-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      <div>
                        <p className="font-bold text-sm">{btDevice.name || "Connected Device"}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{btSignals.length} signals found</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleDisconnectBluetooth} className="text-xs">Disconnect</Button>
                  </div>
                  
                  {btSignals.length > 0 && (
                    <div className="space-y-2">
                      {btSignals.map((sig, i) => (
                        <div key={i} className="flex justify-between items-center text-sm p-2 bg-white rounded-lg border border-border/50">
                          <span className="capitalize text-muted-foreground">{sig.kind.replace("_", " ")}</span>
                          <span className="font-bold">{sig.value} <span className="text-xs font-normal">{sig.unit}</span></span>
                        </div>
                      ))}
                      <Button onClick={handleImportBluetooth} className="w-full mt-2">Import Signals</Button>
                    </div>
                  )}
                </div>
              ) : (
                <Button onClick={handleConnectBluetooth} disabled={btConnecting} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  {btConnecting ? "Requesting permission..." : "Connect Bluetooth device"}
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="wifi" className="space-y-4">
            <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
              <h4 className="font-bold text-sm text-emerald-900 mb-1">WiFi/API Endpoint Connector</h4>
              <p className="text-xs text-emerald-800/80 mb-3">Requires a compatible local device endpoint.</p>
              
              <div className="flex gap-2 mb-2">
                <Input 
                  placeholder="e.g. http://192.168.0.50/signals" 
                  value={wifiUrl} 
                  onChange={(e) => setWifiUrl(e.target.value)} 
                  className="bg-white border-emerald-200 focus-visible:ring-emerald-500"
                />
                <Button onClick={handleTestWifi} disabled={wifiTesting || !wifiUrl} className="bg-emerald-600 hover:bg-emerald-700">
                  {wifiTesting ? "Testing..." : "Test"}
                </Button>
              </div>
              
              {wifiError && (
                <p className="text-xs text-destructive font-medium mt-2">{wifiError}</p>
              )}

              {wifiSignals.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center px-1 mb-1">
                    <span className="text-xs font-bold text-emerald-900">Preview Data</span>
                    <DataSourceBadge source="wifi_endpoint" className="border-none" />
                  </div>
                  {wifiSignals.map((sig, i) => (
                    <div key={i} className="flex justify-between items-center text-sm p-2 bg-white rounded-lg border border-border/50">
                      <span className="capitalize text-muted-foreground">{sig.kind.replace("_", " ")}</span>
                      <span className="font-bold">{sig.value} <span className="text-xs font-normal">{sig.unit}</span></span>
                    </div>
                  ))}
                  <Button onClick={handleImportWifi} className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700">Import Signals</Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="future" className="space-y-4">
             <div className="grid gap-2">
               {futureConnectors.map((c, i) => (
                 <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-card">
                   <div className="flex items-center gap-3">
                     <div className="h-8 w-8 rounded-full bg-secondary/30 flex items-center justify-center">
                       <Activity className="h-4 w-4 text-muted-foreground" />
                     </div>
                     <div>
                       <p className="font-bold text-sm text-foreground">{c.name}</p>
                       <p className="text-[10px] text-muted-foreground">{c.description}</p>
                     </div>
                   </div>
                   <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 bg-muted px-2 py-1 rounded">Coming Soon</span>
                 </div>
               ))}
             </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
