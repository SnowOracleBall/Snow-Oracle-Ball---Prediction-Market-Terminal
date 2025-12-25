# Contributing to Snow Oracle Ball

First off, thank you for considering contributing to Snow Oracle Ball! It's people like you that make this project great.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct: be respectful, inclusive, and constructive.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples**
- **Describe the behavior you observed and what you expected**
- **Include screenshots if possible**

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Explain why this enhancement would be useful**
- **List any alternatives you've considered**

### Pull Requests

1. **Fork the repo** and create your branch from `main`
2. **Install dependencies** with `npm install`
3. **Make your changes** and ensure the code follows our style guidelines
4. **Test your changes** thoroughly
5. **Commit your changes** with a clear commit message
6. **Push to your fork** and submit a pull request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/snow-oracle-ball.git
cd snow-oracle-ball

# Install dependencies
npm install

# Start development server
npm run dev
```

## Style Guidelines

### TypeScript

- Use TypeScript for all new code
- Define proper types and interfaces
- Avoid using `any` type

### React

- Use functional components with hooks
- Keep components small and focused
- Use meaningful component and prop names

### CSS/Tailwind

- Follow the existing Tailwind patterns
- Use the design system defined in `design_guidelines.md`
- Maintain consistency with the winter theme

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Keep the first line under 72 characters
- Reference issues and pull requests when relevant

## Project Structure

- `client/` - Frontend React application
- `server/` - Backend Express application
- `shared/` - Shared types and schemas
- `design_guidelines.md` - UI/UX design system

## Questions?

Feel free to open an issue with your question or reach out to the maintainers.

Thank you for contributing!
