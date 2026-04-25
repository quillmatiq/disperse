import {
  configureOAuth,
  createAuthorizationUrl,
  finalizeAuthorization,
  getSession,
  OAuthUserAgent,
  type Session,
} from "@atcute/oauth-browser-client";
import {
  CompositeDidDocumentResolver,
  LocalActorResolver,
  PlcDidDocumentResolver,
  WebDidDocumentResolver,
  XrpcHandleResolver,
} from "@atcute/identity-resolver";
import { Client } from "@atcute/client";

import { OAUTH_SCOPE } from "./constants";

let oauthConfigured = false;

function ensureOAuthConfigured(): void {
  if (oauthConfigured) return;
  oauthConfigured = true;
  configureOAuth({
    metadata: {
      client_id: `${window.location.origin}/oauth/client-metadata.json`,
      redirect_uri: `${window.location.origin}/oauth/callback`,
    },
    identityResolver: new LocalActorResolver({
      handleResolver: new XrpcHandleResolver({
        serviceUrl: "https://public.api.bsky.app",
      }),
      didDocumentResolver: new CompositeDidDocumentResolver({
        methods: {
          plc: new PlcDidDocumentResolver(),
          web: new WebDidDocumentResolver(),
        },
      }),
    }),
  });
}

export async function login(handle: string): Promise<void> {
  ensureOAuthConfigured();
  const url = await createAuthorizationUrl({
    target: { type: "account", identifier: handle as `${string}.${string}` },
    scope: OAUTH_SCOPE,
  });
  // Small delay to let the browser store PKCE state before navigating
  await new Promise((r) => setTimeout(r, 200));
  window.location.assign(url);
}

export async function handleCallback(): Promise<{
  agent: OAuthUserAgent;
  rpc: Client;
  session: Session;
}> {
  ensureOAuthConfigured();
  // ATProto OAuth uses response_mode=fragment, so params arrive in the hash
  const params = new URLSearchParams(window.location.hash.slice(1));
  // Clean up the URL, keeping the query string but removing the hash
  history.replaceState(null, "", window.location.pathname + window.location.search);

  const { session } = await finalizeAuthorization(params);
  const agent = new OAuthUserAgent(session);
  const rpc = new Client({ handler: agent });
  return { agent, rpc, session };
}

export async function getActiveSession(): Promise<{
  agent: OAuthUserAgent;
  rpc: Client;
  session: Session;
} | null> {
  ensureOAuthConfigured();
  const stored = localStorage.getItem("disperse:did");
  if (!stored) return null;

  try {
    const session = await getSession(stored as `did:${string}:${string}`, {
      allowStale: true,
    });
    const agent = new OAuthUserAgent(session);
    const rpc = new Client({ handler: agent });
    return { agent, rpc, session };
  } catch {
    localStorage.removeItem("disperse:did");
    return null;
  }
}

export async function refreshSession(did: string): Promise<void> {
  await getSession(did as `did:${string}:${string}`, { allowStale: false });
}

export async function logout(agent: OAuthUserAgent): Promise<void> {
  await agent.signOut();
  localStorage.removeItem("disperse:did");
}

export function storeDid(did: string): void {
  localStorage.setItem("disperse:did", did);
}
