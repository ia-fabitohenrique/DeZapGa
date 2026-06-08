import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import {
  exchangeCodeForSessionToken,
  getOAuthRedirectUrl,
  authMiddleware,
  deleteSession,
  MOCHA_SESSION_TOKEN_COOKIE_NAME,
} from "@getmocha/users-service/backend";

const app = new Hono<{ Bindings: Env }>();

// ==================== AUTH ENDPOINTS ====================

// Obtain redirect URL from the Mocha Users Service
app.get("/api/oauth/google/redirect_url", async (c) => {
  const redirectUrl = await getOAuthRedirectUrl("google", {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  return c.json({ redirectUrl }, 200);
});

// Exchange the code for a session token
app.post("/api/sessions", async (c) => {
  const body = await c.req.json();

  if (!body.code) {
    return c.json({ error: "No authorization code provided" }, 400);
  }

  const sessionToken = await exchangeCodeForSessionToken(body.code, {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 60 * 24 * 60 * 60, // 60 days
  });

  return c.json({ success: true }, 200);
});

// Get the current user object for the frontend
app.get("/api/users/me", authMiddleware, async (c) => {
  return c.json(c.get("user"));
});

// Log out the user
app.get("/api/logout", async (c) => {
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);

  if (typeof sessionToken === "string") {
    await deleteSession(sessionToken, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });
  }

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

// ==================== USER PROFILE ENDPOINTS ====================

// Get or create user profile
app.get("/api/profile", authMiddleware, async (c) => {
  const user = c.get("user")!!;
  const result = await c.env.DB.prepare(
    "SELECT * FROM user_profiles WHERE user_id = ?"
  ).bind(user.id).first();

  if (!result) {
    // Create profile if doesn't exist
    const googleData = user.google_user_data;
    await c.env.DB.prepare(
      `INSERT INTO user_profiles (user_id, username, display_name, avatar_url) VALUES (?, ?, ?, ?)`
    ).bind(
      user.id,
      user.email.split("@")[0],
      googleData.name || googleData.given_name || "Usuário",
      googleData.picture || null
    ).run();

    const newProfile = await c.env.DB.prepare(
      "SELECT * FROM user_profiles WHERE user_id = ?"
    ).bind(user.id).first();
    return c.json(newProfile);
  }

  return c.json(result);
});

// Update user profile
app.put("/api/profile", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const body = await c.req.json();

  await c.env.DB.prepare(
    `UPDATE user_profiles SET 
      username = COALESCE(?, username),
      display_name = COALESCE(?, display_name),
      bio = COALESCE(?, bio),
      avatar_url = COALESCE(?, avatar_url),
      phone = COALESCE(?, phone),
      location_state = COALESCE(?, location_state),
      location_city = COALESCE(?, location_city),
      location_neighborhood = COALESCE(?, location_neighborhood),
      updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?`
  ).bind(
    body.username,
    body.display_name,
    body.bio,
    body.avatar_url,
    body.phone,
    body.location_state,
    body.location_city,
    body.location_neighborhood,
    user.id
  ).run();

  const result = await c.env.DB.prepare(
    "SELECT * FROM user_profiles WHERE user_id = ?"
  ).bind(user.id).first();
  return c.json(result);
});

// Get any user's profile by ID
app.get("/api/users/:userId/profile", async (c) => {
  const userId = c.req.param("userId");
  const result = await c.env.DB.prepare(
    "SELECT id, user_id, username, display_name, bio, avatar_url, location_city, location_state, created_at FROM user_profiles WHERE user_id = ?"
  ).bind(userId).first();

  if (!result) {
    return c.json({ error: "User not found" }, 404);
  }

  // Get followers/following counts
  const followersCount = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM follows WHERE following_id = ?"
  ).bind(userId).first();
  const followingCount = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM follows WHERE follower_id = ?"
  ).bind(userId).first();

  return c.json({
    ...result,
    followers_count: (followersCount as any)?.count || 0,
    following_count: (followingCount as any)?.count || 0,
  });
});

// ==================== POSTS ENDPOINTS ====================

// Get all posts (feed)
app.get("/api/posts", async (c) => {
  const category = c.req.query("category");
  const type = c.req.query("type");
  const status = c.req.query("status") || "available";
  const userId = c.req.query("user_id");
  const search = c.req.query("search");

  let query = "SELECT p.*, up.username, up.display_name, up.avatar_url FROM posts p LEFT JOIN user_profiles up ON p.user_id = up.user_id WHERE 1=1";
  const params: any[] = [];

  if (status) {
    query += " AND p.status = ?";
    params.push(status);
  }
  if (category) {
    query += " AND p.category = ?";
    params.push(category);
  }
  if (type) {
    query += " AND p.type = ?";
    params.push(type);
  }
  if (userId) {
    query += " AND p.user_id = ?";
    params.push(userId);
  }
  if (search) {
    query += " AND (p.title LIKE ? OR p.description LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }

  query += " ORDER BY p.created_at DESC";

  const result = await c.env.DB.prepare(query).bind(...params).all();
  return c.json(result.results);
});

// Get single post
app.get("/api/posts/:postId", async (c) => {
  const postId = c.req.param("postId");
  const result = await c.env.DB.prepare(
    "SELECT p.*, up.username, up.display_name, up.avatar_url FROM posts p LEFT JOIN user_profiles up ON p.user_id = up.user_id WHERE p.id = ?"
  ).bind(postId).first();

  if (!result) {
    return c.json({ error: "Post not found" }, 404);
  }

  // Get hype count
  const hypesCount = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM hypes WHERE post_id = ?"
  ).bind(postId).first();

  return c.json({
    ...result,
    hypes_count: (hypesCount as any)?.count || 0,
  });
});

// Create post
app.post("/api/posts", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const body = await c.req.json();

  const result = await c.env.DB.prepare(
    `INSERT INTO posts (user_id, title, description, price, type, condition, category, images) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    user.id,
    body.title,
    body.description,
    body.price,
    body.type,
    body.condition,
    body.category,
    JSON.stringify(body.images || [])
  ).run();

  return c.json({ id: result.meta.last_row_id, success: true });
});

// Update post
app.put("/api/posts/:postId", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const postId = c.req.param("postId");
  const body = await c.req.json();

  // Verify ownership
  const post = await c.env.DB.prepare(
    "SELECT user_id FROM posts WHERE id = ?"
  ).bind(postId).first();

  if (!post || post.user_id !== user.id) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  await c.env.DB.prepare(
    `UPDATE posts SET 
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      price = COALESCE(?, price),
      type = COALESCE(?, type),
      condition = COALESCE(?, condition),
      category = COALESCE(?, category),
      status = COALESCE(?, status),
      images = COALESCE(?, images),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`
  ).bind(
    body.title,
    body.description,
    body.price,
    body.type,
    body.condition,
    body.category,
    body.status,
    body.images ? JSON.stringify(body.images) : null,
    postId
  ).run();

  return c.json({ success: true });
});

// Delete post
app.delete("/api/posts/:postId", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const postId = c.req.param("postId");

  const post = await c.env.DB.prepare(
    "SELECT user_id FROM posts WHERE id = ?"
  ).bind(postId).first();

  if (!post || post.user_id !== user.id) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  await c.env.DB.prepare("DELETE FROM posts WHERE id = ?").bind(postId).run();
  return c.json({ success: true });
});

// ==================== FOLLOWS ENDPOINTS ====================

// Follow a user
app.post("/api/follows/:userId", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const targetUserId = c.req.param("userId");

  if (user.id === targetUserId) {
    return c.json({ error: "Cannot follow yourself" }, 400);
  }

  try {
    await c.env.DB.prepare(
      "INSERT INTO follows (follower_id, following_id) VALUES (?, ?)"
    ).bind(user.id, targetUserId).run();
    return c.json({ success: true, following: true });
  } catch (e) {
    // Already following
    return c.json({ success: true, following: true });
  }
});

// Unfollow a user
app.delete("/api/follows/:userId", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const targetUserId = c.req.param("userId");

  await c.env.DB.prepare(
    "DELETE FROM follows WHERE follower_id = ? AND following_id = ?"
  ).bind(user.id, targetUserId).run();

  return c.json({ success: true, following: false });
});

// Check if following
app.get("/api/follows/:userId/status", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const targetUserId = c.req.param("userId");

  const result = await c.env.DB.prepare(
    "SELECT id FROM follows WHERE follower_id = ? AND following_id = ?"
  ).bind(user.id, targetUserId).first();

  return c.json({ following: !!result });
});

// Get all user IDs that the current user is following
app.get("/api/follows/my-following", authMiddleware, async (c) => {
  const user = c.get("user")!;
  
  const result = await c.env.DB.prepare(
    "SELECT following_id FROM follows WHERE follower_id = ?"
  ).bind(user.id).all();

  const followingIds = result.results.map((row: any) => row.following_id);
  return c.json({ followingIds });
});

// Get followers of a user
app.get("/api/users/:userId/followers", async (c) => {
  const userId = c.req.param("userId");
  const result = await c.env.DB.prepare(
    `SELECT up.* FROM follows f 
     JOIN user_profiles up ON f.follower_id = up.user_id 
     WHERE f.following_id = ?`
  ).bind(userId).all();

  return c.json(result.results);
});

// Get users that a user is following
app.get("/api/users/:userId/following", async (c) => {
  const userId = c.req.param("userId");
  const result = await c.env.DB.prepare(
    `SELECT up.* FROM follows f 
     JOIN user_profiles up ON f.following_id = up.user_id 
     WHERE f.follower_id = ?`
  ).bind(userId).all();

  return c.json(result.results);
});

// ==================== HYPES ENDPOINTS ====================

// Toggle hype on a post
app.post("/api/posts/:postId/hype", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const postId = c.req.param("postId");

  // Check if already hyped
  const existing = await c.env.DB.prepare(
    "SELECT id FROM hypes WHERE user_id = ? AND post_id = ?"
  ).bind(user.id, postId).first();

  if (existing) {
    // Remove hype
    await c.env.DB.prepare(
      "DELETE FROM hypes WHERE user_id = ? AND post_id = ?"
    ).bind(user.id, postId).run();
    return c.json({ success: true, hyped: false });
  } else {
    // Add hype
    await c.env.DB.prepare(
      "INSERT INTO hypes (user_id, post_id) VALUES (?, ?)"
    ).bind(user.id, postId).run();
    return c.json({ success: true, hyped: true });
  }
});

// Get hype status for a post
app.get("/api/posts/:postId/hype", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const postId = c.req.param("postId");

  const result = await c.env.DB.prepare(
    "SELECT id FROM hypes WHERE user_id = ? AND post_id = ?"
  ).bind(user.id, postId).first();

  const count = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM hypes WHERE post_id = ?"
  ).bind(postId).first();

  return c.json({ 
    hyped: !!result, 
    count: (count as any)?.count || 0 
  });
});

// Get posts hyped by current user
app.get("/api/hypes/my", authMiddleware, async (c) => {
  const user = c.get("user")!;

  const result = await c.env.DB.prepare(
    `SELECT p.*, up.username, up.display_name, up.avatar_url 
     FROM hypes h 
     JOIN posts p ON h.post_id = p.id 
     LEFT JOIN user_profiles up ON p.user_id = up.user_id 
     WHERE h.user_id = ?
     ORDER BY h.created_at DESC`
  ).bind(user.id).all();

  return c.json(result.results);
});

// Get most hyped posts (trending)
app.get("/api/posts/trending", async (c) => {
  const result = await c.env.DB.prepare(
    `SELECT p.*, up.username, up.display_name, up.avatar_url, COUNT(h.id) as hypes_count
     FROM posts p 
     LEFT JOIN user_profiles up ON p.user_id = up.user_id 
     LEFT JOIN hypes h ON p.id = h.post_id
     WHERE p.status = 'available'
     GROUP BY p.id
     ORDER BY hypes_count DESC, p.created_at DESC
     LIMIT 50`
  ).all();

  return c.json(result.results);
});

// ==================== CONVERSATIONS ENDPOINTS ====================

// Get all conversations for current user
app.get("/api/conversations", authMiddleware, async (c) => {
  const user = c.get("user")!;

  const result = await c.env.DB.prepare(
    `SELECT c.*, 
      p.title as post_title, p.images as post_images, p.price as post_price,
      seller.display_name as seller_name, seller.avatar_url as seller_avatar, seller.user_id as seller_user_id,
      buyer.display_name as buyer_name, buyer.avatar_url as buyer_avatar, buyer.user_id as buyer_user_id,
      (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
      (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_id != ? AND is_read = 0) as unread_count
     FROM conversations c
     JOIN posts p ON c.post_id = p.id
     LEFT JOIN user_profiles seller ON c.seller_id = seller.user_id
     LEFT JOIN user_profiles buyer ON c.buyer_id = buyer.user_id
     WHERE c.seller_id = ? OR c.buyer_id = ?
     ORDER BY c.last_message_at DESC`
  ).bind(user.id, user.id, user.id).all();

  return c.json(result.results);
});

// Get or create conversation for a post
app.post("/api/posts/:postId/conversation", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const postId = c.req.param("postId");

  // Get post info
  const post = await c.env.DB.prepare(
    "SELECT user_id FROM posts WHERE id = ?"
  ).bind(postId).first();

  if (!post) {
    return c.json({ error: "Post not found" }, 404);
  }

  if (post.user_id === user.id) {
    return c.json({ error: "Cannot message your own post" }, 400);
  }

  // Check if conversation exists
  const existing = await c.env.DB.prepare(
    "SELECT id FROM conversations WHERE post_id = ? AND buyer_id = ?"
  ).bind(postId, user.id).first();

  if (existing) {
    return c.json({ conversation_id: existing.id });
  }

  // Create new conversation
  const result = await c.env.DB.prepare(
    "INSERT INTO conversations (post_id, buyer_id, seller_id) VALUES (?, ?, ?)"
  ).bind(postId, user.id, post.user_id).run();

  return c.json({ conversation_id: result.meta.last_row_id });
});

// Get messages in a conversation
app.get("/api/conversations/:conversationId/messages", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const conversationId = c.req.param("conversationId");

  // Verify user is part of conversation
  const conv = await c.env.DB.prepare(
    "SELECT * FROM conversations WHERE id = ? AND (seller_id = ? OR buyer_id = ?)"
  ).bind(conversationId, user.id, user.id).first();

  if (!conv) {
    return c.json({ error: "Conversation not found" }, 404);
  }

  // Mark messages as read
  await c.env.DB.prepare(
    "UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_id != ?"
  ).bind(conversationId, user.id).run();

  const messages = await c.env.DB.prepare(
    `SELECT m.*, up.display_name as sender_name, up.avatar_url as sender_avatar
     FROM messages m
     LEFT JOIN user_profiles up ON m.sender_id = up.user_id
     WHERE m.conversation_id = ?
     ORDER BY m.created_at ASC`
  ).bind(conversationId).all();

  return c.json({ conversation: conv, messages: messages.results });
});

// Send a message
app.post("/api/conversations/:conversationId/messages", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const conversationId = c.req.param("conversationId");
  const body = await c.req.json();

  // Verify user is part of conversation
  const conv = await c.env.DB.prepare(
    "SELECT * FROM conversations WHERE id = ? AND (seller_id = ? OR buyer_id = ?)"
  ).bind(conversationId, user.id, user.id).first();

  if (!conv) {
    return c.json({ error: "Conversation not found" }, 404);
  }

  // Insert message
  const result = await c.env.DB.prepare(
    "INSERT INTO messages (conversation_id, sender_id, content) VALUES (?, ?, ?)"
  ).bind(conversationId, user.id, body.content).run();

  // Update conversation last_message_at
  await c.env.DB.prepare(
    "UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(conversationId).run();

  return c.json({ id: result.meta.last_row_id, success: true });
});

// Mark conversation as read
app.put("/api/conversations/:conversationId/read", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const conversationId = c.req.param("conversationId");

  // Verify user is part of conversation
  const conv = await c.env.DB.prepare(
    "SELECT * FROM conversations WHERE id = ? AND (seller_id = ? OR buyer_id = ?)"
  ).bind(conversationId, user.id, user.id).first();

  if (!conv) {
    return c.json({ error: "Conversation not found" }, 404);
  }

  await c.env.DB.prepare(
    "UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_id != ?"
  ).bind(conversationId, user.id).run();

  return c.json({ success: true });
});

// Get unread message count
app.get("/api/messages/unread-count", authMiddleware, async (c) => {
  const user = c.get("user")!;

  const result = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM messages m
     JOIN conversations c ON m.conversation_id = c.id
     WHERE (c.seller_id = ? OR c.buyer_id = ?)
     AND m.sender_id != ?
     AND m.is_read = 0`
  ).bind(user.id, user.id, user.id).first();

  return c.json({ count: (result as any)?.count || 0 });
});

// ==================== FILE UPLOAD ENDPOINTS ====================

// Upload post images endpoint (up to 5 images)
app.post("/api/upload/post-images", async (c) => {
  try {
    const formData = await c.req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return c.json({ error: "No files provided" }, 400);
    }

    if (files.length > 5) {
      return c.json({ error: "Maximum 5 images allowed" }, 400);
    }

    const uploadedUrls: string[] = [];
    const timestamp = Date.now();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const extension = file.name.split(".").pop() || "jpg";
      const key = `posts/${timestamp}-${i}.${extension}`;

      await c.env.R2_BUCKET.put(key, file.stream(), {
        httpMetadata: {
          contentType: file.type,
        },
      });

      uploadedUrls.push(`/api/files/${key}`);
    }

    return c.json({ urls: uploadedUrls });
  } catch (error) {
    console.error("Upload error:", error);
    return c.json({ error: "Upload failed" }, 500);
  }
});

// Upload avatar endpoint
app.post("/api/upload/avatar", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return c.json({ error: "No file provided" }, 400);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split(".").pop() || "jpg";
    const key = `avatars/${timestamp}.${extension}`;

    // Upload to R2
    await c.env.R2_BUCKET.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // Return the URL to access the file
    const url = `/api/files/${key}`;

    return c.json({ url, key });
  } catch (error) {
    console.error("Upload error:", error);
    return c.json({ error: "Upload failed" }, 500);
  }
});

// Serve files from R2
app.get("/api/files/*", async (c) => {
  const key = c.req.path.replace("/api/files/", "");

  const object = await c.env.R2_BUCKET.get(key);

  if (!object) {
    return c.json({ error: "File not found" }, 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000");

  return c.body(object.body, { headers });
});

export default app;
