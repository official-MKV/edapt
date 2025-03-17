// components/courses/AIAssistant.js
import { useState, useEffect, useRef } from "react";
import { MessageSquare, HelpCircle, Brain, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AIAssistant({
  courseId,
  currentTopicId,
  API_BASE_URL,
}) {
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [activeAIFeature, setActiveAIFeature] = useState("chat"); // 'chat', 'explain', 'quiz'
  const [aiResponding, setAiResponding] = useState(false);

  const chatContainerRef = useRef();

  // Initialize chat with welcome message
  useEffect(() => {
    setChatMessages([
      {
        role: "assistant",
        content:
          "👋 Hi there! I'm your AI learning assistant. I can help you understand the course materials, explain concepts, generate quizzes, and more. What would you like help with today?",
      },
    ]);
  }, []);

  useEffect(() => {
    // Auto-scroll chat to bottom when new message is added
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

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

  // Handle sending a message to AI
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    const token = localStorage.getItem("token");

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
          Authorization: `Bearer ${token}`,
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

  return (
    <div className="h-full flex flex-col">
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
                  <div className="whitespace-pre-wrap">{message.content}</div>
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
  );
}
