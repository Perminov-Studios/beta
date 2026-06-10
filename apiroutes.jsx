const DEFAULT_API_BASE_URL = "https://beta-api.perminov.studio/api";
const AUTH_TOKEN_KEY = "perminovstudio.authToken";
const AUTH_USER_KEY = "perminovstudio.authUser";
const AUTH_PERSIST_KEY = "perminovstudio.authPersist";
const AUTH_TOKEN_KEYS = [AUTH_TOKEN_KEY, "authToken", "token", "accessToken"];

function normalizeBaseUrl(baseUrl) {
	return String(baseUrl || DEFAULT_API_BASE_URL).replace(/\/+$/, "");
}

export const API_BASE_URL = normalizeBaseUrl(
	import.meta.env.VITE_API_URL ||
		import.meta.env.VITE_BACKEND_URL ||
		DEFAULT_API_BASE_URL
);

function safeStorageValue(storage, key) {
	try {
		return storage?.getItem(key) || null;
	} catch {
		return null;
	}
}

function safeStorageSet(storage, key, value) {
	try {
		storage?.setItem(key, value);
	} catch {
		// ignore storage failures
	}
}

function safeStorageRemove(storage, key) {
	try {
		storage?.removeItem(key);
	} catch {
		// ignore storage failures
	}
}

export function saveAuthToken(token) {
	if (typeof window === "undefined" || !token) return;
	safeStorageSet(window.localStorage, AUTH_TOKEN_KEY, token);
}

function readAuthSession(storage) {
	const token = safeStorageValue(storage, AUTH_TOKEN_KEY);
	const userRaw = safeStorageValue(storage, AUTH_USER_KEY);
	const persist = safeStorageValue(storage, AUTH_PERSIST_KEY);

	if (!token && !userRaw) return null;

	let user = null;
	if (userRaw) {
		try {
			user = JSON.parse(userRaw);
		} catch {
			user = null;
		}
	}

	return {
		token,
		user,
		remember: persist === "true",
	};
}

export function saveAuthSession({ token, user, remember = true } = {}) {
	if (typeof window === "undefined") return;

	const storage = remember ? window.localStorage : window.sessionStorage;
	const otherStorage = remember ? window.sessionStorage : window.localStorage;

	if (token !== undefined) {
		if (token === null) {
			safeStorageRemove(storage, AUTH_TOKEN_KEY);
		} else {
			safeStorageSet(storage, AUTH_TOKEN_KEY, token);
		}
	}

	if (user !== undefined) {
		if (user === null) {
			safeStorageRemove(storage, AUTH_USER_KEY);
		} else {
			safeStorageSet(storage, AUTH_USER_KEY, JSON.stringify(user));
		}
	}

	safeStorageSet(storage, AUTH_PERSIST_KEY, remember ? "true" : "false");
	safeStorageRemove(otherStorage, AUTH_TOKEN_KEY);
	safeStorageRemove(otherStorage, AUTH_USER_KEY);
	safeStorageRemove(otherStorage, AUTH_PERSIST_KEY);
}

export function getAuthToken() {
	if (typeof window === "undefined") return null;

	const localSession = readAuthSession(window.localStorage);
	if (localSession?.token) return localSession.token;

	const sessionSession = readAuthSession(window.sessionStorage);
	if (sessionSession?.token) return sessionSession.token;

	for (const key of AUTH_TOKEN_KEYS) {
		const storedToken = safeStorageValue(window.localStorage, key);
		if (storedToken) return storedToken;
	}

	for (const key of AUTH_TOKEN_KEYS) {
		const storedToken = safeStorageValue(window.sessionStorage, key);
		if (storedToken) return storedToken;
	}

	return null;
}

export function getAuthSession() {
	if (typeof window === "undefined") return null;

	const localSession = readAuthSession(window.localStorage);
	if (localSession?.token) return localSession;

	const sessionSession = readAuthSession(window.sessionStorage);
	if (sessionSession?.token) return sessionSession;

	for (const key of AUTH_TOKEN_KEYS) {
		const storedToken = safeStorageValue(window.localStorage, key);
		if (storedToken) {
			return {
				token: storedToken,
				user: null,
				remember: true,
			};
		}
	}

	for (const key of AUTH_TOKEN_KEYS) {
		const storedToken = safeStorageValue(window.sessionStorage, key);
		if (storedToken) {
			return {
				token: storedToken,
				user: null,
				remember: false,
			};
		}
	}

	return null;
}

export function getAuthUser() {
	return getAuthSession()?.user || null;
}

export function clearAuthToken() {
	if (typeof window === "undefined") return;

	for (const key of AUTH_TOKEN_KEYS) {
		safeStorageRemove(window.localStorage, key);
		safeStorageRemove(window.sessionStorage, key);
	}
}

export function clearAuthSession() {
	if (typeof window === "undefined") return;

	for (const key of [
		...AUTH_TOKEN_KEYS,
		AUTH_USER_KEY,
		AUTH_PERSIST_KEY,
	]) {
		safeStorageRemove(window.localStorage, key);
		safeStorageRemove(window.sessionStorage, key);
	}
}

function joinUrl(baseUrl, path) {
	if (/^https?:\/\//i.test(path)) {
		return path;
	}

	const normalizedPath = path.startsWith("/") ? path : `/${path}`;
	return `${baseUrl}${normalizedPath}`;
}

function buildRequestUrl(path, query) {
	const url = new URL(joinUrl(API_BASE_URL, path));

	if (query && typeof query === "object") {
		Object.entries(query).forEach(([key, value]) => {
			if (value === undefined || value === null || value === "") return;

			if (Array.isArray(value)) {
				value.forEach((item) => {
					if (item !== undefined && item !== null && item !== "") {
						url.searchParams.append(key, String(item));
					}
				});
				return;
			}

			url.searchParams.set(key, String(value));
		});
	}

	return url.toString();
}

function appendFormValue(formData, key, value) {
	if (value === undefined || value === null) return;

	if (Array.isArray(value)) {
		value.forEach((item) => appendFormValue(formData, key, item));
		return;
	}

	if (typeof File !== "undefined" && value instanceof File) {
		formData.append(key, value);
		return;
	}

	if (typeof Blob !== "undefined" && value instanceof Blob) {
		formData.append(key, value);
		return;
	}

	if (typeof value === "object") {
		formData.append(key, JSON.stringify(value));
		return;
	}

	formData.append(key, String(value));
}

function createFormData(payload = {}) {
	if (typeof FormData !== "undefined" && payload instanceof FormData) {
		return payload;
	}

	const formData = new FormData();
	Object.entries(payload || {}).forEach(([key, value]) => {
		appendFormValue(formData, key, value);
	});
	return formData;
}

async function parseResponseBody(response) {
	if (response.status === 204) return null;

	const contentType = response.headers.get("content-type") || "";
	if (contentType.includes("application/json")) {
		try {
			return await response.json();
		} catch {
			return null;
		}
	}

	const text = await response.text();
	if (!text) return null;

	try {
		return JSON.parse(text);
	} catch {
		return text;
	}
}

function createApiError(response, data) {
	const message =
		data?.error || data?.message || `Request failed with status ${response.status}`;
	const error = new Error(message);
	error.status = response.status;
	error.data = data;
	error.response = response;
	return error;
}

export async function apiRequest(
	path,
	{
		method = "GET",
		query,
		body,
		token,
		auth = false,
		apiKey,
		headers = {},
		multipart = false,
		credentials = "include",
	} = {}
) {
	const requestHeaders = new Headers(headers);
	requestHeaders.set("Accept", "application/json");

	const resolvedToken = token ?? (auth ? getAuthToken() : null);
	if (resolvedToken) {
		requestHeaders.set("Authorization", `Bearer ${resolvedToken}`);
	}

	if (apiKey) {
		requestHeaders.set("x-api-key", apiKey);
	}

	let requestBody;
	const hasBody = body !== undefined && body !== null && method !== "GET" && method !== "HEAD";

	if (hasBody) {
		if (typeof FormData !== "undefined" && body instanceof FormData) {
			requestBody = body;
		} else if (multipart) {
			requestBody = createFormData(body);
		} else {
			requestHeaders.set("Content-Type", "application/json");
			requestBody = typeof body === "string" ? body : JSON.stringify(body);
		}
	}

	const response = await fetch(buildRequestUrl(path, query), {
		method,
		headers: requestHeaders,
		body: requestBody,
		credentials,
	});

	const data = await parseResponseBody(response);

	if (!response.ok) {
		throw createApiError(response, data);
	}

	return data;
}

const requestGet = (path, options = {}) => apiRequest(path, { ...options, method: "GET" });
const requestPost = (path, body, options = {}) => apiRequest(path, { ...options, method: "POST", body });
const requestPut = (path, body, options = {}) => apiRequest(path, { ...options, method: "PUT", body });
const requestDelete = (path, options = {}) => apiRequest(path, { ...options, method: "DELETE" });

const analyticsApiKey = import.meta.env.VITE_ANALYTICS_API_KEY || "";

export const authApi = {
	register: (payload) => requestPost("/auth/register", payload, { multipart: true }),
	login: (payload) => requestPost("/auth/login", payload),
	confirmEmail: (token) => requestGet(`/auth/confirm/${encodeURIComponent(token)}`),
	requestPasswordReset: (payload) => requestPost("/auth/reset-password-request", payload),
	resetPassword: (token, payload) =>
		requestPost(`/auth/reset-password/${encodeURIComponent(token)}`, payload),
};

export const usersApi = {
	list: (query = {}, token) => requestGet("/users", { query, auth: true, token }),
	getMe: (token) => requestGet("/users/me", { auth: true, token }),
	getById: (userId, token) => requestGet(`/users/${encodeURIComponent(userId)}`, { auth: true, token }),
	getPublicById: (userId) => requestGet(`/users/${encodeURIComponent(userId)}/public`),
	getPublicByUsername: (username) =>
		requestGet(`/users/username/${encodeURIComponent(username)}/public`),
	update: (userId, payload, token) =>
		requestPut(`/users/${encodeURIComponent(userId)}`, payload, {
			auth: true,
			token,
			multipart: true,
		}),
	remove: (userId, token) => requestDelete(`/users/${encodeURIComponent(userId)}`, { auth: true, token }),
	getNsfwAccess: (userId, token) =>
		requestGet(`/users/${encodeURIComponent(userId)}/nsfw-access`, { auth: true, token }),
	updateNsfwAccess: (userId, nsfwAccess, token) =>
		requestPut(
			`/users/${encodeURIComponent(userId)}/nsfw-access`,
			{ nsfwAccess },
			{ auth: true, token }
		),
};

export const imagesApi = {
	listMine: (query = {}, token) => requestGet("/images", { query, auth: true, token }),
	getPublic: (query = {}, token) => requestGet("/images/public", { query, auth: true, token }),
	getPublicByUser: (userId, query = {}, token) =>
		requestGet(`/images/public/by-user/${encodeURIComponent(userId)}`, {
			query,
			auth: true,
			token,
		}),
	search: (query = {}, token) => requestGet("/images/search", { query, auth: true, token }),
	getById: (imageId, token) => requestGet(`/images/${encodeURIComponent(imageId)}`, { auth: true, token }),
	upload: (payload, token) =>
		requestPost("/images/upload", payload, { auth: true, token, multipart: true }),
	update: (imageId, payload, token) =>
		requestPut(`/images/${encodeURIComponent(imageId)}`, payload, { auth: true, token }),
	updateNsfw: (imageId, isNSFW, token) =>
		requestPut(`/images/${encodeURIComponent(imageId)}/nsfw`, { isNSFW }, { auth: true, token }),
	remove: (imageId, token) => requestDelete(`/images/${encodeURIComponent(imageId)}`, { auth: true, token }),
	like: (imageId, token) => requestPost(`/images/${encodeURIComponent(imageId)}/like`, null, { auth: true, token }),
	unlike: (imageId, token) => requestDelete(`/images/${encodeURIComponent(imageId)}/like`, { auth: true, token }),
	getLikes: (imageId, token) => requestGet(`/images/${encodeURIComponent(imageId)}/likes`, { auth: true, token }),
	getLikers: (imageId, token) => requestGet(`/images/${encodeURIComponent(imageId)}/likers`, { auth: true, token }),
	addComment: (imageId, content, token) =>
		requestPost(
			`/images/${encodeURIComponent(imageId)}/comments`,
			{ content },
			{ auth: true, token }
		),
	getComments: (imageId) => requestGet(`/images/${encodeURIComponent(imageId)}/comments`),
	reorder: (imageOrders, token) =>
		requestPut("/images/reorder", { imageOrders }, { auth: true, token }),
	getCategories: (token) => requestGet("/images/categories/mine", { auth: true, token }),
	getCategoriesByUser: (userId) =>
		requestGet(`/images/categories/by-user/${encodeURIComponent(userId)}`),
	createCategory: (payload, token) => requestPost("/images/categories", payload, { auth: true, token }),
	updateCategory: (categoryId, payload, token) =>
		requestPut(`/images/categories/${encodeURIComponent(categoryId)}`, payload, {
			auth: true,
			token,
		}),
	removeCategory: (categoryId, token) =>
		requestDelete(`/images/categories/${encodeURIComponent(categoryId)}`, { auth: true, token }),
	reorderCategories: (categoryOrders, token) =>
		requestPut("/images/categories/reorder", { categoryOrders }, { auth: true, token }),
	debugListAll: (token) => requestGet("/images/debug/all-images", { auth: true, token }),
	debugDeleteAll: (token) => requestDelete("/images/debug/delete-all", { auth: true, token }),
};

export const chatsApi = {
	list: (query = {}, token) => requestGet("/chats", { query, auth: true, token }),
	getById: (chatId, query = {}, token) =>
		requestGet(`/chats/${encodeURIComponent(chatId)}`, { query, auth: true, token }),
	create: (payload, token) => requestPost("/chats", payload, { auth: true, token }),
	update: (chatId, payload, token) =>
		requestPut(`/chats/${encodeURIComponent(chatId)}`, payload, { auth: true, token }),
	remove: (chatId, token) => requestDelete(`/chats/${encodeURIComponent(chatId)}`, { auth: true, token }),
	deleteMessages: (chatId, token) =>
		requestDelete(`/chats/${encodeURIComponent(chatId)}/messages`, { auth: true, token }),
	sendMessage: (chatId, payload, token) =>
		requestPost(`/chats/${encodeURIComponent(chatId)}/messages`, payload, { auth: true, token }),
	uploadFile: (chatId, payload, token) =>
		requestPost(`/chats/${encodeURIComponent(chatId)}/upload`, payload, {
			auth: true,
			token,
			multipart: true,
		}),
	deleteMessage: (chatId, messageId, token) =>
		requestDelete(
			`/chats/${encodeURIComponent(chatId)}/messages/${encodeURIComponent(messageId)}`,
			{ auth: true, token }
		),
};

export const followsApi = {
	follow: (userId, token) =>
		requestPost(`/follows/${encodeURIComponent(userId)}/follow`, null, { auth: true, token }),
	unfollow: (userId, token) =>
		requestDelete(`/follows/${encodeURIComponent(userId)}/follow`, { auth: true, token }),
	isFollowing: (userId, token) =>
		requestGet(`/follows/${encodeURIComponent(userId)}/is-following`, { auth: true, token }),
	getFollowers: (userId, query = {}) =>
		requestGet(`/follows/${encodeURIComponent(userId)}/followers`, { query }),
	getFollowing: (userId, query = {}) =>
		requestGet(`/follows/${encodeURIComponent(userId)}/following`, { query }),
	getCounts: (userId) => requestGet(`/follows/${encodeURIComponent(userId)}/counts`),
};

export const notificationsApi = {
	list: (query = {}, token) => requestGet("/notifications", { query, auth: true, token }),
	getUnreadCount: (token) => requestGet("/notifications/unread-count", { auth: true, token }),
	markRead: (notificationId, token) =>
		requestPost(`/notifications/${encodeURIComponent(notificationId)}/read`, null, {
			auth: true,
			token,
		}),
	markAllRead: (token) => requestPost("/notifications/read-all", null, { auth: true, token }),
	remove: (notificationId, token) =>
		requestDelete(`/notifications/${encodeURIComponent(notificationId)}`, { auth: true, token }),
	clear: (token) => requestDelete("/notifications", { auth: true, token }),
	proUpgrade: (token) => requestPost("/notifications/pro-upgrade", null, { auth: true, token }),
	getChangelog: () => requestGet("/notifications/changelog"),
};

export const reportsApi = {
	create: (payload, token) => requestPost("/reports", payload, { auth: true, token }),
	list: (query = {}, token) => requestGet("/reports", { query, auth: true, token }),
	update: (reportId, payload, token) =>
		requestPut(`/reports/${encodeURIComponent(reportId)}`, payload, { auth: true, token }),
	remove: (reportId, token) => requestDelete(`/reports/${encodeURIComponent(reportId)}`, { auth: true, token }),
};

export const adminApi = {
	login: (payload) => requestPost("/admin/login", payload),
	me: (token) => requestGet("/admin/me", { auth: true, token }),
	getStats: (token) => requestGet("/admin/stats", { auth: true, token }),
	getPendingImages: (query = {}, token) =>
		requestGet("/admin/images/pending", { query, auth: true, token }),
	approveImage: (imageId, token) =>
		requestPost(`/admin/images/${encodeURIComponent(imageId)}/approve`, null, {
			auth: true,
			token,
		}),
	rejectImage: (imageId, payload = {}, token) =>
		requestPost(`/admin/images/${encodeURIComponent(imageId)}/reject`, payload, {
			auth: true,
			token,
		}),
	bulkApproveImages: (imageIds, token) =>
		requestPost("/admin/images/bulk-approve", { imageIds }, { auth: true, token }),
	getImages: (query = {}, token) => requestGet("/admin/images", { query, auth: true, token }),
	listUsers: (query = {}, token) => requestGet("/admin/users", { query, auth: true, token }),
	getUserDetail: (userId, token) =>
		requestGet(`/admin/users/${encodeURIComponent(userId)}/detail`, { auth: true, token }),
	updateUserRole: (userId, role, token) =>
		requestPut(`/admin/users/${encodeURIComponent(userId)}/role`, { role }, { auth: true, token }),
	removeUser: (userId, token) =>
		requestDelete(`/admin/users/${encodeURIComponent(userId)}`, { auth: true, token }),
	listReports: (query = {}, token) => requestGet("/admin/reports", { query, auth: true, token }),
	sendNotification: (userId, message, token) =>
		requestPost(
			`/admin/users/${encodeURIComponent(userId)}/notify`,
			{ message },
			{ auth: true, token }
		),
	fixHiddenImages: (token) => requestPost("/admin/fix-hidden-images", null, { auth: true, token }),
	issueWarning: (userId, reason, token) =>
		requestPost(
			`/admin/users/${encodeURIComponent(userId)}/warn`,
			{ reason },
			{ auth: true, token }
		),
	getWarnings: (userId, query = {}, token) =>
		requestGet(`/admin/users/${encodeURIComponent(userId)}/warnings`, {
			query,
			auth: true,
			token,
		}),
	banUser: (userId, payload, token) =>
		requestPost(`/admin/users/${encodeURIComponent(userId)}/ban`, payload, {
			auth: true,
			token,
		}),
	unbanUser: (userId, token) =>
		requestPost(`/admin/users/${encodeURIComponent(userId)}/unban`, null, { auth: true, token }),
	getBans: (userId, query = {}, token) =>
		requestGet(`/admin/users/${encodeURIComponent(userId)}/bans`, {
			query,
			auth: true,
			token,
		}),
	getBanStatus: (userId, token) =>
		requestGet(`/admin/users/${encodeURIComponent(userId)}/ban-status`, { auth: true, token }),
};

export const settingsApi = {
	get: (token) => requestGet("/settings", { auth: true, token }),
	updateAppearance: (payload, token) =>
		requestPut("/settings/appearance", payload, { auth: true, token }),
	updateNotifications: (payload, token) =>
		requestPut("/settings/notifications", payload, { auth: true, token }),
	updatePrivacy: (payload, token) =>
		requestPut("/settings/privacy", payload, { auth: true, token }),
	updateSocialLinks: (socialLinks, token) =>
		requestPut("/settings/social-links", { socialLinks }, { auth: true, token }),
	getSections: (token) => requestGet("/settings/sections", { auth: true, token }),
	updateSections: (sections, token) =>
		requestPut("/settings/sections", sections, { auth: true, token }),
};

export const analyticsApi = {
	trackEvent: (payload, token, apiKey = analyticsApiKey) =>
		requestPost("/analytics", payload, { auth: true, token, apiKey }),
	getEvents: (query = {}, token, apiKey = analyticsApiKey) =>
		requestGet("/analytics", { query, auth: true, token, apiKey }),
};

export const imageInfoApi = {
	getById: (imageId) => requestGet(`/imageinfo/${encodeURIComponent(imageId)}`),
};

export const errorsApi = {
	list: (token) => requestGet("/errors", { auth: true, token }),
};

export const systemApi = {
	health: () => requestGet("/health"),
	test: (payload) => requestPost("/test", payload),
};

export const apiRoutes = {
	auth: authApi,
	users: usersApi,
	images: imagesApi,
	chats: chatsApi,
	follows: followsApi,
	notifications: notificationsApi,
	reports: reportsApi,
	admin: adminApi,
	settings: settingsApi,
	analytics: analyticsApi,
	imageInfo: imageInfoApi,
	errors: errorsApi,
	system: systemApi,
};

export default apiRoutes;
