// app/(dashboard)/dashboard/page.js
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Clock,
  ArrowRight,
  BookOpenCheck,
  Calendar,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import CreateCourseDialog from "@/components/dashboard/CreateCourseDialog";
import { useQuery } from "@tanstack/react-query";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedTopics: 0,
    totalTopics: 0,
    studyTimeThisWeek: 0,
  });
  const fetchCourses = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No access token found. Please log in.");
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_PATH}/courses`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.ok) {
      throw new Error("Failed to fetch courses");
    }
    const data = await response.json();
    return data.data;
  };

  const {
    data: recentCourses = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["userCourses"],
    queryFn: fetchCourses,
  });

  const handleCourseCreated = () => {
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <CreateCourseDialog onCourseCreated={handleCourseCreated} />
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Courses"
          value={stats.totalCourses}
          icon={BookOpen}
          loading={isLoading}
        />
        <StatsCard
          title="Completed Topics"
          value={`${stats.completedTopics}/${stats.totalTopics}`}
          icon={BookOpenCheck}
          loading={isLoading}
        />
        <StatsCard
          title="Study Time (This Week)"
          value={`${stats.studyTimeThisWeek} hours`}
          icon={Clock}
          loading={isLoading}
        />
        <StatsCard
          title="Study Streak"
          value="5 days"
          icon={Calendar}
          loading={isLoading}
        />
      </div>

      {/* Recent courses section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Courses</h2>
          <Link
            href="/courses"
            className="text-primary text-sm flex items-center"
          >
            See all courses
            <ArrowRight size={16} className="ml-1" />
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <>
              <CourseCardSkeleton />
              <CourseCardSkeleton />
              <CourseCardSkeleton />
            </>
          ) : (
            recentCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))
          )}

          {!isLoading && recentCourses.length === 0 && (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500 mb-4">
                You haven't created any courses yet.
              </p>
              <CreateCourseDialog onCourseCreated={handleCourseCreated} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon: Icon, loading }) {
  return (
    <Card>
      <CardContent className="p-6 flex justify-between items-center">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          {loading ? (
            <Skeleton className="h-8 w-16 mt-1" />
          ) : (
            <p className="text-2xl font-bold">{value}</p>
          )}
        </div>
        <div className="bg-primary/10 p-3 rounded-full">
          <Icon size={24} className="text-primary" />
        </div>
      </CardContent>
    </Card>
  );
}

function CourseCard({ course }) {
  console.log(course);
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{course.title}</CardTitle>
        <CardDescription>
          Last accessed: {formatDate(course.lastAccessed)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span>{course.progress}% complete</span>
            <span>
              {course.topicsCompleted}/{course.topics} topics
            </span>
          </div>
          <Progress value={course.progress} />
        </div>
      </CardContent>
      <CardFooter>
        <Link href={`/courses/${course.id}`} className="w-full">
          <Button variant="outline" className="w-full">
            Continue Learning
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

function CourseCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-4 w-28 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-4 w-full" />
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
