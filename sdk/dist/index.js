"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentPayError = void 0;
/**
 * Error thrown by the AgentPay SDK when an API request fails.
 */
class AgentPayError extends Error {
    constructor(message, statusCode, body) {
        super(message);
        this.name = "AgentPayError";
        this.statusCode = statusCode;
        this.body = body;
    }
}
exports.AgentPayError = AgentPayError;
/**
 * AgentPay SDK client.
 *
 * @example
 * ```ts
 * import AgentPay from 'agentpay';
 *
 * const ap = new AgentPay({ apiKey: 'ap_...' });
 * const result = await ap.pay({
 *   agentId: 'bot-001',
 *   amount: 5,
 *   token: 'USDC',
 *   recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD2C',
 *   reason: 'API access fee',
 * });
 * console.log(result.tx_hash);
 * ```
 */
class AgentPay {
    /**
     * Create a new AgentPay client.
     * @param config - API key and optional base URL.
     */
    constructor(config) {
        if (!config.apiKey) {
            throw new Error("AgentPay: apiKey is required");
        }
        this.apiKey = config.apiKey;
        this.baseUrl = (config.baseUrl || "http://localhost:8000").replace(/\/$/, "");
    }
    async request(method, path, body) {
        const url = `${this.baseUrl}${path}`;
        const headers = {
            "Content-Type": "application/json",
            "X-API-Key": this.apiKey,
        };
        const res = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });
        let data;
        try {
            data = await res.json();
        }
        catch {
            data = null;
        }
        if (!res.ok) {
            const detail = data && typeof data === "object" && "detail" in data
                ? data.detail
                : `Request failed with status ${res.status}`;
            throw new AgentPayError(detail, res.status, data);
        }
        return data;
    }
    /**
     * Send a payment from an agent wallet.
     *
     * @param params - Payment parameters (agentId, amount, token, recipient, reason).
     * @returns The payment response including status and optional tx_hash.
     * @throws {AgentPayError} If the request fails or is rejected by guardrails.
     *
     * @example
     * ```ts
     * const result = await ap.pay({
     *   agentId: 'trading-bot-001',
     *   amount: 50,
     *   token: 'USDC',
     *   recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD2C',
     *   reason: 'API access fee',
     * });
     * ```
     */
    async pay(params) {
        return this.request("POST", "/pay", {
            agent_id: params.agentId,
            amount: params.amount,
            token: params.token || "USDC",
            recipient: params.recipient,
            reason: params.reason,
        });
    }
    /**
     * Fetch recent transactions from the audit log.
     *
     * @param limit - Maximum number of transactions to return (default: 50).
     * @returns Array of transaction records.
     *
     * @example
     * ```ts
     * const txns = await ap.getTransactions(10);
     * ```
     */
    async getTransactions(limit = 50) {
        return this.request("GET", `/transactions?limit=${limit}`);
    }
    /**
     * Check the health of the AgentPay API.
     *
     * @returns Health status including network and wallet information.
     *
     * @example
     * ```ts
     * const health = await ap.health();
     * console.log(health.wallet_address);
     * ```
     */
    async health() {
        return this.request("GET", "/health");
    }
    /**
     * Create a new API key.
     *
     * @param name - A descriptive name for the key.
     * @returns The newly created key (shown only once).
     *
     * @example
     * ```ts
     * const key = await ap.createKey('production-bot');
     * console.log(key.key); // ap_...
     * ```
     */
    async createKey(name) {
        return this.request("POST", "/keys", { name });
    }
}
exports.default = AgentPay;
//# sourceMappingURL=index.js.map