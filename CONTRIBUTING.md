# Contributing to FastAPI Radar

Thank you for your interest in contributing to FastAPI Radar! We welcome contributions from the community.

## Getting Started

1. Fork the repository
2. Clone your fork:

   ```bash
   git clone https://github.com/your-username/fastapi-radar.git
   cd fastapi-radar
   ```

3. Create a virtual environment:

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

4. Install dependencies:

   ```bash
   pip install -e ".[dev]"
   ```

5. Build the dashboard:
   ```bash
   cd fastapi_radar/dashboard
   npm install
   npm run build
   cd ../..
   ```

## Development Workflow

1. Create a new branch for your feature or fix:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and test them with the example app:

   ```bash
   python example_app.py
   ```

3. Run tests:

   ```bash
   pytest
   ```

4. Format your code:

   ```bash
   black fastapi_radar/
   isort fastapi_radar/
   ```

5. Submit a pull request

## Code Style

- Follow PEP 8
- Use Black for formatting
- Use isort for import sorting
- Add type hints where appropriate
- Write docstrings for public functions and classes

## Dashboard Development

The dashboard is built with React, TypeScript, and Vite:

```bash
cd fastapi_radar/dashboard
npm run dev  # Start development server
npm run build  # Build for production
```

## Testing

- Write tests for new features
- Ensure all tests pass before submitting PR
- Maintain or improve code coverage

## Reporting Issues

- Use GitHub Issues for bug reports and feature requests
- Provide clear reproduction steps for bugs
- Include relevant system information

## Pull Request Process

1. Update documentation for any new features
2. Ensure your branch is up to date with main
3. Write clear commit messages
4. Reference any related issues in your PR description
5. Be responsive to code review feedback

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
