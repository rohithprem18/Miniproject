import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/prisma/client";

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // CORS headers
  const allowedOrigins = [
    "https://stockly-inventory.vercel.app",
    "https://stockly-inventory-managment-nextjs-ovlrz6kdv.vercel.app",
    "https://stockly-inventory-managment-nextjs-arnob-mahmuds-projects.vercel.app",
    "https://stockly-inventory-managment-n-git-cc3097-arnob-mahmuds-projects.vercel.app",
    req.headers.origin,
  ];
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader(
      "Access-Control-Allow-Origin",
      "https://stockly-inventory.vercel.app"
    );
  }

  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { name, email, password } = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate a unique username
    const baseUsername = email.split('@')[0];
    let username = baseUsername;
    let counter = 1;
    
    // Check if username exists and generate a unique one
    while (await prisma.user.findUnique({ where: { username } })) {
      username = `${baseUsername}${counter}`;
      counter++;
      // Prevent infinite loop
      if (counter > 1000) {
        throw new Error("Unable to generate unique username");
      }
    }

    // Create user with Prisma
    const createdUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        username,
        createdAt: new Date(),
      },
    });

    res.status(201).json({ 
      id: createdUser.id, 
      name: createdUser.name, 
      email: createdUser.email 
    });
  } catch (error) {
    console.error("Error registering user:", error);
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Validation failed", 
        details: error.errors 
      });
    }
    
    // Handle Prisma unique constraint errors
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2002') {
        return res.status(400).json({ error: "Email or username already exists" });
      }
    }
    
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: "An unknown error occurred" });
    }
  }
}
