# TaFo - Task & Team Management Application

**TaFo** is a collaborative Task & Team Management web application built with Next.js (App Router), Prisma ORM, PostgreSQL (Supabase), and Supabase Authentication.

## Features

- **User Authentication**:
  - Secure registration and login powered by Supabase Auth and synced with PostgreSQL.
  - Role-based route protection via Next.js Middleware.
  - Self-registration enabled without mandatory email confirmation links.

- **Team Management**:
  - Create and manage collaborative teams.
  - Team creator automatically assigned as `OWNER`.
  - Owners can invite members by email and remove members.
  - Members can belong to multiple teams and switch between them.

- **Task Management**:
  - Full CRUD operations on tasks.
  - Assign tasks to specific team members.
  - Set status (*To Do*, *In Progress*, *Done*), priority (*Low*, *Medium*, *High*), and due dates.
  - **Role-based deletion**: Only the task creator, the assignee, or the team Owner can delete a task.

- **Bonus & Enhanced UI/UX**:
  - **Interactive Kanban Board**: 3-column workflow (*To Do*, *In Progress*, *Done*) with quick status transition buttons.
  - **Table / List View**: Clean tabular display with inline status selectors and actions.
  - **Filters & Search**: Instant filtering by status, priority, and assignee, plus keyword search.
  - Glassmorphic dark theme with smooth micro-interactions.

## Tech Stack

- **Framework**: Next.js 16 (App Router) & React 19
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma 6
- **Auth**: Supabase Auth (`@supabase/ssr`, `@supabase/supabase-js`)
- **Styling**: Tailwind CSS & Lucide Icons

## API Endpoints (CRUD)

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user account | Public |
| `POST` | `/api/auth/login` | Login and receive session token | Public |
| `POST` | `/api/auth/logout` | Logout and clear session | Authenticated |
| `GET` | `/api/auth/me` | Get current user profile and team memberships | Authenticated |
| `GET` | `/api/teams` | List teams current user belongs to | Authenticated |
| `POST` | `/api/teams` | Create a new team (creator becomes Owner) | Authenticated |
| `GET` | `/api/teams/:id` | Get team details, members, and tasks | Team Member |
| `PUT` | `/api/teams/:id` | Update team details | Team Owner |
| `DELETE` | `/api/teams/:id` | Delete team and cascade tasks | Team Owner |
| `POST` | `/api/teams/:id/members` | Add member to team by email | Team Owner |
| `DELETE` | `/api/teams/:id/members/:userId` | Remove member from team | Team Owner |
| `GET` | `/api/teams/:id/tasks` | List tasks for team (with filters & search) | Team Member |
| `POST` | `/api/teams/:id/tasks` | Create new task within team | Team Member |
| `PUT` | `/api/tasks/:id` | Update task status, priority, assignee, etc. | Team Member |
| `DELETE` | `/api/tasks/:id` | Delete task | Creator, Assignee, or Owner |

## Database Schema (ERD)

```mermaid
erDiagram
    User ||--o{ TeamMember : "has"
    User ||--o{ Task : "assigned to"
    User ||--o{ Task : "created"
    Team ||--o{ TeamMember : "has"
    Team ||--o{ Task : "contains"

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
        String role
        DateTime joinedAt
    }

    Task {
        String id PK
        String title
        String description
        String status
        String priority
        DateTime dueDate
        String teamId FK
        String assigneeId FK
        String creatorId FK
        DateTime createdAt
        DateTime updatedAt
    }
```

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Create a `.env` file containing:
   ```env
   DATABASE_URL="postgresql://postgres.[ref]:[pass]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres.[ref]:[pass]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
   NEXT_PUBLIC_SUPABASE_URL="https://[ref].supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="[your-anon-key]"
   ```

3. **Push Prisma Schema to Database**:
   ```bash
   npx prisma db push
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)
