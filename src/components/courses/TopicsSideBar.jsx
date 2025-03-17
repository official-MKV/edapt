// components/courses/TopicsSidebar.js
import { useState, useEffect } from "react";
import {
  CheckCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  FolderClosed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function TopicsSidebar({
  topics,
  materials,
  courseProgress,
  currentTopicId,
  handleTopicChange,
  API_BASE_URL,
}) {
  const [topicsExpanded, setTopicsExpanded] = useState(true);
  const [materialsExpanded, setMaterialsExpanded] = useState(
    materials.length > 0
  );

  // Load saved state on component mount
  useEffect(() => {
    const savedTopicsExpanded = localStorage.getItem("sidebar-topics-expanded");
    const savedMaterialsExpanded = localStorage.getItem(
      "sidebar-materials-expanded"
    );

    if (savedTopicsExpanded !== null) {
      setTopicsExpanded(savedTopicsExpanded === "true");
    }

    if (savedMaterialsExpanded !== null) {
      setMaterialsExpanded(savedMaterialsExpanded === "true");
    }
  }, []);

  // Toggle topics section
  const toggleTopics = () => {
    const newState = !topicsExpanded;
    setTopicsExpanded(newState);
    localStorage.setItem("sidebar-topics-expanded", newState.toString());
  };

  // Toggle materials section
  const toggleMaterials = () => {
    const newState = !materialsExpanded;
    setMaterialsExpanded(newState);
    localStorage.setItem("sidebar-materials-expanded", newState.toString());
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-medium">Course Progress</h2>
          <span className="text-sm font-medium">{courseProgress}%</span>
        </div>
        <Progress value={courseProgress} className="h-2" />
      </div>

      <div className="flex-1 overflow-auto">
        <ScrollArea className="h-full">
          {/* Topics Section */}
          <div className="p-4">
            <div
              className="flex items-center justify-between cursor-pointer mb-2"
              onClick={toggleTopics}
            >
              <h3 className="text-sm font-medium text-muted-foreground flex items-center">
                {topicsExpanded ? (
                  <FolderOpen size={16} className="mr-2" />
                ) : (
                  <FolderClosed size={16} className="mr-2" />
                )}
                TOPICS
              </h3>
              {topicsExpanded ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </div>

            {topicsExpanded && (
              <div className="space-y-1 mt-2">
                {topics.map((topic) => (
                  <Button
                    key={topic.id}
                    variant={
                      currentTopicId === topic.id ? "secondary" : "ghost"
                    }
                    className="w-full justify-start mb-1 h-auto py-2 px-3"
                    onClick={() => handleTopicChange(topic.id)}
                  >
                    <div className="flex items-start">
                      <div className="mr-2 mt-0.5">
                        {topic.completed ? (
                          <CheckCircle size={16} className="text-primary" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border border-muted-foreground" />
                        )}
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-sm">{topic.title}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {topic.description}
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Materials Section - Only show if there are materials */}
          {materials.length > 0 && (
            <div className="p-4">
              <div
                className="flex items-center justify-between cursor-pointer mb-2"
                onClick={toggleMaterials}
              >
                <h3 className="text-sm font-medium text-muted-foreground flex items-center">
                  {materialsExpanded ? (
                    <FolderOpen size={16} className="mr-2" />
                  ) : (
                    <FolderClosed size={16} className="mr-2" />
                  )}
                  MATERIALS
                </h3>
                {materialsExpanded ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </div>

              {materialsExpanded && (
                <div className="space-y-1 mt-2">
                  {materials.map((material) => (
                    <Button
                      key={material.id}
                      variant="ghost"
                      className="w-full justify-start mb-1"
                      asChild
                    >
                      <a
                        href={`${API_BASE_URL}/courses/materials/${material.id}/download`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FileText size={16} className="mr-2" />
                        <span className="text-sm truncate">
                          {material.title}
                        </span>
                      </a>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
