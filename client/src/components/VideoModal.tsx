import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Play } from "lucide-react";

interface VideoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoUrl?: string;
}

export function VideoModal({ open, onOpenChange, videoUrl }: VideoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-4xl w-[95vw] p-0 bg-slate-900 border-slate-700/50 overflow-hidden"
        data-testid="modal-video-demo"
      >
        <DialogTitle className="sr-only">Demo Video</DialogTitle>
        
        {videoUrl ? (
          <div className="aspect-video w-full">
            <video 
              src={videoUrl} 
              controls 
              autoPlay 
              className="w-full h-full"
              data-testid="video-player"
            />
          </div>
        ) : (
          <div className="aspect-video w-full relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950" />
            
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.15),transparent_70%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.1),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.1),transparent_60%)]" />
            
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
            
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
              <div className="relative group cursor-pointer" data-testid="placeholder-play-button">
                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
                <div className="absolute inset-[-8px] bg-gradient-to-r from-blue-500/30 to-violet-500/30 rounded-full animate-spin-slow opacity-60" style={{ animationDuration: '8s' }} />
                
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                  <Play className="w-10 h-10 text-white ml-1" fill="white" />
                </div>
              </div>
              
              <p className="mt-8 text-white/80 text-lg font-medium tracking-wide" data-testid="text-coming-soon">
                Demo video coming soon
              </p>
              <p className="mt-2 text-white/50 text-sm">
                See how easy it is to build your contractor website
              </p>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
