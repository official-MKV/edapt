// app/(dashboard)/courses/[courseId]/page.js
"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import {
  BookOpen,
  Clock,
  List,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Search,
  MessageSquare,
  Timer,
  Send,
  PanelLeftClose,
  PanelRightClose,
  PanelLeftOpen,
  PanelRightOpen,
  AlignLeft,
  Loader2,
  AlignJustify,
  MoreHorizontal,
  Info,
  HelpCircle,
  BookmarkPlus,
  Edit3,
  Paperclip,
  X,
  Play,
  Pause,
  RotateCw,
  Plus,
  FileText,
  LightbulbIcon,
  HelpCircle as Help,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_PATH || "/api/v1";

export default function CourseLearnPage() {
  const params = useParams();
  const courseId = params.courseId;
  console.log(`CourseId:${courseId}`);

  const [isLoading, setIsLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [topics, setTopics] = useState([]);
  const [currentTopicId, setCurrentTopicId] = useState(null);
  const [notes, setNotes] = useState("");
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [studyTimer, setStudyTimer] = useState({
    isActive: false,
    time: 0,
    startTime: null,
  });
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [activeAIFeature, setActiveAIFeature] = useState("chat"); // 'chat', 'explain', 'quiz'
  const [aiResponding, setAiResponding] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  const chatContainerRef = useRef();
  const timerRef = useRef();
  const notesRef = useRef();
  const saveNotesTimeoutRef = useRef();

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

        // Fetch course materials
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

        // Fetch topics with progress
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

          // Fetch notes for the initial topic
          await fetchNotes(topicsData.data[0].id);
        }

        // Initialize AI chat
        setChatMessages([
          {
            role: "assistant",
            content:
              "👋 Hi there! I'm your AI learning assistant. I can help you understand the course materials, explain concepts, generate quizzes, and more. What would you like help with today?",
          },
        ]);

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
      if (saveNotesTimeoutRef.current) {
        clearTimeout(saveNotesTimeoutRef.current);
      }
    };
  }, [courseId]);

  // Fetch notes for a topic
  const fetchNotes = async (topicId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/learning/topics/${topicId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch topic details");
      }

      const data = await response.json();
      const topic = data.data;

      // Check if user has notes for this topic
      if (topic.notes && topic.notes.length > 0) {
        // Get the most recent note
        setNotes(topic.notes[0].content);
      } else {
        // Set default notes with topic title
        setNotes(
          `# ${topic.title}\n\nThis is where your notes for this topic will appear. Start typing to add notes.`
        );
      }
    } catch (error) {
      console.error("Error fetching notes:", error);
      toast({
        title: "Error",
        description: "Failed to load notes. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Save notes to the server
  const saveNotes = async () => {
    if (!notes.trim()) return;

    setSavingNotes(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/learning/topics/${currentTopicId}/notes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: notes,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save notes");
      }

      setSavingNotes(false);
    } catch (error) {
      console.error("Error saving notes:", error);
      toast({
        title: "Error",
        description: "Failed to save notes. Please try again.",
        variant: "destructive",
      });
      setSavingNotes(false);
    }
  };

  useEffect(() => {
    // Auto-scroll chat to bottom when new message is added
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Timer functions
  const toggleTimer = () => {
    if (studyTimer.isActive) {
      // Stop timer
      clearInterval(timerRef.current);
      setStudyTimer((prev) => ({
        ...prev,
        isActive: false,
      }));
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

  // Handle sending a message to AI
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    // Add user message
    setChatMessages((prev) => [...prev, { role: "user", content: newMessage }]);

    // Clear input
    setNewMessage("");

    // Show AI is responding
    setAiResponding(true);

    try {
      let endpoint;
      let requestData = {
        course_id: parseInt(courseId),
        topic_id: currentTopicId,
      };

      if (activeAIFeature === "chat") {
        endpoint = `${API_BASE_URL}/learning/ask`;
        requestData.question = newMessage;
      } else if (activeAIFeature === "explain") {
        endpoint = `${API_BASE_URL}/learning/explain`;
        requestData.concept = newMessage;
        requestData.format = "markdown";
      } else if (activeAIFeature === "quiz") {
        endpoint = `${API_BASE_URL}/learning/topics/${currentTopicId}/quiz`;
        requestData.difficulty = "medium";
        requestData.num_questions = 3;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from AI");
      }

      const data = await response.json();

      // Add AI response to chat
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            activeAIFeature === "quiz"
              ? formatQuizResponse(data.data)
              : data.data.content ||
                data.data.answer ||
                "I don't have a specific answer for that.",
        },
      ]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I'm sorry, I encountered an error processing your request. Please try again.",
        },
      ]);
    } finally {
      setAiResponding(false);
    }
  };

  // Format quiz response
  const formatQuizResponse = (quizData) => {
    if (!quizData || !quizData.questions) {
      return "I couldn't generate a quiz at this time.";
    }

    let formattedQuiz = `Here's a quiz about ${
      quizData.topic || "this topic"
    }:\n\n`;

    quizData.questions.forEach((q, index) => {
      formattedQuiz += `**Question ${index + 1}:** ${q.question}\n`;

      if (q.options) {
        q.options.forEach((option, optIndex) => {
          const optionLabel = String.fromCharCode(65 + optIndex); // A, B, C, D...
          formattedQuiz += `${optionLabel}) ${option}\n`;
        });
      }

      formattedQuiz += "\n";
    });

    formattedQuiz += "Reply with your answers, and I'll provide explanations!";

    return formattedQuiz;
  };

  // Handle changing the current topic
  const handleTopicChange = async (topicId) => {
    // Save current notes before changing topics
    if (currentTopicId) {
      await saveNotes();
    }

    setCurrentTopicId(topicId);
    await fetchNotes(topicId);
  };

  // Handle note changes with debounced saving
  const handleNotesChange = (e) => {
    setNotes(e.target.value);

    // Clear previous timeout
    if (saveNotesTimeoutRef.current) {
      clearTimeout(saveNotesTimeoutRef.current);
    }

    // Set new timeout to save notes after 2 seconds of inactivity
    saveNotesTimeoutRef.current = setTimeout(() => {
      saveNotes();
    }, 2000);
  };

  // Mark a topic as completed
  const markTopicCompleted = async (topicId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/learning/topics/${topicId}/complete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
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
              onClick={() => {
                if (studyTimer.isActive) {
                  // When stopping the timer, save the study session
                  saveStudySession();
                }
                toggleTimer();
              }}
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

      {/* Main content area with sidebars */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - Topics */}
        <div
          className={`border-r bg-card ${
            leftSidebarOpen ? "w-64" : "w-0"
          } transition-all duration-300 overflow-hidden flex flex-col`}
        >
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-medium">Course Progress</h2>
              <span className="text-sm font-medium">{courseProgress}%</span>
            </div>
            <Progress value={courseProgress} className="h-2" />
          </div>

          <div className="flex-1 overflow-auto">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  TOPICS
                </h3>
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

              <div className="p-4 border-t">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  MATERIALS
                </h3>
                <div className="space-y-1">
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
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Main content - Notes */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">{currentTopic.title}</h2>
              <p className="text-sm text-muted-foreground">
                {currentTopic.description}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {savingNotes && (
                <div className="text-sm text-muted-foreground flex items-center">
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  Saving...
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => markTopicCompleted(currentTopicId)}
                disabled={currentTopic.completed}
              >
                <CheckCircle size={16} className="mr-2" />
                {currentTopic.completed ? "Completed" : "Mark as Complete"}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal size={18} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Topic Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => saveNotes()}>
                    <Edit3 size={16} className="mr-2" />
                    Save Notes
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setActiveAIFeature("quiz");
                      setNewMessage(
                        "Create a quiz about " + currentTopic.title
                      );
                      setRightSidebarOpen(true);
                    }}
                  >
                    <MessageSquare size={16} className="mr-2" />
                    Get Quiz
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4">
            <textarea
              ref={notesRef}
              value={notes}
              onChange={handleNotesChange}
              className="w-full h-full resize-none bg-background border-0 focus:ring-0 text-base p-0"
              placeholder="Start taking notes..."
            />
          </div>
        </div>

        {/* Right sidebar - AI assistant */}
        <div
          className={`border-l bg-card ${
            rightSidebarOpen ? "w-80" : "w-0"
          } transition-all duration-300 overflow-hidden flex flex-col`}
        >
          <div className="p-4 border-b">
            <Tabs defaultValue="chat" onValueChange={setActiveAIFeature}>
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="chat">
                  <MessageSquare size={16} className="mr-2" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="explain">
                  <HelpCircle size={16} className="mr-2" />
                  Explain
                </TabsTrigger>
                <TabsTrigger value="quiz">
                  <Brain size={16} className="mr-2" />
                  Quiz
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex-1 overflow-auto">
            <ScrollArea className="h-full" ref={chatContainerRef}>
              <div className="p-4 space-y-4">
                {chatMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground ml-auto"
                          : "bg-muted"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">
                        {message.content}
                      </div>
                    </div>
                  </div>
                ))}

                {aiResponding && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="p-4 border-t">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center space-x-2"
            >
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={
                  activeAIFeature === "chat"
                    ? "Ask a question..."
                    : activeAIFeature === "explain"
                    ? "Explain a concept..."
                    : "Create a quiz about..."
                }
                disabled={aiResponding}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!newMessage.trim() || aiResponding}
              >
                <Send size={16} />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
