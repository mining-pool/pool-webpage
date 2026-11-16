#!/bin/sh
# Validate runtime settings before nginx renders them into config.js and the
# CSP header. Refuse to start rather than serve a broken or injectable config.
set -eu

fail() {
    echo "nomp: $1" >&2
    exit 1
}

api="${NOMP_API_BASE_URL:-}"
name="${NOMP_POOL_NAME:-}"
host="${NOMP_STRATUM_HOST:-}"

if [ -n "$api" ] && ! printf '%s' "$api" | grep -Eq '^https?://[A-Za-z0-9.-]+(:[0-9]{1,5})?$'; then
    fail "NOMP_API_BASE_URL must be an origin like https://api.pool.example[:port] (no path)"
fi
case "$name" in
    *[\"\'\\\<\>\$\`]*) fail "NOMP_POOL_NAME must not contain quotes, backslashes, <, >, \$ or backticks" ;;
esac
if [ "$(printf '%s' "$name" | wc -l)" -ne 0 ] || [ "${#name}" -gt 64 ]; then
    fail "NOMP_POOL_NAME must be a single line of at most 64 characters"
fi
if [ -n "$host" ] && ! printf '%s' "$host" | grep -Eq '^[A-Za-z0-9.-]+$'; then
    fail "NOMP_STRATUM_HOST must be a bare host name"
fi
echo "nomp: api=${api:-<same origin>} pool=${name:-<build default>} stratum=${host:-<page host>}"
