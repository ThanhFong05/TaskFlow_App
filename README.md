# TaFo - Task & Team Management Application (Assignment 3 & 4)

**TaFo** is a real-time collaborative Task & Team Management web application built with **Next.js 16 (App Router)**, **TypeScript**, **Prisma ORM**, **PostgreSQL (Supabase)**, and **Supabase Realtime**.

---

## Key Features (Assignment 3 & 4)

### 1. Real-time Team Chat
- **Dedicated Chat Room**: Each team workspace has its own real-time chat room.
- **Message Persistence**: All messages are persisted in PostgreSQL (`Message` model: `senderId`, `content`, `teamId`, `createdAt`).
- **Zero-Refresh Updates**: Powered by **Supabase Realtime (Broadcast channels)**, new messages arrive immediately across all active browser sessions.
- **Typing Indicators**: Displays who is currently typing in real-time.
- **Online Presence**: Live presence tracking shows who is currently active in the team workspace.

### 2. Live Task Board Updates
- **Real-time Kanban & List Sync**: When any team member creates, moves status, updates, or deletes a task, all other members viewing the same workspace see the change live without page reload.
- **Interactive Kanban Columns**: *To Do*, *In Progress*, *Done* with instant quick-move transitions.

### 3. In-App Notification System
- **Notification Bell & Badge**: Top navbar bell icon displays real-time unread counts with pulsating badge.
- **Task Assignment Alerts**: Instant in-app notification when assigned to a task.
- **Team Invitation Alerts**: Instant notification when added to a team.
- **Role Update Alerts**: Notification when permissions/role are modified.
- **Notification Center**: Dropdown to view recent notifications, click to navigate, mark individual or all notifications as read.

### 4. Advanced 3-Tier Role & Permission System (RBAC)
Enforced strictly on both the UI and server-side Route Handlers:
- **`OWNER`**: Full control:
  - Add members and change member roles (`ADMIN` / `MEMBER`).
  - Transfer team ownership to another member.
  - Delete team and cascade tasks.
  - Create, edit, and delete **ANY** task.
- **`ADMIN`**:
  - Add new members and remove standard `MEMBER` users (cannot remove Owner or other Admins).
  - Create, edit, and delete **ALL** tasks in the team.
  - Cannot delete team or transfer ownership.
- **`MEMBER`**:
  - Create tasks and participate in chat.
  - Edit own tasks, assigned tasks, or update task status.
  - **Can only delete their own tasks** (`creatorId === user.id`). Cannot delete tasks created by others.
  - Cannot invite/remove members or change roles.
- **Permissions Matrix Modal**: In-app visual comparison matrix explaining the exact capabilities of each role.

### 5. Team Audit Trail / Activity Log *(Bonus Feature)*
- Comprehensive chronological timeline recording all team events:
  - Task created / updated / status moved / deleted.
  - Member added / removed / left team.
  - Member role updated / ownership transferred.

---

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: Next.js Route Handlers (REST API)
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma 6
- **Real-time Engine**: Supabase Realtime (Channels: Broadcast & Presence)
- **Authentication**: Supabase Auth (`@supabase/ssr`, `@supabase/supabase-js`)
- **Hosting**: Vercel

---

## API Endpoints

| Method | Endpoint | Description | Role / Permission |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user | Public |
| `POST` | `/api/auth/login` | Login user session | Public |
| `POST` | `/api/auth/logout` | Logout user | Authenticated |
| `GET` | `/api/auth/me` | Current user profile | Authenticated |
| `GET` | `/api/teams` | List user teams | Authenticated |
| `POST` | `/api/teams` | Create new team (creator becomes Owner) | Authenticated |
| `GET` | `/api/teams/:id` | Get team details, members, tasks, and role | Team Member |
| `PUT` | `/api/teams/:id` | Update team details | Owner |
| `DELETE` | `/api/teams/:id` | Delete team | Owner |
| `POST` | `/api/teams/:id/members` | Add member by email (sends notification) | Owner, Admin |
| `PUT` | `/api/teams/:id/members/:userId` | Update member role / Transfer ownership | Owner |
| `DELETE` | `/api/teams/:id/members/:userId` | Remove member (or leave team) | Owner, Admin, Self |
| `GET` | `/api/teams/:id/messages` | Get team chat history | Team Member |
| `POST` | `/api/teams/:id/messages` | Send chat message | Team Member |
| `GET` | `/api/teams/:id/tasks` | Get team tasks (filters & search) | Team Member |
| `POST` | `/api/teams/:id/tasks` | Create task (notifies assignee) | Team Member |
| `PUT` | `/api/tasks/:id` | Edit task / Move status | Owner, Admin, Creator, Assignee |
| `DELETE` | `/api/tasks/:id` | Delete task | Owner, Admin, Creator |
| `GET` | `/api/teams/:id/activity` | Get team audit trail | Team Member |
| `GET` | `/api/notifications` | Get user notifications & unread count | Authenticated |
| `PUT` | `/api/notifications/:id/read` | Mark notification as read | Notification Owner |
| `PUT` | `/api/notifications/read-all` | Mark all notifications as read | Authenticated |

---

## Database Schema (ERD)

```mermaid
erDiagram
    User ||--o{ TeamMember : "has"
    User ||--o{ Task : "assigned to"
    User ||--o{ Task : "created"
    User ||--o{ Message : "sent"
    User ||--o{ Notification : "received"
    User ||--o{ ActivityLog : "performed"
    Team ||--o{ TeamMember : "has"
    Team ||--o{ Task : "contains"
    Team ||--o{ Message : "contains"
    Team ||--o{ ActivityLog : "logged"

    User {
        String id PK
        String name
        String email UK
        String password
        DateTime createdAt
    }

    Team {
        String id PK
        String name
        String description
        String ownerId
        DateTime createdAt
    }

    TeamMember {
        String id PK
        String teamId FK
        String userId FK
        String role "OWNER | ADMIN | MEMBER"
        DateTime joinedAt
    }

    Task {
        String id PK
        String title
        String description
        String status "To Do | In Progress | Done"
        String priority "Low | Medium | High"
        DateTime dueDate
        String teamId FK
        String assigneeId FK
        String creatorId FK
        DateTime createdAt
        DateTime updatedAt
    }

    Message {
        String id PK
        String content
        String teamId FK
        String senderId FK
        DateTime createdAt
    }

    Notification {
        String id PK
        String userId FK
        String type "TASK_ASSIGNED | TEAM_INVITED | ROLE_UPDATED"
        String title
        String message
        String link
        Boolean isRead
        DateTime createdAt
    }

    ActivityLog {
        String id PK
        String teamId FK
        String actorId FK
        String action
        String details
        DateTime createdAt
    }
```

---

## Setup & Running Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables** (`.env`):
   ```env
   DATABASE_URL="postgresql://postgres.[ref]:[pass]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres.[ref]:[pass]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
   NEXT_PUBLIC_SUPABASE_URL="https://[ref].supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="[your-anon-key]"
   ```

3. **Database Migration**:
   ```bash
   npx prisma db push
   # or run prisma/migration.sql directly in the Supabase SQL Editor
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

---

## Submission Information (Template)

Student ID: __________
Full Name: __________
GitHub Repository URL: https://github.com/ThanhFong05/TaskFlow_App
Deployed Website URL (Vercel): __________
Separate Backend URL (NestJS on Render) — write N/A if not used: N/A
Real-time mechanism used (Supabase Realtime / Socket.io / Pusher / Ably): Supabase Realtime
Test Account 1 Email: __________
Test Account 1 Password: __________
Test Account 2 Email (must be on the SAME team as Account 1, to test real-time between two sessions): __________
Test Account 2 Password: __________
Both test accounts are already email-verified / ready to log in immediately, with no confirmation link needed (Yes / No): Yes
Demo video link (YouTube/Drive/Loom, 2–3 minutes, showing live chat and live task updates across two sessions): __________
