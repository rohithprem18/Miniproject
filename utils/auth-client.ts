"use client";

import Cookies from "js-cookie";

// Client-side User type (without Prisma dependencies)
export interface User {
  id: string;
  name?: string | null;
  email: string;
  createdAt?: Date | string;
  updatedAt?: Date | string | null;
}

export const getSessionClient = async (): Promise<User | null> => {
  try {
    const token = Cookies.get("session_id");
    // Debug log - only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log("Session ID from cookies:", token);
    }
    if (!token) {
      return null;
    }

    // On client side, we'll make an API call to verify the token
    // This avoids using the JWT library on the client side
    const response = await fetch('/api/auth/session', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies
    });

    if (response.ok) {
      const user = await response.json();
      return user;
    }

    return null;
  } catch (error) {
    // Only log in development to avoid console errors in production
    if (process.env.NODE_ENV === 'development') {
      console.error("Error in getSessionClient:", error);
    }
    return null;
  }
};

