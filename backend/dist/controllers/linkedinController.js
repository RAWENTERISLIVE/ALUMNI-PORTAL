"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleLinkedInOAuthCallback = exports.getLinkedInOAuthStatus = exports.getLinkedInOAuthUrl = exports.getLinkedInCallbackScript = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../config/prisma"));
const errorHandler_1 = require("../middleware/errorHandler");
const getAuthenticatedUserId = (req) => req.user?.id || req.user?._id;
const linkedInOAuthStatusByUserId = new Map();
const setOAuthStatus = (userId, status) => {
    linkedInOAuthStatusByUserId.set(userId, {
        ...status,
        updatedAt: Date.now(),
    });
};
const getJwtSecret = () => process.env.JWT_SECRET || 'linkedin-oauth-fallback-secret';
const normalizeLinkedInProfileUrl = (input) => {
    if (!input || typeof input !== 'string')
        return undefined;
    const value = input.trim();
    if (!value)
        return undefined;
    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    try {
        const parsed = new URL(withProtocol);
        if (!/(^|\.)linkedin\.com$/i.test(parsed.hostname)) {
            return undefined;
        }
        const profileMatch = parsed.pathname.match(/\/in\/([^/?#]+)/i);
        if (!profileMatch?.[1]) {
            return undefined;
        }
        return `https://www.linkedin.com/in/${profileMatch[1]}`;
    }
    catch {
        return undefined;
    }
};
const getRequestOrigin = (req) => {
    const originHeader = req.get('origin');
    if (originHeader && /^https?:\/\//i.test(originHeader)) {
        return originHeader;
    }
    const refererHeader = req.get('referer');
    if (refererHeader) {
        try {
            const refererUrl = new URL(refererHeader);
            return `${refererUrl.protocol}//${refererUrl.host}`;
        }
        catch {
            return undefined;
        }
    }
    return undefined;
};
const buildLinkedInRedirectUri = (req) => {
    if (process.env.LINKEDIN_REDIRECT_URI)
        return process.env.LINKEDIN_REDIRECT_URI;
    return `${req.protocol}://${req.get('host')}/api/linkedin/callback`;
};
const popupResponse = (res, frontendUrl, payload) => {
    const safeFrontendUrl = frontendUrl || 'http://localhost:8080';
    const payloadJson = JSON.stringify({ source: 'linkedin-oauth', ...payload });
    const encodedPayload = Buffer.from(payloadJson, 'utf8').toString('base64');
    const encodedOrigin = Buffer.from(safeFrontendUrl, 'utf8').toString('base64');
    const script = `<!doctype html><html><body data-payload="${encodedPayload}" data-origin="${encodedOrigin}"><script src="/api/linkedin/callback-script.js"></script></body></html>`;
    res.status(200).type('html').send(script);
};
exports.getLinkedInCallbackScript = (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const js = `(() => {
    const body = document.body;
    const payloadBase64 = body?.dataset?.payload || '';
    const originBase64 = body?.dataset?.origin || '';

    let payload = null;
    let targetOrigin = '*';

    try {
      payload = JSON.parse(atob(payloadBase64));
    } catch {
      payload = { source: 'linkedin-oauth', success: false, message: 'Invalid callback payload.' };
    }

    try {
      targetOrigin = atob(originBase64) || '*';
    } catch {
      targetOrigin = '*';
    }

    try {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(payload, targetOrigin);
      }
    } catch {
      // no-op
    }

    window.close();
  })();`;
    res.status(200).type('application/javascript').send(js);
});
const fetchLinkedInUserInfo = async (accessToken) => {
    const response = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
        },
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`LinkedIn userinfo fetch failed (${response.status}): ${text}`);
    }
    return response.json();
};
const fetchLinkedInMe = async (accessToken) => {
    const response = await fetch('https://api.linkedin.com/v2/me?projection=(id,localizedFirstName,localizedLastName,vanityName,localizedHeadline)', {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
        },
    });
    if (!response.ok) {
        return null;
    }
    return response.json();
};
exports.getLinkedInOAuthUrl = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
    }
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    if (!clientId) {
        res.status(400).json({
            success: false,
            message: 'LinkedIn OAuth is not configured (missing LINKEDIN_CLIENT_ID).',
            redirectUri: buildLinkedInRedirectUri(req)
        });
        return;
    }
    const redirectUri = buildLinkedInRedirectUri(req);
    const scope = process.env.LINKEDIN_SCOPES || 'openid profile email';
    const frontendUrl = getRequestOrigin(req) || process.env.FRONTEND_URL || 'http://localhost:8080';
    const state = jsonwebtoken_1.default.sign({
        userId,
        frontendUrl,
        ts: Date.now(),
    }, getJwtSecret(), { expiresIn: '15m' });
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${encodeURIComponent(state)}`;
    setOAuthStatus(userId, {
        state: 'pending',
        message: 'LinkedIn OAuth started.',
    });
    res.status(200).json({
        success: true,
        data: { url: authUrl, redirectUri, scope }
    });
});
exports.getLinkedInOAuthStatus = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
    }
    const status = linkedInOAuthStatusByUserId.get(userId) || {
        state: 'pending',
        message: 'No LinkedIn OAuth operation found for this user yet.',
        updatedAt: Date.now(),
    };
    res.status(200).json({ success: true, data: status });
});
exports.handleLinkedInOAuthCallback = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const code = typeof req.query.code === 'string' ? req.query.code : '';
    const state = typeof req.query.state === 'string' ? req.query.state : '';
    const oauthError = typeof req.query.error === 'string' ? req.query.error : '';
    const fallbackFrontend = process.env.FRONTEND_URL || 'http://localhost:8080';
    if (!state) {
        popupResponse(res, fallbackFrontend, { success: false, message: 'Missing OAuth state.' });
        return;
    }
    let decodedState;
    try {
        decodedState = jsonwebtoken_1.default.verify(state, getJwtSecret());
    }
    catch {
        popupResponse(res, fallbackFrontend, { success: false, message: 'Invalid or expired OAuth state.' });
        return;
    }
    const userId = decodedState.userId;
    const frontendUrl = decodedState.frontendUrl || fallbackFrontend;
    if (!userId) {
        popupResponse(res, frontendUrl, { success: false, message: 'Invalid OAuth state user.' });
        return;
    }
    if (oauthError) {
        setOAuthStatus(userId, {
            state: 'error',
            message: `LinkedIn OAuth error: ${oauthError}`,
        });
        popupResponse(res, frontendUrl, { success: false, message: `LinkedIn OAuth error: ${oauthError}` });
        return;
    }
    if (!code) {
        setOAuthStatus(userId, {
            state: 'error',
            message: 'Missing OAuth authorization code.',
        });
        popupResponse(res, frontendUrl, { success: false, message: 'Missing OAuth authorization code.' });
        return;
    }
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
        setOAuthStatus(userId, {
            state: 'error',
            message: 'LinkedIn OAuth not configured. Set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET.',
        });
        popupResponse(res, frontendUrl, { success: false, message: 'LinkedIn OAuth not configured. Set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET.' });
        return;
    }
    const redirectUri = buildLinkedInRedirectUri(req);
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
            client_id: clientId,
            client_secret: clientSecret,
        }).toString(),
    });
    if (!tokenResponse.ok) {
        const tokenError = await tokenResponse.text();
        setOAuthStatus(userId, {
            state: 'error',
            message: `Failed to exchange LinkedIn token: ${tokenError}`,
        });
        popupResponse(res, frontendUrl, { success: false, message: `Failed to exchange LinkedIn token: ${tokenError}` });
        return;
    }
    const tokenJson = await tokenResponse.json();
    const accessToken = tokenJson.access_token;
    if (!accessToken) {
        setOAuthStatus(userId, {
            state: 'error',
            message: 'LinkedIn did not return an access token.',
        });
        popupResponse(res, frontendUrl, { success: false, message: 'LinkedIn did not return an access token.' });
        return;
    }
    try {
        const userInfo = await fetchLinkedInUserInfo(accessToken);
        const meInfo = await fetchLinkedInMe(accessToken);
        const vanityName = meInfo?.vanityName || undefined;
        const linkedInProfileUrl = normalizeLinkedInProfileUrl(vanityName ? `https://www.linkedin.com/in/${vanityName}` : userInfo.profile);
        const firstName = meInfo?.localizedFirstName || userInfo.given_name || undefined;
        const lastName = meInfo?.localizedLastName || userInfo.family_name || undefined;
        const fullName = userInfo.name || [firstName, lastName].filter(Boolean).join(' ').trim() || undefined;
        const profileImage = userInfo.picture || undefined;
        const email = userInfo.email || undefined;
        const headline = meInfo?.localizedHeadline || undefined;
        const updatedUser = await prisma_1.default.user.update({
            where: { id: userId },
            data: {
                ...(linkedInProfileUrl ? { linkedInProfile: linkedInProfileUrl } : {}),
                ...(fullName ? { name: fullName } : {}),
                ...(firstName ? { firstName } : {}),
                ...(lastName ? { lastName } : {}),
                ...(profileImage ? { profileImage } : {}),
                ...(email ? { contactEmail: email } : {}),
                ...(headline ? { headline } : {}),
            },
            select: {
                name: true,
                firstName: true,
                lastName: true,
                profileImage: true,
                contactEmail: true,
                linkedInProfile: true,
                headline: true,
            },
        });
        const profilePayload = {
            ...(updatedUser.name ? { name: updatedUser.name } : {}),
            ...(updatedUser.firstName ? { firstName: updatedUser.firstName } : {}),
            ...(updatedUser.lastName ? { lastName: updatedUser.lastName } : {}),
            ...(updatedUser.profileImage ? { profileImage: updatedUser.profileImage } : {}),
            ...(updatedUser.contactEmail ? { contactEmail: updatedUser.contactEmail } : {}),
            ...(updatedUser.linkedInProfile ? { linkedInProfile: updatedUser.linkedInProfile } : {}),
            ...(updatedUser.headline ? { headline: updatedUser.headline } : {}),
        };
        setOAuthStatus(userId, {
            state: 'success',
            message: 'LinkedIn profile imported successfully.',
            profile: profilePayload,
        });
        popupResponse(res, frontendUrl, {
            success: true,
            message: 'LinkedIn profile imported successfully.',
            profile: profilePayload,
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'LinkedIn auto import failed.';
        setOAuthStatus(userId, {
            state: 'error',
            message,
        });
        popupResponse(res, frontendUrl, {
            success: false,
            message,
        });
    }
});
//# sourceMappingURL=linkedinController.js.map