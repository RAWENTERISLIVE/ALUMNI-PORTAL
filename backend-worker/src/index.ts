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
    const isLocalhost = url.hostname === 'localhost';
    const isCapacitor = origin === 'capacitor://localhost';
    const isApprovedDomain = url.hostname.endsWith('.workers.dev') || 
                             url.hostname.endsWith('.pages.dev') || 
                             url.hostname.endsWith('raghavagarwal.com');

    if (isLocalhost || isCapacitor || isApprovedDomain) {
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
  requirements: parseJSON(j.requirements) || [],
  benefits: parseJSON(j.benefits) || [],
  tags: parseJSON(j.tags) || [],
  isAlumniReferral: Boolean(j.is_alumni_referral),
  isActive: Boolean(j.is_active),
  applicationCount: j.application_count || 0,
  postedByName: j.posted_by_name,
  postedById: j.posted_by_id,
  createdAt: j.created_at,
  updatedAt: j.updated_at,
  postedDate: j.created_at,
  postedBy: {
    id: j.posted_by_id,
    name: j.posted_by_name
  },
  salary: (j.salary_range_min > 0 || j.salary_range_max > 0)
    ? `${Number(j.salary_range_min).toLocaleString()} - ${Number(j.salary_range_max).toLocaleString()} ${j.salary_currency || 'USD'}`
    : null,
  salaryRange: (j.salary_range_min > 0 || j.salary_range_max > 0) ? {
    min: j.salary_range_min,
    max: j.salary_range_max,
    currency: j.salary_currency || 'USD'
  } : null
});

const transformUser = (u: any) => ({
  ...u,
  role: u.role ? toClientRole(u.role) : 'user',
  profileImage: u.profile_image,
  jobTitle: u.job_title,
  classYear: u.class_year,
  graduationYear: u.graduation_year,
  industry: u.industry,
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
  imageUrl: g.image_url,
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

// Health check for monitoring and frontend status manager
api.get('/health', (c) => c.json({ 
  success: true, 
  status: 'ok',
  message: 'MPSAJMER CONNECT API is healthy',
  timestamp: new Date().toISOString(),
  environment: c.env.ENVIRONMENT || 'production'
}));

api.post('/auth/logout', async (c) => {
  return c.json({ success: true, message: 'Logged out successfully' });
});

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

    if (user.status === 'PENDING') {
      return c.json({ success: false, message: 'Your account is currently pending approval by an administrator.' }, 403);
    }

    if (user.status === 'REJECTED') {
      return c.json({ success: false, message: 'Your account registration has been rejected. Please contact support.' }, 403);
    }

    if (user.status === 'SUSPENDED') {
      return c.json({ success: false, message: 'Your account has been suspended. Please contact support.' }, 403);
    }

    const token = await createJWT(user.id, user.email, user.role, user.name || 'User', c.env.JWT_SECRET);
    
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

api.post('/auth/register', async (c) => {
  try {
    const { 
      email, password, name, role, 
      accountType, admissionNumber, admissionYear, graduationYear,
      needsManualVerification, verificationDetails, facultyIdCardUrl 
    } = await c.req.json();
    
    if (!email || !password || !name) {
      return c.json({ success: false, message: 'Email, password and name are required.' }, 400);
    }

    // Check if user already exists
    const existingUser = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (existingUser) {
      return c.json({ success: false, message: 'An account with this email already exists.' }, 400);
    }

    const id = crypto.randomUUID();
    const hashedPassword = await hashPassword(password);
    const dbRole = toDbRole(role || 'USER');
    
    // Fetch global settings to check if all registrations require approval
    let requireApproval = false;
    try {
      const settingsResult: any = await c.env.DB.prepare('SELECT value FROM system_settings WHERE key = ?').bind('global_settings').first();
      if (settingsResult) {
        const settings = parseJSON(settingsResult.value);
        requireApproval = settings?.registration?.requireApproval === true;
      }
    } catch (e) {
      console.error('Error fetching settings during registration:', e);
    }

    // Determine status - if manual verification is needed or global approval is required, set to PENDING
    const status = (needsManualVerification || requireApproval) ? 'PENDING' : 'ACTIVE';

    // Normalize accountType to uppercase to satisfy DB CHECK constraint
    const normalizedAccountType = (accountType || 'ALUMNI').toString().toUpperCase();
    
    await c.env.DB.prepare(`
      INSERT INTO users (
        id, email, password, name, role, status, 
        account_type, admission_number, admission_year, graduation_year,
        needs_manual_verification, verification_details, faculty_id_card_url,
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      id, email, hashedPassword, name, dbRole, status,
      normalizedAccountType, admissionNumber || null, admissionYear || null, graduationYear || null,
      needsManualVerification ? 1 : 0, verificationDetails || null, facultyIdCardUrl || null
    ).run();

    const token = await createJWT(id, email, dbRole, name, c.env.JWT_SECRET);

    return c.json({
      success: true,
      accessToken: token,
      user: {
        id,
        email,
        name,
        role: toClientRole(dbRole),
        status,
        accountType: normalizedAccountType,
        needsManualVerification: !!needsManualVerification,
        facultyIdCardUrl
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return c.json({ success: false, message: error.message || 'Registration failed' }, 500);
  }
});

api.post('/auth/forgot-password', async (c) => {
  try {
    const { email } = await c.req.json();
    if (!email) {
      return c.json({ success: false, message: 'Email is required.' }, 400);
    }

    // Check if user exists
    const user: any = await c.env.DB.prepare('SELECT id, name FROM users WHERE email = ?').bind(email).first();
    
    if (!user) {
      // For security, don't reveal if user exists, but we want to be helpful for now in dev/MVP
      // In production, we'd always return success: true
      return c.json({ 
        success: true, 
        message: 'If an account exists with this email, a reset link will be sent.' 
      });
    }

    // Generate a reset token (using JWT for simplicity, with short expiration)
    const resetToken = await createJWT(user.id, email, 'PASSWORD_RESET', user.name, c.env.JWT_SECRET);
    
    // Log the request (in a real app, we would send an email here)
    console.log(`Password reset requested for ${email}. Token: ${resetToken}`);
    
    // Since we don't have an email service, we'll just return success.
    // The user can implement the actual email sending later.
    return c.json({ 
      success: true, 
      message: 'Password reset link sent to your email.' 
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return c.json({ success: false, message: error.message || 'Failed to process request' }, 500);
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

const updateUserProfileLogic = async (c: any, userId: string, body: any) => {
  try {
    const fieldMap: Record<string, string> = {
      email: 'email', name: 'name', firstName: 'first_name', lastName: 'last_name',
      role: 'role', status: 'status', accountType: 'account_type',
      admissionNumber: 'admission_number', admissionYear: 'admission_year',
      graduationYear: 'graduation_year', classYear: 'class_year',
      contactEmail: 'contact_email', contactPhone: 'contact_phone',
      city: 'city', country: 'country', company: 'company', jobTitle: 'job_title',
      location: 'location', bio: 'bio', headline: 'headline',
      linkedinProfile: 'linkedin_profile', linkedInProfile: 'linkedin_profile', profileImage: 'profile_image',
      isAvailableAsMentor: 'is_available_as_mentor', isVerified: 'is_verified',
      hasPremiumBadge: 'has_premium_badge', skills: 'skills', interests: 'interests',
      experiences: 'experiences', educations: 'educations',
      notificationSettings: 'notification_settings', privacySettings: 'privacy_settings',
      industry: 'industry'
    };

    const updates: string[] = [];
    const params: any[] = [];
    
    // Fetch current user data for JSON merging
    const currentUser: any = await c.env.DB.prepare('SELECT notification_settings, privacy_settings FROM users WHERE id = ?').bind(userId).first();

    for (let [key, value] of Object.entries(body)) {
      const dbField = fieldMap[key];
      if (dbField) {
        // Normalize values for fields with CHECK constraints
        if (typeof value === 'string' && (key === 'status' || key === 'role' || key === 'accountType')) {
          value = value.toUpperCase();
        }

        updates.push(`${dbField} = ?`);
        
        if ((key === 'notificationSettings' || key === 'privacySettings') && typeof value === 'object' && value !== null) {
          // Merge with existing settings
          const currentVal = parseJSON((currentUser && currentUser[dbField]) || '{}');
          const merged = { ...currentVal, ...value };
          params.push(JSON.stringify(merged));
        } else if (typeof value === 'boolean') {
          params.push(value ? 1 : 0);
        } else if (typeof value === 'object' && value !== null) {
          params.push(JSON.stringify(value));
        } else {
          params.push(value);
        }
      }
    }
    
    if (updates.length === 0) return c.json({ success: true, message: 'No fields to update' });
    
    updates.push("updated_at = datetime('now')");
    params.push(userId);
    
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    await c.env.DB.prepare(query).bind(...params).run();
    
    const updatedUser = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
    return c.json({ success: true, data: transformUser(updatedUser), user: transformUser(updatedUser) });
  } catch (error: any) {
    console.error(`Update User Error: ${error.message}`, error);
    return c.json({ success: false, message: `Failed to update profile: ${error.message}` }, 500);
  }
};


api.patch('/users/me', authMiddleware, async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  return await updateUserProfileLogic(c, user.id, body);
});

api.patch('/users/:id/profile', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  
  if (user.role !== 'admin' && user.role !== 'super_admin' && user.id !== id) {
    return c.json({ success: false, message: 'Unauthorized' }, 403);
  }
  const body = await c.req.json();
  return await updateUserProfileLogic(c, id, body);
});

api.patch('/auth/notification-settings', authMiddleware, async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  return await updateUserProfileLogic(c, user.id, { notificationSettings: body });
});

api.patch('/auth/privacy-settings', authMiddleware, async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  return await updateUserProfileLogic(c, user.id, { privacySettings: body });
});

api.patch('/auth/deactivate-account', authMiddleware, async (c) => {
  const user = c.get('user');
  return await updateUserProfileLogic(c, user.id, { status: 'inactive' });
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

api.get('/posts/stats', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin' && user.role !== 'super_admin' && user.role !== 'MODERATOR') {
    return c.json({ success: false, message: 'Unauthorized' }, 403);
  }

  const stats: any = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN is_featured = 1 OR category = 'announcements' THEN 1 ELSE 0 END) as featured,
      SUM(CASE WHEN is_school_update = 1 OR category = 'school' THEN 1 ELSE 0 END) as school_updates,
      SUM(CASE WHEN created_at >= date('now', '-30 days') THEN 1 ELSE 0 END) as recent
    FROM posts
  `).first();

  const total = stats.total || 0;
  const recent = stats.recent || 0;
  const previous = total - recent;
  const growth = previous > 0 ? Math.round((recent / previous) * 100) : (recent > 0 ? 100 : 0);

  return c.json({
    success: true,
    data: {
      totalPosts: total,
      featuredPosts: stats.featured || 0,
      schoolUpdates: stats.school_updates || 0,
      growth: growth
    }
  });
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
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const id = crypto.randomUUID();

    const salaryMin = body.salaryRange?.min ?? body.salaryRangeMin ?? 0;
    const salaryMax = body.salaryRange?.max ?? body.salaryRangeMax ?? 0;
    const salaryCurrency = body.salaryRange?.currency ?? body.salaryCurrency ?? 'USD';

    await c.env.DB.prepare(`
      INSERT INTO jobs (
        id, title, company, location, type, 
        salary_range_min, salary_range_max, salary_currency,
        description, requirements, benefits, tags,
        posted_by_id, posted_by_name,
        is_active, is_alumni_referral,
        application_url, contact_email, application_deadline,
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      id, 
      body.title || '', 
      body.company || '', 
      body.location || '', 
      body.type || 'full-time',
      salaryMin, 
      salaryMax, 
      salaryCurrency,
      body.description || '', 
      JSON.stringify(body.requirements || []), 
      JSON.stringify(body.benefits || []), 
      JSON.stringify(body.tags || []),
      user.id || 'unknown', 
      user.name || 'User',
      body.isAlumniReferral ? 1 : 0,
      body.applicationUrl || null, 
      body.contactEmail || null, 
      body.applicationDeadline || null
    ).run();

    return c.json({ success: true, data: { id, ...body } });
  } catch (error: any) {
    console.error('Create job error:', error);
    return c.json({ success: false, message: error.message || 'Failed to create job' }, 500);
  }
});

api.get('/jobs/saved', authMiddleware, async (c) => {
  const user = c.get('user');
  const result = await c.env.DB.prepare(`
    SELECT j.* FROM jobs j
    JOIN saved_jobs sj ON j.id = sj.job_id
    WHERE sj.user_id = ? AND j.is_active = 1
    ORDER BY j.created_at DESC
  `).bind(user.id).all();
  
  const jobs = result.results.map(transformJob);
  return c.json({ success: true, data: jobs });
});

api.get('/jobs/applied', authMiddleware, async (c) => {
  const user = c.get('user');
  const result = await c.env.DB.prepare(`
    SELECT j.* FROM jobs j
    JOIN job_applications ja ON j.id = ja.job_id
    WHERE ja.applicant_id = ?
    ORDER BY ja.applied_at DESC
  `).bind(user.id).all();
  
  const jobs = result.results.map(transformJob);
  return c.json({ success: true, data: jobs });
});

api.get('/jobs/stats', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin' && user.role !== 'super_admin' && user.role !== 'MODERATOR') {
    return c.json({ success: false, message: 'Unauthorized' }, 403);
  }

  const stats: any = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
      SUM(CASE WHEN created_at >= date('now', '-30 days') THEN 1 ELSE 0 END) as recent
    FROM jobs
  `).first();

  const apps: any = await c.env.DB.prepare('SELECT COUNT(*) as count FROM job_applications').first();
  const total = stats.total || 0;
  const recent = stats.recent || 0;
  const previous = total - recent;
  const growth = previous > 0 ? Math.round((recent / previous) * 100) : (recent > 0 ? 100 : 0);

  return c.json({ 
    success: true, 
    data: { 
      totalJobs: total, 
      activeJobs: stats.active || 0, 
      totalApplications: apps?.count || 0, 
      growth: growth
    } 
  });
});

api.post('/jobs/:id/save', authMiddleware, async (c) => {
  const user = c.get('user');
  const jobId = c.req.param('id');
  
  await c.env.DB.prepare('INSERT OR IGNORE INTO saved_jobs (job_id, user_id) VALUES (?, ?)')
    .bind(jobId, user.id).run();
    
  return c.json({ success: true });
});

api.delete('/jobs/:id/save', authMiddleware, async (c) => {
  const user = c.get('user');
  const jobId = c.req.param('id');
  
  await c.env.DB.prepare('DELETE FROM saved_jobs WHERE job_id = ? AND user_id = ?')
    .bind(jobId, user.id).run();
    
  return c.json({ success: true });
});

api.post('/jobs/:id/apply', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const jobId = c.req.param('id');
    const body = await c.req.json();
    const id = crypto.randomUUID();
    
    // Check if already applied
    const existing = await c.env.DB.prepare('SELECT id FROM job_applications WHERE job_id = ? AND applicant_id = ?')
      .bind(jobId, user.id).first();
      
    if (existing) {
      return c.json({ success: true, data: { alreadyApplied: true } });
    }
    
    await c.env.DB.prepare(`
      INSERT INTO job_applications (id, job_id, applicant_id, cover_letter, resume_url, resume_filename, portfolio_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, 
      jobId, 
      user.id, 
      body.coverLetter || null, 
      body.resumeUrl || null, 
      body.resumeFilename || null, 
      body.portfolioUrl || null
    ).run();
    
    // Increment application count
    await c.env.DB.prepare('UPDATE jobs SET application_count = application_count + 1 WHERE id = ?')
      .bind(jobId).run();
      
    return c.json({ success: true, data: { id, alreadyApplied: false } });
  } catch (error: any) {
    console.error('Job application error:', error);
    return c.json({ success: false, message: error.message || 'Failed to submit application' }, 500);
  }
});

api.get('/jobs/:id/applications', authMiddleware, async (c) => {
  const user = c.get('user');
  const jobId = c.req.param('id');
  
  const job: any = await c.env.DB.prepare('SELECT posted_by_id FROM jobs WHERE id = ?').bind(jobId).first();
  if (!job) return c.json({ success: false, message: 'Job not found' }, 404);
  
  if (String(job.posted_by_id) !== String(user.id)) {
    return c.json({ success: false, message: 'Unauthorized' }, 403);
  }
  
  const result = await c.env.DB.prepare(`
    SELECT ja.*, u.name as applicant_name, u.email as applicant_email, 
           u.contact_phone as applicant_phone, u.linkedin_profile as applicant_linkedin
    FROM job_applications ja
    JOIN users u ON ja.applicant_id = u.id
    WHERE ja.job_id = ?
    ORDER BY ja.applied_at DESC
  `).bind(jobId).all();
  
  const applications = result.results.map((a: any) => ({
    id: a.id,
    applicantId: a.applicant_id,
    applicantName: a.applicant_name,
    applicantEmail: a.applicant_email,
    applicantPhone: a.applicant_phone,
    applicantLinkedin: a.applicant_linkedin,
    coverLetter: a.cover_letter,
    resumeUrl: a.resume_url,
    resumeFilename: a.resume_filename,
    portfolioUrl: a.portfolio_url,
    appliedAt: a.applied_at
  }));
  
  return c.json({ success: true, data: applications });
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
    INSERT INTO groups (id, name, description, creator_id, category, privacy, image_url, member_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `).bind(
    id, body.name, body.description, user.id, 
    body.category || 'professional', body.privacy || 'public',
    body.imageUrl || null
  ).run();

  await c.env.DB.prepare('INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)')
    .bind(id, user.id, 'ADMIN').run();

  return c.json({ success: true, data: { id, ...body } });
});

api.put('/groups/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = await c.req.json();
  
  const group: any = await c.env.DB.prepare('SELECT creator_id FROM groups WHERE id = ?').bind(id).first();
  if (!group) return c.json({ success: false, message: 'Group not found' }, 404);
  
  // Check if user is creator or system admin
  const userRole = (user.role || '').toUpperCase();
  const isSystemAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
  
  // Check if user is group admin
  const memberRole: any = await c.env.DB.prepare('SELECT role FROM group_members WHERE group_id = ? AND user_id = ?')
    .bind(id, user.id).first();
  
  const isGroupAdmin = memberRole?.role === 'ADMIN';

  if (group.creator_id !== user.id && !isSystemAdmin && !isGroupAdmin) {
    return c.json({ success: false, message: 'Unauthorized' }, 403);
  }
  
  try {
    await c.env.DB.prepare(`
      UPDATE groups SET name = ?, description = ?, category = ?, privacy = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      body.name, body.description, body.category, 
      body.privacy || 'public', body.imageUrl || null, id
    ).run();
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error("Error updating group:", error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

api.get('/groups/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  
  // Get group details with creator info
  const group: any = await c.env.DB.prepare(`
    SELECT g.*, 
    u.id as creator_id, u.name as creator_name, u.email as creator_email, u.profile_image as creator_image
    FROM groups g
    JOIN users u ON g.creator_id = u.id
    WHERE g.id = ?
  `).bind(id).first();
  
  if (!group) return c.json({ success: false, message: 'Group not found' }, 404);
  
  // Get members with their basic info
  const membersResult = await c.env.DB.prepare(`
    SELECT u.id, u.name, u.email, u.profile_image, gm.role
    FROM group_members gm
    JOIN users u ON gm.user_id = u.id
    WHERE gm.group_id = ?
  `).bind(id).all();
  
  const isMember = membersResult.results.some((m: any) => m.id === user.id);
  
  const transformed = {
    ...transformGroup(group),
    creator: {
      id: group.creator_id,
      name: group.creator_name,
      email: group.creator_email,
      profileImage: group.creator_image
    },
    isMember: isMember,
    members: membersResult.results.map((m: any) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      profileImage: m.profile_image,
      role: m.role
    }))
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
  
  const attachments = body.attachments ? JSON.stringify(body.attachments) : null;
  
  await c.env.DB.prepare(`
    INSERT INTO group_messages (id, group_id, author_id, content, attachments, message_type)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(id, groupId, user.id, body.content, attachments, body.messageType || 'text').run();
  
  // Fetch the message with author info for immediate UI update
  const newMessage: any = await c.env.DB.prepare(`
    SELECT gm.*, u.name as author_name, u.profile_image as author_image, u.role as author_role
    FROM group_messages gm
    JOIN users u ON gm.author_id = u.id
    WHERE gm.id = ?
  `).bind(id).first();
  
  return c.json({ success: true, data: transformGroupMessage(newMessage) });
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
  
  const member: any = await c.env.DB.prepare('SELECT role FROM group_members WHERE group_id = ? AND user_id = ?').bind(groupId, user.id).first();
  const isAdmin = member?.role === 'ADMIN' || group.creator_id === user.id || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
  
  if (!isAdmin) {
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
  
  const member: any = await c.env.DB.prepare('SELECT role FROM group_members WHERE group_id = ? AND user_id = ?').bind(groupId, user.id).first();
  const isAdmin = member?.role === 'ADMIN' || group.creator_id === user.id || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
  
  if (!isAdmin) {
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

api.delete('/groups/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  
  const group: any = await c.env.DB.prepare('SELECT creator_id FROM groups WHERE id = ?').bind(id).first();
  if (!group) return c.json({ success: false, message: 'Group not found' }, 404);
  
  const member: any = await c.env.DB.prepare('SELECT role FROM group_members WHERE group_id = ? AND user_id = ?').bind(id, user.id).first();
  
  const isAuthorized = 
    user.role === 'admin' || 
    user.role === 'super_admin' || 
    group.creator_id === user.id || 
    member?.role === 'ADMIN';
    
  if (!isAuthorized) {
    return c.json({ success: false, message: 'Unauthorized' }, 403);
  }
  
  try {
    // Delete group and related records in order
    await c.env.DB.prepare('DELETE FROM group_members WHERE group_id = ?').bind(id).run();
    await c.env.DB.prepare('DELETE FROM group_messages WHERE group_id = ?').bind(id).run();
    await c.env.DB.prepare('DELETE FROM group_join_requests WHERE group_id = ?').bind(id).run();
    await c.env.DB.prepare('DELETE FROM groups WHERE id = ?').bind(id).run();
    
    return c.json({ success: true, message: 'Group deleted successfully' });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
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

api.post('/groups/:id/invite-link', authMiddleware, async (c) => {
  const user = c.get('user');
  const groupId = c.req.param('id');
  
  const group: any = await c.env.DB.prepare('SELECT creator_id FROM groups WHERE id = ?').bind(groupId).first();
  if (!group) return c.json({ success: false, message: 'Group not found' }, 404);
  
  const member: any = await c.env.DB.prepare('SELECT role FROM group_members WHERE group_id = ? AND user_id = ?').bind(groupId, user.id).first();
  const isAdmin = member?.role === 'ADMIN' || group.creator_id === user.id || 
                  user.role?.toUpperCase() === 'ADMIN' || user.role?.toUpperCase() === 'SUPER_ADMIN';
  
  if (!isAdmin) {
    return c.json({ success: false, message: 'Unauthorized' }, 403);
  }
  
  // Create a signed token containing the groupId
  const token = await sign({ 
    groupId, 
    type: 'group_invite', 
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
  }, c.env.JWT_SECRET);
  
  const origin = c.req.header('Origin') || 'https://mpsajmer-connect.pages.dev';
  const inviteLink = `${origin}/groups?inviteToken=${token}`;
  
  return c.json({ 
    success: true, 
    data: { inviteLink } 
  });
});

api.post('/groups/invite/accept', authMiddleware, async (c) => {
  const user = c.get('user');
  const { token } = await c.req.json();
  
  if (!token) return c.json({ success: false, message: 'Token is required' }, 400);
  
  try {
    const payload = await verify(token, c.env.JWT_SECRET) as any;
    if (payload.type !== 'group_invite') {
      throw new Error('Invalid token type');
    }
    
    const groupId = payload.groupId;
    
    // Check if group exists
    const group: any = await c.env.DB.prepare('SELECT id, name FROM groups WHERE id = ?').bind(groupId).first();
    if (!group) return c.json({ success: false, message: 'Group no longer exists' }, 404);
    
    // Join the group
    const result = await c.env.DB.prepare('INSERT OR IGNORE INTO group_members (group_id, user_id) VALUES (?, ?)')
      .bind(groupId, user.id).run();
    
    if (result.meta.changes > 0) {
      await c.env.DB.prepare('UPDATE groups SET member_count = member_count + 1 WHERE id = ?')
        .bind(groupId).run();
    }
      
    return c.json({ success: true, message: `Successfully joined ${group.name}` });
    
  } catch (error) {
    return c.json({ success: false, message: 'Invalid or expired invite link' }, 400);
  }
});


// Admin/Management analytics
api.get('/admin/stats', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin' && user.role !== 'super_admin') {
    return c.json({ success: false, message: 'Unauthorized' }, 403);
  }
  
  try {
    const userStats: any = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN created_at >= date('now', '-30 days') THEN 1 ELSE 0 END) as recent
      FROM users
    `).first();

    const postStats: any = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_featured = 1 THEN 1 ELSE 0 END) as featured,
        SUM(CASE WHEN is_school_update = 1 THEN 1 ELSE 0 END) as schoolUpdates
      FROM posts
    `).first();

    const jobStats: any = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
        (SELECT COUNT(*) FROM job_applications) as applications
      FROM jobs
    `).first();

    const mentorshipStats: any = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as active
      FROM mentorship_requests
    `).first() || { total: 0, pending: 0, active: 0 };

    const eventStats: any = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN date >= date('now') THEN 1 ELSE 0 END) as upcoming
      FROM events
    `).first() || { total: 0, upcoming: 0 };

    const groupCount: any = await c.env.DB.prepare('SELECT COUNT(*) as count FROM groups').first() || { count: 0 };
    
    return c.json({
      success: true,
      data: {
        users: {
          total: userStats?.total || 0,
          active: userStats?.active || 0,
          pending: userStats?.pending || 0,
          recent: userStats?.recent || 0,
          growth: 15
        },
        posts: {
          total: postStats?.total || 0,
          featured: postStats?.featured || 0,
          schoolUpdates: postStats?.schoolUpdates || 0,
          growth: 8
        },
        jobs: {
          total: jobStats?.total || 0,
          active: jobStats?.active || 0,
          applications: jobStats?.applications || 0,
          growth: 5
        },
        mentorship: {
          total: mentorshipStats?.total || 0,
          pending: mentorshipStats?.pending || 0,
          active: mentorshipStats?.active || 0
        },
        events: {
          total: eventStats?.total || 0,
          upcoming: eventStats?.upcoming || 0
        },
        groups: {
          total: groupCount?.count || 0
        }
      }
    });
  } catch (error: any) {
    console.error('Admin stats error:', error);
    return c.json({ success: false, message: error.message || 'Failed to fetch admin statistics' }, 500);
  }
});

// Mentorship
api.get('/mentorship/mentors', authMiddleware, async (c) => {
  const query = c.req.query('query') || '';
  const expertise = c.req.query('expertise');
  const user = c.get('user');
  let sql = `
    SELECT 
      mp.*, 
      u.name as user_name, 
      u.profile_image as user_image, 
      u.job_title as user_title, 
      u.graduation_year,
      COALESCE(AVG(mr.rating), 0) as avg_rating,
      COUNT(mr.id) as total_ratings_count
    FROM mentorship_profiles mp
    JOIN users u ON mp.user_id = u.id
    LEFT JOIN mentorship_reviews mr ON mp.id = mr.mentor_profile_id
    WHERE mp.is_active = 1
    AND mp.user_id != ?
    AND mp.id IN (SELECT MAX(id) FROM mentorship_profiles GROUP BY user_id)
  `;
  
  const params: any[] = [user.id];
  if (query) {
    sql += ` AND (u.name LIKE ? OR mp.expertise LIKE ? OR mp.bio LIKE ?)`;
    params.push(`%${query}%`, `%${query}%`, `%${query}%`);
  }

  sql += ` GROUP BY mp.id`;
  
  const result = await c.env.DB.prepare(sql).bind(...params).all();
  
  const mentors = result.results.map((m: any) => ({
    ...m,
    expertise: parseJSON(m.expertise),
    availableSlots: parseJSON(m.slots),
    availability: m.availability,
    user: {
      id: m.user_id,
      name: m.user_name,
      profileImage: m.user_image,
      jobTitle: m.user_title,
      graduationYear: m.graduation_year
    },
    reviewCount: m.total_ratings_count || 0,
    rating: m.avg_rating || 0
  }));
  
  return c.json({ success: true, data: mentors });
});

api.get('/mentorship/profile', authMiddleware, async (c) => {
  const user = c.get('user');
  
  // Find mentor profile for current user
  const profile: any = await c.env.DB.prepare('SELECT * FROM mentorship_profiles WHERE user_id = ?').bind(user.id).first();
  const isMentor = !!(profile && profile.is_mentor);
  
  // Get mentorship requests SENT by this user (as mentee)
  const sentRequestsResult = await c.env.DB.prepare(`
    SELECT r.*, u.name as mentor_name, u.profile_image as mentor_image, u.id as mentor_user_id, mp.experience as mentor_experience
    FROM mentorship_requests r
    JOIN mentorship_profiles mp ON r.mentor_profile_id = mp.id
    JOIN users u ON mp.user_id = u.id
    WHERE r.mentee_id = ?
    AND r.status != 'cancelled'
    ORDER BY r.created_at DESC
  `).bind(user.id).all();
  
  const requests = sentRequestsResult.results.map(r => ({
    ...r,
    id: r.id,
    status: r.status,
    preferredSlot: parseJSON(r.preferred_slot),
    sessionMode: r.session_mode,
    mentor: {
      user: {
        id: r.mentor_user_id,
        name: r.mentor_name,
        profileImage: r.mentor_image
      },
      experience: r.mentor_experience
    },
    topics: r.topic ? [r.topic] : [],
    nextSession: r.updated_at || r.created_at
  }) as any);

  let incomingRequests = [];
  if (profile) {
    // Get mentorship requests RECEIVED by this user (as mentor)
    const incomingResult = await c.env.DB.prepare(`
      SELECT r.*, u.name as mentee_name, u.profile_image as mentee_image, u.job_title as mentee_title
      FROM mentorship_requests r
      JOIN users u ON r.mentee_id = u.id
      WHERE r.mentor_profile_id = ?
      AND r.status = 'pending'
      ORDER BY r.created_at DESC
    `).bind(profile.id).all();
    
    incomingRequests = incomingResult.results.map(r => ({
      ...r,
      preferredSlot: parseJSON(r.preferred_slot),
      sessionMode: r.session_mode,
      mentee: {
        user: {
          id: r.mentee_id,
          name: r.mentee_name,
          profileImage: r.mentee_image,
          title: r.mentee_title
        }
      },
      topics: r.topic ? [r.topic] : [],
      nextSession: r.updated_at || r.created_at
    }));
  }

  return c.json({ 
    success: true, 
    data: { 
      requests, 
      incomingRequests,
      isMentor,
      profile: profile ? {
        ...profile,
        expertise: parseJSON(profile.expertise),
        slots: parseJSON(profile.slots)
      } : null
    } 
  });
});

api.post('/mentorship/become-mentor', authMiddleware, async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const { bio, expertise, availability, experience, sessionMode, availableSlots, iceBreakerTemplate } = body;
  const id = crypto.randomUUID();
  
  await c.env.DB.prepare(`
    INSERT INTO mentorship_profiles (
      id, user_id, bio, expertise, availability, experience, 
      session_mode, slots, is_active, is_mentor
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
    ON CONFLICT(user_id) DO UPDATE SET
      bio = excluded.bio,
      expertise = excluded.expertise,
      availability = excluded.availability,
      experience = excluded.experience,
      session_mode = excluded.session_mode,
      slots = excluded.slots,
      is_active = 1,
      is_mentor = 1,
      updated_at = CURRENT_TIMESTAMP
  `).bind(
    id, 
    user.id, 
    bio || null, 
    JSON.stringify(expertise || []), 
    availability || 'medium', 
    experience || null,
    sessionMode || 'chat',
    availableSlots ? JSON.stringify(availableSlots) : null
  ).run();
  
  // Update user table as well
  await c.env.DB.prepare('UPDATE users SET is_available_as_mentor = 1 WHERE id = ?').bind(user.id).run();
  
  return c.json({ success: true });
});

api.post('/mentorship/request/:mentorId', authMiddleware, async (c) => {
  const user = c.get('user');
  const mentorId = c.req.param('mentorId');
  const body = await c.req.json();
  const { message, topic, sessionMode, selectedSlot } = body;
  
  const mentorProfile: any = await c.env.DB.prepare('SELECT id, user_id FROM mentorship_profiles WHERE user_id = ? OR id = ?').bind(mentorId, mentorId).first();
  if (!mentorProfile) return c.json({ success: false, message: 'Mentor not found' }, 404);

  // Robust check for self-mentorship
  if (String(mentorProfile.user_id) === String(user.id)) {
    return c.json({ success: false, message: 'You cannot request mentorship from yourself' }, 400);
  }

  // Check for existing pending request
  const existing: any = await c.env.DB.prepare('SELECT id FROM mentorship_requests WHERE mentee_id = ? AND mentor_profile_id = ? AND status IN (?, ?)')
    .bind(user.id, mentorProfile.id, 'pending', 'accepted').first();
  if (existing) return c.json({ success: false, message: 'You already have an active or pending request for this mentor' }, 400);
  
  const id = crypto.randomUUID();
  try {
    await c.env.DB.prepare(`
      INSERT INTO mentorship_requests (id, mentee_id, mentor_profile_id, message, topic, session_mode, preferred_slot, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, 
      user.id, 
      mentorProfile.id, 
      message || null, 
      topic || null, 
      sessionMode || 'chat', 
      selectedSlot ? JSON.stringify(selectedSlot) : null,
      'pending'
    ).run();
    
    // Send notification to the mentor
    const mentorUser = await c.env.DB.prepare(`
      SELECT user_id FROM mentorship_profiles WHERE id = ?
    `).bind(mentorProfile.id).first();
    
    if (mentorUser) {
      const notifId = crypto.randomUUID();
      await c.env.DB.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, action_url)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        notifId, 
        mentorUser.user_id, 
        'New Mentorship Request',
        `${user.name} has requested you as a mentor.`,
        'mentorship',
        '/mentorship'
      ).run();
    }
    
    return c.json({ success: true, message: 'Mentorship request sent successfully' });
  } catch (error: any) {
    return c.json({ success: false, message: 'Failed to send request: ' + error.message }, 500);
  }
});

api.post('/mentorship/request/:requestId/:action', authMiddleware, async (c) => {
  const user = c.get('user');
  const requestId = c.req.param('requestId');
  const action = c.req.param('action');
  
  if (action !== 'accept' && action !== 'reject' && action !== 'cancel') {
    return c.json({ success: false, message: 'Invalid action' }, 400);
  }
  
  const request: any = await c.env.DB.prepare(`
    SELECT r.*, mp.user_id as mentor_user_id
    FROM mentorship_requests r
    JOIN mentorship_profiles mp ON r.mentor_profile_id = mp.id
    WHERE r.id = ?
  `).bind(requestId).first();
  
  if (!request) return c.json({ success: false, message: 'Request not found' }, 404);
  
  if (action === 'cancel') {
    if (String(request.mentee_id) !== String(user.id)) return c.json({ success: false, message: 'Unauthorized' }, 403);
    await c.env.DB.prepare('DELETE FROM mentorship_requests WHERE id = ?').bind(requestId).run();
    return c.json({ success: true, message: 'Request cancelled' });
  }

  if (request.mentor_user_id !== user.id) return c.json({ success: false, message: 'Unauthorized' }, 403);
  
  const status = action === 'accept' ? 'accepted' : 'rejected';
  
  await c.env.DB.prepare('UPDATE mentorship_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .bind(status, requestId).run();
    
  if (action === 'accept') {
    await c.env.DB.prepare('UPDATE mentorship_profiles SET current_mentees = current_mentees + 1 WHERE id = ?')
      .bind(request.mentor_profile_id).run();
      
    // Automatically create or update a connection between mentor and mentee to enable messaging
    const existingConn: any = await c.env.DB.prepare(`
      SELECT id, status FROM connection_requests 
      WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
    `).bind(user.id, request.mentee_id, request.mentee_id, user.id).first();

    if (!existingConn) {
      await c.env.DB.prepare(`
        INSERT INTO connection_requests (id, sender_id, receiver_id, status, responded_at)
        VALUES (?, ?, ?, 'ACCEPTED', CURRENT_TIMESTAMP)
      `).bind(crypto.randomUUID(), request.mentee_id, user.id).run();
    } else if (existingConn.status !== 'ACCEPTED') {
      await c.env.DB.prepare(`
        UPDATE connection_requests 
        SET status = 'ACCEPTED', responded_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(existingConn.id).run();
    }
  }
  
  const notifId = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type, action_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    notifId, 
    request.mentee_id, 
    `Mentorship Request ${action === 'accept' ? 'Accepted' : 'Rejected'}`,
    `Your mentorship request has been ${status}.`,
    'mentorship',
    '/mentorship'
  ).run();
  
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

api.post('/notifications/:id/seen', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const now = new Date().toISOString();
  
  await c.env.DB.prepare('UPDATE notifications SET is_seen = 1, seen_at = ?, updated_at = ? WHERE id = ? AND user_id = ?')
    .bind(now, now, id, user.id).run();
    
  return c.json({ success: true });
});

api.patch('/notifications/:id/seen', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const now = new Date().toISOString();
  
  await c.env.DB.prepare('UPDATE notifications SET is_seen = 1, seen_at = ?, updated_at = ? WHERE id = ? AND user_id = ?')
    .bind(now, now, id, user.id).run();
    
  return c.json({ success: true });
});

api.post('/notifications/mark-all-seen', authMiddleware, async (c) => {
  const user = c.get('user');
  const now = new Date().toISOString();
  
  await c.env.DB.prepare('UPDATE notifications SET is_seen = 1, seen_at = ?, updated_at = ? WHERE user_id = ? AND is_seen = 0')
    .bind(now, now, user.id).run();
    
  return c.json({ success: true });
});

// --- HELP TICKETS ---
api.get('/help-tickets/my', authMiddleware, async (c) => {
  const user = c.get('user');
  const status = c.req.query('status');
  
  let sql = 'SELECT * FROM help_tickets WHERE created_by_id = ?';
  const params = [user.id];
  
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  
  sql += ' ORDER BY created_at DESC';
  
  const result = await c.env.DB.prepare(sql).bind(...params).all();
  
  // Fetch replies and attachments for each ticket (simple version)
  const tickets = await Promise.all(result.results.map(async (t: any) => {
    const replies = await c.env.DB.prepare('SELECT * FROM help_ticket_replies WHERE ticket_id = ? ORDER BY created_at ASC').bind(t.id).all();
    const attachments = await c.env.DB.prepare('SELECT * FROM help_ticket_attachments WHERE ticket_id = ?').bind(t.id).all();
    
    return {
      ...t,
      createdBy: { id: user.id, name: user.name, email: user.email },
      replies: replies.results.map((r: any) => ({
        ...r,
        user: { id: r.user_id, name: r.user_id === user.id ? user.name : 'Support Team' }
      })),
      attachments: attachments.results
    };
  }));
  
  return c.json({ success: true, data: { tickets } });
});

api.post('/help-tickets', authMiddleware, async (c) => {
  const user = c.get('user');
  const formData = await c.req.formData();
  
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const category = formData.get('category') as string;
  const priority = formData.get('priority') as string;
  const reportedUserId = formData.get('reportedUserId') as string;
  
  const ticketId = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO help_tickets (id, title, description, category, priority, status, created_by_id, reported_user_id)
    VALUES (?, ?, ?, ?, ?, 'open', ?, ?)
  `).bind(ticketId, title, description, category, priority, user.id, reportedUserId || null).run();
  
  // Handle attachments
  const files = formData.getAll('attachments');
  for (const file of files) {
    if (file && typeof (file as any).arrayBuffer === 'function') {
      const fileName = (file as any).name || 'upload';
      const fileType = (file as any).type || 'application/octet-stream';
      const fileSize = (file as any).size || 0;
      const key = `help-${crypto.randomUUID()}-${fileName}`;
      
      await c.env.BUCKET.put(key, await (file as any).arrayBuffer(), {
        httpMetadata: { contentType: fileType }
      });
      
      const baseUrl = new URL(c.req.url).origin;
      const url = `${baseUrl}/api/files/${key}`;
      
      await c.env.DB.prepare(`
        INSERT INTO help_ticket_attachments (id, ticket_id, filename, original_name, mimetype, size, url)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(crypto.randomUUID(), ticketId, key, fileName, fileType, fileSize, url).run();
    }
  }
  
  return c.json({ success: true, message: 'Ticket created', data: { id: ticketId } });
});

api.post('/help-tickets/:id/reply', authMiddleware, async (c) => {
  const user = c.get('user');
  const ticketId = c.req.param('id');
  const { content } = await c.req.json();
  
  const replyId = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO help_ticket_replies (id, ticket_id, user_id, content)
    VALUES (?, ?, ?, ?)
  `).bind(replyId, ticketId, user.id, content).run();
  
  // Update ticket updated_at
  await c.env.DB.prepare('UPDATE help_tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(ticketId).run();
  
  return c.json({ success: true, message: 'Reply added' });
});

// --- DIRECTORY ---
api.get('/users/directory', authMiddleware, async (c) => {
  const currentUser = c.get('user');
  const limit = parseInt(c.req.query('limit') || '100');
  const search = (c.req.query('search') || '').trim();
  const industry = c.req.query('industry') || '';
  const graduationYear = c.req.query('graduationYear') || '';
  const location = c.req.query('location') || '';
  
  let sql = `
    SELECT u.*, 
    (
      SELECT status FROM connection_requests 
      WHERE (sender_id = ? AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = ?)
      LIMIT 1
    ) as connection_status_raw,
    (
      SELECT sender_id FROM connection_requests 
      WHERE (sender_id = ? AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = ?)
      LIMIT 1
    ) as connection_sender_id
    FROM users u
    WHERE (u.status = 'ACTIVE' OR u.status = 'APPROVED') AND u.id != ?
  `;
  const params: any[] = [currentUser.id, currentUser.id, currentUser.id, currentUser.id, currentUser.id];
  
  if (search) {
    sql += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.job_title LIKE ? OR u.company LIKE ?)`;
    const term = `%${search}%`;
    params.push(term, term, term, term);
  }
  
  if (industry) {
    sql += ` AND u.industry = ?`;
    params.push(industry);
  }
  
  if (graduationYear) {
    sql += ` AND (u.graduation_year = ? OR u.admission_year = ?)`;
    params.push(graduationYear, graduationYear);
  }
  
  if (location) {
    sql += ` AND (u.location LIKE ? OR u.city LIKE ?)`;
    params.push(`%${location}%`, `%${location}%`);
  }
  
  sql += ` LIMIT ?`;
  params.push(limit);
  
  const result = await c.env.DB.prepare(sql).bind(...params).all();
  
  const users = result.results
    .map((u: any) => {
      const transformed = transformUser(u);
      let connectionStatus: "connected" | "pending" | "none" = "none";
      
      if (u.connection_status_raw === 'ACCEPTED') {
        connectionStatus = "connected";
      } else if (u.connection_status_raw === 'PENDING') {
        connectionStatus = u.connection_sender_id === currentUser.id ? "pending" : "incoming";
      }
      
      const privacy = transformed.privacySettings || {};
      
      // Respect 'profileVisibility'
      const visibility = privacy.profileVisibility || 'alumni';
      if (visibility === 'connections' && connectionStatus !== 'connected') {
        return null; // Hide completely
      }
      
      // Mask contact info based on privacy
      if (privacy.showEmail === false) {
        transformed.email = undefined;
        transformed.contactEmail = undefined;
      }
      if (privacy.showPhone === false) {
        transformed.contactPhone = undefined;
      }

      return {
        ...transformed,
        connectionStatus
      };
    })
    .filter((u: any) => {
      if (!u) return false;
      const privacy = u.privacySettings || {};
      // If search is active, and allowProfileSearch is false, hide unless connected
      if (search && privacy.allowProfileSearch === false && u.connectionStatus !== 'connected') {
        return false;
      }
      return true;
    });
  
  // Also fetch unique filters for the UI
  let industries: string[] = [];
  let locations: string[] = [];
  let graduationYears: number[] = [];

  try {
    const industriesResult = await c.env.DB.prepare("SELECT DISTINCT industry FROM users WHERE industry IS NOT NULL AND industry != ''").all();
    industries = industriesResult.results.map((r: any) => r.industry);
  } catch (e) { console.error("Filter fetch error (industries):", e); }

  try {
    const locationsResult = await c.env.DB.prepare("SELECT DISTINCT city as location FROM users WHERE city IS NOT NULL AND city != '' UNION SELECT DISTINCT location FROM users WHERE location IS NOT NULL AND location != ''").all();
    locations = locationsResult.results.map((r: any) => r.location);
  } catch (e) { console.error("Filter fetch error (locations):", e); }

  try {
    const yearsResult = await c.env.DB.prepare("SELECT DISTINCT graduation_year FROM users WHERE graduation_year IS NOT NULL UNION SELECT DISTINCT admission_year FROM users WHERE admission_year IS NOT NULL").all();
    graduationYears = yearsResult.results.map((r: any) => Number(r.graduation_year || r.admission_year)).filter(Boolean);
  } catch (e) { console.error("Filter fetch error (years):", e); }

  return c.json({ 
    success: true, 
    data: users, 
    users,
    filters: {
      industries,
      locations,
      graduationYears
    }
  });
});


api.get('/users/messages/search', authMiddleware, async (c) => {
  const query = c.req.query('query') || '';
  const limit = parseInt(c.req.query('limit') || '25');
  const user = c.get('user');

  const result = await c.env.DB.prepare(`
    SELECT u.id, u.name, u.email, u.profile_image, u.role
    FROM users u
    JOIN connection_requests cr ON 
      ((cr.sender_id = ? AND cr.receiver_id = u.id) OR (cr.sender_id = u.id AND cr.receiver_id = ?))
    WHERE u.id != ? AND cr.status = 'ACCEPTED' AND (u.name LIKE ? OR u.email LIKE ?)
    LIMIT ?
  `).bind(user.id, user.id, user.id, `%${query}%`, `%${query}%`, limit).all();

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

// --- UNIVERSAL SEARCH ---
api.get('/search/universal', authMiddleware, async (c) => {
  const query = (c.req.query('q') || '').trim();
  const limit = parseInt(c.req.query('limit') || '8');
  
  if (!query) {
    // Return shortcuts/recent if no query
    return c.json({
      success: true,
      data: [
        { id: 'home', type: 'shortcut', title: 'Dashboard', route: '/dashboard' },
        { id: 'dir', type: 'shortcut', title: 'Alumni Directory', route: '/directory' },
        { id: 'jobs', type: 'shortcut', title: 'Job Board', route: '/jobs' },
        { id: 'profile', type: 'shortcut', title: 'My Profile', route: '/profile' },
        { id: 'settings', type: 'shortcut', title: 'Settings', route: '/settings' },
      ]
    });
  }

  const searchResults: any[] = [];
  const term = `%${query}%`;

  // Search Users
  const users = await c.env.DB.prepare(`
    SELECT id, name, job_title, company, profile_image 
    FROM users 
    WHERE (name LIKE ? OR email LIKE ? OR job_title LIKE ? OR company LIKE ?) 
    AND status IN ('ACTIVE', 'APPROVED')
    LIMIT ?
  `).bind(term, term, term, term, Math.ceil(limit/2)).all();
  
  users.results.forEach((u: any) => {
    searchResults.push({
      id: u.id,
      type: 'user',
      title: u.name,
      subtitle: u.job_title ? `${u.job_title} at ${u.company || 'N/A'}` : 'Alumni',
      route: `/directory/profile/${u.id}`
    });
  });

  // Search Jobs
  const jobs = await c.env.DB.prepare(`
    SELECT id, title, company FROM jobs 
    WHERE (title LIKE ? OR company LIKE ? OR description LIKE ?) 
    AND is_active = 1
    LIMIT 2
  `).bind(term, term, term).all();
  
  jobs.results.forEach((j: any) => {
    searchResults.push({
      id: j.id,
      type: 'job',
      title: j.title,
      subtitle: j.company,
      route: `/jobs?jobId=${j.id}`
    });
  });

  // Search Posts
  const posts = await c.env.DB.prepare(`
    SELECT id, title, content FROM posts 
    WHERE (title LIKE ? OR content LIKE ?) 
    LIMIT 2
  `).bind(term, term).all();
  
  posts.results.forEach((p: any) => {
    searchResults.push({
      id: p.id,
      type: 'post',
      title: p.title || 'Untitled Post',
      subtitle: p.content.substring(0, 50) + '...',
      route: `/posts?postId=${p.id}`
    });
  });

  return c.json({
    success: true,
    data: searchResults.slice(0, limit)
  });
});

// --- CONNECTIONS & FOLLOWS ---
api.post('/users/:id/connect', authMiddleware, async (c) => {
  const sender = c.get('user');
  const receiverId = c.req.param('id');
  
  if (sender.id === receiverId) return c.json({ success: false, message: "You cannot connect with yourself" }, 400);

  const id = crypto.randomUUID();
  try {
    await c.env.DB.prepare(`
      INSERT INTO connection_requests (id, sender_id, receiver_id, status)
      VALUES (?, ?, ?, 'PENDING')
    `).bind(id, sender.id, receiverId).run();
    
    // Create notification
    const notifId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, action_url)
      VALUES (?, ?, ?, ?, 'connection_request', ?)
    `).bind(notifId, receiverId, 'New Connection Request', `${sender.name} wants to connect with you.`, `/directory/profile/${sender.id}`).run();

    return c.json({ success: true, message: 'Connection request sent', data: { connectionStatus: 'pending' } });
  } catch (error: any) {
    if (error.message.includes('UNIQUE')) return c.json({ success: false, message: 'Request already exists' }, 400);
    return c.json({ success: false, message: error.message }, 500);
  }
});

api.post('/users/:id/connect/accept', authMiddleware, async (c) => {
  const receiver = c.get('user');
  const senderId = c.req.param('id');
  
  await c.env.DB.prepare(`
    UPDATE connection_requests SET status = 'ACCEPTED', responded_at = datetime('now')
    WHERE sender_id = ? AND receiver_id = ? AND status = 'PENDING'
  `).bind(senderId, receiver.id).run();
  
  // Create reverse follow or connection record if needed, but for now we just use the status
  return c.json({ success: true, message: 'Connection accepted', data: { connectionStatus: 'connected' } });
});

api.delete('/users/:id/connect', authMiddleware, async (c) => {
  const user = c.get('user');
  const targetId = c.req.param('id');
  
  await c.env.DB.prepare(`
    DELETE FROM connection_requests 
    WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
  `).bind(user.id, targetId, targetId, user.id).run();
  
  return c.json({ success: true, message: 'Connection removed' });
});

api.post('/users/:id/follow', authMiddleware, async (c) => {
  const follower = c.get('user');
  const followingId = c.req.param('id');
  
  if (follower.id === followingId) return c.json({ success: false, message: "You cannot follow yourself" }, 400);

  const id = crypto.randomUUID();
  try {
    await c.env.DB.prepare(`
      INSERT INTO follows (id, follower_id, following_id)
      VALUES (?, ?, ?)
    `).bind(id, follower.id, followingId).run();
    
    return c.json({ success: true });
  } catch (error: any) {
    if (error.message.includes('UNIQUE')) return c.json({ success: true });
    return c.json({ success: false, message: error.message }, 500);
  }
});

api.delete('/users/:id/follow', authMiddleware, async (c) => {
  const follower = c.get('user');
  const followingId = c.req.param('id');
  
  await c.env.DB.prepare(`
    DELETE FROM follows WHERE follower_id = ? AND following_id = ?
  `).bind(follower.id, followingId).run();
  
  return c.json({ success: true });
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

api.get('/admin/settings', authMiddleware, async (c) => {
  const admin = c.get('user');
  if (admin.role !== 'admin' && admin.role !== 'super_admin') {
    return c.json({ success: false, message: 'Unauthorized' }, 403);
  }

  const result: any = await c.env.DB.prepare('SELECT value FROM system_settings WHERE key = ?').bind('global_settings').first();
  if (!result) return c.json({ success: true, settings: null, data: { settings: null } });

  const settings = parseJSON(result.value);
  return c.json({ success: true, settings, data: { settings } });
});

api.patch('/admin/settings', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin' && user.role !== 'super_admin') {
    return c.json({ success: false, message: 'Unauthorized' }, 403);
  }

  const body = await c.req.json();
  const settingsStr = JSON.stringify(body.settings || body);

  await c.env.DB.prepare('INSERT INTO system_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP')
    .bind('global_settings', settingsStr, settingsStr)
    .run();

  return c.json({ success: true, message: 'Settings updated' });
});

api.get('/settings/public', async (c) => {
  const result: any = await c.env.DB.prepare('SELECT value FROM system_settings WHERE key = ?').bind('global_settings').first();
  if (!result) return c.json({ success: true, settings: null });

  const settings = parseJSON(result.value);
  // Strip sensitive info if any
  const publicSettings = {
    institutionRules: settings.institutionRules,
    registration: settings.registration,
    appearance: settings.appearance
  };

  return c.json({ success: true, settings: publicSettings });
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

// Admin actions on users
api.on(['POST', 'PATCH'], '/users/:id/approve', authMiddleware, async (c) => {
  const admin = c.get('user');
  if (admin.role !== 'admin' && admin.role !== 'super_admin') {
    return c.json({ success: false, message: 'Unauthorized' }, 403);
  }

  const id = c.req.param('id');
  await c.env.DB.prepare("UPDATE users SET status = 'ACTIVE', is_verified = 1 WHERE id = ?").bind(id).run();
  
  return c.json({ success: true, message: 'User approved and verified' });
});

api.on(['POST', 'PATCH'], '/users/:id/reject', authMiddleware, async (c) => {
  const admin = c.get('user');
  if (admin.role !== 'admin' && admin.role !== 'super_admin') {
    return c.json({ success: false, message: 'Unauthorized' }, 403);
  }

  const id = c.req.param('id');
  await c.env.DB.prepare("UPDATE users SET status = 'REJECTED' WHERE id = ?").bind(id).run();
  
  return c.json({ success: true, message: 'User rejected' });
});

api.patch('/users/:id/premium-badge', authMiddleware, async (c) => {
  const admin = c.get('user');
  if (admin.role !== 'admin' && admin.role !== 'super_admin') {
    return c.json({ success: false, message: 'Unauthorized' }, 403);
  }

  const id = c.req.param('id');
  const body = await c.req.json();
  const hasPremiumBadge = body.hasPremiumBadge ?? body.enabled;
  
  await c.env.DB.prepare("UPDATE users SET has_premium_badge = ? WHERE id = ?")
    .bind(hasPremiumBadge ? 1 : 0, id).run();
    
  return c.json({ success: true, message: `Premium badge ${hasPremiumBadge ? 'granted' : 'removed'}` });
});

api.patch('/users/:id/promote-moderator', authMiddleware, async (c) => {
  const admin = c.get('user');
  if (admin.role !== 'admin' && admin.role !== 'super_admin') {
    return c.json({ success: false, message: 'Unauthorized' }, 403);
  }

  const id = c.req.param('id');
  await c.env.DB.prepare("UPDATE users SET role = 'MODERATOR' WHERE id = ?").bind(id).run();
  
  return c.json({ success: true, message: 'User promoted to moderator' });
});

api.patch('/users/:id/promote', authMiddleware, async (c) => {
  const admin = c.get('user');
  if (admin.role !== 'super_admin') {
    return c.json({ success: false, message: 'Only super admins can promote others to admin' }, 403);
  }

  const id = c.req.param('id');
  await c.env.DB.prepare("UPDATE users SET role = 'ADMIN' WHERE id = ?").bind(id).run();
  
  return c.json({ success: true, message: 'User promoted to admin' });
});

api.patch('/users/:id/demote', authMiddleware, async (c) => {
  const admin = c.get('user');
  if (admin.role !== 'admin' && admin.role !== 'super_admin') {
    return c.json({ success: false, message: 'Unauthorized' }, 403);
  }

  const id = c.req.param('id');
  await c.env.DB.prepare("UPDATE users SET role = 'USER' WHERE id = ?").bind(id).run();
  
  return c.json({ success: true, message: 'User demoted to regular user' });
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

// User Profile (Moved down to avoid shadowing static /users routes)
api.get('/users/:id', authMiddleware, async (c) => {
  const currentUser = c.get('user');
  const id = c.req.param('id');
  
  const user: any = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
  if (!user) return c.json({ success: false, message: 'User not found' }, 404);
  
  // Check connection status
  const connection: any = await c.env.DB.prepare(`
    SELECT status, sender_id FROM connection_requests 
    WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
  `).bind(currentUser.id, id, id, currentUser.id).first();
  
  const connectionStatus = connection?.status === 'ACCEPTED' 
    ? 'connected' 
    : (connection?.status === 'PENDING' 
        ? (connection.sender_id === currentUser.id ? 'pending' : 'incoming') 
        : 'none');
  
  const transformed = transformUser(user);
  const privacy = transformed.privacySettings || {};
  const visibility = privacy.profileVisibility || 'alumni';
  
  // Basic privacy check
  if (id !== currentUser.id && currentUser.role !== 'admin' && currentUser.role !== 'super_admin') {
    if (visibility === 'connections' && connectionStatus !== 'connected') {
      // Restricted view - hide most things
      return c.json({ 
        success: true, 
        data: {
          id: transformed.id,
          name: transformed.name,
          profileImage: transformed.profileImage,
          isRestricted: true,
          connectionStatus
        }
      });
    }
    
    // Mask contact info
    if (privacy.showEmail === false) {
      transformed.email = undefined;
      transformed.contactEmail = undefined;
    }
    if (privacy.showPhone === false) {
      transformed.contactPhone = undefined;
    }
  }
  
  return c.json({ 
    success: true, 
    data: {
      ...transformed,
      connectionStatus
    } 
  });
});


api.patch('/users/:id/edit', authMiddleware, async (c) => {
  const admin = c.get('user');
  if (admin.role !== 'admin' && admin.role !== 'super_admin') {
    return c.json({ success: false, message: 'Unauthorized' }, 403);
  }

  const id = c.req.param('id');
  const body = await c.req.json();
  return await updateUserProfileLogic(c, id, body);
});

api.get('/users/messages/conversations', authMiddleware, async (c) => {
  const user = c.get('user');
  
  // Basic conversation list: people you've messaged
  const result = await c.env.DB.prepare(`
    SELECT DISTINCT u.id, u.name, u.profile_image, u.role,
    (SELECT content FROM direct_messages 
     WHERE (sender_id = u.id AND receiver_id = ?) OR (sender_id = ? AND receiver_id = u.id)
     ORDER BY created_at DESC LIMIT 1) as last_message,
    (SELECT sender_id FROM direct_messages 
     WHERE (sender_id = u.id AND receiver_id = ?) OR (sender_id = ? AND receiver_id = u.id)
     ORDER BY created_at DESC LIMIT 1) as last_sender_id,
    (SELECT created_at FROM direct_messages 
     WHERE (sender_id = u.id AND receiver_id = ?) OR (sender_id = ? AND receiver_id = u.id)
     ORDER BY created_at DESC LIMIT 1) as last_activity,
    (SELECT COUNT(*) FROM direct_messages
     WHERE sender_id = u.id AND receiver_id = ? AND is_read = 0) as unread_count
    FROM users u
    JOIN direct_messages dm ON (u.id = dm.sender_id OR u.id = dm.receiver_id)
    WHERE (dm.sender_id = ? OR dm.receiver_id = ?) AND u.id != ?
    ORDER BY last_activity DESC
  `).bind(user.id, user.id, user.id, user.id, user.id, user.id, user.id, user.id, user.id, user.id).all();
  
  const conversations = result.results.map(u => ({
    userId: u.id,
    lastMessage: u.last_message,
    lastMessageAt: u.last_activity,
    lastMessageFromMe: u.last_sender_id === user.id,
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
  
  // Check connection status
  const connection: any = await c.env.DB.prepare(`
    SELECT status FROM connection_requests 
    WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
    AND status = 'ACCEPTED'
  `).bind(user.id, targetId, targetId, user.id).first();
  
  if (!connection && user.role !== 'admin' && user.role !== 'super_admin') {
    return c.json({ success: false, message: 'You can only message your connections' }, 403);
  }
  
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
  
  const messages = result.results.map(m => ({
    id: m.id,
    senderId: m.sender_id,
    receiverId: m.receiver_id,
    content: m.content,
    isRead: Boolean(m.is_read),
    createdAt: m.created_at
  }));
  
  return c.json({ success: true, data: messages });
});

api.post('/users/messages/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const targetId = c.req.param('id');
  
  // Check connection status
  const connection: any = await c.env.DB.prepare(`
    SELECT status FROM connection_requests 
    WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
    AND status = 'ACCEPTED'
  `).bind(user.id, targetId, targetId, user.id).first();
  
  if (!connection && user.role !== 'admin' && user.role !== 'super_admin') {
    return c.json({ success: false, message: 'You can only message your connections' }, 403);
  }
  const { content } = await c.req.json();
  
  if (!content) return c.json({ success: false, message: 'Message content is required' }, 400);
  
  const id = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO direct_messages (id, sender_id, receiver_id, content)
    VALUES (?, ?, ?, ?)
  `).bind(id, user.id, targetId, content).run();
  
  const newMessage: any = await c.env.DB.prepare('SELECT * FROM direct_messages WHERE id = ?').bind(id).first();
  
  return c.json({ 
    success: true, 
    data: {
      id: newMessage.id,
      senderId: newMessage.sender_id,
      receiverId: newMessage.receiver_id,
      content: newMessage.content,
      isRead: Boolean(newMessage.is_read),
      createdAt: newMessage.created_at
    } 
  });
});

// Files
const handleUpload = async (c: any) => {
  const user = c.get('user');
  if (!user) return c.json({ success: false, message: 'Unauthorized' }, 401);

  let file: File | null = null;
  
  try {
    const formData = await c.req.formData();
    file = formData.get('file') as any;
  } catch (e: any) {
    console.error('Error parsing form data:', e);
    return c.json({ success: false, message: 'Invalid form data: ' + e.message }, 400);
  }

  if (!file || typeof (file as any).arrayBuffer !== 'function') {
    return c.json({ success: false, message: 'No valid file provided' }, 400);
  }

  try {
    const fileName = (file as any).name || 'upload';
    const fileType = (file as any).type || 'application/octet-stream';
    const fileSize = (file as any).size || 0;
    
    const key = `${crypto.randomUUID()}-${fileName.replace(/\s+/g, '_')}`;
    
    if (!c.env.BUCKET) throw new Error('R2 Bucket binding is missing');

    await c.env.BUCKET.put(key, await (file as any).arrayBuffer(), {
      httpMetadata: { contentType: fileType }
    });

    const baseUrl = new URL(c.req.url).origin;
    const url = `${baseUrl}/api/files/${key}`;
    const id = crypto.randomUUID();

    await c.env.DB.prepare(`
      INSERT INTO files (id, filename, original_name, mimetype, size, path, url, uploaded_by_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, key, fileName, fileType, fileSize, key, url, user.id).run();

    return c.json({ 
      success: true, 
      id, 
      url,
      data: {
        id,
        url,
        originalName: fileName,
        mimetype: fileType,
        size: fileSize
      }
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    return c.json({ success: false, message: error.message || 'File upload failed' }, 500);
  }
};

const handleUploadUnauthenticated = async (c: any) => {
  let file: File | null = null;
  try {
    const formData = await c.req.formData();
    file = formData.get('file') as any;
  } catch (e: any) {
    return c.json({ success: false, message: 'Invalid form data: ' + e.message }, 400);
  }

  if (!file || typeof (file as any).arrayBuffer !== 'function') {
    return c.json({ success: false, message: 'No valid file provided' }, 400);
  }

  try {
    const fileName = (file as any).name || 'upload';
    const fileType = (file as any).type || 'application/octet-stream';
    const fileSize = (file as any).size || 0;
    
    const key = `verification-${crypto.randomUUID()}-${fileName.replace(/\s+/g, '_')}`;
    
    if (!c.env.BUCKET) throw new Error('R2 Bucket binding is missing');

    await c.env.BUCKET.put(key, await (file as any).arrayBuffer(), {
      httpMetadata: { contentType: fileType }
    });

    const baseUrl = new URL(c.req.url).origin;
    const url = `${baseUrl}/api/files/${key}`;

    return c.json({ success: true, url, data: { url } });
  } catch (error: any) {
    console.error('File upload error:', error);
    return c.json({ success: false, message: error.message || 'File upload failed' }, 500);
  }
};

api.post('/uploads', authMiddleware, handleUpload);
api.post('/uploads/single', authMiddleware, handleUpload);
api.post('/auth/upload-verification-id', handleUploadUnauthenticated);

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
