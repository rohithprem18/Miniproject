import { NextApiRequest, NextApiResponse } from "next";
import { getSessionServer } from "@/utils/auth-server";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const user = await getSessionServer(req, res);
    
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Return user data without sensitive information
    res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    console.error("Error getting session:", error);
    res.status(500).json({ 
      error: "Internal Server Error",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
