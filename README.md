# Galileo Ramp Demo Dashboard

Static GitHub Pages dashboard for Galileo's Ramp open day demo.

## Features

- Responsive layout for mobile and laptop screens.
- Total number of experiments.
- Histogram of measured `g` values.
- Mean and standard deviation of `g`.

## Data source

Data is fetched from the Google Apps Script web app endpoint:

`https://script.google.com/macros/s/AKfycbxSAmARkkiSKkmw4T_dpZRnnJMJu1fyY-jDCW_hdFlc6oKD4GdNXeQFK2gd0tbYnQyR/exec`

Expected JSON structure:

```json
[
  {"timestamp":"2026-03-06T18:33:57.000Z","experiment":1,"g":9.696},
  {"timestamp":"2026-03-06T18:36:03.000Z","experiment":1,"g":10.19}
]
```

## Run locally

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.
