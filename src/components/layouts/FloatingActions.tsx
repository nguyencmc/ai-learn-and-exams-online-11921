import { useState } from "react";
import { 
  MessageSquare, 
  Mic, 
  Gift, 
  FileText, 
  BookOpen, 
  Book, 
  Bot, 
  PenTool, 
  BookMarked,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const actions = [
  { icon: Mic, label: "AI Talk", color: "bg-blue-500 hover:bg-blue-600" },
  { icon: MessageSquare, label: "Free Talk", color: "bg-teal-500 hover:bg-teal-600" },
  { icon: Gift, label: "Quà tặng", color: "bg-orange-500 hover:bg-orange-600" },
  { icon: FileText, label: "Bài thi", color: "bg-red-500 hover:bg-red-600" },
  { icon: BookOpen, label: "Khóa học", color: "bg-indigo-500 hover:bg-indigo-600" },
  { icon: Book, label: "Sách", color: "bg-green-500 hover:bg-green-600" },
  { icon: Bot, label: "Hỏi AI", color: "bg-purple-500 hover:bg-purple-600" },
  { icon: PenTool, label: "Kỹ năng", color: "bg-pink-500 hover:bg-pink-600" },
  { icon: BookMarked, label: "Ghi chú", color: "bg-amber-500 hover:bg-amber-600" },
];

export const FloatingActions = () => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40 hidden lg:flex items-center">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-primary text-primary-foreground p-2 rounded-l-lg shadow-lg hover:bg-primary/90 transition-colors"
      >
        {isExpanded ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>

      {/* Actions Panel */}
      <div
        className={`bg-card border border-border shadow-lg rounded-l-2xl overflow-hidden transition-all duration-300 ${
          isExpanded ? "w-20 opacity-100" : "w-0 opacity-0"
        }`}
      >
        <div className="p-2 flex flex-col gap-2">
          {actions.map((action) => (
            <Tooltip key={action.label} delayDuration={100}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`w-14 h-14 rounded-xl ${action.color} text-white flex-col gap-1`}
                >
                  <action.icon className="h-5 w-5" />
                  <span className="text-[10px] font-medium">{action.label}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>{action.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </div>
  );
};
