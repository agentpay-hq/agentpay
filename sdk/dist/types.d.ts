/** Configuration options for the AgentPay client. */
export interface AgentPayConfig {
    /** Your API key (starts with ap_). */
    apiKey: string;
    /** Base URL of the AgentPay API. Defaults to http://localhost:8000. */
    baseUrl?: string;
}
/** Parameters for sending a payment. */
export interface PaymentParams {
    /** Unique identifier for the agent making the payment. */
    agentId: string;
    /** Amount in USDC to send. Max 100 per transaction. */
    amount: number;
    /** Token to send. Currently only "USDC" is supported. */
    token?: string;
    /** Recipient Ethereum address (0x + 40 hex chars). */
    recipient: string;
    /** Human-readable reason for the payment. */
    reason: string;
}
/** Response from a payment request. */
export interface PaymentResponse {
    /** Payment status: "approved", "rejected", or "error". */
    status: "approved" | "rejected" | "error";
    /** On-chain transaction hash, present when status is "approved". */
    tx_hash: string | null;
    /** Agent that initiated the payment. */
    agent_id: string;
    /** Amount sent. */
    amount: number;
    /** Token used. */
    token: string;
    /** Recipient address. */
    recipient: string;
    /** Timestamp of the payment. */
    timestamp: string;
    /** Reason for the payment or rejection. */
    reason: string | null;
}
/** A transaction record from the audit log. */
export interface Transaction {
    /** Unique transaction ID. */
    id: number;
    /** Timestamp of the transaction. */
    timestamp: string;
    /** Agent that initiated the transaction. */
    agent_id: string;
    /** Transaction amount. */
    amount: number;
    /** Token used. */
    token: string;
    /** Recipient address. */
    recipient: string;
    /** On-chain transaction hash. */
    tx_hash: string | null;
    /** Decision: "approved", "rejected", or "error". */
    decision: string;
    /** Reason for the decision. */
    reason: string | null;
}
/** Response from the health endpoint. */
export interface HealthResponse {
    /** Service status. */
    status: string;
    /** Blockchain network. */
    network: string;
    /** Wallet address used for payments. */
    wallet_address: string | null;
    /** API version. */
    version: string;
}
/** Response from creating an API key. */
export interface ApiKeyResponse {
    /** The raw API key — shown only once. */
    key: string;
    /** Key ID. */
    id: number;
    /** Key name. */
    name: string;
    /** Key owner. */
    owner: string;
    /** Creation timestamp. */
    created_at: string;
    /** Warning message. */
    message: string;
}
//# sourceMappingURL=types.d.ts.map