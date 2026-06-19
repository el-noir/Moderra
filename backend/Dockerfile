FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# Make the entrypoint executable
RUN chmod +x /app/entrypoint.sh

EXPOSE 3001

CMD ["/bin/sh", "/app/entrypoint.sh"]
