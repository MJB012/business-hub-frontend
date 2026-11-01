#!/bin/sh
set -e

# Generate env-config.js dynamically from environment variables
cat <<EOF > /usr/share/nginx/html/env-config.js
window.__ENV__ = {
  VITE_API_BASE_URL: "${VITE_API_BASE_URL:-http://localhost:3004}"
};
EOF

# Execute container CMD (default: nginx -g 'daemon off;')
exec "$@"
