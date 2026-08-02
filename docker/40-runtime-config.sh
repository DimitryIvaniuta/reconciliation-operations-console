#!/bin/sh
set -eu

: "${APP_ENVIRONMENT:=production}"
: "${APP_SUPPORT_URL:=}"
: "${BACKEND_API_URL:=http://host.docker.internal:8080}"
: "${BACKEND_API_KEY:?BACKEND_API_KEY must be configured}"

case "$BACKEND_API_URL" in
  http://*|https://*) ;;
  *) echo "BACKEND_API_URL must use http or https" >&2; exit 1 ;;
esac

# Prevent deployment values from becoming nginx directives during envsubst.
if ! printf '%s' "$BACKEND_API_URL" | grep -Eq '^https?://[A-Za-z0-9.-]+(:[0-9]{1,5})?(/[A-Za-z0-9._~:/?%#@&=+,-]*)?$'; then
  echo "BACKEND_API_URL contains unsupported characters" >&2
  exit 1
fi
if ! printf '%s' "$BACKEND_API_KEY" | grep -Eq '^[A-Za-z0-9._~+/=-]{8,512}$'; then
  echo "BACKEND_API_KEY contains unsupported characters or has an unsafe length" >&2
  exit 1
fi
if ! printf '%s' "$APP_ENVIRONMENT" | grep -Eq '^[A-Za-z0-9._ -]{1,64}$'; then
  echo "APP_ENVIRONMENT contains unsupported characters or has an unsafe length" >&2
  exit 1
fi
if [ -n "$APP_SUPPORT_URL" ] && ! printf '%s' "$APP_SUPPORT_URL" | grep -Eq '^(https://[A-Za-z0-9.-]+(:[0-9]{1,5})?(/[A-Za-z0-9._~:/?%#@&=+,-]*)?|/[A-Za-z0-9._~/?%#@&=+,-]*)$'; then
  echo "APP_SUPPORT_URL must be an HTTPS URL or a same-origin absolute path" >&2
  exit 1
fi
if [ "${#APP_SUPPORT_URL}" -gt 2048 ]; then
  echo "APP_SUPPORT_URL exceeds the safe length limit" >&2
  exit 1
fi

json_escape() {
  printf '%s' "$1" | awk 'BEGIN { ORS="" } { gsub(/\\/, "\\\\"); gsub(/\"/, "\\\""); if (NR > 1) printf "\\n"; printf "%s", $0 }'
}

ENVIRONMENT_JSON=$(json_escape "$APP_ENVIRONMENT")
SUPPORT_URL_JSON=$(json_escape "$APP_SUPPORT_URL")

# Runtime values are deployment-controlled. The backend key is intentionally omitted.
mkdir -p /var/run/ledgerguard
cat > /var/run/ledgerguard/config.js <<EOF_CONFIG
window.__APP_CONFIG__ = Object.freeze({
  apiBaseUrl: "/api",
  healthBaseUrl: "/actuator",
  authMode: "proxy",
  environment: "${ENVIRONMENT_JSON}",
  supportUrl: "${SUPPORT_URL_JSON}"
});
EOF_CONFIG
