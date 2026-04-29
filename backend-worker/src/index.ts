import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import { cors } from 'hono/cors';
import { verifyPassword, hashPassword, createJWT, verifyJWT } from './lib/auth';
import { toClientRole, toDbRole, parseJSON } from './lib/utils';

interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
  JWT_SECRET: string;
  ENVIRONMENT: string;
}

const app = new Hono<{ Bindings: Env }>();

// Enable CORS with broader support for subdomains
app.use('*', cors({
  origin: (origin) => {
    if (!origin) return null;
    const url = new URL(origin);
    if (url.hostname === 'localhost' || 
        url.hostname.endsWith('.workers.dev') || 
        url.hostname.endsWith('raghavagarwal.com')) {
      return origin;
    }
    return null;
  },
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'x-refresh-token'],
  credentials: true,
}));

// Auth Middleware
const authMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  
  if (!token) return c.json({ success: false, message: 'Unauthorized' }, 401);
  
  const payload = await verifyJWT(token, c.env.JWT_SECRET);
  if (!payload) return c.json({ success: false, message: 'Invalid token' }, 401);
  
  // Normalize role for consistency in route handlers
  if (payload.role) {
    payload.role = toClientRole(payload.role);
  }
  
  c.set('user', payload);
  await next();
};

// --- UTILITIES ---
const transformPost = (p: any) => ({
  ...p,
  tags: parseJSON(p.tags),
  attachments: parseJSON(p.attachments),
  externalLinks: parseJSON(p.external_links),
  createdAt: p.created_at,
  updatedAt: p.updated_at,
  isFeatured: Boolean(p.is_featured),
  isSchoolUpdate: Boolean(p.is_school_update),
  reactionCount: p.likes_count || 0,
  commentCount: p.comments_count || 0,
  shareCount: p.shares_count || 0,
  author: {
    id: p.author_id,
    name: p.author_name,
    profileImage: p.author_image,
    role: toClientRole(p.author_role || 'USER')
  }
});

const transformJob = (j: any) => ({
  ...j,
  requirements: parseJSON(j.requirements),
  benefits: parseJSON(j.benefits),
  tags: parseJSON(j.tags),
  isAlumniReferral: Boolean(j.is_alumni_referral),
  isActive: Boolean(j.is_active),
  applicationCount: j.application_count || 0,
  createdAt: j.created_at,
  updatedAt: j.updated_at,
  postedDate: j.created_at,
  salaryRange: {
    min: j.salary_range_min,
    max: j.salary_range_max,
    currency: j.salary_currency || 'USD'
  }
});

const transformUser = (u: any) => ({
  ...u,
  role: u.role ? toClientRole(u.role) : 'user',
  profileImage: u.profile_image,
  jobTitle: u.job_title,
  classYear: u.class_year,
  graduationYear: u.graduation_year,
  firstName: u.first_name,
  lastName: u.last_name,
  isVerified: Boolean(u.is_verified),
  isAvailableAsMentor: Boolean(u.is_available_as_mentor),
  admissionNumber: u.admission_number,
  admissionYear: u.admission_year,
  accountType: u.account_type,
  contactEmail: u.contact_email,
  contactPhone: u.contact_phone,
  linkedinProfile: u.linkedin_profile,
  hasPremiumBadge: Boolean(u.has_premium_badge),
  needsManualVerification: Boolean(u.needs_manual_verification),
  verificationDetails: u.verification_details,
  facultyIdCardUrl: u.faculty_id_card_url,
  skills: parseJSON(u.skills),
  interests: parseJSON(u.interests),
  experiences: parseJSON(u.experiences),
  educations: parseJSON(u.educations),
  notificationSettings: parseJSON(u.notification_settings),
  privacySettings: parseJSON(u.privacy_settings),
  createdAt: u.created_at,
  updatedAt: u.updated_at
});

const transformNotification = (n: any) => ({
  ...n,
  isSeen: Boolean(n.is_seen),
  metadata: parseJSON(n.metadata),
  createdAt: n.created_at,
  updatedAt: n.updated_at
});

const transformEvent = (e: any) => ({
  ...e,
  tags: parseJSON(e.tags),
  isVirtual: Boolean(e.is_virtual),
  isSchoolEvent: Boolean(e.is_school_event),
  attendeeCount: e.attendees_count || 0,
  organizer: { id: e.organizer_id },
  createdAt: e.created_at,
  updatedAt: e.updated_at
});

const transformGroup = (g: any) => ({
  ...g,
  memberCount: g.member_count || 0,
  lastActivity: g.last_activity,
  createdAt: g.created_at,
  updatedAt: g.updated_at
});

const transformComment = (c: any) => ({
  ...c,
  author: {
    id: c.author_id,
    name: c.author_name,
    profileImage: c.author_image,
    role: toClientRole(c.author_role || 'USER')
  },
  createdAt: c.created_at,
  updatedAt: c.updated_at
});

const transformGroupMessage = (m: any) => ({
  ...m,
  attachments: parseJSON(m.attachments),
  reactions: parseJSON(m.reactions),
  author: {
    id: m.author_id,
    name: m.author_name,
    profileImage: m.author_image,
    role: toClientRole(m.author_role || 'USER')
  },
  createdAt: m.created_at
});

// --- API ROUTES ---
const api = new Hono<{ Bindings: Env }>();

// Documentation
const getDocs = (c: any) => c.json({
  success: true,
  name: "MPSAJMER CONNECT API",
  version: "1.0.0",
  endpoints: {
    auth: ["/auth/login", "/auth/register", "/auth/me"],
    posts: ["/posts", "/posts/feed"],
    jobs: ["/jobs"],
    events: ["/events"],
    mentorship: ["/mentorship/mentors", "/mentorship/profile"],
    notifications: ["/notifications"],
    users: ["/users/directory", "/users/:id"],
    files: ["/uploads", "/files/:key"]
  }
});

api.get('/docs', getDocs);
api.get('/v1/docs', getDocs);

// Auth
api.post('/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    console.log(`Attempting login for: ${email}`);

    const user: any = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();

    if (!user) {
      return c.json({ success: false, message: 'Invalid credentials' }, 401);
    }

    const isMatch = await verifyPassword(password, user.password);
    if (!isMatch) {
      return c.json({ success: false, message: 'Invalid credentials' }, 401);
    }

    // Upgrade plaintext password to Bcrypt if necessary
    if (!user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
      const hashed = await hashPassword(password);
      await c.env.DB.prepare('UPDATE users SET password = ? WHERE id = ?').bind(hashed, user.id).run();
    }

    const token = await createJWT(user.id, user.email, user.role, c.env.JWT_SECRET);
    
    return c.json({
      success: true,
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: toClientRole(user.role),
        status: user.status,
        profileImage: user.profile_image
      }
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

api.get('/auth/me', authMiddleware, async (c) => {
  const userPayload = c.get('user');
  const user: any = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userPayload.id).first();
  
  if (!user) return c.json({ success: false, message: 'User not found' }, 404);

  const transformed = transformUser(user);
  return c.json({
    success: true,
    user: transformed,
    data: transformed
  });
});

api.get('/auth/sessions', authMiddleware, async (c) => {
  const user = c.get('user');
  // Since we don't have a sessions table yet, return current session as a placeholder
  return c.json({
    success: true,
    data: [
      {
        id: 'current',
        userAgent: c.req.header('User-Agent') || 'Unknown',
        ipAddress: c.req.header('CF-Connecting-IP') || '127.0.0.1',
        lastActive: new Date().toISOString(),
        isCurrent: true
      }
    ]
  });
});

// Posts
api.get('/posts', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '10');
  const offset = (page - 1) * limit;

  const result = await c.env.DB.prepare(`
    SELECT p.*, u.name as author_name, u.profile_image as author_image, u.role as author_role
    FROM posts p 
    JOIN users u ON p.author_id = u.id 
    ORDER BY p.created_at DESC 
    LIMIT ? OFFSET ?
  `).bind(limit, offset).all();

  const posts = result.results.map(transformPost);
  return c.json({ success: true, posts, data: posts, total: 100 });
});

api.get('/posts/featured', async (c) => {
  const result = await c.env.DB.prepare(`
    SELECT p.*, u.name as author_name, u.profile_image as author_image, u.role as author_role
    FROM posts p 
    JOIN users u ON p.author_id = u.id 
    WHERE p.is_featured = 1 OR p.category = 'announcements'
    ORDER BY p.created_at DESC 
    LIMIT 3
  `).all();

  const posts = result.results.map(transformPost);
  return c.json({ success: true, posts, data: posts });
});

api.get('/posts/school-updates', async (c) => {
  const result = await c.env.DB.prepare(`
    SELECT p.*, u.name as author_name, u.profile_image as author_image, u.role as author_role
    FROM posts p 
    JOIN users u ON p.author_id = u.id 
    WHERE p.is_school_update = 1 OR p.category = 'school'
    ORDER BY p.created_at DESC 
    LIMIT 5
  `).all();

  const posts = result.results.map(transformPost);
  return c.json({ success: true, posts, data: posts });
});

api.get('/posts/feed', async (c) => {
  const result = await c.env.DB.prepare(`
    SELECT p.*, u.name as author_name, u.profile_image as author_image, u.role as author_role
    FROM posts p 
    JOIN users u ON p.author_id = u.id 
    ORDER BY p.created_at DESC 
    LIMIT 20
  `).all();
  
  const posts = result.results.map(transformPost);
  return c.json({ success: true, posts, data: posts });
});

api.get('/posts/feed', authMiddleware, async (c) => {
  // For now, return all posts as feed
  const result = await c.env.DB.prepare(`
    SELECT p.*, u.name as author_name, u.profile_image as author_image, u.role as author_role
    FROM posts p 
    JOIN users u ON p.author_id = u.id 
    ORDER BY p.created_at DESC
  `).all();
  
  const posts = result.results.map(transformPost);
  return c.json({ success: true, posts, data: posts });
});

api.get('/posts/bookmarked', authMiddleware, async (c) => {
  const user = c.get('user');
  const result = await c.env.DB.prepare(`
    SELECT p.*, u.name as author_name, u.profile_image as author_image, u.role as author_role
    FROM posts p 
    JOIN users u ON p.author_id = u.id 
    JOIN bookmarked_posts bp ON p.id = bp.post_id
    WHERE bp.user_id = ?
    ORDER BY p.created_at DESC
  `).bind(user.id).all();
  
  const posts = result.results.map(transformPost);
  return c.json({ success: true, posts, data: posts });
});

api.post('/posts', authMiddleware, async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const id = crypto.randomUUID();
  
  await c.env.DB.prepare(`
    INSERT INTO posts (id, title, content, author_id, category, tags, visibility) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, 
    body.title || '', 
    body.content, 
    user.id, 
    body.category || 'general', 
    JSON.stringify(body.tags || []),
    body.visibility || 'public'
  ).run();

  return c.json({ success: true, data: { id, ...body } });
});

api.post('/posts/:id/react', authMiddleware, async (c) => {
  const user = c.get('user');
  const postId = c.req.param('id');
  const { reactionType } = await c.req.json();
  
  const id = crypto.randomUUID();
  try {
    const result = await c.env.DB.prepare(`
      INSERT INTO post_reactions (id, post_id, user_id, type)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(post_id, user_id) DO UPDATE SET type = excluded.type
    `).bind(id, postId, user.id, reactionType || 'like').run();
    
    if (result.meta.changes > 0) {
       await c.env.DB.prepare('UPDATE posts SET likes_count = (SELECT COUNT(*) FROM post_reactions WHERE post_id = ?) WHERE id = ?')
         .bind(postId, postId).run();
    }
    
    // Fetch updated post to return to client
    const updatedPost: any = await c.env.DB.prepare(`
      SELECT p.*, u.name as author_name, u.profile_image as author_image, u.role as author_role
      FROM posts p 
      JOIN users u ON p.author_id = u.id 
      WHERE p.id = ?
    `).bind(postId).first();

    return c.json({ 
      success: true, 
      post: transformPost(updatedPost),
      data: transformPost(updatedPost)
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

api.post('/posts/:id/bookmark', authMiddleware, async (c) => {
  const user = c.get('user');
  const postId = c.req.param('id');
  
  try {
    await c.env.DB.prepare(`
      INSERT INTO bookmarked_posts (post_id, user_id)
      VALUES (?, ?)
      ON CONFLICT(post_id, user_id) DO NOTHING
    `).bind(postId, user.id).run();
    
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

api.delete('/posts/:id/bookmark', authMiddleware, async (c) => {
  const user = c.get('user');
  const postId = c.req.param('id');
  
  await c.env.DB.prepare('DELETE FROM bookmarked_posts WHERE post_id = ? AND user_id = ?')
    .bind(postId, user.id).run();
    
  return c.json({ success: true });
});

api.get('/posts/:id/comments', async (c) => {
  const postId = c.req.param('id');
  const result = await c.env.DB.prepare(`
    SELECT c.*, u.name as author_name, u.profile_image as author_image, u.role as author_role
    FROM comments c
    JOIN users u ON c.author_id = u.id
    WHERE c.post_id = ?
    ORDER BY c.created_at ASC
  `).bind(postId).all();
  
  const comments = result.results.map(transformComment);
  return c.json({ success: true, data: comments });
});
api.post('/posts/:id/comments', authMiddleware, async (c) => {
  const user = c.get('user');
  const postId = c.req.param('id');
  const { content } = await c.req.json();
  
  const id = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO comments (id, post_id, author_id, content)
    VALUES (?, ?, ?, ?)
  `).bind(id, postId, user.id, content).run();
  
  await c.env.DB.prepare('UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?')
    .bind(postId).run();
    
  // Return the newly created comment with author info
  const comment: any = await c.env.DB.prepare(`
    SELECT c.*, u.name as author_name, u.profile_image as author_image, u.role as author_role
    FROM comments c
    JOIN users u ON c.author_id = u.id
    WHERE c.id = ?
  `).bind(id).first();
  
  return c.json({ success: true, data: transformComment(comment) });
});

api.post('/posts/:id/share', authMiddleware, async (c) => {
  const user = c.get('user');
  const postId = c.req.param('id');
  
  // Logic for sharing (e.g., increment share count, create notification)
  await c.env.DB.prepare('UPDATE posts SET shares_count = shares_count + 1 WHERE id = ?')
    .bind(postId).run();
    
  return c.json({ success: true });
});
api.get('/jobs', async (c) => {
  const result = await c.env.DB.prepare('SELECT * FROM jobs WHERE is_active = 1 ORDER BY created_at DESC').all();
  const jobs = result.results.map(transformJob);
  return c.json({ success: true, jobs, data: jobs });
});

api.post('/jobs', authMiddleware, async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const id = crypto.randomUUID();

  await c.env.DB.prepare(`
    INSERT INTO jobs (id, title, company, location, type, salary_range_min, salary_range_max, description, posted_by_id, posted_by_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, body.title, body.company, body.location, body.type, 
    body.salaryRangeMin || 0, body.salaryRangeMax || 0,
    body.description, user.id, body.name || 'Admin'
  ).run();

  return c.json({ success: true, data: { id, ...body } });
});

// Events
api.get('/events', async (c) => {
  const result = await c.env.DB.prepare('SELECT * FROM events ORDER BY date ASC').all();
  const events = await Promise.all(result.results.map(async (e: any) => {
    const attendees = await c.env.DB.prepare('SELECT user_id as id FROM event_attendees WHERE event_id = ?').bind(e.id).all();
    return {
      ...transformEvent(e),
      attendees: attendees.results
    };
  }));
  return c.json({ success: true, data: events });
});

api.get('/events/my-events', authMiddleware, async (c) => {
  const user = c.get('user');
  const result = await c.env.DB.prepare(`
    SELECT e.* FROM events e 
    WHERE e.organizer_id = ? 
    OR e.id IN (SELECT event_id FROM event_attendees WHERE user_id = ?)
    ORDER BY e.date ASC
  `).bind(user.id, user.id).all();
  
  const events = await Promise.all(result.results.map(async (e: any) => {
    const attendees = await c.env.DB.prepare('SELECT user_id as id FROM event_attendees WHERE event_id = ?').bind(e.id).all();
    return {
      ...transformEvent(e),
      attendees: attendees.results
    };
  }));
  
  return c.json({ success: true, data: events });
});

api.post('/events', authMiddleware, async (c) => {
  const user = c.get('user');
  try {
    const body = await c.req.json();
    const id = crypto.randomUUID();
    
    await c.env.DB.prepare(`
      INSERT INTO events (id, title, description, date, end_date, time, location, category, is_virtual, meeting_link, max_attendees, organizer_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, 
      body.title, 
      body.description, 
      body.date, 
      body.endDate || null,
      body.time, 
      body.location, 
      body.category || 'other', 
      body.isVirtual ? 1 : 0, 
      body.meetingLink || null,
      body.maxAttendees || null, 
      user.id
    ).run();
    
    return c.json({ success: true, data: { id, ...body } });
  } catch (error: any) {
    console.error('Event creation failed:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

api.get('/events/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const user = c.get('user');
  const event: any = await c.env.DB.prepare(`
    SELECT e.*, 
    (SELECT COUNT(*) FROM event_attendees WHERE event_id = e.id AND user_id = ?) as is_attending
    FROM events e WHERE e.id = ?
  `).bind(user.id, id).first();
  
  if (!event) return c.json({ success: false, message: 'Event not found' }, 404);
  
  const attendees = await c.env.DB.prepare('SELECT user_id as id FROM event_attendees WHERE event_id = ?').bind(id).all();
  
  return c.json({ 
    success: true, 
    data: { 
      ...transformEvent(event),
      isAttending: Boolean(event.is_attending),
      attendees: attendees.results
    } 
  });
});

api.get('/events/:id/attendees', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const result = await c.env.DB.prepare(`
    SELECT u.id, u.name, u.email, u.contact_phone as phone, u.admission_number as admissionNumber
    FROM users u
    JOIN event_attendees ea ON u.id = ea.user_id
    WHERE ea.event_id = ?
  `).bind(id).all();
  
  return c.json({ success: true, data: result.results });
});

api.post('/events/:id/rsvp', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  
  try {
    await c.env.DB.prepare('INSERT INTO event_attendees (event_id, user_id) VALUES (?, ?)')
      .bind(id, user.id).run();
    await c.env.DB.prepare('UPDATE events SET attendees_count = attendees_count + 1 WHERE id = ?')
      .bind(id).run();
    return c.json({ success: true });
  } catch (error: any) {
    if (error.message.includes('UNIQUE')) return c.json({ success: true, message: 'Already attending' });
    return c.json({ success: false, message: error.message }, 500);
  }
});

api.delete('/events/:id/rsvp', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  
  await c.env.DB.prepare('DELETE FROM event_attendees WHERE event_id = ? AND user_id = ?')
    .bind(id, user.id).run();
  await c.env.DB.prepare('UPDATE events SET attendees_count = attendees_count - 1 WHERE id = ?')
    .bind(id).run();
    
  return c.json({ success: true });
});

// Groups
api.get('/groups', authMiddleware, async (c) => {
  const user = c.get('user');
  const result = await c.env.DB.prepare(`
    SELECT g.*, 
    (SELECT COUNT(*) FROM group_members WHERE group_id = g.id AND user_id = ?) as is_member,
    (SELECT GROUP_CONCAT(user_id) FROM group_members WHERE group_id = g.id) as member_ids
    FROM groups g 
    ORDER BY last_activity DESC
  `).bind(user.id).all();
  
  const groups = result.results.map(g => ({
    ...transformGroup(g),
    isMember: Boolean(g.is_member),
    members: (g.member_ids as string || '').split(',').filter(Boolean)
  }));
  return c.json({ success: true, data: groups });
});

api.get('/groups/user', authMiddleware, async (c) => {
  const user = c.get('user');
  const result = await c.env.DB.prepare(`
    SELECT g.*, 1 as is_member,
    (SELECT GROUP_CONCAT(user_id) FROM group_members WHERE group_id = g.id) as member_ids
    FROM groups g
    JOIN group_members gm ON g.id = gm.group_id
    WHERE gm.user_id = ?
    ORDER BY g.last_activity DESC
  `).bind(user.id).all();
  
  const groups = result.results.map(g => ({
    ...transformGroup(g),
    isMember: true,
    members: (g.member_ids as string || '').split(',').filter(Boolean)
  }));
  return c.json({ success: true, data: groups });
});

api.post('/groups', authMiddleware, async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const id = crypto.randomUUID();
  
  await c.env.DB.prepare(`
    INSERT INTO groups (id, name, description, creator_id, category, privacy, member_count)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `).bind(id, body.name, body.description, user.id, body.category || 'general', body.privacy || 'public').run();

  // Also add creator as member
  await c.env.DB.prepare('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)').bind(id, user.id).run();
  
  return c.json({ success: true, data: { id, ...body } });
});

api.put('/groups/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = await c.req.json();
  
  const group: any = await c.env.DB.prepare('SELECT creator_id FROM groups WHERE id = ?').bind(id).first();
  if (!group) return c.json({ success: false, message: 'Group not found' }, 404);
  
  if (group.creator_id !== user.id && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    return c.json({ success: false, message: 'Unauthorized' }, 403);
  }
  
  await c.env.DB.prepare(`
    UPDATE groups SET name = ?, description = ?, category = ?, privacy = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(body.name, body.description, body.category, body.privacy, id).run();
  
  return c.json({ success: true });
});

api.get('/groups/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const group: any = await c.env.DB.prepare(`
    SELECT g.*, 
    (SELECT COUNT(*) FROM group_members WHERE group_id = g.id AND user_id = ?) as is_member,
    (SELECT GROUP_CONCAT(user_id) FROM group_members WHERE group_id = g.id) as member_ids
    FROM groups g 
    WHERE g.id = ?
  `).bind(user.id, id).first();
  
  if (!group) return c.json({ success: false, message: 'Group not found' }, 404);
  
  const transformed = {
    ...transformGroup(group),
    isMember: Boolean(group.is_member),
    members: (group.member_ids as string || '').split(',').filter(Boolean)
  };
  
  return c.json({ success: true, data: transformed });
});

api.get('/groups/:id/messages', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const result = await c.env.DB.prepare(`
    SELECT gm.*, u.name as author_name, u.profile_image as author_image, u.role as author_role
    FROM group_messages gm
    JOIN users u ON gm.author_id = u.id
    WHERE gm.group_id = ?
    ORDER BY gm.created_at ASC
  `).bind(id).all();
  
  const messages = result.results.map(transformGroupMessage);
  return c.json({ success: true, data: messages });
});

api.post('/groups/:id/messages', authMiddleware, async (c) => {
  const user = c.get('user');
  const groupId = c.req.param('id');
  const body = await c.req.json();
  const id = crypto.randomUUID();
  
  await c.env.DB.prepare(`
    INSERT INTO group_messages (id, group_id, author_id, content)
    VALUES (?, ?, ?, ?)
  `).bind(id, groupId, user.id, body.content).run();
  
  return c.json({ success: true, data: { id, ...body } });
});

api.post('/groups/:id/join', authMiddleware, async (c) => {
  const user = c.get('user');
  const groupId = c.req.param('id');
  
  const group: any = await c.env.DB.prepare('SELECT name, privacy FROM groups WHERE id = ?').bind(groupId).first();
  if (!group) return c.json({ success: false, message: 'Group not found' }, 404);
  
  if (group.privacy === 'private') {
    const id = crypto.randomUUID();
    try {
      await c.env.DB.prepare('INSERT INTO group_join_requests (id, group_id, requester_id) VALUES (?, ?, ?)')
        .bind(id, groupId, user.id).run();
      return c.json({ success: true, message: 'Join request sent' });
    } catch (error: any) {
      if (error.message.includes('UNIQUE')) {
        return c.json({ success: true, message: 'Request already pending' });
      }
      return c.json({ success: false, message: error.message }, 500);
    }
  }
  
  try {
    const result = await c.env.DB.prepare('INSERT OR IGNORE INTO group_members (group_id, user_id) VALUES (?, ?)')
      .bind(groupId, user.id).run();
    
    if (result.meta.changes > 0) {
      // Only update member count if they actually joined now
      await c.env.DB.prepare('UPDATE groups SET member_count = member_count + 1 WHERE id = ?')
        .bind(groupId).run();
    }
      
    return c.json({ success: true, message: result.meta.changes > 0 ? 'Joined' : 'Already a member' });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

api.post('/groups/:id/leave', authMiddleware, async (c) => {
  const user = c.get('user');
  const groupId = c.req.param('id');
  
  await c.env.DB.prepare('DELETE FROM group_members WHERE group_id = ? AND user_id = ?')
    .bind(groupId, user.id).run();
  
  await c.env.DB.prepare('UPDATE groups SET member_count = member_count - 1 WHERE id = ?')
    .bind(groupId).run();
    
  return c.json({ success: true });
});

api.get('/groups/:id/join-requests', authMiddleware, async (c) => {
  const user = c.get('user');
  const groupId = c.req.param('id');
  
  const group: any = await c.env.DB.prepare('SELECT creator_id FROM groups WHERE id = ?').bind(groupId).first();
  if (!group) return c.json({ success: false, message: 'Group not found' }, 404);
  
  if (group.creator_id !== user.id && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    return c.json({ success: false, message: 'Unauthorized' }, 403);
  }
  
  const result = await c.env.DB.prepare(`
    SELECT gjr.*, u.name as requester_name, u.email as requester_email, u.profile_image as requester_image
    FROM group_join_requests gjr
    JOIN users u ON gjr.requester_id = u.id
    WHERE gjr.group_id = ? AND gjr.status = 'pending'
  `).bind(groupId).all();
  
  const requests = result.results.map(r => ({
    id: r.id,
    status: r.status,
    createdAt: r.created_at,
    requester: {
      id: r.requester_id,
      name: r.requester_name,
      email: r.requester_email,
      profileImage: r.requester_image
    }
  }));
  
  return c.json({ success: true, data: requests });
});

api.patch('/groups/:id/join-requests/:requestId/respond', authMiddleware, async (c) => {
  const user = c.get('user');
  const groupId = c.req.param('id');
  const requestId = c.req.param('requestId');
  const { action } = await c.req.json();
  
  const group: any = await c.env.DB.prepare('SELECT creator_id FROM groups WHERE id = ?').bind(groupId).first();
  if (!group) return c.json({ success: false, message: 'Group not found' }, 404);
  
  if (group.creator_id !== user.id && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    return c.json({ success: false, message: 'Unauthorized' }, 403);
  }
  
  const request: any = await c.env.DB.prepare('SELECT requester_id FROM group_join_requests WHERE id = ?').bind(requestId).first();
  if (!request) return c.json({ success: false, message: 'Request not found' }, 404);
  
  if (action === 'approve') {
    await c.env.DB.prepare('UPDATE group_join_requests SET status = "approved", reviewed_by_id = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(user.id, requestId).run();
      
    await c.env.DB.prepare('INSERT OR IGNORE INTO group_members (group_id, user_id) VALUES (?, ?)')
      .bind(groupId, request.requester_id).run();
      
    await c.env.DB.prepare('UPDATE groups SET member_count = member_count + 1 WHERE id = ?')
      .bind(groupId).run();
  } else {
    await c.env.DB.prepare('UPDATE group_join_requests SET status = "rejected", reviewed_by_id = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(user.id, requestId).run();
  }
  
  return c.json({ success: true });
});

api.post('/groups/:id/invite', authMiddleware, async (c) => {
  const user = c.get('user');
  const groupId = c.req.param('id');
  const { userId } = await c.req.json();
  
  // Create a notification for the invited user
  const group: any = await c.env.DB.prepare('SELECT name FROM groups WHERE id = ?').bind(groupId).first();
  
  const notifId = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type, action_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    notifId, 
    userId, 
    'Group Invitation', 
    `${user.name} invited you to join the group "${group.name}".`,
    'group_invite',
    `/groups?join=${groupId}`
  ).run();
  
  return c.json({ success: true, message: 'Invitation sent' });
});

api.get('/groups/:id/invitable-users', authMiddleware, async (c) => {
  const groupId = c.req.param('id');
  const query = c.req.query('query') || '';
  
  const result = await c.env.DB.prepare(`
    SELECT id, name, email, profile_image, city, country, company, job_title
    FROM users
    WHERE id NOT IN (SELECT user_id FROM group_members WHERE group_id = ?)
    AND (name LIKE ? OR email LIKE ?)
    LIMIT 25
  `).bind(groupId, `%${query}%`, `%${query}%`).all();
  
  return c.json({ success: true, data: result.results });
});

// Admin/Management placeholder
api.get('/admin/stats', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    return c.json({ success: false, message: 'Unauthorized' }, 403);
  }
  
  const userCount: any = await c.env.DB.prepare('SELECT COUNT(*) as count FROM users').first();
  const postCount: any = await c.env.DB.prepare('SELECT COUNT(*) as count FROM posts').first();
  const jobCount: any = await c.env.DB.prepare('SELECT COUNT(*) as count FROM jobs').first();
  
  return c.json({
    success: true,
    data: {
      users: userCount.count,
      posts: postCount.count,
      jobs: jobCount.count
    }
  });
});

// Mentorship
api.get('/mentorship/mentors', async (c) => {
  const query = c.req.query('query') || '';
  const expertise = c.req.query('expertise');
  
  let sql = `
    SELECT mp.*, u.name, u.email, u.profile_image, u.job_title, u.company
    FROM mentorship_profiles mp
    JOIN users u ON mp.user_id = u.id
    WHERE mp.is_active = 1
  `;
  
  const params: any[] = [];
  if (query) {
    sql += ` AND (u.name LIKE ? OR mp.expertise LIKE ?)`;
    params.push(`%${query}%`, `%${query}%`);
  }
  
  const result = await c.env.DB.prepare(sql).bind(...params).all();
  
  const mentors = result.results.map((m: any) => ({
    ...m,
    expertise: parseJSON(m.expertise),
    availability: parseJSON(m.availability),
    user: {
      id: m.user_id,
      name: m.name,
      email: m.email,
      profileImage: m.profile_image,
      jobTitle: m.job_title,
      company: m.company
    }
  }));
  
  return c.json({ success: true, data: mentors });
});

api.get('/mentorship/profile', authMiddleware, async (c) => {
  const user = c.get('user');
  const profile = await c.env.DB.prepare('SELECT * FROM mentorship_profiles WHERE user_id = ?').bind(user.id).first();
  
  if (!profile) return c.json({ success: false, message: 'Profile not found' }, 404);
  
  return c.json({ 
    success: true, 
    data: {
      ...profile,
      expertise: parseJSON(profile.expertise),
      availability: parseJSON(profile.availability)
    } 
  });
});

api.post('/mentorship/become-mentor', authMiddleware, async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const id = crypto.randomUUID();
  
  await c.env.DB.prepare(`
    INSERT INTO mentorship_profiles (id, user_id, bio, expertise, availability)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      bio = excluded.bio,
      expertise = excluded.expertise,
      availability = excluded.availability,
      updated_at = CURRENT_TIMESTAMP
  `).bind(
    id, 
    user.id, 
    body.bio, 
    JSON.stringify(body.expertise || []), 
    JSON.stringify(body.availability || {})
  ).run();
  
  return c.json({ success: true });
});

api.post('/mentorship/request/:mentorId', authMiddleware, async (c) => {
  const user = c.get('user');
  const mentorId = c.req.param('mentorId');
  const { message } = await c.req.json();
  
  const mentorProfile: any = await c.env.DB.prepare('SELECT id FROM mentorship_profiles WHERE user_id = ?').bind(mentorId).first();
  if (!mentorProfile) return c.json({ success: false, message: 'Mentor not found' }, 404);
  
  const id = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO mentorship_requests (id, mentee_id, mentor_profile_id, message)
    VALUES (?, ?, ?, ?)
  `).bind(id, user.id, mentorProfile.id, message).run();
  
  return c.json({ success: true });
});

// Conversations
api.get('/conversations', authMiddleware, async (c) => {
  const user = c.get('user');
  
  // Basic conversation list: people you've messaged
  const result = await c.env.DB.prepare(`
    SELECT DISTINCT u.id, u.name, u.profile_image, u.role,
    (SELECT content FROM direct_messages 
     WHERE (sender_id = u.id AND receiver_id = ?) OR (sender_id = ? AND receiver_id = u.id)
     ORDER BY created_at DESC LIMIT 1) as last_message,
    (SELECT created_at FROM direct_messages 
     WHERE (sender_id = u.id AND receiver_id = ?) OR (sender_id = ? AND receiver_id = u.id)
     ORDER BY created_at DESC LIMIT 1) as last_activity
    FROM users u
    JOIN direct_messages dm ON (u.id = dm.sender_id OR u.id = dm.receiver_id)
    WHERE (dm.sender_id = ? OR dm.receiver_id = ?) AND u.id != ?
    ORDER BY last_activity DESC
  `).bind(user.id, user.id, user.id, user.id, user.id, user.id, user.id).all();
  
  const conversations = result.results.map(u => ({
    id: u.id,
    name: u.name,
    profileImage: u.profile_image,
    role: toClientRole(u.role || 'USER'),
    lastMessage: u.last_message,
    lastActivity: u.last_activity
  }));
  
  return c.json({ success: true, data: conversations });
});

// Notifications
api.get('/notifications', authMiddleware, async (c) => {
  const user = c.get('user');
  const result = await c.env.DB.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').bind(user.id).all();
  const notifications = result.results.map(transformNotification);
  return c.json({ success: true, data: notifications });
});

api.get('/users/directory', authMiddleware, async (c) => {
  const limit = parseInt(c.req.query('limit') || '100');
  const search = c.req.query('search') || '';
  
  let sql = `SELECT * FROM users WHERE (status = 'ACTIVE' OR status = 'APPROVED')`;
  const params: any[] = [];
  
  if (search) {
    sql += ` AND (name LIKE ? OR email LIKE ? OR job_title LIKE ? OR company LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }
  
  sql += ` LIMIT ?`;
  params.push(limit);
  
  const result = await c.env.DB.prepare(sql).bind(...params).all();
  const users = result.results.map(transformUser);
  
  return c.json({ success: true, data: users, users });
});

api.get('/users/messages/search', authMiddleware, async (c) => {
  const query = c.req.query('query') || '';
  const limit = parseInt(c.req.query('limit') || '25');
  const user = c.get('user');

  const result = await c.env.DB.prepare(`
    SELECT id, name, email, profile_image, role
    FROM users
    WHERE id != ? AND (name LIKE ? OR email LIKE ?)
    LIMIT ?
  `).bind(user.id, `%${query}%`, `%${query}%`, limit).all();

  const users = result.results.map(u => ({
    ...u,
    role: toClientRole(u.role || 'USER')
  }));

  return c.json({ success: true, data: users, users });
});

api.get('/users', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin' && user.role !== 'super_admin') {
    return c.json({ success: false, message: 'Unauthorized' }, 403);
  }

  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '10');
  const offset = (page - 1) * limit;

  const result = await c.env.DB.prepare(`
    SELECT * FROM users 
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
  `).bind(limit, offset).all();

  const countResult: any = await c.env.DB.prepare('SELECT COUNT(*) as count FROM users').first();

  return c.json({
    success: true,
    data: result.results.map(transformUser),
    users: result.results.map(transformUser),
    pagination: {
      page,
      limit,
      total: countResult.count,
      pages: Math.ceil(countResult.count / limit)
    }
  });
});

api.get('/users/pending', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin' && user.role !== 'super_admin') {
    return c.json({ success: false, message: 'Unauthorized' }, 403);
  }

  const result = await c.env.DB.prepare(`
    SELECT * FROM users 
    WHERE status = 'PENDING' 
    ORDER BY created_at DESC
  `).all();

  return c.json({
    success: true,
    data: result.results.map(transformUser),
    users: result.results.map(transformUser)
  });
});

api.get('/users/stats', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin' && user.role !== 'super_admin') {
    return c.json({ success: false, message: 'Unauthorized' }, 403);
  }

  const userStats: any = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'ACTIVE' OR status = 'APPROVED' THEN 1 ELSE 0 END) as active,
      SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'SUSPENDED' THEN 1 ELSE 0 END) as suspended,
      SUM(CASE WHEN role = 'MODERATOR' THEN 1 ELSE 0 END) as moderator,
      SUM(CASE WHEN role = 'ADMIN' THEN 1 ELSE 0 END) as admin,
      SUM(CASE WHEN role = 'SUPER_ADMIN' THEN 1 ELSE 0 END) as super_admin,
      SUM(CASE WHEN created_at >= date('now', '-30 days') THEN 1 ELSE 0 END) as recent
    FROM users
  `).first();

  const counts: any = await c.env.DB.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM jobs) as jobs,
      (SELECT COUNT(*) FROM groups) as groups,
      (SELECT COUNT(*) FROM posts) as posts
  `).first();
  
  const stats = {
    totalUsers: userStats.total || 0,
    activeUsers: userStats.active || 0,
    pendingUsers: userStats.pending || 0,
    suspendedUsers: userStats.suspended || 0,
    moderatorUsers: userStats.moderator || 0,
    adminUsers: userStats.admin || 0,
    superAdminUsers: userStats.super_admin || 0,
    recentRegistrations: userStats.recent || 0,
    totalJobs: counts.jobs || 0,
    totalGroups: counts.groups || 0,
    totalPosts: counts.posts || 0
  };

  return c.json({
    success: true,
    data: stats,
    stats: stats
  });
});

api.get('/reports', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin' && user.role !== 'super_admin') {
    return c.json({ success: false, message: 'Unauthorized' }, 403);
  }

  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = (page - 1) * limit;

  const result = await c.env.DB.prepare(`
    SELECT r.*, u.name as reporter_name
    FROM reports r
    JOIN users u ON r.reported_by_id = u.id
    ORDER BY r.created_at DESC
    LIMIT ? OFFSET ?
  `).bind(limit, offset).all();

  return c.json({
    success: true,
    data: result.results,
    reports: result.results
  });
});

api.patch('/users/:id/edit', authMiddleware, async (c) => {
  const admin = c.get('user');
  if (admin.role !== 'admin' && admin.role !== 'super_admin') {
    return c.json({ success: false, message: 'Unauthorized' }, 403);
  }

  const id = c.req.param('id');
  const body = await c.req.json();
  
  // Prepare update query
  const updates: string[] = [];
  const params: any[] = [];
  
  const fieldMap: Record<string, string> = {
    email: 'email',
    name: 'name',
    firstName: 'first_name',
    lastName: 'last_name',
    role: 'role',
    status: 'status',
    accountType: 'account_type',
    admissionNumber: 'admission_number',
    admissionYear: 'admission_year',
    contactEmail: 'contact_email',
    contactPhone: 'contact_phone',
    city: 'city',
    country: 'country',
    company: 'company',
    jobTitle: 'job_title',
    location: 'location',
    bio: 'bio',
    headline: 'headline',
    linkedinProfile: 'linkedin_profile',
    isAvailableAsMentor: 'is_available_as_mentor',
    isVerified: 'is_verified',
    hasPremiumBadge: 'has_premium_badge'
  };
  
  Object.entries(body).forEach(([key, value]) => {
    const dbField = fieldMap[key];
    if (dbField) {
      updates.push(`${dbField} = ?`);
      // Handle booleans for SQLite
      if (typeof value === 'boolean') {
        params.push(value ? 1 : 0);
      } else if (Array.isArray(value)) {
        params.push(JSON.stringify(value));
      } else {
        params.push(value);
      }
    }
  });
  
  if (updates.length === 0) {
    return c.json({ success: false, message: 'No fields to update' }, 400);
  }
  
  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);
  
  const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
  await c.env.DB.prepare(sql).bind(...params).run();
  
  const updatedUser = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
  return c.json({ 
    success: true, 
    message: 'User updated successfully', 
    data: transformUser(updatedUser),
    user: transformUser(updatedUser)
  });
});

// User Profile (Moved down to avoid shadowing static /users routes)
api.get('/users/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
  
  if (!user) return c.json({ success: false, message: 'User not found' }, 404);
  
  return c.json({ success: true, data: transformUser(user) });
});

api.post('/users/:id/approve', authMiddleware, async (c) => {
  const admin = c.get('user');
  if (admin.role !== 'admin' && admin.role !== 'super_admin') {
    return c.json({ success: false, message: 'Unauthorized' }, 403);
  }

  const id = c.req.param('id');
  await c.env.DB.prepare("UPDATE users SET status = 'ACTIVE' WHERE id = ?").bind(id).run();
  
  return c.json({ success: true, message: 'User approved' });
});

api.post('/users/:id/reject', authMiddleware, async (c) => {
  const admin = c.get('user');
  if (admin.role !== 'admin' && admin.role !== 'super_admin') {
    return c.json({ success: false, message: 'Unauthorized' }, 403);
  }

  const id = c.req.param('id');
  await c.env.DB.prepare("UPDATE users SET status = 'REJECTED' WHERE id = ?").bind(id).run();
  
  return c.json({ success: true, message: 'User rejected' });
});

api.post('/users/:id/block', authMiddleware, async (c) => {
  const admin = c.get('user');
  if (admin.role !== 'admin' && admin.role !== 'super_admin') {
    return c.json({ success: false, message: 'Unauthorized' }, 403);
  }

  const id = c.req.param('id');
  await c.env.DB.prepare("UPDATE users SET status = 'SUSPENDED' WHERE id = ?").bind(id).run();
  
  return c.json({ success: true, message: 'User blocked' });
});

api.get('/users/messages/conversations', authMiddleware, async (c) => {
  const user = c.get('user');
  
  // Basic conversation list: people you've messaged
  const result = await c.env.DB.prepare(`
    SELECT DISTINCT u.id, u.name, u.profile_image, u.role,
    (SELECT content FROM direct_messages 
     WHERE (sender_id = u.id AND receiver_id = ?) OR (sender_id = ? AND receiver_id = u.id)
     ORDER BY created_at DESC LIMIT 1) as last_message,
    (SELECT created_at FROM direct_messages 
     WHERE (sender_id = u.id AND receiver_id = ?) OR (sender_id = ? AND receiver_id = u.id)
     ORDER BY created_at DESC LIMIT 1) as last_activity,
    (SELECT COUNT(*) FROM direct_messages
     WHERE sender_id = u.id AND receiver_id = ? AND is_read = 0) as unread_count
    FROM users u
    JOIN direct_messages dm ON (u.id = dm.sender_id OR u.id = dm.receiver_id)
    WHERE (dm.sender_id = ? OR dm.receiver_id = ?) AND u.id != ?
    ORDER BY last_activity DESC
  `).bind(user.id, user.id, user.id, user.id, user.id, user.id, user.id, user.id).all();
  
  const conversations = result.results.map(u => ({
    userId: u.id,
    lastMessage: u.last_message,
    lastMessageAt: u.last_activity,
    unreadCount: u.unread_count || 0,
    participant: {
      id: u.id,
      name: u.name,
      profileImage: u.profile_image
    }
  }));
  
  return c.json({ success: true, data: conversations });
});

api.get('/users/messages/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const targetId = c.req.param('id');
  
  const result = await c.env.DB.prepare(`
    SELECT * FROM direct_messages 
    WHERE (sender_id = ? AND receiver_id = ?) 
       OR (sender_id = ? AND receiver_id = ?)
    ORDER BY created_at ASC
  `).bind(user.id, targetId, targetId, user.id).all();
  
  // Mark as read
  await c.env.DB.prepare(`
    UPDATE direct_messages 
    SET is_read = 1, read_at = (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    WHERE sender_id = ? AND receiver_id = ? AND is_read = 0
  `).bind(targetId, user.id).run();
  
  return c.json({ success: true, data: result.results });
});

api.post('/users/messages/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const targetId = c.req.param('id');
  const { content } = await c.req.json();
  
  if (!content) return c.json({ success: false, message: 'Message content is required' }, 400);
  
  const id = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO direct_messages (id, sender_id, receiver_id, content)
    VALUES (?, ?, ?, ?)
  `).bind(id, user.id, targetId, content).run();
  
  const newMessage = await c.env.DB.prepare('SELECT * FROM direct_messages WHERE id = ?').bind(id).first();
  
  return c.json({ success: true, data: newMessage });
});

// Files
api.post('/uploads', authMiddleware, async (c) => {
  const user = c.get('user');
  const formData = await c.req.parseBody();
  const file = formData.file as File;

  if (!file) return c.json({ success: false, message: 'No file provided' }, 400);

  const key = `${crypto.randomUUID()}-${file.name.replace(/\s+/g, '_')}`;
  await c.env.BUCKET.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type }
  });

  const url = `https://mpsajmer-connect-api.futurist-raghav.workers.dev/api/files/${key}`;
  const id = crypto.randomUUID();

  await c.env.DB.prepare(`
    INSERT INTO files (id, filename, original_name, mimetype, size, url, uploaded_by_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(id, key, file.name, file.type, file.size, url, user.id).run();

  return c.json({ success: true, url, id });
});

api.get('/files/:key', async (c) => {
  const key = c.req.param('key');
  const object = await c.env.BUCKET.get(key);
  
  if (!object) return c.json({ message: 'File not found' }, 404);

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('Cache-Control', 'public, max-age=31536000');

  return new Response(object.body, { headers });
});

// Mount the API routes under both /api and /api/v1
app.route('/api', api);
app.route('/api/v1', api);

// Root health check
app.get('/', (c) => c.json({ success: true, message: "MPSAJMER CONNECT API is running" }));

// Default 404
app.all('*', (c) => {
  console.log(`404: ${c.req.method} ${c.req.path}`);
  return c.json({ 
    success: false, 
    message: `Route ${c.req.path} not found on MPSAJMER CONNECT API. Try /api/v1/docs for available routes.`,
    path: c.req.path
  }, 404);
});

export default app;
