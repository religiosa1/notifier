# syntax=docker/dockerfile:1

# You should build this image from the root of the repo, like this:
# docker build -t notifier-admin -f ./packages/admin/Dockerfile . \
#  --build-arg=API_URL=http://your-backend-address:8085/

# https://docs.docker.com/engine/reference/builder/

ARG NODE_VERSION=20.10.0
ARG PNPM_VERSION=8.13.1

################################################################################
# Use node image for base image for all stages.
FROM node:${NODE_VERSION}-alpine as base

# Set working directory for all build stages.
WORKDIR /usr/src/app

# Install pnpm.
RUN --mount=type=cache,target=/root/.npm \
    npm install -g pnpm@${PNPM_VERSION}

################################################################################
# Create a stage for installing production dependecies.
FROM base as deps

# Download dependencies as a separate step to take advantage of Docker's caching.
# Leverage a cache mount to /root/.local/share/pnpm/store to speed up subsequent builds.
# Leverage bind mounts to package.json and pnpm-lock.yaml to avoid having to copy them
# into this layer.
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=packages/admin/package.json,target=packages/admin/package.json \
    --mount=type=bind,source=packages/shared/package.json,target=packages/shared/package.json \
    --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
    --mount=type=bind,source=pnpm-workspace.yaml,target=pnpm-workspace.yaml \
    --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --prod --frozen-lockfile --filter admin

################################################################################
# Create a stage for building the application.
FROM deps as build

# REQUIRED: backend connection url 
ARG API_URL
# Optional initial database connection url value for the setup page
ARG DB_URL
# Optional hardcoded public URL for CORS
ARG ORIGIN
ARG PROTOCOL_HEADER="X-Forwarded-Proto"
ARG HOST_HEADER="X-Forwarded-Host"

RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=packages/admin/package.json,target=packages/admin/package.json \
    --mount=type=bind,source=packages/shared/package.json,target=packages/shared/package.json \
    --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
    --mount=type=bind,source=pnpm-workspace.yaml,target=pnpm-workspace.yaml \
    --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --force --filter admin

# Copy the rest of the source files into the image.
COPY packages/admin ./packages/admin
COPY packages/shared ./packages/shared

# Run the build script.
RUN cd packages/admin && pnpm run build

################################################################################
# Create a new stage to run the application with minimal runtime dependencies
# where the necessary files are copied from the build stage.
FROM base as final

# Use production node environment by default.
ENV NODE_ENV production

# Run the application as a non-root user.
USER node

# Copy package.json so that package manager commands can be used.
COPY packages/admin/package.json ./packages/admin/package.json

# Copy the production dependencies from the deps stage and also
# the built application from the build stage into the image.
COPY --from=deps /usr/src/app/node_modules ./node_modules 
COPY --from=deps /usr/src/app/packages/admin/node_modules ./packages/admin/node_modules
COPY --from=build /usr/src/app/packages/admin/build ./packages/admin/build

# Expose the port that the application listens on.
EXPOSE 3000

# Run the application.
CMD cd packages/admin && pnpm start
