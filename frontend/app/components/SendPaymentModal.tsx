"use client";

import { useState } from "react";
import axios from "axios";

interface SendPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SendPaymentModal({
  isOpen,
  onClose,
}: SendPaymentModalProps) {
  const [agentId, setAgentId] = useState("agent-1");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    type: "success" | "rejected" | "error";
    message: string;
    txHash?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/pay`, {
        agent_id: agentId,
        amount: parseFloat(amount),
        recipient,
        reason,
      });

      if (res.data.status === "approved") {
        setResult({
          type: "success",
          message: "Payment approved and sent",
          txHash: res.data.tx_hash,
        });
      } else {
        setResult({
          type: "rejected",
          message: res.data.reason || "Payment rejected by policy engine",
        });
      }
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.detail
          ? err.response.data.detail
          : "Failed to send payment";
      setResult({ type: "error", message });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setAmount("");
    setRecipient("");
    setReason("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-md animate-fade-in rounded-xl border border-[#222222] bg-[#111111] p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Send Payment</h2>
          <button
            onClick={handleClose}
            className="rounded-lg p-1 text-zinc-500 transition-colors hover:bg-[#1a1a1a] hover:text-white"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">
              Agent ID
            </label>
            <input
              type="text"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              className="w-full rounded-lg border border-[#222222] bg-[#0a0a0a] px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-blue-500"
              placeholder="agent-1"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">
              Amount (USDC)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-[#222222] bg-[#0a0a0a] px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-blue-500"
              placeholder="0.00"
              step="0.01"
              min="0"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">
              Recipient Address
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full rounded-lg border border-[#222222] bg-[#0a0a0a] px-3 py-2.5 font-mono text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-blue-500"
              placeholder="0x..."
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">
              Reason
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-[#222222] bg-[#0a0a0a] px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-blue-500"
              placeholder="Player payout, affiliate commission..."
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white transition-all hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Sending...
              </span>
            ) : (
              "Send Payment"
            )}
          </button>
        </form>

        {result && (
          <div
            className={`mt-4 animate-fade-in rounded-lg border p-3 text-sm ${
              result.type === "success"
                ? "border-green-500/20 bg-green-500/10 text-green-400"
                : result.type === "rejected"
                  ? "border-red-500/20 bg-red-500/10 text-red-400"
                  : "border-yellow-500/20 bg-yellow-500/10 text-yellow-400"
            }`}
          >
            <p className="font-medium">
              {result.type === "success"
                ? "Approved"
                : result.type === "rejected"
                  ? "Rejected"
                  : "Error"}
            </p>
            <p className="mt-1 text-xs opacity-80">{result.message}</p>
            {result.txHash && (
              <a
                href={`https://sepolia.basescan.org/tx/${result.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs text-blue-400 underline decoration-blue-400/30 transition-colors hover:text-blue-300"
              >
                View on BaseScan
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M3.5 8.5l5-5M4.5 3.5h4v4" />
                </svg>
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
