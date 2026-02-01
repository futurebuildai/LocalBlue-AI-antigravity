import { 
  Home, 
  TrendingUp, 
  Globe, 
  Zap, 
  MessageSquare, 
  Star,
  Wrench,
  HardHat,
  Hammer,
  Building2
} from "lucide-react";

const icons = [
  { Icon: Home, delay: "0s", position: "top-[15%] left-[8%]", size: "w-6 h-6" },
  { Icon: TrendingUp, delay: "1s", position: "top-[25%] right-[12%]", size: "w-5 h-5" },
  { Icon: Globe, delay: "2s", position: "bottom-[35%] left-[5%]", size: "w-7 h-7" },
  { Icon: Zap, delay: "0.5s", position: "top-[40%] right-[8%]", size: "w-5 h-5" },
  { Icon: MessageSquare, delay: "3s", position: "bottom-[25%] right-[10%]", size: "w-6 h-6" },
  { Icon: Star, delay: "1.5s", position: "top-[60%] left-[10%]", size: "w-4 h-4" },
  { Icon: Wrench, delay: "2.5s", position: "bottom-[45%] right-[5%]", size: "w-5 h-5" },
  { Icon: HardHat, delay: "4s", position: "top-[10%] right-[25%]", size: "w-5 h-5" },
  { Icon: Hammer, delay: "3.5s", position: "bottom-[20%] left-[15%]", size: "w-4 h-4" },
  { Icon: Building2, delay: "1.2s", position: "top-[70%] right-[18%]", size: "w-6 h-6" },
];

export function FloatingIcons() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {icons.map(({ Icon, delay, position, size }, index) => (
        <div
          key={index}
          className={`absolute ${position} animate-float-icon`}
          style={{ animationDelay: delay }}
        >
          <div className="p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <Icon className={`${size} text-white/40`} />
          </div>
        </div>
      ))}
    </div>
  );
}
