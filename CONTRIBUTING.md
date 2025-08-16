# Contributing to MatchVibe

## 🤖 AI-Only Code Policy

**CRITICAL REQUIREMENT**: This is a purely AI-coded project. By contributing, you confirm that you are **NOT** adding any human-written lines of code.

## How to Contribute

### Prerequisites

- Access to an AI coding assistant (Claude Code, GitHub Copilot, etc.)
- Understanding that all code must be AI-generated
- Willingness to maintain the experimental nature of this project

### Contribution Process

1. **Fork the Repository**
   - Create your own fork of the MatchVibe repository

2. **Create a Feature Branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Generate Code Using AI**
   - Use Claude Code or another AI assistant exclusively
   - Document which AI tool was used in your PR description
   - No manual code writing allowed

4. **Commit Your Changes**
   - Follow conventional commit format
   - Example: `feat: add user profile component`

5. **Push to Your Fork**

   ```bash
   git push origin feature/your-feature-name
   ```

6. **Submit a Pull Request**
   - Provide clear description of changes
   - Specify which AI assistant generated the code
   - Include prompt strategies if relevant

## Code of Conduct

### Expected Behavior

- Respect the experimental nature of this project
- Provide constructive feedback on AI-generated code
- Share insights about AI coding effectiveness
- Help document AI limitations discovered

### Unacceptable Behavior

- Adding human-written code (this breaks the experiment)
- Claiming AI-generated code as human-written
- Harassment about code quality (roasting the code is fine, attacking people is not)

## Types of Contributions

### Bug Reports

When reporting bugs in AI-generated code:

- Include the problematic code section
- Describe expected vs actual behavior
- Tag as `ai-bug` for tracking patterns

### Feature Requests

- Describe the feature clearly
- Explain how it should be AI-implemented
- Consider AI capabilities and limitations

### Code Reviews

- Focus on patterns in AI-generated code
- Identify systematic issues
- Suggest better prompting strategies

## Development Setup

```bash
# Clone your fork
git clone https://github.com/mars-mx/matchvibe.git

# Install dependencies
npm install

# Run development server
npm run dev
```

## Testing

All tests must also be AI-generated:

```bash
npm run test        # Run tests
npm run lint        # Check linting
npm run typecheck   # Check types
```

## Documentation

- Documentation updates must be AI-generated
- Include prompts used for complex documentation
- Maintain consistency with existing AI style

## Questions?

If you have questions about contributing:

1. Check existing issues and discussions
2. Ask your AI assistant first
3. Open a discussion if still unclear

## Certification

By submitting a pull request, you certify that:

- [ ] All code is 100% AI-generated
- [ ] No manual code modifications were made
- [ ] You've tested the AI-generated solution
- [ ] You're contributing to the experiment in good faith

---

**Remember**: This project exists to explore the boundaries of AI-assisted development. Every contribution helps us understand what's possible when humans step back and let AI write the code.
