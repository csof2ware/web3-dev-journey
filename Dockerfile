FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache git bash
CMD ["tail", "-f", "/dev/null"]
