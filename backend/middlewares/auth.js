// Login-only auth. There is no plan/tier system: every signed-in user gets
// the same access.
export const auth = async (req, res, next) => {
  try {
    const { userId } = req.auth();
    if (!userId) {
      return res.status(401).json({ success: false, message: "please sign in" });
    }
    req.userId = userId;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "authentication required" });
  }
};
