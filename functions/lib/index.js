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
exports.verifyPayment = exports.safepayWebhook = exports.createPaymentSession = void 0;
const https_1 = require("firebase-functions/v2/https");
const firebase_functions_1 = require("firebase-functions");
const params_1 = require("firebase-functions/params");
const admin = __importStar(require("firebase-admin"));
const crypto = __importStar(require("crypto"));
admin.initializeApp();
const db = admin.firestore();
const SAFEPAY_SECRET_KEY = (0, params_1.defineSecret)("SAFEPAY_SECRET_KEY");
const SAFEPAY_PUBLIC_KEY = (0, params_1.defineSecret)("SAFEPAY_PUBLIC_KEY");
// Set to "false" only when you have live Safepay credentials and are ready for production.
// Default: "true" (sandbox). Change with: firebase functions:params:set SAFEPAY_USE_SANDBOX=false
const SAFEPAY_USE_SANDBOX = (0, params_1.defineString)("SAFEPAY_USE_SANDBOX", { default: "true" });
// Resolved inside each function via SAFEPAY_USE_SANDBOX.value()
const PLAN_PRICES = {
    standard: { monthlyPKR: 1680, yearlyPKR: 16800 },
    pro: { monthlyPKR: 3360, yearlyPKR: 33600 },
    max: { monthlyPKR: 5600, yearlyPKR: 56000 },
};
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
    var _a, _b, _c, _d, _e, _f, _g;
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
    const intent = PAYMENT_METHODS[paymentMethod];
    const orderId = `${userId}_${plan}_${billing}_${Date.now()}`;
    const baseUrl = (appUrl || "https://prepnova.online").replace(/\/$/, "");
    const projectId = process.env.GCLOUD_PROJECT;
    const webhookUrl = `https://us-central1-${projectId}.cloudfunctions.net/safepayWebhook`;
    const trackerBody = {
        client: SAFEPAY_PUBLIC_KEY.value(),
        environment: safepayEnv,
        intent,
        mode: "payment",
        currency: "PKR",
        amount,
        source: "custom",
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
    catch (_h) {
        throw new https_1.HttpsError("internal", `SafePay returned non-JSON: ${responseText}`);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = safepayData;
    const token = (_f = (_e = (_c = (_b = (_a = d === null || d === void 0 ? void 0 : d.data) === null || _a === void 0 ? void 0 : _a.tracker) === null || _b === void 0 ? void 0 : _b.token) !== null && _c !== void 0 ? _c : (_d = d === null || d === void 0 ? void 0 : d.tracker) === null || _d === void 0 ? void 0 : _d.token) !== null && _e !== void 0 ? _e : d === null || d === void 0 ? void 0 : d.token) !== null && _f !== void 0 ? _f : (_g = d === null || d === void 0 ? void 0 : d.data) === null || _g === void 0 ? void 0 : _g.token;
    if (!token) {
        throw new https_1.HttpsError("internal", `SafePay did not return a tracker token. Response: ${responseText}`);
    }
    const redirectUrl = `${baseUrl}/checkout/callback?order_id=${encodeURIComponent(orderId)}`;
    const cancelUrl = `${baseUrl}/checkout/callback?order_id=${encodeURIComponent(orderId)}&status=cancel`;
    const checkoutUrl = `${safepayBase}/checkout/pay` +
        `?beacon=${encodeURIComponent(token)}` +
        `&env=${safepayEnv}` +
        `&order_id=${encodeURIComponent(orderId)}` +
        `&source=custom` +
        `&redirect_url=${encodeURIComponent(redirectUrl)}` +
        `&cancel_url=${encodeURIComponent(cancelUrl)}` +
        `&webhook_url=${encodeURIComponent(webhookUrl)}`;
    firebase_functions_1.logger.info(`[createPaymentSession] Order ${orderId} created for user ${userId}`);
    return { checkoutUrl, orderId, trackerToken: token };
});
/**
 * HTTPS webhook called directly by Safepay after payment.
 * Verifies HMAC signature then writes the subscription to Firestore.
 * URL: https://us-central1-{PROJECT_ID}.cloudfunctions.net/safepayWebhook
 */
exports.safepayWebhook = (0, https_1.onRequest)({ secrets: [SAFEPAY_SECRET_KEY] }, async (req, res) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = req.body;
    const tracker = String((_c = (_b = (_a = body === null || body === void 0 ? void 0 : body.notification) === null || _a === void 0 ? void 0 : _a.tracker) !== null && _b !== void 0 ? _b : body === null || body === void 0 ? void 0 : body.token) !== null && _c !== void 0 ? _c : "");
    const signature = String((_d = body === null || body === void 0 ? void 0 : body.signature) !== null && _d !== void 0 ? _d : "");
    if (tracker && signature) {
        try {
            const expected = crypto
                .createHmac("sha256", SAFEPAY_SECRET_KEY.value())
                .update(tracker)
                .digest("hex");
            const expBuf = Buffer.from(expected, "hex");
            const sigBuf = Buffer.from(signature, "hex");
            const valid = expBuf.length === sigBuf.length &&
                crypto.timingSafeEqual(expBuf, sigBuf);
            if (!valid) {
                firebase_functions_1.logger.error("[safepayWebhook] Invalid HMAC signature");
                res.status(401).json({ error: "Invalid signature" });
                return;
            }
        }
        catch (err) {
            firebase_functions_1.logger.error("[safepayWebhook] Signature check threw:", err);
            res.status(401).json({ error: "Signature check failed" });
            return;
        }
    }
    const state = String((_g = (_f = (_e = body === null || body === void 0 ? void 0 : body.notification) === null || _e === void 0 ? void 0 : _e.state) !== null && _f !== void 0 ? _f : body === null || body === void 0 ? void 0 : body.state) !== null && _g !== void 0 ? _g : "").toUpperCase();
    if (!["PAID", "SETTLED", "COMPLETED"].includes(state)) {
        res.json({ received: true });
        return;
    }
    const orderId = String((_l = (_k = (_j = (_h = body === null || body === void 0 ? void 0 : body.notification) === null || _h === void 0 ? void 0 : _h.metadata) === null || _j === void 0 ? void 0 : _j.order_id) !== null && _k !== void 0 ? _k : body === null || body === void 0 ? void 0 : body.order_id) !== null && _l !== void 0 ? _l : "");
    const parsed = parsePlanFromOrderId(orderId);
    if (!parsed || !parsed.userId) {
        firebase_functions_1.logger.error("[safepayWebhook] Could not parse orderId:", orderId);
        res.json({ received: true });
        return;
    }
    const { userId, plan, billing } = parsed;
    const periodEnd = getPeriodEnd(billing);
    try {
        await db
            .collection("users").doc(userId)
            .collection("subscription").doc("info")
            .set({
            plan,
            status: "active",
            billing,
            currentPeriodEnd: periodEnd,
            cancelAtPeriodEnd: false,
            safepayTracker: tracker,
            safepayOrderId: orderId,
            updatedAt: new Date().toISOString(),
        });
        await db
            .collection("users").doc(userId)
            .collection("billing")
            .add({
            plan,
            billing,
            amount: (_o = (_m = body === null || body === void 0 ? void 0 : body.notification) === null || _m === void 0 ? void 0 : _m.amount) !== null && _o !== void 0 ? _o : 0,
            currency: (_q = (_p = body === null || body === void 0 ? void 0 : body.notification) === null || _p === void 0 ? void 0 : _p.currency) !== null && _q !== void 0 ? _q : "PKR",
            status: "paid",
            safepayTracker: tracker,
            orderId,
            date: new Date().toISOString(),
        });
        firebase_functions_1.logger.info(`[safepayWebhook] Activated: user=${userId} plan=${plan} billing=${billing}`);
    }
    catch (err) {
        firebase_functions_1.logger.error("[safepayWebhook] Firestore write failed:", err);
        res.status(500).json({ error: "DB write failed" });
        return;
    }
    res.json({ received: true });
});
/**
 * Fallback verification: called from the success page if the webhook hasn't fired yet.
 * Queries the SafePay API directly and writes to Firestore if payment is confirmed.
 */
exports.verifyPayment = (0, https_1.onCall)({ secrets: [SAFEPAY_SECRET_KEY] }, async (request) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Must be signed in");
    }
    const { orderId, trackerToken } = request.data;
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
    const subSnap = await db
        .collection("users").doc(userId)
        .collection("subscription").doc("info")
        .get();
    const existing = subSnap.data();
    if ((existing === null || existing === void 0 ? void 0 : existing.status) === "active" &&
        (existing === null || existing === void 0 ? void 0 : existing.plan) === plan &&
        (existing === null || existing === void 0 ? void 0 : existing.safepayOrderId) === orderId) {
        return { paid: true, plan, billing, source: "firestore" };
    }
    if (trackerToken) {
        const isSandbox = SAFEPAY_USE_SANDBOX.value() !== "false";
        const safepayBase = isSandbox ? "https://sandbox.api.getsafepay.com" : "https://api.getsafepay.com";
        const safepayEnv = isSandbox ? "sandbox" : "production";
        let state = "UNKNOWN";
        try {
            const r = await fetch(`${safepayBase}/order/v1/init?token=${encodeURIComponent(trackerToken)}&env=${safepayEnv}`, { headers: { "X-SFPY-MERCHANT-SECRET": SAFEPAY_SECRET_KEY.value() } });
            if (r.ok) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const d = await r.json();
                state = String((_f = (_e = (_c = (_b = (_a = d === null || d === void 0 ? void 0 : d.data) === null || _a === void 0 ? void 0 : _a.tracker) === null || _b === void 0 ? void 0 : _b.state) !== null && _c !== void 0 ? _c : (_d = d === null || d === void 0 ? void 0 : d.tracker) === null || _d === void 0 ? void 0 : _d.state) !== null && _e !== void 0 ? _e : d === null || d === void 0 ? void 0 : d.state) !== null && _f !== void 0 ? _f : "UNKNOWN").toUpperCase();
            }
        }
        catch ( /* fall through to Firestore state */_j) { /* fall through to Firestore state */ }
        if (["PAID", "SETTLED", "COMPLETED", "SUCCESS"].includes(state)) {
            const periodEnd = getPeriodEnd(billing);
            await db.collection("users").doc(userId).collection("subscription").doc("info").set({
                plan,
                status: "active",
                billing,
                currentPeriodEnd: periodEnd,
                cancelAtPeriodEnd: false,
                safepayTracker: trackerToken,
                safepayOrderId: orderId,
                updatedAt: new Date().toISOString(),
            });
            await db.collection("users").doc(userId).collection("billing").add({
                plan,
                billing,
                amount: 0,
                currency: "PKR",
                status: "paid",
                safepayTracker: trackerToken,
                orderId,
                date: new Date().toISOString(),
                source: "verify-endpoint",
            });
            return { paid: true, plan, billing, source: "safepay-api" };
        }
        return { paid: false, plan, billing, source: "safepay-api", state };
    }
    return {
        paid: (existing === null || existing === void 0 ? void 0 : existing.status) === "active" || false,
        plan: (_g = existing === null || existing === void 0 ? void 0 : existing.plan) !== null && _g !== void 0 ? _g : "free",
        billing: (_h = existing === null || existing === void 0 ? void 0 : existing.billing) !== null && _h !== void 0 ? _h : "monthly",
        source: "firestore",
    };
});
//# sourceMappingURL=index.js.map