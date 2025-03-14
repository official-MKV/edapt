// components/courses/CreateCourseDialog.js
"use client";

import { useState } from "react";
import {
  Upload,
  Loader2,
  X,
  Check,
  Plus,
  BookOpen,
  Trash2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Domain options
const DOMAIN_OPTIONS = [
  "Computer Science",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Engineering",
  "Business",
  "Economics",
  "Psychology",
  "Sociology",
  "Philosophy",
  "History",
  "Literature",
  "Languages",
  "Art",
  "Music",
  "Medicine",
  "Law",
  "Political Science",
  "Other",
];

// Level options
const LEVEL_OPTIONS = [
  "High School",
  "Undergraduate - Freshman",
  "Undergraduate - Sophomore",
  "Undergraduate - Junior",
  "Undergraduate - Senior",
  "Graduate - Master's",
  "Graduate - Doctoral",
  "Professional",
  "Continuing Education",
];

// Material type options
const MATERIAL_TYPES = [
  "Textbook",
  "Academic Paper",
  "Course Notes",
  "Website",
  "Video",
  "Tutorial",
  "Article",
  "Other",
];

export default function CreateCourseDialog({ onCourseCreated }) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    domain: "",
    level: "",
    university_details: {
      name: "",
      course_code: "",
      department: "",
      term: "",
    },
    recommended_materials: [],
  });
  const [newMaterial, setNewMaterial] = useState({
    title: "",
    authors: "",
    type: "Textbook",
    description: "",
  });
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setCourseData({
      title: "",
      description: "",
      domain: "",
      level: "",
      university_details: {
        name: "",
        course_code: "",
        department: "",
        term: "",
      },
      recommended_materials: [],
    });
    setNewMaterial({
      title: "",
      authors: "",
      type: "Textbook",
      description: "",
    });
    setFiles([]);
    setUploadProgress({});
    setError("");
    setActiveTab("details");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCourseData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUniversityDetailChange = (e) => {
    const { name, value } = e.target;
    setCourseData((prev) => ({
      ...prev,
      university_details: {
        ...prev.university_details,
        [name]: value,
      },
    }));
  };

  const handleNewMaterialChange = (e) => {
    const { name, value } = e.target;
    setNewMaterial((prev) => ({ ...prev, [name]: value }));
  };

  const handleMaterialTypeChange = (value) => {
    setNewMaterial((prev) => ({ ...prev, type: value }));
  };

  const addRecommendedMaterial = () => {
    if (!newMaterial.title) return;

    setCourseData((prev) => ({
      ...prev,
      recommended_materials: [
        ...prev.recommended_materials,
        { ...newMaterial },
      ],
    }));

    // Reset the form
    setNewMaterial({
      title: "",
      authors: "",
      type: "Textbook",
      description: "",
    });
  };

  const removeRecommendedMaterial = (index) => {
    setCourseData((prev) => ({
      ...prev,
      recommended_materials: prev.recommended_materials.filter(
        (_, i) => i !== index
      ),
    }));
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const isDetailsComplete = () => {
    return courseData.title && courseData.domain && courseData.level;
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      // 1. Create course
      const courseResponse = await fetch(
        "http://localhost:8000/api/v1/courses",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(courseData),
        }
      );

      const courseResult = await courseResponse.json();

      if (!courseResponse.ok) {
        throw new Error(courseResult.message || "Failed to create course");
      }

      const courseId = courseResult.data.id;

      // 2. Upload files if any
      if (files.length > 0) {
        setIsUploading(true);

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const formData = new FormData();
          formData.append("file", file);
          formData.append("title", file.name);

          // Track progress for this file
          setUploadProgress((prev) => ({
            ...prev,
            [i]: { progress: 0, status: "uploading" },
          }));

          try {
            const uploadResponse = await fetch(
              `http://localhost:8000/api/v1/courses/${courseId}/materials`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
                body: formData,
              }
            );

            const uploadResult = await uploadResponse.json();

            if (!uploadResponse.ok) {
              setUploadProgress((prev) => ({
                ...prev,
                [i]: { progress: 100, status: "error" },
              }));
              console.error(
                `Failed to upload ${file.name}: ${uploadResult.message}`
              );
            } else {
              setUploadProgress((prev) => ({
                ...prev,
                [i]: { progress: 100, status: "success" },
              }));
            }
          } catch (uploadErr) {
            setUploadProgress((prev) => ({
              ...prev,
              [i]: { progress: 100, status: "error" },
            }));
            console.error(`Error uploading ${file.name}:`, uploadErr);
          }
        }
      }

      // Success - close dialog and notify parent
      toast({
        title: "Course created",
        description: "Your course has been created successfully.",
      });

      onCourseCreated?.();
      resetForm();
      setOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!isSubmitting && !isUploading) {
          setOpen(newOpen);
          if (!newOpen) resetForm();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>Create Course</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Course</DialogTitle>
          <DialogDescription>
            Create a new course and upload materials for your personalized
            learning.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          defaultValue="details"
          value={activeTab}
          onValueChange={setActiveTab}
          className="mt-2"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Course Details</TabsTrigger>
            <TabsTrigger value="materials" disabled={!isDetailsComplete()}>
              Recommended Materials
            </TabsTrigger>
            <TabsTrigger value="uploads" disabled={!isDetailsComplete()}>
              Upload Files
            </TabsTrigger>
          </TabsList>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Course Details Tab */}
          <TabsContent value="details" className="py-4">
            <form id="course-details-form">
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="title">Course Title*</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="e.g. Introduction to Machine Learning"
                    value={courseData.title}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="domain">Subject Domain*</Label>
                  <Select
                    value={courseData.domain}
                    onValueChange={(value) =>
                      setCourseData((prev) => ({ ...prev, domain: value }))
                    }
                    required
                  >
                    <SelectTrigger id="domain">
                      <SelectValue placeholder="Select domain" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOMAIN_OPTIONS.map((domain) => (
                        <SelectItem key={domain} value={domain}>
                          {domain}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="level">Academic Level*</Label>
                  <Select
                    value={courseData.level}
                    onValueChange={(value) =>
                      setCourseData((prev) => ({ ...prev, level: value }))
                    }
                    required
                  >
                    <SelectTrigger id="level">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEVEL_OPTIONS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Course Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe your course..."
                    rows={3}
                    value={courseData.description}
                    onChange={handleChange}
                  />
                </div>

                <div className="border p-4 rounded-md">
                  <h3 className="text-sm font-medium mb-3">
                    University Details (Optional)
                  </h3>
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="uni-name">University Name</Label>
                        <Input
                          id="uni-name"
                          name="name"
                          placeholder="e.g. Stanford University"
                          value={courseData.university_details.name}
                          onChange={handleUniversityDetailChange}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="course-code">Course Code</Label>
                        <Input
                          id="course-code"
                          name="course_code"
                          placeholder="e.g. CS101"
                          value={courseData.university_details.course_code}
                          onChange={handleUniversityDetailChange}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="department">Department</Label>
                        <Input
                          id="department"
                          name="department"
                          placeholder="e.g. Computer Science"
                          value={courseData.university_details.department}
                          onChange={handleUniversityDetailChange}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="term">Term</Label>
                        <Input
                          id="term"
                          name="term"
                          placeholder="e.g. Fall 2023"
                          value={courseData.university_details.term}
                          onChange={handleUniversityDetailChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </TabsContent>

          {/* Recommended Materials Tab */}
          <TabsContent value="materials" className="py-4">
            <div className="grid gap-6">
              <div className="border p-4 rounded-md">
                <h3 className="text-sm font-medium mb-3">
                  Add Recommended Materials
                </h3>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="material-title">Title</Label>
                    <Input
                      id="material-title"
                      name="title"
                      placeholder="e.g. Introduction to Algorithms"
                      value={newMaterial.title}
                      onChange={handleNewMaterialChange}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="material-authors">Authors</Label>
                    <Input
                      id="material-authors"
                      name="authors"
                      placeholder="e.g. Thomas H. Cormen, et al."
                      value={newMaterial.authors}
                      onChange={handleNewMaterialChange}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="material-type">Type</Label>
                    <Select
                      value={newMaterial.type}
                      onValueChange={handleMaterialTypeChange}
                    >
                      <SelectTrigger id="material-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {MATERIAL_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="material-description">Description</Label>
                    <Textarea
                      id="material-description"
                      name="description"
                      placeholder="Brief description of the material..."
                      rows={2}
                      value={newMaterial.description}
                      onChange={handleNewMaterialChange}
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={addRecommendedMaterial}
                    disabled={!newMaterial.title}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Material
                  </Button>
                </div>
              </div>

              {/* List of added materials */}
              {courseData.recommended_materials.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-3">
                    Recommended Materials (
                    {courseData.recommended_materials.length})
                  </h3>
                  <div className="space-y-3">
                    {courseData.recommended_materials.map((material, index) => (
                      <Card key={index}>
                        <CardContent className="p-4 flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{material.title}</h4>
                              <Badge variant="outline">{material.type}</Badge>
                            </div>
                            {material.authors && (
                              <p className="text-sm text-muted-foreground">
                                By {material.authors}
                              </p>
                            )}
                            {material.description && (
                              <p className="text-sm mt-1">
                                {material.description}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeRecommendedMaterial(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {courseData.recommended_materials.length === 0 && (
                <div className="text-center p-6 border border-dashed rounded-md">
                  <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <h3 className="text-lg font-medium">
                    No materials added yet
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Add recommended textbooks, papers, or other materials for
                    this course.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Upload Files Tab */}
          <TabsContent value="uploads" className="py-4">
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label>Upload Course Materials</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Input
                    id="file-upload"
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.txt,.md,.ppt,.pptx"
                  />
                  <Label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                    <span className="text-lg font-medium">Click to upload</span>
                    <span className="text-sm text-muted-foreground">
                      PDF, DOCX, TXT, PPT (max 10MB)
                    </span>
                  </Label>
                </div>
              </div>

              {files.length > 0 && (
                <div className="grid gap-2">
                  <Label>Selected Files</Label>
                  <div className="border rounded-lg divide-y overflow-hidden">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div className="flex-1 truncate">
                            <p className="font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {uploadProgress[index]?.status === "success" && (
                            <Check className="h-5 w-5 text-green-500" />
                          )}
                          {uploadProgress[index]?.status === "error" && (
                            <X className="h-5 w-5 text-red-500" />
                          )}
                          {uploadProgress[index]?.status === "uploading" && (
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          )}

                          {!uploadProgress[index] && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFile(index)}
                              disabled={isUploading}
                            >
                              <X className="h-5 w-5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {files.length === 0 && (
                <div className="text-center p-6 border border-dashed rounded-md">
                  <Info className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <h3 className="text-lg font-medium">No files uploaded yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload lecture notes, slides, assignments, or other course
                    materials.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          {activeTab === "details" ? (
            <Button
              type="button"
              disabled={!isDetailsComplete() || isSubmitting}
              onClick={() => setActiveTab("materials")}
            >
              Next: Recommended Materials
            </Button>
          ) : activeTab === "materials" ? (
            <div className="flex gap-2 w-full justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab("details")}
                disabled={isSubmitting}
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={() => setActiveTab("uploads")}
                disabled={isSubmitting}
              >
                Next: Upload Files
              </Button>
            </div>
          ) : (
            <div className="flex gap-2 w-full justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab("materials")}
                disabled={isSubmitting || isUploading}
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={handleCreateCourse}
                disabled={isSubmitting || isUploading}
              >
                {isSubmitting || isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isUploading ? "Uploading..." : "Creating..."}
                  </>
                ) : (
                  "Create Course"
                )}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
