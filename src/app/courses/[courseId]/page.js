// app/(dashboard)/courses/[courseId]/page.js
"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import CourseHeader from "@/components/courses/CourseHeader";
import TopicsSidebar from "@/components/courses/TopicsSideBar";
import TopicContent from "@/components/courses/TopicContent";
import AIAssistant from "@/components/courses/AIAssistant";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_PATH || "/api/v1";

export default function CourseLearnPage() {
  const params = useParams();
  const courseId = params.courseId;

  const [isLoading, setIsLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [topics, setTopics] = useState([]);
  const [currentTopicId, setCurrentTopicId] = useState(null);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [studyTimer, setStudyTimer] = useState({
    isActive: false,
    time: 0,
    startTime: null,
  });

  const timerRef = useRef();

  // Fetch course data
  useEffect(() => {
    const fetchCourseData = async () => {
      setIsLoading(true);
      const token = localStorage.getItem("token");

      try {
        const courseResponse = await fetch(
          `${API_BASE_URL}/courses/${courseId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!courseResponse.ok) {
          throw new Error("Failed to fetch course data");
        }
        const courseData = await courseResponse.json();
        setCourse(courseData.data);

        const materialsResponse = await fetch(
          `${API_BASE_URL}/courses/${courseId}/materials`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!materialsResponse.ok) {
          throw new Error("Failed to fetch materials");
        }
        const materialsData = await materialsResponse.json();
        setMaterials(materialsData.data);

        const topicsResponse = await fetch(
          `${API_BASE_URL}/learning/${courseId}/topics`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!topicsResponse.ok) {
          throw new Error("Failed to fetch topics");
        }
        const topicsData = await topicsResponse.json();
        setTopics(topicsData.data);

        // Set initial topic
        if (topicsData.data && topicsData.data.length > 0) {
          setCurrentTopicId(topicsData.data[0].id);
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching course data:", error);
        toast({
          title: "Error",
          description: "Failed to load course data. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };

    fetchCourseData();

    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [courseId]);

  // Timer functions
  const toggleTimer = () => {
    if (studyTimer.isActive) {
      // Stop timer
      clearInterval(timerRef.current);
      setStudyTimer((prev) => ({
        ...prev,
        isActive: false,
      }));
      saveStudySession();
    } else {
      // Start timer
      const startTime = Date.now() - studyTimer.time * 1000;
      setStudyTimer((prev) => ({
        ...prev,
        isActive: true,
        startTime,
      }));

      timerRef.current = setInterval(() => {
        setStudyTimer((prev) => ({
          ...prev,
          time: Math.floor((Date.now() - prev.startTime) / 1000),
        }));
      }, 1000);
    }
  };

  const resetTimer = () => {
    clearInterval(timerRef.current);
    setStudyTimer({
      isActive: false,
      time: 0,
      startTime: null,
    });
  };

  const saveStudySession = async () => {
    if (studyTimer.time < 30) return;
    const token = localStorage.getItem("token");

    try {
      await fetch(`${API_BASE_URL}/learning/study-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          course_id: parseInt(courseId),
          topic_id: currentTopicId,
          duration_seconds: studyTimer.time,
        }),
      });
    } catch (error) {
      console.error("Error saving study session:", error);
    }
  };

  // Handle changing the current topic
  const handleTopicChange = async (topicId) => {
    setCurrentTopicId(topicId);
  };

  // Mark a topic as completed
  const markTopicCompleted = async (topicId) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(
        `${API_BASE_URL}/learning/topics/${topicId}/complete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to mark topic as complete");
      }

      // Update local state
      setTopics((prev) =>
        prev.map((topic) =>
          topic.id === topicId ? { ...topic, completed: true } : topic
        )
      );

      toast({
        title: "Success",
        description: "Topic marked as completed",
      });
    } catch (error) {
      console.error("Error marking topic as complete:", error);
      toast({
        title: "Error",
        description: "Failed to mark topic as complete. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Get current topic
  const currentTopic =
    topics.find((topic) => topic.id === currentTopicId) || {};

  // Calculate course progress
  const courseProgress = topics.length
    ? Math.round(
        (topics.filter((t) => t.completed).length / topics.length) * 100
      )
    : 0;

  const formatTime = (timeInSeconds) => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = timeInSeconds % 60;

    return [
      hours.toString().padStart(2, "0"),
      minutes.toString().padStart(2, "0"),
      seconds.toString().padStart(2, "0"),
    ].join(":");
  };

  if (isLoading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium">Loading course content...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top toolbar */}
      <CourseHeader
        course={course}
        studyTimer={studyTimer}
        formatTime={formatTime}
        toggleTimer={toggleTimer}
        resetTimer={resetTimer}
        leftSidebarOpen={leftSidebarOpen}
        rightSidebarOpen={rightSidebarOpen}
        setLeftSidebarOpen={setLeftSidebarOpen}
        setRightSidebarOpen={setRightSidebarOpen}
      />

      {/* Main content area with sidebars */}
      <ResizablePanelGroup
        direction="horizontal"
        className="flex-1 overflow-hidden"
      >
        {/* Left sidebar - Topics */}
        {leftSidebarOpen && (
          <>
            <ResizablePanel
              defaultSize={20}
              minSize={15}
              maxSize={30}
              className="bg-card border-r"
            >
              <TopicsSidebar
                topics={topics}
                materials={materials}
                courseProgress={courseProgress}
                currentTopicId={currentTopicId}
                handleTopicChange={handleTopicChange}
                API_BASE_URL={API_BASE_URL}
              />
            </ResizablePanel>
            <ResizableHandle withHandle />
          </>
        )}

        {/* Main content - Notes and Objectives */}
        <ResizablePanel
          defaultSize={leftSidebarOpen && rightSidebarOpen ? 60 : 80}
        >
          <TopicContent
            courseId={courseId}
            currentTopic={currentTopic}
            currentTopicId={currentTopicId}
            markTopicCompleted={markTopicCompleted}
            API_BASE_URL={API_BASE_URL}
            setRightSidebarOpen={setRightSidebarOpen}
          />
        </ResizablePanel>

        {/* Right sidebar - AI assistant */}
        {rightSidebarOpen && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel
              defaultSize={20}
              minSize={15}
              maxSize={30}
              className="bg-card border-l"
            >
              <AIAssistant
                courseId={courseId}
                currentTopicId={currentTopicId}
                API_BASE_URL={API_BASE_URL}
              />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
}
