# Algorithm Practice - Spaced Repetition for Coding

A minimalist web application that helps you practice and remember coding algorithms using spaced repetition techniques inspired by Anki.

## Features

- **Spaced Repetition System**: Uses the SM-2 algorithm (similar to Anki) to optimize your learning
- **Algorithm Challenges**: Practice implementing common algorithms from scratch
- **Multiple Languages**: Support for Python, Java, and JavaScript
- **Progress Tracking**: See your improvement over time with built-in statistics
- **Custom Challenges**: Add your own algorithm challenges
- **Local Storage**: All data is stored in your browser's local storage

## How It Works

Algorithm Practice uses a spaced repetition system to ensure you review algorithms at optimal intervals for memory retention:

1. **Study Phase**: You're presented with an algorithm challenge
2. **Implementation**: Write your solution in the built-in code editor
3. **Feedback**: Rate your performance (Again, Hard, Good, Easy)
4. **Spacing**: The system schedules your next review based on your performance

Algorithms you find difficult will appear more frequently, while those you've mastered will appear less often.

## Getting Started

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/algorithm-practice.git
   ```

2. Open `index.html` in your web browser

3. Start practicing! The app comes preloaded with two sample algorithms (Merge Sort and Binary Search)

## Usage

### Adding New Algorithms

1. Click on "Add New Algorithm" on the home screen
2. Fill in the algorithm details:
   - Title
   - Description
   - Language (Python, Java, or JavaScript)
   - Reference solution
3. Click "Save Challenge"

### Practicing

1. Click "Start Practice" on the home screen
2. Implement the algorithm in the code editor
3. Click "Check Solution" when you're done
4. Rate your performance to determine when you'll see this algorithm again

### Settings

You can customize your experience in the Settings menu:
- Set daily new cards limit
- Set daily review limit
- Choose theme
- Export/import your data

## Technical Details

- **Pure HTML/CSS/JavaScript**: No backend dependencies
- **TailwindCSS**: Used for styling
- **Ace Editor**: Code editor with syntax highlighting
- **LocalStorage**: All data is stored locally in your browser

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by [Anki](https://apps.ankiweb.net/) spaced repetition system
- Based on the [SuperMemo-2 algorithm](https://en.wikipedia.org/wiki/SuperMemo#Algorithm_SM-2)
