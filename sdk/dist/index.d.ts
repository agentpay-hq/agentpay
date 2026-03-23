import type { AgentPayConfig, ApiKeyResponse, HealthResponse, PaymentParams, PaymentResponse, Transaction } from "./types";
export type { AgentPayConfig, ApiKeyResponse, HealthResponse, PaymentParams, PaymentResponse, Transaction, };
/**
 * Error thrown by the AgentPay SDK when an API request fails.
 */
export declare class AgentPayError extends Error {
    /** HTTP status code from the API. */
    readonly statusCode: number;
    /** Raw response body. */
    readonly body: unknown;
    constructor(message: string, statusCode: number, body?: unknown);
}
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
declare class AgentPay {
    private readonly apiKey;
    private readonly baseUrl;
    /**
     * Create a new AgentPay client.
     * @param config - API key and optional base URL.
     */
    constructor(config: AgentPayConfig);
    private request;
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
    pay(params: PaymentParams): Promise<PaymentResponse>;
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
    getTransactions(limit?: number): Promise<Transaction[]>;
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
    health(): Promise<HealthResponse>;
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
    createKey(name: string): Promise<ApiKeyResponse>;
}
export default AgentPay;
//# sourceMappingURL=index.d.ts.map