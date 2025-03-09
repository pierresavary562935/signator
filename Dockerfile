# Use the official Node.js image as the base image
FROM node:22-alpine

# Set the working directory
WORKDIR /src

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of the application code
COPY . .

# Build the Next.js application
# RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# prisma
RUN npx prisma generate
# Start the Next.js application
CMD npm run dev
