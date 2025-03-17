// components/courses/TopicContent.js
import { useState, useEffect, useRef } from "react";
import {
  CheckCircle,
  Edit3,
  MessageSquare,
  Loader2,
  MoreHorizontal,
  RotateCw,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import MDEditor from "@uiw/react-md-editor";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

export default function TopicContent({
  courseId,
  currentTopic,
  currentTopicId,
  markTopicCompleted,
  API_BASE_URL,
  setRightSidebarOpen,
}) {
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [topicObjectives, setTopicObjectives] = useState([]);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [aiResponding, setAiResponding] = useState(false);
  const [objectivesExpanded, setObjectivesExpanded] = useState(true);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  const notesRef = useRef();
  const saveNotesTimeoutRef = useRef();
  const autoSaveIntervalRef = useRef();

  // Fetch topic details when currentTopicId changes
  useEffect(() => {
    if (currentTopicId) {
      fetchTopicDetails(currentTopicId);
    }

    return () => {
      if (saveNotesTimeoutRef.current) {
        clearTimeout(saveNotesTimeoutRef.current);
      }

      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [currentTopicId]);

  // Setup auto-save interval
  useEffect(() => {
    autoSaveIntervalRef.current = setInterval(() => {
      if (hasChanges) {
        saveNotes();
        setHasChanges(false);
      }
    }, 30000); // Save every 30 seconds if there are changes

    return () => clearInterval(autoSaveIntervalRef.current);
  }, [hasChanges, notes]);

  // Fetch topic details (notes and objectives)
  const fetchTopicDetails = async (topicId) => {
    try {
      const token = localStorage.getItem("token");
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

      // Set notes
      if (topic.notes && topic.notes.length > 0) {
        // Get the most recent note
        setNotes(topic.notes[0].content);
      } else {
        // Set default notes with topic title
        setNotes(
          `# ${topic.title}\n\nThis is where your notes for this topic will appear. Start typing to add notes.`
        );
      }

      // Generate mock objectives if not available from API
      // In a real app, these would come from the backend
      const mockObjectives = [
        {
          id: 1,
          title: `Understand key concepts of ${topic.title}`,
          completed: topic.completed || false,
        },
        {
          id: 2,
          title: `Apply ${topic.title} principles to real-world scenarios`,
          completed: topic.completed || false,
        },
        {
          id: 3,
          title: `Analyze the relationship between ${topic.title} and other course topics`,
          completed: topic.completed || false,
        },
        {
          id: 4,
          title: `Evaluate the importance of ${topic.title} in the overall subject domain`,
          completed: topic.completed || false,
        },
      ];

      setTopicObjectives(mockObjectives);

      // Load saved expanded state
      const savedExpanded = localStorage.getItem(
        `objectives-expanded-${topicId}`
      );
      if (savedExpanded !== null) {
        setObjectivesExpanded(savedExpanded === "true");
      }

      // Reset hasChanges flag since we've just loaded fresh content
      setHasChanges(false);
      setLastSaved(new Date());

      // Hide quiz by default when changing topics
      setShowQuiz(false);
    } catch (error) {
      console.error("Error fetching topic details:", error);
      toast({
        title: "Error",
        description: "Failed to load topic details. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Save notes to the server
  const saveNotes = async () => {
    if (!notes.trim()) return;

    setSavingNotes(true);
    const token = localStorage.getItem("token");
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
      setLastSaved(new Date());
      setHasChanges(false);
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

  // Toggle objectives card expanded state
  const toggleObjectivesExpanded = () => {
    const newState = !objectivesExpanded;
    setObjectivesExpanded(newState);
    localStorage.setItem(
      `objectives-expanded-${currentTopicId}`,
      newState.toString()
    );
  };

  // Handle objective toggle
  const toggleObjective = async (objectiveId) => {
    const updatedObjectives = topicObjectives.map((obj) =>
      obj.id === objectiveId ? { ...obj, completed: !obj.completed } : obj
    );

    setTopicObjectives(updatedObjectives);

    // Check if all objectives are completed
    const allCompleted = updatedObjectives.every((obj) => obj.completed);

    // If all objectives are completed and the topic is marked as completed, show quiz
    if (allCompleted && currentTopic.completed) {
      toast({
        title: "All objectives completed!",
        description: "You can now take a quiz to test your knowledge.",
      });
    }
  };

  // Generate quiz for the current topic
  const generateQuiz = async () => {
    setAiResponding(true);
    setShowQuiz(true);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        `${API_BASE_URL}/learning/topics/${currentTopicId}/quiz`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            course_id: parseInt(courseId),
            difficulty: "medium",
            num_questions: 5,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate quiz");
      }

      const data = await response.json();
      setQuizData(data.data);
      setQuizAnswers({});
      setQuizSubmitted(false);
      setQuizResult(null);
    } catch (error) {
      console.error("Error generating quiz:", error);
      toast({
        title: "Error",
        description: "Failed to generate quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAiResponding(false);
    }
  };

  // Submit quiz answers
  const submitQuiz = async () => {
    const token = localStorage.getItem("token");
    if (!quizData || !quizData.questions) return;

    // Calculate results
    let correctAnswers = 0;
    const totalQuestions = quizData.questions.length;

    quizData.questions.forEach((question, index) => {
      if (quizAnswers[index] === question.correct_answer) {
        correctAnswers++;
      }
    });

    const results = {
      correct_answers: correctAnswers,
      total_questions: totalQuestions,
      score: (correctAnswers / totalQuestions) * 100,
    };

    try {
      const response = await fetch(
        `${API_BASE_URL}/learning/topics/${currentTopicId}/quiz/results`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(results),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to submit quiz results");
      }

      setQuizSubmitted(true);
      setQuizResult(results);

      toast({
        title: "Quiz Submitted",
        description: `You got ${correctAnswers} out of ${totalQuestions} correct (${Math.round(
          results.score
        )}%)`,
      });
    } catch (error) {
      console.error("Error submitting quiz results:", error);
      toast({
        title: "Error",
        description: "Failed to submit quiz results. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle note changes with debounced saving
  const handleNotesChange = (value) => {
    setNotes(value);
    setHasChanges(true);

    // Clear previous timeout
    if (saveNotesTimeoutRef.current) {
      clearTimeout(saveNotesTimeoutRef.current);
    }

    // Set new timeout to save notes after 2 seconds of inactivity
    saveNotesTimeoutRef.current = setTimeout(() => {
      saveNotes();
    }, 2000);
  };

  // Format last saved timestamp
  const formatLastSaved = () => {
    if (!lastSaved) return "";

    const now = new Date();
    const diffMs = now - lastSaved;
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) {
      return "Saved just now";
    } else if (diffMinutes === 1) {
      return "Saved 1 minute ago";
    } else if (diffMinutes < 60) {
      return `Saved ${diffMinutes} minutes ago`;
    } else {
      return `Saved at ${lastSaved.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
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

          {!savingNotes && lastSaved && (
            <div className="text-xs text-muted-foreground">
              {formatLastSaved()}
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
              <DropdownMenuItem onClick={() => generateQuiz()}>
                <MessageSquare size={16} className="mr-2" />
                Generate Quiz
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {showQuiz ? (
          <div className="p-4">
            <QuizSection
              currentTopic={currentTopic}
              quizData={quizData}
              quizAnswers={quizAnswers}
              quizSubmitted={quizSubmitted}
              quizResult={quizResult}
              aiResponding={aiResponding}
              generateQuiz={generateQuiz}
              submitQuiz={submitQuiz}
              setQuizAnswers={setQuizAnswers}
              setShowQuiz={setShowQuiz}
            />
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Learning Objectives */}
            <div className="p-4 pb-0">
              <div
                className="flex items-center justify-between cursor-pointer mb-2"
                onClick={toggleObjectivesExpanded}
              >
                <h3 className="text-sm font-medium flex items-center">
                  Learning Objectives
                </h3>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {objectivesExpanded ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </Button>
              </div>

              {objectivesExpanded && (
                <div className="space-y-3 py-2">
                  {topicObjectives.map((objective) => (
                    <div
                      key={objective.id}
                      className="flex items-start space-x-3"
                    >
                      <Checkbox
                        id={`objective-${objective.id}`}
                        checked={objective.completed}
                        onCheckedChange={() => toggleObjective(objective.id)}
                      />
                      <label
                        htmlFor={`objective-${objective.id}`}
                        className={`text-sm ${
                          objective.completed
                            ? "line-through text-muted-foreground"
                            : ""
                        }`}
                      >
                        {objective.title}
                      </label>
                    </div>
                  ))}

                  {topicObjectives.every((obj) => obj.completed) &&
                    currentTopic.completed && (
                      <div className="pt-2">
                        <Button
                          variant="outline"
                          onClick={generateQuiz}
                          size="sm"
                        >
                          Take a Quiz
                        </Button>
                      </div>
                    )}
                </div>
              )}
              <Separator className="my-4" />
            </div>

            {/* Notes - Main Content Area */}
            <div className="flex-1 p-4 pt-0">
              <div className="h-full">
                <div data-color-mode="light" className="h-full">
                  <MDEditor
                    value={notes}
                    onChange={handleNotesChange}
                    height="100%"
                    preview="edit"
                    className="w-full h-full border-none shadow-none"
                    previewOptions={{
                      className: "editor-preview-no-border",
                    }}
                    style={{
                      border: "none",
                      boxShadow: "none",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Quiz Section Component
function QuizSection({
  currentTopic,
  quizData,
  quizAnswers,
  quizSubmitted,
  quizResult,
  aiResponding,
  generateQuiz,
  submitQuiz,
  setQuizAnswers,
  setShowQuiz,
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Quiz: {currentTopic.title}</span>
            {!quizSubmitted && (
              <Button onClick={generateQuiz} variant="outline" size="sm">
                <RotateCw size={16} className="mr-2" />
                Regenerate Quiz
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {aiResponding ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : quizData && quizData.questions ? (
            <div className="space-y-6">
              {quizData.questions.map((question, qIndex) => (
                <Card
                  key={qIndex}
                  className={
                    quizSubmitted
                      ? quizAnswers[qIndex] === question.correct_answer
                        ? "border-green-500"
                        : "border-red-500"
                      : ""
                  }
                >
                  <CardContent className="pt-6">
                    <p className="font-medium mb-4">
                      {qIndex + 1}. {question.question}
                    </p>
                    <div className="space-y-2">
                      {question.options.map((option, oIndex) => (
                        <div
                          key={oIndex}
                          className={`p-3 rounded-md flex items-center space-x-2 cursor-pointer transition-colors ${
                            quizAnswers[qIndex] === oIndex
                              ? "bg-primary/10"
                              : "hover:bg-muted"
                          } ${
                            quizSubmitted && oIndex === question.correct_answer
                              ? "bg-green-100 dark:bg-green-900/20"
                              : ""
                          }`}
                          onClick={() => {
                            if (!quizSubmitted) {
                              setQuizAnswers({
                                ...quizAnswers,
                                [qIndex]: oIndex,
                              });
                            }
                          }}
                        >
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                              quizAnswers[qIndex] === oIndex
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-muted-foreground"
                            }`}
                          >
                            {quizAnswers[qIndex] === oIndex && (
                              <Check size={12} />
                            )}
                          </div>
                          <span>{option}</span>
                          {quizSubmitted &&
                            oIndex === question.correct_answer && (
                              <CheckCircle
                                size={16}
                                className="text-green-500 ml-auto"
                              />
                            )}
                        </div>
                      ))}
                    </div>
                    {quizSubmitted && (
                      <div className="mt-4 p-3 bg-muted rounded-md">
                        <p className="font-medium text-sm">Explanation:</p>
                        <p className="text-sm">
                          {question.explanation ||
                            "This answer is correct based on the course materials."}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {!quizSubmitted ? (
                <Button
                  onClick={submitQuiz}
                  className="w-full"
                  disabled={
                    Object.keys(quizAnswers).length !==
                    quizData.questions.length
                  }
                >
                  Submit Quiz
                </Button>
              ) : (
                quizResult && (
                  <Card className="bg-muted">
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-semibold mb-2">
                        Quiz Results
                      </h3>
                      <p>
                        You got {quizResult.correct_answers} out of{" "}
                        {quizResult.total_questions} correct.
                      </p>
                      <p className="font-medium mt-2">
                        Score: {Math.round(quizResult.score)}%
                      </p>
                      <div className="mt-4">
                        <Button onClick={() => setShowQuiz(false)}>
                          Back to Notes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          ) : (
            <p>Failed to load quiz questions. Please try again.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
