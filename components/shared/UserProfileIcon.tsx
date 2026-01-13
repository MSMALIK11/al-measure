"use client";

import React, { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, LogOut } from "lucide-react";

const LOCAL_STORAGE_KEY = "projectLoginData";

export default function UserProfileIcon({
  onLogout }: { onLogout?: () => void }) {
  const [userData, setUserData] = useState<{
    userName:string
    projectId: string;
    userRole: string;
    userId: string;
  } | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedUser) {
      setUserData(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setUserData(null);
    window.location.reload();
    if (onLogout) onLogout();
  };

  if (!userData) return null;
  // generate initials for fallback avatar
  const initials = userData?.userName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)


  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
  <div className="relative">
    <Avatar className="cursor-pointer border-2 border-blue-200 shadow-md hover:scale-105 transition-transform duration-200">
      <AvatarImage src="" alt="User" />
      <AvatarFallback className="bg-blue-600 text-white">
        {initials || <User className="w-5 h-5" />}
      </AvatarFallback>
    </Avatar>

    {/* Active badge */}
    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-sm"></span>
  </div>
</DropdownMenuTrigger>

      <DropdownMenuContent className="w-64 bg-white/90 backdrop-blur-md border border-blue-100 shadow-lg rounded-xl p-4 animate-fade-in">
        <DropdownMenuLabel className="text-gray-500 font-semibold text-sm">
          User Info
        </DropdownMenuLabel>

        <div className="flex flex-col gap-2 mt-2">
          <DropdownMenuItem className="flex justify-between text-gray-700 hover:bg-blue-50 rounded-md px-2 py-1 cursor-default">
            <span className="font-medium text-sm">Name:</span>
            <span className="text-sm">{userData?.userName}</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex justify-between text-gray-700 hover:bg-blue-50 rounded-md px-2 py-1 cursor-default">
            <span className="font-medium text-sm">Project ID:</span>
            <span className="text-sm">{userData?.projectId}</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex justify-between text-gray-700 hover:bg-blue-50 rounded-md px-2 py-1 cursor-default">
            <span className="font-medium text-sm">User ID:</span>
            <span className="text-sm">{userData?.userId}</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex justify-between text-gray-700 hover:bg-blue-50 rounded-md px-2 py-1 cursor-default">
            <span className="font-medium text-sm">Role:</span>
            <span className="text-sm">{userData?.userRole}</span>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="my-2 border-blue-100" />

        <DropdownMenuItem
          onClick={handleLogout}
          className="flex items-center gap-2 text-red-600 hover:bg-red-50 rounded-md px-2 py-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
