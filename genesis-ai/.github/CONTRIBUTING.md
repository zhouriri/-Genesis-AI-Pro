# Contributing to Genesis AI

Thank you for your interest in contributing to Genesis AI! 🎉

This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## Getting Started

### Prerequisites

- Node.js >= 18.x
- Python >= 3.10
- npm >= 9.x
- Git

### Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/-Genesis-AI-Pro.git
   cd -Genesis-AI-Pro
   ```

3. Set up development environment:
   ```bash
   npm run setup
   ```

4. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Project Structure

```
genesis-ai/
├── contracts/    # Smart contracts (Solidity)
├── api/          # Backend API (Express + TypeScript)
├── web/          # Frontend (Next.js + React)
├── ai-agent/     # AI Agent (Python + LangChain)
├── docs/         # Documentation
└── scripts/      # Utility scripts
```

## Development Workflow

### 1. Smart Contracts

```bash
cd contracts

# Compile contracts
npm run compile

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### 2. Backend API

```bash
cd api

# Development mode
npm run dev

# Build for production
npm run build

# Run production server
npm start
```

### 3. Frontend

```bash
cd web

# Development mode
npm run dev

# Build for production
npm run build
```

### 4. AI Agent

```bash
cd ai-agent

# Run agent
python -m src.main

# Run tests
pytest
```

## Coding Standards

### Commits

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new trading strategy module
fix: resolve slippage calculation issue
docs: update API documentation
style: format code with prettier
refactor: optimize gas consumption
test: add unit tests for vault contract
chore: update dependencies
```

### Pull Requests

1. Ensure all tests pass locally
2. Update documentation if needed
3. Fill out the PR template completely
4. Request review from code owners

## Reporting Issues

- Use the GitHub issue tracker
- Search for existing issues before creating new ones
- Include environment details and steps to reproduce

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
