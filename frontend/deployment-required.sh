#!/bin/sh
set -eu
test -n "${JIAYOU_PUBLIC_HOST:-}" || { echo 'Jiayou public host is required' >&2; exit 1; }
test -r /etc/nginx/jiayou/trusted-ingress.conf || { echo 'Jiayou ingress peer contract is required' >&2; exit 1; }
mkdir -p /tmp/jiayou-nginx
