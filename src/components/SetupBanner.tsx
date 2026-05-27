import React from "react";
import { ConfigStatus } from "../types";
import { Database, ShieldCheck, Key, HelpCircle, X } from "lucide-react";
import { motion } from "motion/react";

interface SetupBannerProps {
  status: ConfigStatus | null;
  onRefresh: () => void;
}

export default function SetupBanner({ status, onRefresh }: SetupBannerProps) {
  const [isOpen, setIsOpen] = React.useState(true);

  if (!status || !isOpen) return null;

  const { mongooseConnected, mongoError, hasMongoUri, hasJwtSecret, hasRazorpay } = status;
  const isFullyConfigured = mongooseConnected && hasJwtSecret && hasRazorpay;
  const failedToConnect = hasMongoUri && !mongooseConnected;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-stone-950/92 backdrop-blur-xl border-b border-white/10 text-white z-50 relative shadow-md animate-fade-in"
      id="setup-banner-root"
    >
      <div className="max-w-7xl mx-auto px-4 py-3.5 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-start md:items-center space-x-3">
            <div className={`p-1.5 rounded border shrink-0 ${failedToConnect ? "bg-rose-500/10 border-rose-500/40 text-rose-400" : "bg-amber-500/10 border-amber-500/40 text-amber-500"}`}>
              <Database className="w-5 h-5 animate-pulse" id="banner-icon-db" />
            </div>
            <div>
              <p className={`font-serif text-base font-medium tracking-wide ${failedToConnect ? "text-rose-450" : "text-amber-500"}`}>
                {failedToConnect 
                  ? "❌ MongoDB Atlas Connection Failed (IP Whitelist Issue)" 
                  : !mongooseConnected 
                  ? "✨ Enlight Candles High-Fidelity Demo Mode Active" 
                  : "🚀 Enlight Candles Fully Connected"}
              </p>
              <p className="text-xs text-stone-300 font-sans mt-0.5 max-w-3xl leading-relaxed">
                {failedToConnect ? (
                  <>
                    Your <code>MONGODB_URI</code> environment variable is set, but Atlas rejected the connection. Because Cloud Run spins up containers with dynamic outbound IPs, your database cluster is blocking access. See the troubleshooting guide below to whitelist access!
                  </>
                ) : !mongooseConnected ? (
                  <>
                    MongoDB is currently stored in <strong>server-side temporary RAM</strong> because <code>MONGODB_URI</code> is not set in secrets. 
                    You can read/write data, register admins, and process mock payments flawlessly out of the box!
                  </>
                ) : (
                  <>
                    Live integration active! All products and custom user accounts are securely persisted in your <strong>MongoDB Atlas</strong> cloud cluster.
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0 self-end md:self-auto">
            <button
              onClick={onRefresh}
              className="text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded px-2.5 py-1 text-xs font-mono transition-colors"
              id="refresh-config-btn"
            >
              Check Secrets Env ↻
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="text-stone-400 hover:text-white p-1 rounded hover:bg-stone-800 transition-colors"
              aria-label="Close"
              id="close-banner-btn"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Configurations status bar */}
        <div className="mt-2.5 pt-2.5 border-t border-stone-800 flex flex-wrap gap-x-6 gap-y-2 text-xs font-mono text-stone-400">
          <div className="flex items-center space-x-1.5">
            <span className={`w-2 h-2 rounded-full ${mongooseConnected ? "bg-emerald-500" : "bg-amber-400 animate-pulse"}`}></span>
            <span>MongoDB Database:</span>
            <span className={mongooseConnected ? "text-emerald-400 font-bold" : "text-amber-400"}>
              {mongooseConnected ? "Connected (Live)" : "In-Memory Temporary Datastore"}
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className={`w-2 h-2 rounded-full ${hasJwtSecret ? "bg-emerald-500" : "bg-stone-600"}`}></span>
            <span>JWT_SECRET auth:</span>
            <span className={hasJwtSecret ? "text-emerald-400" : "text-stone-500"}>
              {hasJwtSecret ? "Active (Custom)" : "Inactive (Using secure fallback API keys)"}
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className={`w-2 h-2 rounded-full ${hasRazorpay ? "bg-emerald-500" : "bg-stone-600"}`}></span>
            <span>Razorpay Payment:</span>
            <span className={hasRazorpay ? "text-emerald-400" : "text-stone-500"}>
              {hasRazorpay ? "Active (Live checkout)" : "Inactive (Auto Simulated checkout active)"}
            </span>
          </div>
        </div>

        {/* Connection Failure Whitelist Guide */}
        {failedToConnect && (
          <div className="mt-4 p-4.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-200 animate-fade-in cursor-default" id="mongodb-whitelist-diagnostic">
            <h4 className="font-serif text-sm font-semibold text-rose-350 mb-2.5 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
              <span>⚠️ Action Needed: Configure MongoDB Atlas Firewall and IP Whitelist</span>
            </h4>
            <div className="space-y-3 font-sans">
              <p className="text-stone-300 leading-relaxed font-light">
                We detected an active connection block from your MongoDB Atlas cloud cluster. Because your app container is deployed dynamically on Cloud Run, outbound database requests flow through changing, dynamic Cloud IP ranges. Individual static intellectual patterns are not supported. You must open firewall rule access to let Cloud Run persist data properly.
              </p>
              
              {mongoError && (
                <div className="p-3 bg-stone-950/80 rounded-xl border border-rose-950/40 font-mono text-[11px] text-rose-400 select-text overflow-x-auto">
                  <span className="font-bold text-rose-350">Error reported:</span>
                  <div className="mt-1 whitespace-pre">{mongoError}</div>
                </div>
              )}

              <div className="pl-4.5 border-l border-rose-500/25 py-0.5 space-y-2">
                <p className="font-semibold text-white">Follow this fast 2-step setup to resolve the block:</p>
                <ol className="list-decimal pl-4 space-y-1.5 text-stone-300 font-light leading-relaxed">
                  <li>
                    Visit your <a href="https://cloud.mongodb.com" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 underline font-semibold transition-colors">MongoDB Atlas Dashboard ↗</a>, then choose <strong className="text-white">Security ➔ Network Access</strong> in the side menu.
                  </li>
                  <li>
                    Click <strong className="text-white">Add IP Address</strong>, then selection/click <strong className="text-white">"Allow Access From Anywhere"</strong>. This fills in the range as <code className="bg-rose-950/50 px-1.5 py-0.5 rounded text-rose-300 border border-rose-900/40 font-mono text-[10px]">0.0.0.0/0</code>. Click <strong className="text-white">Confirm</strong>.
                  </li>
                </ol>
                <p className="text-stone-400 text-[11px] pt-1 italic">
                  * Note: Allow Atlas about 15-30 seconds to synchronize permissions across your cluster databases, then refresh above!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick config setup instruction toggle drawer */}
        {!isFullyConfigured && (
          <details className="mt-3 text-xs text-stone-400 bg-stone-950 p-2.5 rounded border border-stone-800 group cursor-pointer">
            <summary className="font-serif select-none outline-none text-stone-300 hover:text-amber-500 transition-colors flex items-center justify-between">
              <span className="flex items-center space-x-1.5 font-sans justify-start">
                <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>How do I populate my personal keys and secrets to run real MongoDB & Razorpay payments?</span>
              </span>
              <span className="text-amber-500 group-open:rotate-180 transform transition-transform">▼</span>
            </summary>
            <div className="mt-2.5 pl-5 border-l border-amber-500/20 space-y-2 font-sans cursor-default">
              <p className="leading-relaxed">
                To connect your own private database and checkouts permanently, open the <strong>Secrets API Keys panel</strong> in the <strong>Settings menu</strong> of the AI Studio workspace and set:
              </p>
              <ul className="list-disc pl-4 space-y-1 font-mono text-[11px] text-stone-300">
                <li><strong className="text-amber-400">MONGODB_URI</strong>: Create a database on MongoDB Atlas & paste the URI connection string.</li>
                <li><strong className="text-amber-400">JWT_SECRET</strong>: Any strong alphanumeric string (e.g. <code>aura_candle_9988_secret_key</code>).</li>
                <li><strong className="text-amber-400">RAZORPAY_KEY_ID</strong> & <strong className="text-amber-400">RAZORPAY_KEY_SECRET</strong>: Get credentials from your Razorpay Merchant Dashboard in Test Mode.</li>
              </ul>
              <p className="text-stone-400 text-[11px]"> After saving secret values, restart your development environment to activate changes.</p>
            </div>
          </details>
        )}
      </div>
    </motion.div>
  );
}
