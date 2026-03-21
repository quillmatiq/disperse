import type { APIRoute } from "astro";

export const GET: APIRoute = ({ url, request }) => {
  // When behind a reverse proxy (ngrok, etc.), reconstruct the real public origin
  // from X-Forwarded-* headers rather than the internal request URL.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  // Only trust X-Forwarded-* headers if they look like a valid hostname — never
  // allow arbitrary values to flow into OAuth client_id / redirect_uris.
  const VALID_HOST_RE = /^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*(:\d+)?$/;
  const trustedHost = forwardedHost && VALID_HOST_RE.test(forwardedHost) ? forwardedHost : null;
  const origin =
    import.meta.env.PUBLIC_ORIGIN ??
    (trustedHost ? `${forwardedProto}://${trustedHost}` : url.origin);

  const metadata = {
    client_id: `${origin}/oauth/client-metadata.json`,
    client_name: "Disperse",
    client_uri: origin,
    redirect_uris: [`${origin}/oauth/callback`],
    scope: "atproto transition:generic",
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    token_endpoint_auth_method: "none",
    application_type: "web",
    dpop_bound_access_tokens: true,
  };

  return new Response(JSON.stringify(metadata), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-cache",
    },
  });
};
