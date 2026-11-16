FROM node:24-alpine@sha256:116b800c3754b440ee0aa3ed2f20f5bf3d99a554bfd9adeea09ea8017f6e85f5 AS build
WORKDIR /workspace
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV VITE_API_BASE_URL=/api/v1
ARG VITE_AUTH_COOKIE=true
ARG RELEASE_SHA
ENV VITE_AUTH_COOKIE=$VITE_AUTH_COOKIE
RUN test "$VITE_AUTH_COOKIE" = true && echo "$RELEASE_SHA" | grep -Eq '^[a-f0-9]{40}$'
RUN npm run build && node -e "require('fs').writeFileSync('dist/jiayou-build.json', JSON.stringify({revision:process.argv[1],authTransport:'cookie',apiBase:'/api/v1'}))" "$RELEASE_SHA"
FROM nginxinc/nginx-unprivileged:stable-alpine@sha256:f5116ed4606f3eb015dd4a8e28cb9b351476dc0ad4bc6e9f93b19cec130cdf03
ARG RELEASE_SHA
LABEL org.opencontainers.image.source="https://github.com/thach09/jiayou" \
      org.opencontainers.image.revision="$RELEASE_SHA" \
      io.jiayou.deployment.contract="1" io.jiayou.component="frontend" io.jiayou.auth-transport="cookie"
ENV NGINX_ENVSUBST_FILTER="^JIAYOU_" NGINX_ENVSUBST_OUTPUT_DIR=/tmp/jiayou-nginx
COPY nginx-main.conf /etc/nginx/nginx.conf
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY deployment-required.sh /docker-entrypoint.d/15-jiayou-required.sh
RUN rm /etc/nginx/conf.d/default.conf && mkdir -p /etc/nginx/jiayou && chmod +x /docker-entrypoint.d/15-jiayou-required.sh
COPY --from=build /workspace/dist /usr/share/nginx/html
EXPOSE 8080
