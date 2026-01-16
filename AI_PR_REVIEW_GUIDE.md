# AI-Powered PR Review System

## Overview

This project includes an advanced AI-powered Pull Request (PR) review system that performs strict code checking and logical validation to provide intelligent code review recommendations. The system is designed for GitHub integration and open-source projects.

## Features

### 1. **Strict Code Checks**

The AI bot performs comprehensive code quality validation:

- **TypeScript Strict Mode**: Validates proper typing and type safety
- **Linting Standards**: Checks ESLint compliance (80+ score minimum, 90+ optimal)
- **Test Coverage**: Verifies all tests pass before approval
- **Code Formatting**: Ensures proper formatting guidelines are followed
- **Branch Naming Convention**: Validates branch follows proper naming patterns
  - Allowed prefixes: `feature/`, `bugfix/`, `hotfix/`, `chore/`, `refactor/`, `docs/`

### 2. **Logical Validation**

The AI analyzes code logic and best practices:

- **Documentation**: Checks PR title and description completeness
- **Change Scope**: Validates change descriptions match their complexity
- **Feature Testing**: Ensures new features include test coverage
- **Breaking Changes**: Detects and flags potential breaking changes
- **Security Analysis**: Identifies security-sensitive code patterns
- **Performance**: Flags performance-critical code for additional review

### 3. **Scoring System**

The AI generates an overall score (0-100) based on:

```
Base Score: 100
- Code Check Errors: -15 points each
- Code Check Warnings: -5 points each
- Logical Issues: -10 points each
+ Bonus for excellent lint (≥95): +5 points
+ Bonus for comprehensive description (>100 chars): +3 points

Approval Threshold: ≥85 score + ≥90 lint + tests passing
```

### 4. **AI Review Components**

#### Code Check Severity Levels:

- **Error** (Red): Critical issues that must be fixed
- **Warning** (Yellow): Important issues to address
- **Info** (Green): Positive feedback on code quality

#### Categories Analyzed:

1. **Naming Convention**

   - PR title descriptiveness (minimum 10 characters)
   - Branch name format compliance

2. **Code Formatting**

   - Proper formatting standards
   - Code style consistency

3. **Linting**

   - Static analysis results
   - Code quality metrics

4. **Testing**

   - Test passing status
   - Test coverage requirements

5. **Feature Development**

   - Test requirements for new features
   - Documentation of new features

6. **API Compatibility**

   - Breaking change detection
   - Version compatibility

7. **Security**

   - Sensitive keyword detection
   - Auth/permission code review

8. **Performance**
   - Performance-critical code detection
   - Optimization suggestions

## Usage

### Submitting a PR

1. Navigate to **PR Review** section
2. Fill in PR details:

   - **PR Title**: Descriptive title (min 10 characters)
   - **Branch Name**: Use proper prefix (feature/, bugfix/, etc.)
   - **Lint Score**: Enter linting score (0-100)
   - **Tests Passed**: Check if all tests pass
   - **Description**: Detailed explanation of changes

3. Click **Submit PR**

### AI Review Analysis

After submission, the AI bot automatically:

1. Performs strict code checks
2. Validates logical requirements
3. Calculates overall AI score
4. Provides recommendations
5. Generates approval/rejection decision

### Viewing AI Results

- **AI Score Badge**: Shows score (color-coded: green ≥90, yellow ≥75, red <75)
- **Click to Expand**: View detailed code checks and suggestions
- **Recommendations**: Actionable improvement suggestions
- **Final Decision**: AI recommendation for approval or changes requested

### Manual Review

For pending PRs, you can:

1. Add custom review comments
2. Manually approve based on AI analysis
3. Request changes with detailed feedback

## Configuration

### Thresholds

To modify approval thresholds, edit `pr-review.service.ts`:

```typescript
const lintThreshold = 90; // Minimum lint score
const minLintScore = pr.lintScore >= lintThreshold;
```

### Severity Rules

Modify code check severity by editing `performStrictCodeChecks()` method:

- Change penalty points in `calculateAIScore()`
- Add/remove check categories
- Adjust severity levels for specific checks

### Branch Prefixes

Update allowed branch prefixes in `isValidBranchName()`:

```typescript
const validPrefixes = ['feature/', 'bugfix/', 'hotfix/', 'chore/', 'refactor/', 'docs/'];
```

## AI Decision Logic

### Automatic Approval

PR is automatically approved when:

- ✅ AI Score ≥ 85
- ✅ Lint Score ≥ 90
- ✅ All tests passing
- ✅ No critical code check errors

### Requires Changes

PR requires changes when:

- ❌ AI Score < 85
- ❌ Lint Score < 90
- ❌ Tests failing
- ❌ Critical code check errors present

## GitHub Integration

This system is designed for GitHub without requiring any external license:

1. **No external dependencies**: All logic is self-contained
2. **Customizable**: Easy to adapt for specific project needs
3. **Open Source friendly**: Can be integrated as a GitHub Action
4. **Real-time feedback**: Instant PR analysis on submission

## Implementation Details

### Service Methods

```typescript
// Perform full AI review
performAIReview(pr: PullRequest): AIReviewResult

// Perform strict code checks
performStrictCodeChecks(pr: PullRequest): CodeCheckResult[]

// Perform logical validation
performLogicalValidation(pr: PullRequest): LogicalCheckResult[]

// Calculate AI score
calculateAIScore(...): number

// Generate recommendations
generateRecommendations(...): string[]
```

### Data Models

```typescript
interface AIReviewResult {
  strictCodeChecks: CodeCheckResult[];
  logicalValidation: LogicalCheckResult[];
  overallScore: number;
  recommendations: string[];
  shouldApprove: boolean;
}

interface CodeCheckResult {
  category: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
}

interface LogicalCheckResult {
  category: string;
  issue: string;
  suggestion: string;
}
```

## Future Enhancements

- ML-based pattern recognition for code smells
- Integration with GitHub API for automatic commenting
- Custom rule sets per repository
- Performance benchmarking for optimized code
- Security vulnerability scanning
- Dependency analysis and updates

## License

No license required. Free to use for GitHub projects and personal use.

## Support

For issues or feature requests, create an issue in the repository with:

- PR title and description
- Expected vs actual AI review result
- Steps to reproduce
