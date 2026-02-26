import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { useTranslation } from "../../lib/i18n";

export default function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);
  const { t } = useTranslation();

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-50 bg-orange-600 text-white text-sm py-2 px-4 flex items-center gap-2 justify-center">
      <WifiOff size={15} />
      <span>{t("offline")}</span>
    </div>
  );
}
