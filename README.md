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

## Self-Assessment Checklist (Assignment 3 & 4)

### A. Authentication & Security
- [x] **[AUTH-01] User Self-Registration**: Users can register with name, email, and password. Newly registered accounts are activated immediately without confirmation links.
- [x] **[AUTH-02] JWT Session & Security**: JWT-based authentication via Supabase Auth and HTTP-only cookies. Users can log out securely.
- [x] **[AUTH-03] Pre-seeded Dual Test Accounts**: Two verified test accounts belonging to the same team are available for immediate login and testing.

### B. Real-time Chat
- [x] **[CHAT-01] Dedicated Real-time Channel**: Supabase Realtime uses WebSocket broadcast channels to deliver chat messages instantly across users without page reload.
- [x] **[CHAT-02] Persistent Chat History**: Chat messages are persistently stored in PostgreSQL (`Message` table) and reloaded on page refresh.
- [x] **[CHAT-03] Typing Indicator**: Displays live typing indicator (*"User is typing..."*) when another team member types.
- [x] **[CHAT-04] Online Presence**: Tracks and displays active team members online in real time using Supabase Presence.
- [x] **[CHAT-05] File and Image Attachments**: Users can send image and file attachments through chat. Images are compressed with HTML5 Canvas, previewed in a Lightbox modal, and downloadable.

### C. Task Management
- [x] **[TASK-01] Real-time Task Synchronization**: Creating, editing, moving status, and deleting tasks updates the board live across connected sessions.
- [x] **[TASK-02] Three-column Kanban Board**: Visual 3-column workflow (*To Do*, *In Progress*, *Done*) with instant status transitions.
- [x] **[TASK-03] Real-time Update Notifications**: Real-time Toast notifications inform users when tasks or messages are modified by teammates.
- [x] **[TASK-04] Task Filtering and Search**: Filter tasks by status, priority, and assignee, plus live keyword search.

### D. Role-Based Access Control
- [x] **[ROLE-01] Three-tier Role System**: Supports Owner, Admin, and Member roles, enforced both in UI and server-side Route Handlers.
- [x] **[ROLE-02] Role Promotion and Demotion**: Owner can promote members to Admin, demote to Member, or transfer ownership.
- [x] **[ROLE-03] Team Management Permissions**: Only Owner can edit or delete team. Admins can manage tasks and members.
- [x] **[ROLE-04] Task Authorization Matrix**: Owner & Admin can delete any task; Members can only delete their own tasks (unauthorized tasks locked with 🔒).

### E. Notifications & Audit Trail
- [x] **[NOTIF-01] Notification Triggers**: In-app notifications generated for task assignments, team invitations, and role updates.
- [x] **[NOTIF-02] Notification Center**: Top bell icon with pulsating unread badge, dropdown list, and mark-as-read controls.
- [x] **[NOTIF-03] Browser Push Notifications**: Web Notifications API integration with toggle button to enable/disable desktop push notifications.
- [x] **[NOTIF-04] Audit Trail**: Detailed chronological activity log recording who did what and when.

### F. Deployment & Submission
- [x] **[DEPLOY-01] Application Deployment**: Deployed on Vercel connected to Supabase PostgreSQL.
- [x] **[DEPLOY-02] Dual-session Testing**: Tested across dual browser sessions (Owner & Member).
- [x] **[DEPLOY-03] Demo Video**: Ready for demo recording showcasing live chat, presence, typing, and task sync.
- [x] **[DEPLOY-04] Public GitHub Repository**: Public repository at https://github.com/ThanhFong05/TaskFlow_App.

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
