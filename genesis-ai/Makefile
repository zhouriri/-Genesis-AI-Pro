# Makefile for Genesis AI Pro
# Usage: make <target>

.PHONY: help install dev test build clean fmt lint contracts api web agent

# Default target
help:
	@echo "Genesis AI Pro - Make Commands"
	@echo ""
	@echo "Available targets:"
	@echo "  install    - Install all dependencies"
	@echo "  dev        - Start development servers"
	@echo "  test       - Run all tests"
	@echo "  build      - Build all projects"
	@echo "  clean      - Remove build artifacts"
	@echo "  fmt        - Format code"
	@echo "  lint       - Lint code"
	@echo "  contracts  - Smart contract commands"
	@echo "  api        - API commands"
	@echo "  web        - Web commands"
	@echo "  agent      - AI Agent commands"

# Install all dependencies
install:
	@echo "Installing all dependencies..."
	npm install && \
	npm install --prefix contracts && \
	npm install --prefix api && \
	npm install --prefix web

# Start development servers
dev:
	@echo "Starting development servers..."
	bash start.sh

# Stop development servers
stop:
	@echo "Stopping development servers..."
	bash stop.sh

# Run all tests
test:
	@echo "Running all tests..."
	cd contracts && npm test
	cd api && npm test || true

# Build all projects
build:
	@echo "Building all projects..."
	npm run build

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf contracts/node_modules/.cache
	rm -rf contracts/artifacts
	rm -rf contracts/typechain
	rm -rf api/dist
	rm -rf web/.next
	rm -rf web/build
	rm -rf **/node_modules/.cache
	find . -name "*.tsbuildinfo" -delete
	find . -name "*.log" -delete

# Format code
fmt:
	@echo "Formatting code..."
	npx prettier --write "**/*.{ts,tsx,js,jsx,json,md}" --ignore-path .prettierignore

# Lint code
lint:
	@echo "Linting code..."
	cd web && npm run lint || true

# Smart contract commands
contracts:
	@echo "Running contract commands..."
	@echo "Use: make contracts-compile, make contracts-test, make contracts-deploy"

contracts-compile:
	cd contracts && npm run compile

contracts-test:
	cd contracts && npm test

contracts-coverage:
	cd contracts && npm run test:coverage

contracts-deploy:
	cd contracts && npm run deploy:amoy

# API commands
api:
	@echo "Running API commands..."
	@echo "Use: make api-dev, make api-build, make api-start"

api-dev:
	cd api && npm run dev

api-build:
	cd api && npm run build

api-start:
	cd api && npm start

# Web commands
web:
	@echo "Running Web commands..."
	@echo "Use: make web-dev, make web-build, make web-start"

web-dev:
	cd web && npm run dev

web-build:
	cd web && npm run build

web-start:
	cd web && npm start

# AI Agent commands
agent:
	@echo "Running AI Agent commands..."
	@echo "Use: make agent-run, make agent-test"

agent-run:
	cd ai-agent && python -m src.main

agent-test:
	cd ai-agent && pytest

# Docker commands
docker-build:
	docker-compose build

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f

# Database commands
db-reset:
	@echo "Resetting database..."
	rm -f api/data/genesis.db
	cd api && npm run db:sync

# Security audit
audit:
	@echo "Running security audits..."
	cd contracts && npm audit
	cd api && npm audit
	cd web && npm audit
