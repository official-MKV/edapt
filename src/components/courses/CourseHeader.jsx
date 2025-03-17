// components/courses/CourseHeader.js
import {
  PanelLeftClose,
  PanelRightClose,
  PanelLeftOpen,
  PanelRightOpen,
  Timer,
  Play,
  Pause,
  RotateCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function CourseHeader({
  course,
  studyTimer,
  formatTime,
  toggleTimer,
  resetTimer,
  leftSidebarOpen,
  rightSidebarOpen,
  setLeftSidebarOpen,
  setRightSidebarOpen,
}) {
  return (
    <div className="bg-background border-b px-4 py-2 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
        >
          {leftSidebarOpen ? (
            <PanelLeftClose size={20} />
          ) : (
            <PanelLeftOpen size={20} />
          )}
        </Button>

        <div>
          <h1 className="text-lg font-semibold truncate max-w-md">
            {course?.title}
          </h1>
          <div className="flex items-center text-sm text-muted-foreground">
            <span>{course?.domain}</span>
            <span className="mx-2">•</span>
            <span>{course?.level}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="bg-muted px-3 py-1 rounded-md flex items-center space-x-2">
          <Timer size={16} className="text-muted-foreground" />
          <span className="font-mono">{formatTime(studyTimer.time)}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={toggleTimer}
          >
            {studyTimer.isActive ? <Pause size={14} /> : <Play size={14} />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={resetTimer}
          >
            <RotateCw size={14} />
          </Button>
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
              >
                {rightSidebarOpen ? (
                  <PanelRightClose size={20} />
                ) : (
                  <PanelRightOpen size={20} />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{rightSidebarOpen ? "Hide" : "Show"} AI assistant</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
