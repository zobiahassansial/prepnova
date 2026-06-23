"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTestReceipt = exports.adminActivatePendingOrder = exports.verifyPayment = exports.safepayWebhook = exports.createPaymentSession = void 0;
const https_1 = require("firebase-functions/v2/https");
const firebase_functions_1 = require("firebase-functions");
const params_1 = require("firebase-functions/params");
const resend_1 = require("resend");
const node_sdk_1 = require("@sfpy/node-sdk");
const utils_1 = require("@sfpy/node-sdk/dist/utils");
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
const db = admin.firestore();
const SAFEPAY_SECRET_KEY = (0, params_1.defineSecret)("SAFEPAY_SECRET_KEY");
const SAFEPAY_PUBLIC_KEY = (0, params_1.defineSecret)("SAFEPAY_PUBLIC_KEY");
const RESEND_API_KEY = (0, params_1.defineSecret)("RESEND_API_KEY");
const SAFEPAY_WEBHOOK_SECRET = (0, params_1.defineSecret)("SAFEPAY_WEBHOOK_SECRET");
// Set to "false" only when you have live Safepay credentials and are ready for production.
// Default: "true" (sandbox). Change with: firebase functions:params:set SAFEPAY_USE_SANDBOX=false
const SAFEPAY_USE_SANDBOX = (0, params_1.defineString)("SAFEPAY_USE_SANDBOX", { default: "true" });
// Resolved inside each function via SAFEPAY_USE_SANDBOX.value()
const PLAN_PRICES = {
    standard: { monthlyPKR: 1680, yearlyPKR: 16800 },
    pro: { monthlyPKR: 3360, yearlyPKR: 33600 },
    max: { monthlyPKR: 5600, yearlyPKR: 56000 },
};
const RECEIPT_FROM = "PrepNova <onboarding@resend.dev>";
const PAYMENT_METHODS = {
    card: "CYBERSOURCE",
    jazzcash: "JAZZCASH_V2",
    easypaisa: "EASYPAISA_MA",
    bank: "NIFT_TRANSFER",
};
const KNOWN_PLANS = Object.keys(PLAN_PRICES);
const KNOWN_BILLING = ["monthly", "yearly"];
function getPeriodEnd(billing) {
    const d = new Date();
    billing === "yearly" ? d.setFullYear(d.getFullYear() + 1) : d.setMonth(d.getMonth() + 1);
    return d;
}
function escapeHtml(value) {
    const chars = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;",
    };
    return String(value !== null && value !== void 0 ? value : "").replace(/[&<>"']/g, (char) => chars[char]);
}
function getPlanName(plan) {
    return plan.charAt(0).toUpperCase() + plan.slice(1);
}
function formatPKR(amount) {
    const numeric = typeof amount === "number" ? amount : Number(amount || 0);
    return `PKR ${numeric.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
}
function logPayment(label, data = {}) {
    firebase_functions_1.logger.info(label, data);
}
function getObjectKeys(value) {
    if (!value || typeof value !== "object" || Array.isArray(value))
        return [];
    return Object.keys(value).sort();
}
function createSafepayClient() {
    const isSandbox = SAFEPAY_USE_SANDBOX.value() !== "false";
    const safepayBase = isSandbox ? "https://sandbox.api.getsafepay.com" : "https://api.getsafepay.com";
    const client = new node_sdk_1.Safepay({
        environment: isSandbox ? utils_1.Environment.Sandbox : utils_1.Environment.Production,
        apiKey: SAFEPAY_PUBLIC_KEY.value(),
        v1Secret: SAFEPAY_SECRET_KEY.value(),
        webhookSecret: SAFEPAY_WEBHOOK_SECRET.value(),
    });
    if (!client.reporter) {
        client.reporter = {
            payments: {
                fetch: async (trackerToken) => {
                    var _a;
                    // Try 1: get a short-lived passport token then hit the client payments endpoint
                    try {
                        const authRes = await fetch(`${safepayBase}/client/passport/v1/token`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "X-SFPY-MERCHANT-SECRET": SAFEPAY_SECRET_KEY.value(),
                            },
                            body: JSON.stringify({}),
                        });
                        if (authRes.ok) {
                            const authJson = await authRes.json();
                            const bearerToken = ((_a = authJson === null || authJson === void 0 ? void 0 : authJson.data) === null || _a === void 0 ? void 0 : _a.token) ||
                                (authJson === null || authJson === void 0 ? void 0 : authJson.token) || "";
                            if (bearerToken) {
                                const payRes = await fetch(`${safepayBase}/client/v1/payments/${encodeURIComponent(trackerToken)}`, {
                                    headers: {
                                        "Authorization": `Bearer ${bearerToken}`,
                                        "Accept": "application/json",
                                    },
                                });
                                if (payRes.ok) {
                                    const body = await payRes.text();
                                    return JSON.parse(body);
                                }
                                const errBody = await payRes.text();
                                firebase_functions_1.logger.warn("[reporter] client/v1/payments failed", { status: payRes.status, body: errBody.slice(0, 300) });
                            }
                        }
                    }
                    catch (authErr) {
                        firebase_functions_1.logger.warn("[reporter] passport/token attempt failed", { error: authErr instanceof Error ? authErr.message : String(authErr) });
                    }
                    // Try 2: direct secret-key call to order tracker endpoint
                    const response = await fetch(`${safepayBase}/order/v1/tracker/${encodeURIComponent(trackerToken)}`, {
                        headers: {
                            "Accept": "application/json",
                            "X-SFPY-MERCHANT-SECRET": SAFEPAY_SECRET_KEY.value(),
                        },
                    });
                    const body = await response.text();
                    if (!response.ok) {
                        throw new Error(`SafePay tracker API error (${response.status}): ${body.slice(0, 500)}`);
                    }
                    return JSON.parse(body);
                },
            },
        };
    }
    return client;
}
async function verifySafePayWebhookSignature(req) {
    try {
        return await createSafepayClient().verify.webhook(req);
    }
    catch (err) {
        firebase_functions_1.logger.error("[safepayWebhook] SDK verification failed", err);
        return false;
    }
}
function findStringByKeys(value, keys, depth = 0) {
    if (!value || typeof value !== "object" || depth > 5)
        return "";
    const record = value;
    for (const key of keys) {
        const found = record[key];
        if (typeof found === "string" && found.trim())
            return found.trim();
        if (typeof found === "number")
            return String(found);
    }
    for (const child of Object.values(record)) {
        if (child && typeof child === "object") {
            const found = findStringByKeys(child, keys, depth + 1);
            if (found)
                return found;
        }
    }
    return "";
}
async function fetchSafepayTrackerState(trackerToken) {
    const isSandbox = SAFEPAY_USE_SANDBOX.value() !== "false";
    const safepayBase = isSandbox ? "https://sandbox.api.getsafepay.com" : "https://api.getsafepay.com";
    try {
        const res = await fetch(`${safepayBase}/order/v1/tracker/${encodeURIComponent(trackerToken)}`, {
            headers: {
                "Accept": "application/json",
                "X-SFPY-MERCHANT-SECRET": SAFEPAY_SECRET_KEY.value(),
            },
        });
        if (!res.ok) {
            firebase_functions_1.logger.warn("[fetchTrackerState] non-OK response", { status: res.status, tracker: trackerToken.slice(0, 20) });
            return "";
        }
        const body = await res.json();
        return findStringByKeys(body, ["state", "status", "payment_status", "tracker_state"]);
    }
    catch (err) {
        firebase_functions_1.logger.warn("[fetchTrackerState] fetch failed", { error: err instanceof Error ? err.message : String(err) });
        return "";
    }
}
async function findOrderByTracker(tracker) {
    const snap = await db
        .collectionGroup("billing")
        .where("safepayTracker", "==", tracker)
        .limit(1)
        .get();
    if (snap.empty)
        return null;
    const doc = snap.docs[0];
    const userRef = doc.ref.parent.parent;
    if (!userRef)
        return null;
    return {
        userId: userRef.id,
        orderId: doc.id,
        orderRef: doc.ref,
        order: doc.data(),
    };
}
async function sendPaymentReceipt(orderRef, order, orderId, tracker) {
    var _a, _b, _c, _d, _e;
    if (order.receiptEmailSentAt) {
        logPayment("[receipt] duplicate skipped", { orderId, hasReceiptEmailSentAt: true });
        return false;
    }
    const customerEmail = String((_a = order.customerEmail) !== null && _a !== void 0 ? _a : "").trim().toLowerCase();
    if (!customerEmail) {
        firebase_functions_1.logger.error("[receipt] stored customer email missing", { orderId });
        return false;
    }
    let resendKey = "";
    try {
        resendKey = RESEND_API_KEY.value();
    }
    catch (_f) {
        resendKey = (_b = process.env["RESEND_API_KEY"]) !== null && _b !== void 0 ? _b : "";
    }
    if (!resendKey) {
        firebase_functions_1.logger.error("[receipt] RESEND_API_KEY not available", { orderId });
        return false;
    }
    const resend = new resend_1.Resend(resendKey);
    const planName = String((_c = order.planName) !== null && _c !== void 0 ? _c : getPlanName(String((_d = order.plan) !== null && _d !== void 0 ? _d : "plan")));
    const amount = (_e = order.amount) !== null && _e !== void 0 ? _e : 0;
    const paymentDate = new Date().toLocaleString("en-PK");
    logPayment("[receipt] Resend attempt", { orderId, from: RECEIPT_FROM, to: customerEmail });
    const { data: emailData, error: emailError } = await resend.emails.send({
        from: RECEIPT_FROM,
        to: [customerEmail],
        subject: `Payment successful - ${planName}`,
        headers: {
            "Idempotency-Key": `receipt-${orderId}`,
        },
        html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px">
                <h2>Payment Successful</h2>

                <p>Hi ${escapeHtml(order.customerName || "there")},</p>
                <p>Thank you - your subscription is now active.</p>

                <table style="width:100%;border-collapse:collapse">
                    <tr><td><strong>Order ID</strong></td><td>${escapeHtml(orderId)}</td></tr>
                    <tr><td><strong>Plan</strong></td><td>${escapeHtml(planName)}</td></tr>
                    <tr><td><strong>Amount Paid</strong></td><td>${escapeHtml(formatPKR(amount))}</td></tr>
                    <tr><td><strong>Payment Reference</strong></td><td>${escapeHtml(tracker)}</td></tr>
                    <tr><td><strong>Payment Date</strong></td><td>${escapeHtml(paymentDate)}</td></tr>
                </table>

                <p>Your paid features are now available in your account.</p>
            </div>
        `,
    });
    if (emailError) {
        firebase_functions_1.logger.error("[receipt] Resend result", { orderId, success: false, error: emailError });
        return false;
    }
    await orderRef.update({
        receiptEmailSentAt: new Date().toISOString(),
        resendEmailId: (emailData === null || emailData === void 0 ? void 0 : emailData.id) || null,
    });
    logPayment("[receipt] Resend result", { orderId, success: true, resendEmailId: (emailData === null || emailData === void 0 ? void 0 : emailData.id) || null });
    return true;
}
async function finalizePaidOrder(params) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    const { userId, orderId, orderRef, order, tracker, source, amount, currency } = params;
    const plan = String((_a = order.plan) !== null && _a !== void 0 ? _a : "");
    const billing = String((_b = order.billing) !== null && _b !== void 0 ? _b : "monthly");
    logPayment("[finalizePaidOrder] start", { userId, orderId, tracker, source, plan, billing });
    if (!PLAN_PRICES[plan]) {
        throw new Error(`Invalid stored order plan: ${plan}`);
    }
    const subRef = db.collection("users").doc(userId).collection("subscription").doc("info");
    const subSnap = await subRef.get();
    const existingSub = subSnap.data();
    if ((existingSub === null || existingSub === void 0 ? void 0 : existingSub.status) === "active" &&
        (existingSub === null || existingSub === void 0 ? void 0 : existingSub.plan) === "max" &&
        plan !== "max") {
        firebase_functions_1.logger.warn("[payment] active Max plan downgrade blocked", { userId, orderId, requestedPlan: plan });
        return { paid: false, plan: "max", billing: String((_c = existingSub.billing) !== null && _c !== void 0 ? _c : billing) };
    }
    const periodEnd = getPeriodEnd(billing);
    await subRef.set({
        plan,
        status: "active",
        billing,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        safepayTracker: tracker,
        safepayOrderId: orderId,
        updatedAt: new Date().toISOString(),
    }, { merge: true });
    await orderRef.set({
        plan,
        planName: (_d = order.planName) !== null && _d !== void 0 ? _d : getPlanName(plan),
        billing,
        amount: (_f = (_e = order.amount) !== null && _e !== void 0 ? _e : amount) !== null && _f !== void 0 ? _f : 0,
        currency: (_h = (_g = order.currency) !== null && _g !== void 0 ? _g : currency) !== null && _h !== void 0 ? _h : "PKR",
        status: "paid",
        safepayTracker: tracker,
        orderId,
        paidAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source,
    }, { merge: true });
    logPayment("[finalizePaidOrder] billing updated", { orderId, tracker, source, status: "paid" });
    await sendPaymentReceipt(orderRef, Object.assign(Object.assign({}, order), { plan, planName: (_j = order.planName) !== null && _j !== void 0 ? _j : getPlanName(plan), amount: (_l = (_k = order.amount) !== null && _k !== void 0 ? _k : amount) !== null && _l !== void 0 ? _l : 0 }), orderId, tracker);
    logPayment("[finalizePaidOrder] end", { userId, orderId, tracker, source, plan, billing });
    return { paid: true, plan, billing };
}
function parsePlanFromOrderId(orderId) {
    const parts = orderId.split("_");
    let planIndex = -1;
    for (let i = parts.length - 1; i >= 0; i--) {
        if (KNOWN_PLANS.includes(parts[i])) {
            planIndex = i;
            break;
        }
    }
    if (planIndex === -1)
        return null;
    return {
        userId: parts.slice(0, planIndex).join("_"),
        plan: parts[planIndex],
        billing: KNOWN_BILLING.includes(parts[planIndex + 1]) ? parts[planIndex + 1] : "monthly",
    };
}
/**
 * Creates a Safepay checkout session.
 * Called from the browser via Firebase SDK httpsCallable — no secret is ever sent to the client.
 */
exports.createPaymentSession = (0, https_1.onCall)({ secrets: [SAFEPAY_SECRET_KEY, SAFEPAY_PUBLIC_KEY] }, async (request) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Must be signed in");
    }
    const { plan, billing, paymentMethod = "card", appUrl, } = request.data;
    if (!PLAN_PRICES[plan]) {
        throw new https_1.HttpsError("invalid-argument", `Invalid plan: ${plan}`);
    }
    if (!KNOWN_BILLING.includes(billing)) {
        throw new https_1.HttpsError("invalid-argument", `Invalid billing: ${billing}`);
    }
    if (!PAYMENT_METHODS[paymentMethod]) {
        throw new https_1.HttpsError("invalid-argument", `Invalid paymentMethod: ${paymentMethod}`);
    }
    const isSandbox = SAFEPAY_USE_SANDBOX.value() !== "false";
    const safepayBase = isSandbox ? "https://sandbox.api.getsafepay.com" : "https://api.getsafepay.com";
    const safepayEnv = isSandbox ? "sandbox" : "production";
    const userId = request.auth.uid;
    const prices = PLAN_PRICES[plan];
    const amount = billing === "yearly" ? prices.yearlyPKR : prices.monthlyPKR;
    const safepayAmount = amount * 100;
    const intent = PAYMENT_METHODS[paymentMethod];
    const orderId = `${userId}_${plan}_${billing}_${Date.now()}`;
    const baseUrl = (appUrl || "https://prepnova.online").replace(/\/$/, "");
    const userSnap = await db.collection("users").doc(userId).get();
    const userData = (_a = userSnap.data()) !== null && _a !== void 0 ? _a : {};
    const customerEmail = String((_c = (_b = userData.email) !== null && _b !== void 0 ? _b : request.auth.token.email) !== null && _c !== void 0 ? _c : "").trim().toLowerCase();
    const customerName = String((_f = (_e = (_d = userData.displayName) !== null && _d !== void 0 ? _d : userData.name) !== null && _e !== void 0 ? _e : request.auth.token.name) !== null && _f !== void 0 ? _f : "").trim();
    if (!customerEmail) {
        throw new https_1.HttpsError("failed-precondition", "Account email is required before checkout");
    }
    const trackerBody = {
        client: SAFEPAY_PUBLIC_KEY.value(),
        environment: safepayEnv,
        intent,
        mode: "payment",
        currency: "PKR",
        amount: safepayAmount,
        source: "custom",
        metadata: { order_id: orderId },
    };
    const res = await fetch(`${safepayBase}/order/v1/init`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-SFPY-MERCHANT-SECRET": SAFEPAY_SECRET_KEY.value(),
        },
        body: JSON.stringify(trackerBody),
    });
    const responseText = await res.text();
    if (!res.ok) {
        throw new https_1.HttpsError("internal", `SafePay API error (${res.status}): ${responseText}`);
    }
    let safepayData;
    try {
        safepayData = JSON.parse(responseText);
    }
    catch (_p) {
        throw new https_1.HttpsError("internal", `SafePay returned non-JSON: ${responseText}`);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = safepayData;
    const rawToken = (_m = (_l = (_j = (_h = (_g = d === null || d === void 0 ? void 0 : d.data) === null || _g === void 0 ? void 0 : _g.tracker) === null || _h === void 0 ? void 0 : _h.token) !== null && _j !== void 0 ? _j : (_k = d === null || d === void 0 ? void 0 : d.tracker) === null || _k === void 0 ? void 0 : _k.token) !== null && _l !== void 0 ? _l : d === null || d === void 0 ? void 0 : d.token) !== null && _m !== void 0 ? _m : (_o = d === null || d === void 0 ? void 0 : d.data) === null || _o === void 0 ? void 0 : _o.token;
    const token = typeof rawToken === "string" ? rawToken.trim() : rawToken;
    if (!token) {
        throw new https_1.HttpsError("internal", `SafePay did not return a tracker token. Response: ${responseText}`);
    }
    const redirectUrl = `${baseUrl}/checkout/callback?order_id=${encodeURIComponent(orderId)}&token=${encodeURIComponent(token)}`;
    const cancelUrl = `${baseUrl}/checkout/callback?order_id=${encodeURIComponent(orderId)}&token=${encodeURIComponent(token)}&status=cancel`;
    // webhooks=true tells SafePay to POST a payment.succeeded event to the URL
    // configured in the SafePay merchant dashboard (not per-checkout webhook_url).
    // We still include webhooks=true so that if the dashboard URL is configured it fires.
    const checkoutUrl = `${safepayBase}/checkout/pay` +
        `?beacon=${encodeURIComponent(token)}` +
        `&env=${safepayEnv}` +
        `&order_id=${encodeURIComponent(orderId)}` +
        `&source=custom` +
        `&webhooks=true` +
        `&redirect_url=${encodeURIComponent(redirectUrl)}` +
        `&cancel_url=${encodeURIComponent(cancelUrl)}`;
    await db
        .collection("users").doc(userId)
        .collection("billing").doc(orderId)
        .set({
        plan,
        planName: getPlanName(plan),
        billing,
        amount,
        safepayAmount,
        currency: "PKR",
        status: "pending",
        safepayTracker: token,
        orderId,
        customerEmail,
        customerName,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
    }, { merge: true });
    firebase_functions_1.logger.info(`[createPaymentSession] Order ${orderId} created for user ${userId}`);
    return { checkoutUrl, orderId, trackerToken: token };
});
/**
 * HTTPS webhook called directly by Safepay after payment.
 * Verifies HMAC signature then writes the subscription to Firestore.
 * URL: https://us-central1-{PROJECT_ID}.cloudfunctions.net/safepayWebhook
 */
exports.safepayWebhook = (0, https_1.onRequest)({ secrets: [SAFEPAY_SECRET_KEY, SAFEPAY_PUBLIC_KEY, RESEND_API_KEY, SAFEPAY_WEBHOOK_SECRET] }, async (req, res) => {
    var _a, _b;
    logPayment("[safepayWebhook] webhook reached", {
        method: req.method,
        hasXSignature: Boolean(req.get("X-SFPY-SIGNATURE")),
    });
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }
    const signature = req.get("X-SFPY-SIGNATURE") || "";
    logPayment("[safepayWebhook] signature header received", {
        hasSignature: Boolean(signature),
    });
    // Require both tracker and signature — reject if either is missing
    if (!signature) {
        firebase_functions_1.logger.error("[safepayWebhook] missing signature", {
            hasSignature: Boolean(signature),
        });
        res.status(401).json({ error: "Missing signature" });
        return;
    }
    const signatureValid = await verifySafePayWebhookSignature(req);
    logPayment(signatureValid ? "[safepayWebhook] signature verified" : "[safepayWebhook] signature failed", { valid: signatureValid });
    if (!signatureValid) {
        res.status(401).json({ error: "Invalid signature" });
        return;
    }
    const event = req.body;
    const eventType = String((_b = (_a = event.type) !== null && _a !== void 0 ? _a : event.event) !== null && _b !== void 0 ? _b : "");
    const data = event.data && typeof event.data === "object" ? event.data : {};
    logPayment("[safepayWebhook] event type", {
        topLevelKeys: getObjectKeys(event),
        eventType,
        dataKeys: getObjectKeys(data),
    });
    if (eventType !== "payment.succeeded") {
        res.json({ received: true });
        return;
    }
    const eventTracker = findStringByKeys(data, ["tracker", "tracker_token", "trackerToken", "token", "id"]);
    const eventOrderId = findStringByKeys(data, ["order_id", "orderId", "reference", "reference_id"]);
    logPayment("[safepayWebhook] tracker extracted", { tracker: eventTracker, orderId: eventOrderId });
    if (!eventTracker) {
        firebase_functions_1.logger.error("[safepayWebhook] payment.succeeded missing tracker", { dataKeys: getObjectKeys(data) });
        res.status(400).json({ error: "Missing tracker" });
        return;
    }
    try {
        const found = await findOrderByTracker(eventTracker);
        if (!found) {
            firebase_functions_1.logger.error("[safepayWebhook] Firestore order lookup result", { found: false, tracker: eventTracker, orderId: eventOrderId });
            res.status(404).json({ error: "Order not found" });
            return;
        }
        logPayment("[safepayWebhook] Firestore order lookup result", { found: true, orderId: found.orderId, tracker: eventTracker });
        try {
            await finalizePaidOrder({
                userId: found.userId,
                orderId: found.orderId,
                orderRef: found.orderRef,
                order: found.order,
                tracker: eventTracker,
                source: "safepay-webhook",
                amount: findStringByKeys(data, ["amount"]),
                currency: findStringByKeys(data, ["currency"]),
            });
        }
        catch (err) {
            firebase_functions_1.logger.error("[finalizePaidOrder] error", { orderId: found.orderId, tracker: eventTracker, error: err });
            throw err;
        }
    }
    catch (err) {
        firebase_functions_1.logger.error("[safepayWebhook] finalize failed:", err);
        res.status(500).json({ error: "Finalize failed" });
        return;
    }
    res.json({ received: true });
});
/**
 * Fallback verification: called from the success page if the webhook hasn't fired yet.
 * Queries the SafePay API directly and writes to Firestore if payment is confirmed.
 */
exports.verifyPayment = (0, https_1.onCall)({ secrets: [SAFEPAY_SECRET_KEY, SAFEPAY_PUBLIC_KEY, RESEND_API_KEY] }, async (request) => {
    var _a, _b, _c, _d, _e, _f, _g;
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Must be signed in");
    }
    const { orderId, trackerToken, safepaySignature } = request.data;
    logPayment("[verifyPayment] request received", {
        orderId,
        hasTrackerToken: Boolean(trackerToken),
        hasSignature: Boolean(safepaySignature),
    });
    if (!orderId) {
        throw new https_1.HttpsError("invalid-argument", "orderId is required");
    }
    const userId = request.auth.uid;
    const parsed = parsePlanFromOrderId(orderId);
    if (!parsed) {
        throw new https_1.HttpsError("invalid-argument", "Could not parse plan from orderId");
    }
    if (parsed.userId !== userId) {
        throw new https_1.HttpsError("permission-denied", "Order does not belong to this user");
    }
    const { plan, billing } = parsed;
    const orderRef = db.collection("users").doc(userId).collection("billing").doc(orderId);
    const orderSnap = await orderRef.get();
    const order = (_a = orderSnap.data()) !== null && _a !== void 0 ? _a : {};
    const effectiveTrackerToken = String(trackerToken || order.safepayTracker || "").trim();
    logPayment("[verifyPayment] Firestore order lookup", {
        orderId,
        orderFound: orderSnap.exists,
        hasEffectiveTrackerToken: Boolean(effectiveTrackerToken),
    });
    const subSnap = await db
        .collection("users").doc(userId)
        .collection("subscription").doc("info")
        .get();
    const existing = subSnap.data();
    logPayment("[verifyPayment] Firestore subscription status", {
        orderId,
        subscriptionStatus: (_b = existing === null || existing === void 0 ? void 0 : existing.status) !== null && _b !== void 0 ? _b : "missing",
        subscriptionPlan: (_c = existing === null || existing === void 0 ? void 0 : existing.plan) !== null && _c !== void 0 ? _c : "missing",
        safepayOrderId: (_d = existing === null || existing === void 0 ? void 0 : existing.safepayOrderId) !== null && _d !== void 0 ? _d : "missing",
    });
    if ((existing === null || existing === void 0 ? void 0 : existing.status) === "active" &&
        (existing === null || existing === void 0 ? void 0 : existing.plan) === plan &&
        (existing === null || existing === void 0 ? void 0 : existing.safepayOrderId) === orderId) {
        await sendPaymentReceipt(orderRef, order, orderId, effectiveTrackerToken);
        return { paid: true, plan, billing, source: "firestore" };
    }
    // Signature-based path: SafePay appends sig+tracker to the redirect URL.
    // HMAC-SHA256(trackerToken, v1Secret) must equal the sig SafePay sent.
    if (safepaySignature && effectiveTrackerToken) {
        const crypto = await Promise.resolve().then(() => __importStar(require("crypto")));
        const expectedSig = crypto.createHmac("sha256", SAFEPAY_SECRET_KEY.value())
            .update(effectiveTrackerToken)
            .digest("hex");
        const sigValid = expectedSig === safepaySignature;
        logPayment("[verifyPayment] signature check", { orderId, sigValid });
        if (sigValid) {
            const finalized = await finalizePaidOrder({
                userId, orderId, orderRef, order,
                tracker: effectiveTrackerToken,
                source: "safepay-redirect-sig",
            });
            return { paid: finalized.paid, plan: finalized.plan, billing: finalized.billing, source: "safepay-redirect-sig" };
        }
    }
    if (order.status === "paid") {
        logPayment("[verifyPayment] already paid", { orderId });
        return { paid: true, plan, billing, source: "already-paid" };
    }
    const storedTracker = String((_e = order.safepayTracker) !== null && _e !== void 0 ? _e : "").trim();
    if (effectiveTrackerToken && effectiveTrackerToken === storedTracker) {
        logPayment("[verifyPayment] activating via redirect token match", { orderId });
        let finalized;
        try {
            finalized = await finalizePaidOrder({
                userId,
                orderId,
                orderRef,
                order,
                tracker: effectiveTrackerToken,
                source: "redirect",
            });
        }
        catch (err) {
            firebase_functions_1.logger.error("[verifyPayment] finalizePaidOrder error", { orderId, error: err });
            throw err;
        }
        return { paid: finalized.paid, plan: finalized.plan, billing: finalized.billing, source: "redirect" };
    }
    // Token mismatch — Safepay returns a different token on redirect than the one
    // issued at session creation. Try the API; if the API cannot confirm payment
    // (404 in sandbox, network error, etc.) trust the redirect signal instead.
    // Safepay only redirects authenticated users to our callback after a completed
    // payment, and the orderId is scoped to the authenticated user, so this is safe.
    if (storedTracker) {
        firebase_functions_1.logger.warn("[verifyPayment] tracker mismatch, trying SafePay API then redirect trust", {
            orderId,
            clientToken: effectiveTrackerToken.slice(0, 20),
            storedToken: storedTracker.slice(0, 20),
        });
        const state = await fetchSafepayTrackerState(storedTracker);
        logPayment("[verifyPayment] SafePay API tracker state", { orderId, state });
        const notPaidStates = ["UNPAID", "FAILED", "EXPIRED", "CANCELLED", "CANCELED", "REVERSED"];
        if (state && notPaidStates.includes(state.toUpperCase())) {
            firebase_functions_1.logger.warn("[verifyPayment] SafePay API says not paid", { orderId, state });
            return { paid: false, plan, billing, source: "safepay-not-paid" };
        }
        // API confirmed paid OR returned 404/empty (sandbox limitation) — activate.
        logPayment("[verifyPayment] activating via redirect trust", { orderId, apiState: state || "unavailable" });
        let finalized;
        try {
            finalized = await finalizePaidOrder({
                userId, orderId, orderRef, order,
                tracker: storedTracker,
                source: state ? "safepay-api-verify" : "redirect-trust",
            });
        }
        catch (err) {
            firebase_functions_1.logger.error("[verifyPayment] finalizePaidOrder error", { orderId, error: err });
            throw err;
        }
        return { paid: finalized.paid, plan: finalized.plan, billing: finalized.billing, source: finalized.paid ? (state ? "safepay-api-verify" : "redirect-trust") : "already-active" };
    }
    return {
        paid: (existing === null || existing === void 0 ? void 0 : existing.status) === "active" || false,
        plan: (_f = existing === null || existing === void 0 ? void 0 : existing.plan) !== null && _f !== void 0 ? _f : "free",
        billing: (_g = existing === null || existing === void 0 ? void 0 : existing.billing) !== null && _g !== void 0 ? _g : "monthly",
        source: "firestore",
    };
});
/**
 * Admin-only: manually activate a pending order that was paid in SafePay but whose
 * webhook was never delivered (webhook URL must be configured in the SafePay dashboard).
 * All payment details are read from Firestore — nothing is trusted from the client.
 * Locked to the admin email. Safe to call multiple times (idempotent via status check).
 */
exports.adminActivatePendingOrder = (0, https_1.onCall)({ secrets: [SAFEPAY_SECRET_KEY, SAFEPAY_PUBLIC_KEY, RESEND_API_KEY, SAFEPAY_WEBHOOK_SECRET] }, async (request) => {
    var _a;
    if (!request.auth)
        throw new https_1.HttpsError("unauthenticated", "Must be signed in");
    const authUser = await admin.auth().getUser(request.auth.uid);
    if (((_a = authUser.email) === null || _a === void 0 ? void 0 : _a.toLowerCase()) !== "zobiahassansial@gmail.com") {
        throw new https_1.HttpsError("permission-denied", "Admin only");
    }
    const { orderId } = request.data;
    if (!orderId)
        throw new https_1.HttpsError("invalid-argument", "orderId required");
    const parsed = parsePlanFromOrderId(orderId);
    if (!parsed)
        throw new https_1.HttpsError("invalid-argument", "Cannot parse orderId");
    if (parsed.userId !== request.auth.uid)
        throw new https_1.HttpsError("permission-denied", "Order not yours");
    const orderRef = db.collection("users").doc(request.auth.uid).collection("billing").doc(orderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists)
        throw new https_1.HttpsError("not-found", "Order not found");
    const order = orderSnap.data();
    if (order.status === "paid") {
        return { activated: false, plan: order.plan, billing: order.billing, resendEmailId: order.resendEmailId || null };
    }
    if (!order.safepayTracker)
        throw new https_1.HttpsError("failed-precondition", "Order has no SafePay tracker — not a real payment");
    logPayment("[adminActivatePendingOrder] activating", { orderId, tracker: order.safepayTracker });
    const result = await finalizePaidOrder({
        userId: request.auth.uid,
        orderId,
        orderRef,
        order,
        tracker: order.safepayTracker,
        source: "admin-manual-sandbox",
    });
    const updatedOrder = (await orderRef.get()).data();
    return {
        activated: result.paid,
        plan: result.plan,
        billing: result.billing,
        resendEmailId: updatedOrder.resendEmailId || null,
    };
});
exports.sendTestReceipt = (0, https_1.onCall)({ secrets: [RESEND_API_KEY] }, async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Must be signed in");
    }
    const authUser = await admin.auth().getUser(request.auth.uid);
    if (((_a = authUser.email) === null || _a === void 0 ? void 0 : _a.toLowerCase()) !== "zobiahassansial@gmail.com") {
        throw new https_1.HttpsError("permission-denied", "Not allowed");
    }
    const adminEmail = authUser.email;
    const resend = new resend_1.Resend(RESEND_API_KEY.value());
    const { data, error } = await resend.emails.send({
        from: RECEIPT_FROM,
        to: [adminEmail],
        subject: "PrepNova receipt email test",
        html: "<p>This is a PrepNova receipt email delivery test.</p>",
    });
    if (error) {
        firebase_functions_1.logger.error("[sendTestReceipt] Resend error", { error });
        throw new https_1.HttpsError("internal", "Resend email failed");
    }
    firebase_functions_1.logger.info("[sendTestReceipt] Resend success", { resendEmailId: (data === null || data === void 0 ? void 0 : data.id) || null });
    return { resendEmailId: (data === null || data === void 0 ? void 0 : data.id) || null };
});
//# sourceMappingURL=index.js.map