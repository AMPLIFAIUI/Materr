import { useLocation } from "wouter";
import { Home, MessageCircle, FileText, User, PhoneCall } from "lucide-react";

const navItems = [
  { label: "Home", icon: Home, path: "/" },
  { label: "Chat", icon: MessageCircle, path: "/chat/new" },
  { label: "Crisis", icon: PhoneCall, path: "/crisis-services" },
  { label: "Notes", icon: FileText, path: "/notes" },
  { label: "Profile", icon: User, path: "/profile" },
];

export default function BottomNav() {
  const [location, setLocation] = useLocation();
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md mx-auto bg-blue-600 text-white flex justify-around items-center h-16 z-50 shadow-lg rounded-t-2xl border-t-2 border-blue-500 solid-nav"
    >
      {navItems.map(({ label, icon: Icon, path }) => (
        <button
          key={label}
          className={`flex flex-col items-center justify-center flex-1 focus:outline-none transition-colors interactive cursor-pointer min-h-[64px] tap-highlight-none ${location === path ? "text-yellow-300" : "text-white"}`}
          onClick={() => setLocation(path)}
        >
          <Icon className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">{label}</span>
        </button>
      ))}
    </nav>
  );
}
