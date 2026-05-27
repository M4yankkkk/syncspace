# SyncSpace - Product Requirements Document (PRD)

**Version:** 1.1

## 1. Product Overview
**SyncSpace** is a synchronous, 2-player productivity platform designed to digitize the experience of "body doubling." By combining real-time task tracking, shared timers, and focused communication, the platform creates an intense, accountability-driven environment for students, developers, and freelancers.

## 2. Target Audience
* **Students:** Needing accountability for late-night study sessions and assignment completion.
* **Developers:** Requiring focused sprint blocks for coding, debugging, or algorithmic challenges.
* **Freelancers/Remote Workers:** Seeking a structured workday substitute with peer accountability.

## 3. Feature Specifications

### 3.1 The Core Workspace ("Shared Desk")
* **Side-by-Side Goal Boards:** A split-screen UI displaying both users' tasks. Real-time sync ensures user A sees user B checking off tasks instantly.
* **Synchronized Pomodoro:** A master timer shared by both users. Pausing requires mutual consent or sends an immediate alert to the partner.
* **Dynamic Presence:** Status indicators reflecting current actions (e.g., "typing...", "reading...", "in deep focus").
* **Brain Dump Zone:** A localized, drag-and-drop scratchpad for sharing links, PDFs, and code snippets quickly.

### 3.2 Accountability Mechanics
* **Strict Mode (Tab Tracking):** If enabled, navigating away from the SyncSpace tab triggers a subtle audio/visual warning to the partner.
* **Shared Streaks:** Gamification where consecutive successful sessions build a shared visual entity (e.g., a plant). Failing a session breaks the streak.
* **2-Minute Debrief:** A mandatory post-session screen requiring users to rate their focus (Red/Yellow/Green) and verify completed tasks before logging off.

### 3.3 Communication
* **Push-to-Talk (PTT) Audio:** WebRTC-powered, low-latency audio that requires holding a button to speak, preventing background noise distraction.
* **Ephemeral Chat:** A text channel that wipes completely upon session completion to keep focus on work rather than conversation history.

### 3.4 Specialized Modes
* **Library Match:** Asynchronous queuing to pair with a random, anonymous partner for a silent study block.
* **Interrogation Mode:** Active recall feature allowing one user to push a flashcard/question to their partner's screen.
* **Sprint/Arena Mode:** Developer-focused mode with webhook integrations (GitHub/LeetCode) for automatic task completion celebrations.

## 4. Technical Stack

| Component | Technology Choice | Justification |
| :--- | :--- | :--- |
| **Frontend** | React.js + Tailwind CSS | Component-based UI, rapid styling for split-screen layouts. |
| **State Management** | Zustand or Redux Toolkit | Efficient handling of complex, rapidly changing session states. |
| **Real-time Engine** | Go (Golang) + WebSockets | High concurrency and low latency for timer sync and presence. |
| **REST API** | Node.js (Express) or Go | Handling user auth, CRUD for tasks, and historical data. |
| **Audio Comm** | WebRTC | Peer-to-peer low latency push-to-talk functionality. |
| **Database (Primary)** | PostgreSQL | Relational integrity for users, friendships, and session history. |
| **In-Memory Store** | Redis | Managing live active session data, fast matchmaking queues. |

## 5. System Architecture
The architecture separates heavy, persistent data from lightweight, real-time sync data to ensure the shared timers and typing indicators remain snappy (sub-100ms latency).

**Data Flow:**
1. **Client (Browser):** Connects via HTTPS to the REST API for initial load and via WSS (Secure WebSockets) to the Go Real-time Server for the session.
2. **Go WebSocket Server:** Maintains the live connection pool. Pushes timer ticks, task updates, and presence changes instantly to the paired client.
3. **Redis:** Acts as the source of truth for active sessions. If the WebSocket server restarts, session state is quickly recovered from Redis.
4. **PostgreSQL:** When a session ends (2-Minute Debrief completed), the Go server/Node API writes the final aggregate data (tasks completed, focus rating) to Postgres for long-term storage.
5. **WebRTC:** Clients establish a direct P2P connection via a signaling server (part of the Go WebSocket service) for voice data.

## 6. Database Schema (PostgreSQL)

### Users
* `id`: UUID (PK)
* `username`: VARCHAR
* `email`: VARCHAR
* `password_hash`: VARCHAR
* `created_at`: TIMESTAMP

### Friendships
* `user_id_1`: UUID (FK)
* `user_id_2`: UUID (FK)
* `status`: ENUM ('pending', 'accepted')
* `shared_streak`: INT

### Sessions
* `id`: UUID (PK)
* `user_1_id`: UUID (FK)
* `user_2_id`: UUID (FK)
* `mode`: ENUM ('study', 'sprint', 'arena')
* `status`: ENUM ('active', 'completed', 'abandoned')
* `duration_minutes`: INT
* `started_at`: TIMESTAMP
* `ended_at`: TIMESTAMP

### Tasks
* `id`: UUID (PK)
* `session_id`: UUID (FK)
* `user_id`: UUID (FK)
* `description`: TEXT
* `is_completed`: BOOLEAN

### Session_Debriefs
* `session_id`: UUID (FK)
* `user_id`: UUID (FK)
* `focus_rating`: ENUM ('red', 'yellow', 'green')
* `notes`: TEXT

## 7. Deployment & Hosting Strategy (Always Free Tier)
To achieve a 24/7, zero-cost deployment, SyncSpace utilizes **Oracle Cloud Infrastructure (OCI)**'s "Always Free" tier, containerized via Docker.

### 7.1 Infrastructure Breakdown
* **Provider:** Oracle Cloud (OCI) Always Free Tier
* **Compute:** Ampere A1 Compute instance (ARM64 architecture)
* **Resources:** Up to 4 OCPUs, 24 GB RAM, 200 GB Block Storage
* **OS:** Ubuntu Linux LTS

### 7.2 Containerization (Docker Compose)
The entire stack is orchestrated using Docker Compose to ensure a reproducible environment:
1. **PostgreSQL Container:** Handles relational data (persistent volume).
2. **Redis Container:** In-memory store for active sessions.
3. **Go Backend Container:** Runs the WebSocket real-time engine and REST API.
4. **Frontend Container:** Nginx serving the compiled React build.

### 7.3 Network & Security
* **Internal Firewall (iptables):** Flushed and configured via `iptables-save` to allow standard web traffic.
* **OCI Security Lists:** Ingress rules configured on the Virtual Cloud Network for:
  * Port 80 (HTTP)
  * Port 443 (HTTPS)
  * Port 8080 (WebSockets/Backend API)
