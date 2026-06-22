# Plan: WebSocket Real-Time Chat & Notifications

## Goal
Implement Socket.io-based real-time chat and notifications for Hiram.
- Transport: Socket.io (backend) + socket.io-client (frontend)
- Chat messages: persisted to PostgreSQL
- Notifications: persisted to PostgreSQL, pushed via socket (replace current 30s polling)

---

## Current State (already done)

- **Notifications** — fully scaffolded and working via REST + 30s polling:
  - `backend/migrations/008_notifications.sql` — DB table exists
  - `backend/src/types/notification.ts`
  - `backend/src/models/notification.model.ts`
  - `backend/src/controllers/notification.controller.ts`
  - `backend/src/routes/notifications.ts` — mounted in `index.ts`
  - `frontend/src/types/notification.ts`
  - `frontend/src/api/notifications.ts`
  - `frontend/src/hooks/useNotifications.ts` — polls every 30s (to be replaced with socket)
- **Chat** — nothing exists yet
- **Socket.io** — not installed on either backend or frontend

---

## Step 1 — Install Socket.io

```bash
# from repo root
npm install socket.io --workspace=backend
npm install socket.io-client --workspace=frontend
npm install @types/socket.io --workspace=backend --save-dev
```

---

## Step 2 — Wire Socket.io to Express

**File: `backend/src/index.ts`**
- Import `http` from Node and `Server` from `socket.io`
- Replace `app.listen(PORT)` with:
  ```ts
  import { createServer } from 'http';
  import { Server } from 'socket.io';

  const httpServer = createServer(app);
  const io = new Server(httpServer, { cors: { origin: '*' } });
  httpServer.listen(PORT, ...);
  ```
- Pass `io` to the socket manager (see below)

**New file: `backend/src/socket.ts`**
- Authenticates each connecting socket via JWT (read token from `auth.token` handshake)
- Tracks `userId → Socket` in a `Map`
- Exports `emitToUser(userId: string, event: string, data: unknown): void`
- Handles `disconnect` to clean up the map

```ts
// rough shape
const userSockets = new Map<string, Socket>();

export function initSocket(io: Server) {
  io.use((socket, next) => {
    // verify JWT from socket.handshake.auth.token
    // attach socket.data.userId
  });

  io.on('connection', (socket) => {
    userSockets.set(socket.data.userId, socket);
    socket.on('disconnect', () => userSockets.delete(socket.data.userId));
  });
}

export function emitToUser(userId: string, event: string, data: unknown) {
  userSockets.get(userId)?.emit(event, data);
}
```

---

## Step 3 — Chat DB + Backend

### Migration: `backend/migrations/009_create_messages.sql`

```sql
CREATE TABLE IF NOT EXISTS conversations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id      UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  borrower_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lister_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (item_id, borrower_id, lister_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  read            BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_conversation_idx ON messages(conversation_id, created_at ASC);
```

### Backend files to create

| File | Purpose |
|------|---------|
| `backend/src/types/message.ts` | `Conversation` and `Message` types |
| `backend/src/models/message.model.ts` | `findOrCreateConversation`, `listConversations`, `getMessages`, `createMessage` |
| `backend/src/controllers/message.controller.ts` | REST handlers |
| `backend/src/routes/messages.ts` | Routes (see below) |

### REST endpoints

```
GET  /api/conversations              — list conversations for current user
GET  /api/conversations/:id/messages — paginated message history
POST /api/conversations              — find or create conversation { itemId, listenerId }
POST /api/conversations/:id/messages — send a message { content }
```

### Socket event on new message

In `message.controller.ts` after `MessageModel.createMessage(...)`:
```ts
import { emitToUser } from '../socket';
emitToUser(recipientId, 'chat:message', newMessage);
```

Mount in `index.ts`:
```ts
import messagesRouter from './routes/messages';
app.use('/api/conversations', messagesRouter);
```

---

## Step 4 — Push Notifications via Socket (replace polling)

**Backend:** Wherever `NotificationModel.create()` is called (request controller, etc.), add:
```ts
import { emitToUser } from '../socket';
// after await NotificationModel.create(...)
emitToUser(recipientId, 'notification', notification);
```

Search for all `NotificationModel.create` calls — currently in:
- `backend/src/controllers/request.controller.ts`

**Frontend:** In `frontend/src/hooks/useNotifications.ts`:
- Remove `refetchInterval: 30_000`
- Add socket listener for `'notification'` event that calls `queryClient.invalidateQueries(['notifications'])`
  (handled via `useSocket` — see Step 5)

---

## Step 5 — Frontend Socket + Chat UI

### New file: `frontend/src/hooks/useSocket.ts`
- Connects to backend with `io(BACKEND_URL, { auth: { token } })` on mount when authenticated
- Disconnects on logout
- Provides `socket` instance via context or direct export
- Registers `'notification'` listener → invalidates `['notifications']` query
- Registers `'chat:message'` listener → appends to conversation query cache

### New types/API/hooks

| File | Purpose |
|------|---------|
| `frontend/src/types/message.ts` | `Conversation` and `Message` types |
| `frontend/src/api/messages.ts` | `getConversations`, `getMessages`, `createConversation`, `sendMessage` |
| `frontend/src/hooks/useMessages.ts` | TanStack Query wrappers for conversations + messages |

### Chat UI

- **`frontend/src/pages/MessagesPage.tsx`** — conversation list (left) + message thread (right)
  - Route: `/messages`
- **`frontend/src/components/ChatDrawer.tsx`** — optional: slide-in drawer version accessible from ItemDetailPage ("Message Lister" button)
- Message bubble: sender on right (you), recipient on left
- Input bar at bottom — calls `sendMessage`, socket pushes reply in real time

### Add route in App router
```tsx
<Route path="/messages" element={<MessagesPage />} />
```

### Add link in Header
- Icon button (chat bubble icon) with unread message count badge, links to `/messages`

---

## Implementation Order

1. Install packages
2. `backend/src/socket.ts` + wire into `index.ts`
3. Migration `009_create_messages.sql` + apply it
4. `message.model.ts` → `message.controller.ts` → `messages.ts` route → mount
5. Emit socket event in message controller
6. Emit socket event in notification creation (request controller)
7. `frontend/src/hooks/useSocket.ts`
8. Update `useNotifications` to drop polling, listen via socket
9. `frontend/src/types/message.ts` + `api/messages.ts` + `useMessages.ts`
10. `MessagesPage.tsx` + `ChatDrawer.tsx`
11. Add `/messages` route + Header icon

---

## Notes

- Socket auth uses the same JWT as REST — verify with `jsonwebtoken.verify` in the socket middleware
- `emitToUser` silently no-ops if the user is not currently connected (they'll get the notification/message on next REST fetch)
- The `conversations` table has a `UNIQUE(item_id, borrower_id, lister_id)` constraint — use `INSERT ... ON CONFLICT DO NOTHING` + `SELECT` to find-or-create safely
- Frontend `BACKEND_URL` for socket: `http://localhost:3001` in dev (not proxied through Vite like REST)