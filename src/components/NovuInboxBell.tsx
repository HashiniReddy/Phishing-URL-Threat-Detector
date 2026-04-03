import { Bell, BellRing } from "lucide-react";
import { useEffect, useState } from "react";

type NotificationItem = {
  id: number;
  title: string;
  message: string;
  time: string;
  read?: boolean;
};

const demoNotifications: NotificationItem[] = [
  {
    id: 1,
    title: "Threat Alert",
    message: "Suspicious URL activity detected in recent scans.",
    time: "2 min ago",
    read: false,
  },
  {
    id: 2,
    title: "System Update",
    message: "Threat intelligence feeds synchronized successfully.",
    time: "10 min ago",
    read: false,
  },
  {
    id: 3,
    title: "Verification",
    message: "Operator login verified and session secured.",
    time: "22 min ago",
    read: true,
  },
];

const NovuInboxBell = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(demoNotifications);
  const unreadCount = notifications.filter((item) => !item.read).length;

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-novu-bell-root]")) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", onClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, [open]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  return (
    <div className="relative" data-novu-bell-root>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative inline-flex items-center gap-2 h-11 px-4 rounded-2xl border border-cyan-500/20 bg-black/80 hover:bg-cyan-500/10 hover:scale-105 transition-all"
        aria-label="Notifications"
      >
        {unreadCount > 0 ? (
          <BellRing className="w-4 h-4 text-cyan-300" />
        ) : (
          <Bell className="w-4 h-4 text-cyan-300" />
        )}
        <span className="text-sm text-cyan-200 hidden sm:inline">Alerts</span>

        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.45)]">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-[360px] max-w-[90vw] rounded-3xl border border-cyan-500/20 bg-black/90 backdrop-blur-md shadow-[0_0_40px_rgba(34,211,238,0.15)] overflow-hidden z-50">
          <div className="px-5 py-4 border-b border-cyan-500/10 bg-gradient-to-r from-cyan-500/5 to-transparent">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] tracking-[0.35em] text-cyan-400/70">NOTIFICATION GRID</p>
                <h3 className="text-lg font-semibold text-cyan-200 mt-1">Inbox Alerts</h3>
              </div>

              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Mark all read
              </button>
            </div>
          </div>

          <div className="max-h-[380px] overflow-auto">
            {notifications.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <Bell className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-300">No alerts available</p>
                <p className="text-xs text-slate-500 mt-1">System inbox is currently quiet.</p>
              </div>
            ) : (
              <div className="p-3 space-y-3">
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-2xl border p-4 transition-all ${item.read
                        ? "border-cyan-500/10 bg-slate-950"
                        : "border-cyan-500/20 bg-cyan-500/5 shadow-[0_0_20px_rgba(34,211,238,0.06)]"
                      }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-semibold text-cyan-200">{item.title}</h4>
                        <p className="text-sm text-slate-300 mt-1 leading-6">{item.message}</p>
                      </div>

                      {!item.read && (
                        <span className="mt-1 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_14px_rgba(34,211,238,0.5)]" />
                      )}
                    </div>

                    <p className="text-[11px] tracking-[0.18em] text-slate-500 mt-3">{item.time}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NovuInboxBell;