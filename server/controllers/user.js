import auth from "../config/firebase-config.js";

export const getAllUsers = async (req, res) => {
  const maxResults = 1000;
  let users = [];

  try {
    const userRecords = await auth.listUsers(maxResults);

    userRecords.users.forEach((user) => {
      const { uid, email, displayName, photoURL } = user;
      const safeDisplayName = displayName || email || uid;
      users.push({ uid, email, displayName: safeDisplayName, photoURL });
    });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to list users" });
  }
};

export const getUser = async (req, res) => {
  try {
    const userRecord = await auth.getUser(req.params.userId);

    const { uid, email, displayName, photoURL } = userRecord;

    const safeDisplayName = displayName || email || uid;
    res.status(200).json({ uid, email, displayName: safeDisplayName, photoURL });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch user" });
  }
};

export const searchUsers = async (req, res) => {
  try {
    // Accept flexible payload shapes:
    // - { query: "..." }
    // - { searchQuery: "..." }
    // - "some text" (raw JSON string)
    const rawBody = req.body;
    const query =
      (typeof rawBody === "string" ? rawBody : rawBody?.query) ||
      (typeof rawBody === "string" ? rawBody : rawBody?.searchQuery) ||
      (typeof rawBody === "string" ? rawBody : rawBody?.q) ||
      "";

    const q = String(query).trim().toLowerCase();
    if (!q) return res.status(200).json([]);

    const maxResults = 1000;
    const userRecords = await auth.listUsers(maxResults);

    const matches = userRecords.users
      .filter((u) => {
        const displayName = (u.displayName || u.email || u.uid || "").toLowerCase();
        const email = (u.email || "").toLowerCase();
        const uid = (u.uid || "").toLowerCase();
        return displayName.includes(q) || email.includes(q) || uid.includes(q);
      })
      .map((u) => {
        const { uid, email, displayName, photoURL } = u;
        const safeDisplayName = displayName || email || uid;
        return { uid, email, displayName: safeDisplayName, photoURL };
      });

    res.status(200).json(matches);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to search users" });
  }
};
