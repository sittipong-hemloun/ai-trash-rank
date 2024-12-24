# AI Trash Rank – Developer Guide

Welcome! This document aims to help you (or your friend) understand how the **AI Trash Rank** project works so you can develop it further. This project is built on top of **Next.js** (App Router) and uses **Drizzle ORM** with a **Neon** PostgreSQL database. It also integrates Google Generative AI, Google Maps API, and Web3Auth for authentication.

Below is an overview of the critical parts of the codebase, focusing on two key areas:

## Table of Contents

- [AI Trash Rank – Developer Guide](#ai-trash-rank--developer-guide)
  - [Table of Contents](#table-of-contents)
  - [Project Overview](#project-overview)
  - [Setup Instructions](#setup-instructions)
    - [Actions (utils/db/actions.ts)](#actions-utilsdbactionsts)
  - [Hooks](#hooks)

---

## Project Overview

The **AI Trash Rank** project allows users to:

- **Report trash** by uploading images and location data, which then gets verified by an AI model.
- **Collect trash** tasks (from reports) and verify that the correct trash type and quantity have been collected.
- **Earn points/score** and get notifications for successful verifications.
- **Use web-based authentication** via Web3Auth (using Ethereum-based login).

Key tech stack includes:

- **Next.js (v14+)** with the new App Router (`app/` directory).
- **TypeScript** throughout the code.
- **Drizzle ORM** to interface with a **Neon** PostgreSQL database.
- **React Hooks** for data fetching, verification logic, and more.
- **Google Generative AI** for analyzing uploaded trash photos.
- **Google Maps** for location-based searching and auto-complete.
- **Tailwind CSS** for styling.

---

## Setup Instructions

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/YourRepo/ai-trash-rank.git
   cd ai-trash-rank
    ```

2.	**Install Dependencies**:
    ```bash
    npm install
    ```

3.	**Set Up Environment Variables**:
    - Copy the `.env.example` file to `.env.local` and fill in the required values.
    ```bash
    cp .env.example .env.local
    ```

<!-- if need to migrate database -->
4.	**Migrate the Database (Optional)**:
    - Run the following command to create the database tables:
    ```bash
    npm run db:push
    ```

5.	**Start the Development Server**:
    ```bash
    npm run dev
    ```

6.	**Open the App**:
    - Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## Database Layer

### Overview of Drizzle ORM with Neon DB
- Neon: A serverless PostgreSQL provider. We connect via their HTTP driver.
  To access the database, follow the this link: [Neon Dashboard](https://console.neon.tech/app/projects/orange-haze-87223769?branchId=br-ancient-band-a1glvx86&database=AI+Trash+Rank+Database).
- Drizzle ORM: A new-generation TypeScript-first ORM. We define our table schemas in utils/db/schema.ts and then run migrations with Drizzle Kit.
  To do CRUD operations, follow this link: [Drizzle ORM Access Data](https://orm.drizzle.team/docs/rqb).

### Schema Definition (utils/db/schema.ts)
The file schema.ts defines our primary tables, such as Users, Reports, Notifications, etc. For example:

```typescript
import { 
  integer, 
  varchar, 
  pgTable, 
  serial, 
  text, 
  timestamp, 
  jsonb, 
  boolean,
} from "drizzle-orm/pg-core"

/**
 * Users table schema.
 */
export const Users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  profileImage: text("profile_image"),
  name: varchar("name", { length: 255 }).notNull(),
  point: integer("point").notNull().default(0), // Points earned by the user
  score: integer("score").notNull().default(0), // Score earned by the user
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

/**
 * Reports table schema.
 */
export const Reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => Users.id).notNull(),
  location: text("location").notNull(),
  trashType: varchar("trash_type", { length: 255 }).notNull(),
  quantity: varchar("quantity", { length: 255 }).notNull(),
  imageUrl: text("image_url"),
  verificationResult: jsonb("verification_result"),
  status: varchar("status", { length: 255 }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  collectorId: integer("collector_id").references(() => Users.id),
})

/**
 * Notifications table schema.
 */
export const Notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => Users.id).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// Additional tables like Posts, Activities, Rewards, UserRewards can be defined similarly
```

### Actions (utils/db/actions.ts)
This file contains all the database-related logic (e.g., queries, inserts, updates) in simple, reusable functions. Each function is responsible for a single task (e.g., create a user, fetch tasks, create a notification, etc.).

Key Functions:
```typescript
import { db } from './dbConfig'
import { Users } from './schema'

/**
 * Creates a new user in the database.
 * @param email - User's email.
 * @param profileImage - URL to the user's profile image.
 * @param name - User's name.
 * @returns The created user or null if an error occurs.
 */
export async function createUser(email: string, profileImage: string, name: string) {
  try {
    const [user] = await db.insert(Users).values({ email, profileImage, name }).returning().execute()
    return user
  } catch (error) {
    console.error("Error creating user:", error)
    return null
  }
}
```

How to Use:
```typescript
import { createUser } from '@/utils/db/actions';

async function someComponentOrFunction() {
  const newUser = await createUser('test@email.com', 'profile.jpg', 'Test');
  if (!newUser) {
    console.error('Failed to create user!');
  } else {
    console.log('User created successfully!', newUser);
  }
}
```

---

## Hooks
The hooks folder contains React hooks for abstracting repeated logic. Each hook focuses on a single responsibility:

e.g., `useUser.ts` hook:
```typescript
import { User } from "@/app/types/user"
import { getUserByEmail } from "@/utils/db/actions"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"

/**
 * Custom hook to fetch and manage user information.
 */
const useUser = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userEmail = localStorage.getItem('userEmail')
        if (userEmail) {
          const fetchedUser = await getUserByEmail(userEmail)
          if (fetchedUser) {
            setUser(fetchedUser)
          } else {
            toast.error('ไม่พบผู้ใช้ กรุณาเข้าสู่ระบบอีกครั้ง')
            router.push('/')
          }
        } else {
          toast.error('ผู้ใช้ยังไม่ได้เข้าสู่ระบบ กรุณาเข้าสู่ระบบ')
          router.push('/')
        }
      } catch (error) {
        console.error('Error fetching user:', error)
        toast.error('ไม่สามารถโหลดข้อมูลผู้ใช้ได้ กรุณาลองอีกครั้ง')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [router])

  return { user, loading, setUser }
}

export default useUser
```

How to Use:
```typescript
import useUser from '@/hooks/useUser';

function ProfilePage() {
  const { user, loading, setUser } = useUser();

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <h1>Welcome, {user?.name}!</h1>
      <button onClick={() => setUser(null)}>Log Out</button>
    </div>
  );
}
```
