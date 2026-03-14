# 3. Database Schema

The initial architecture utilized MongoDB, but the data layer has successfully been migrated to **PostgreSQL using Prisma ORM**.

## Core Entities & Models

### `User`
Central nexus identity model. Every core action maps to a User.
- **Key Fields**: `id` UUID, `email`, `password`, `name`, `admissionNumber`, `admissionYear`
- **Enums**:
  - `role`: `USER`, `ADMIN`, `SUPER_ADMIN`
  - `status`: `PENDING`, `ACTIVE`, `SUSPENDED`, `DELETED`
- **Relations**:
  - Posts (`posts`, `postReactions`, `postBookmarks`, `postMentions`)
  - Jobs (`jobsPosted`, `savedJobs`)
  - Mentorship (`mentorshipProfile`, `mentorshipRequestsAsMentee`)
  - Interactions (`connections`, `eventsAttended`, `groupsJoined`)

### `Post` & `Comment` (Social Network Engine)
- **`Post`**:
  - Core feed generator. Links to an `authorId`.
  - Captures `category` (General, Event, Jobs) and specific visibility structures (`PUBLIC`, `ALUMNI_ONLY`).
  - Supports `attachments` (JSON representation) and `sharedPostId` (reposting capability).
- **`Comment`**:
  - Nested, associated tightly to one `Post`.
  - Supports recursive/threaded commentary through a self-relation linking `parentCommentId`.
- **`PostReaction`**:
  - Dedicated table resolving mapping conflicts ensuring 1 User = 1 Reaction limitation per Post using a Compound Unique key (`postId`, `userId`).

### `MentorshipProfile` & `MentorshipRequest` (Career Growth Module)
- **`MentorshipProfile`**:
  - Distinct extended model tied to a `User` allowing one 1-1 strict relationship.
  - Contains detailed fields: `expertise` tags, `yearsOfExperience`, `bio`, `preferredMenteeLevel`, `maxMentees`.
- **`MentorshipRequest`**:
  - Pivot tracking lifecycle of application bridging a mentee (`User`) to a mentor (`MentorshipProfile`). Has tracked a string `status` (pending, accepted, rejected, completed).

### `Job` (Professional Board)
- Professional opportunity tracking model.
- Contains references to compensation `salaryRangeMin/Max`, `tags`, and links natively dynamically to `postedById`.

### `Group`, `GroupMessage`, & `Event` (Community Tools)
- **`Group`**: Clusters of Users (via a pivot) grouped around specific interests. Tracks `privacy` and `category`.
- **`GroupMessage`**: Message pipeline belonging to a `Group` tracking attachments, edit history, and reactions (as JSON).
- **`Event`**: Specific calendaring item bridging time bounds, location (`meetingLink` for virtual vs real mappings), and max user capacities. Links to `User` for an organizer and attendees array.

### `Report` (Moderation Queue)
- Unified flagging mechanism letting Users signal issues natively.
- Dynamically references optional strings representing problematic models (`reportedPostId`, `reportedCommentId`, `reportedUserId`).
- Monitored by `Admin` roles checking status ('pending', updated to resolved).

### `File` (Media Server Storage)
- Records uploads (images, PDFs) referencing native `filename`, `mimetype`, `size`, `url`, and securely mapping an `uploadedById`.

---
## Prisma Migration Highlights (MongoDB to Postgres Differences)
- **Primary Keys**: Evaluated explicitly as UUID Strings utilizing default decorators instead of `ObjectId`.
- **Arrays & Flexibility**: Elements like nested settings configs remain serialized dynamically inside native PostgreSQL `Json` structures (`notificationSettings`, `privacySettings`).
- **Data Integrity**: Deeply enforced using strict Foreign Key guarantees natively dropping elements based off explicit `Cascade` clauses.
