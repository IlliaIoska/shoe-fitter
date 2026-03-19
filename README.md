# 👟 ShapeFit — Custom Footwear 3D Visualizer

A local web app that takes your exact foot measurements and renders an interactive 3D model of the optimal shoe or boot fit — including an interior/cross-section view so you can see how your foot sits inside.

**Zero hosting fees. Runs 100% on your machine.**

---

## Features

- **5 footwear types**: Sneaker, Ankle Boot, 6" Boot, 8" Boot, 10–11" Boot
- **8 foot measurements**: Length, Width, Ball Circumference, Waist Circumference, Instep, Heel, Ankle, and Calf
- **Imperial & metric**: Switch between inches and centimeters
- **3D viewer**: Drag to rotate, scroll to zoom
- **Exterior view**: Full shoe model scaled to your measurements
- **Interior / Section view**: Cross-section with insole, lining, and foot ghost showing how your foot fits

---

## Requirements

- Python 3.8+
- pip

---

## Setup & Run

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/shoe-fitter.git
cd shoe-fitter

# 2. (Optional) Create a virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run the app
python app.py
```

Then open your browser and go to: **http://localhost:5000**

---

## How to Use

1. **Select a footwear type** from the left panel
2. **Choose your unit** (cm or inches)
3. **Enter your foot measurements** — use a soft measuring tape
4. Click **Generate 3D Model**
5. Drag to rotate the model, scroll to zoom
6. Toggle between **Exterior** and **Interior / Section** views

---

## Measurement Guide

| Measurement | How to Measure |
|---|---|
| **Foot Length** | Heel to longest toe on a flat surface |
| **Foot Width** | Widest point across the ball of foot |
| **Ball Circumference** | Tape around widest part of the forefoot |
| **Waist Circumference** | Tape around the narrower arch area |
| **Instep Circumference** | Over the top of the foot at its highest point |
| **Heel Circumference** | Around the heel and over the instep |
| **Ankle Circumference** | Around the ankle bone |
| **Calf Circumference** | Around the widest part of the calf (boots only) |

---

## Project Structure

```
shoe-fitter/
├── app.py              # Flask backend — fit calculations
├── requirements.txt
├── templates/
│   └── index.html      # Main UI
└── static/
    ├── css/
    │   └── style.css
    └── js/
        ├── viewer.js   # Three.js 3D renderer
        └── app.js      # UI controller
```

---

## Tech Stack

- **Python / Flask** — measurement processing, fit computation
- **Three.js** — 3D rendering (loaded from CDN, no build step needed)
- **Vanilla JS + CSS** — no framework, no bundler

---

## License

MIT
