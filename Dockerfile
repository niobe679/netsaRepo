 # Use Node.js LTS version
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json .

# Install dependencies
RUN npm install

# Copy the rest of the server files
COPY . .  

# Expose the port (adjust if necessary)
EXPOSE 5000

# Command to start the server
CMD ["node", "./src/server.js"]