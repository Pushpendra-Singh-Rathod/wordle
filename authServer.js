const arctic = require("arctic");

const {
  createUserWithOauth,
  linkUserWithOauth,
  getUserWithOauthId,
  getUserByEmail,
} = require("./schema.js");
require("dotenv").config();

const google = new arctic.Google(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "http://localhost:3000/google/callback"
);
const getLoginPage = async (req, res) => {
  if (req.user) return res.redirect("/");

  const state = arctic.generateState();
  const codeVerifier = arctic.generateCodeVerifier();
  const url = google.createAuthorizationURL(state, codeVerifier, [
    "openid",
    "profile",
    "email",
  ]);

  const cookieConfig = {
    httpOnly: true,
    secure: true,
    maxAge: 60 * 10 * 1000,
    sameSite: "lax",
  };
  res.cookie("google_oauth_state", state, cookieConfig);
  res.cookie("google_code_verifier", codeVerifier, cookieConfig);
  res.redirect(url.toString());
};

const getLoginCallback = async (req, res) => {
  const { code, state } = req.query;

  const {
    google_oauth_state: storedState,
    google_code_verifier: storedCodeVerifier,
  } = req.cookies;

  if (!code || !storedState || state !== storedState || !storedCodeVerifier) {
    res.flash(
      "errors",
      "Couldn't login with Google because of invalid login attempt. Please try again!"
    );
    return res.redirect("/login");
  }
  let tokens;
  try {
    tokens = await google.validateAuthorizationCode(code, storedCodeVerifier);
  } catch (err) {
    res.flash(
      "errors",
      "Couldn't login with Google because of invalid login attempt. Please try again!"
    );
    return res.redirect("/login");
  }

  const claims = arctic.decodeIdToken(tokens.idToken());
  const { sub: googleUserId, name, email } = claims;

  let user = await getUserWithOauthId(email, "google");

  if (user && !user.providerAccountId) {
    await linkUserWithOauth(user.user_id, "google", googleUserId);
  }

  if (!user) {
    await createUserWithOauth({
      name: name,
      email: email,
      password: null,
      provider: "google",
      providerAccountId: googleUserId,
    });
  }

  res.redirect("/content");
};

async function loginWithEmail(req, res) {
  const { email, password } = req.body;

  try {
    let user = await getUserByEmail(email);

    if (!user) {
      user = await getUserWithOauthId(email, "google");
    }

    if (!user) {
      res.flash("errors", "No account found with this email.");
      return res.redirect("/login");
    }

    if (!user.password) {
      res.flash(
        "errors",
        "This account was created using Google. Please continue with Google login."
      );
      return res.redirect("/login");
    }

    if (user.password !== password) {
      res.flash("errors", "Invalid email or password.");
      return res.redirect("/login");
    }

    res.cookie(
      "user",
      JSON.stringify({
        id: user.user_id,
        email: user.email,
        name: user.name,
      }),
      {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60, // 1 hour
      }
    );

    res.flash("success", "Welcome back!");
    return res.redirect("/content");
  } catch (err) {
    console.error("❌ Login error:", err.message);
    res.flash("errors", "Something went wrong. Please try again.");
    return res.redirect("/login");
  }
}

module.exports = { getLoginPage, getLoginCallback, loginWithEmail };
