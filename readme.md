[![CI](https://github.com/aoisupersix/strava-leaderboard-enhanced/actions/workflows/ci.yml/badge.svg)](https://github.com/aoisupersix/strava-leaderboard-enhanced/actions/workflows/ci.yml)

# Strava Leaderboard Enhanced

A Chrome extension that enhances Strava segment leaderboards with advanced sorting, pagination management, column visibility controls, and CSV export functionality.

## Features

- **🔄 Sorting**: Click any column header to sort leaderboard data with intelligent type detection
- **📊 Load All Pages**: Automatically fetch and combine data from all leaderboard pages while preserving filters
- **📤 CSV Export**: Export leaderboard data to CSV with UTF-8 encoding and dynamic headers
- **👁️ Column Visibility**: Show/hide table columns with a collapsible control panel

## Development

```sh
git clone https://github.com/aoisupersix/strava-leaderboard-enhanced.git
npm i
npm start
```

After running the command, go to chrome://extensions, click "Load unpacked" → select the dist directory to enable the extension.

## License

The MIT License(MIT)

Copyright(c) 2025 aoisupersix

[license.md](license.md)
