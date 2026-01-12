# Nginx Reverse Proxy Dockerfile
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Tạo thư mục cho SSL certificates (sẽ được mount từ host)
RUN mkdir -p /etc/letsencrypt/live

# Expose ports
EXPOSE 80 443

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

