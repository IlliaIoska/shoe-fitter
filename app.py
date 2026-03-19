from flask import Flask, render_template, request, jsonify
import math

app = Flask(__name__)

# Shoe type definitions: shaft heights and base dimensions (in cm)
SHOE_TYPES = {
    "sneaker": {
        "label": "Sneaker / Flat Shoe",
        "shaft_height": 0,
        "ankle_coverage": False,
        "base_length_ratio": 1.08,
        "base_width_ratio": 1.06,
    },
    "ankle_boot": {
        "label": "Ankle Boot",
        "shaft_height": 10,
        "ankle_coverage": True,
        "base_length_ratio": 1.07,
        "base_width_ratio": 1.05,
    },
    "boot_6in": {
        "label": '6" Boot',
        "shaft_height": 15.2,
        "ankle_coverage": True,
        "base_length_ratio": 1.07,
        "base_width_ratio": 1.05,
    },
    "boot_8in": {
        "label": '8" Boot',
        "shaft_height": 20.3,
        "ankle_coverage": True,
        "base_length_ratio": 1.07,
        "base_width_ratio": 1.05,
    },
    "boot_10in": {
        "label": '10–11" Boot',
        "shaft_height": 27,
        "ankle_coverage": True,
        "base_length_ratio": 1.07,
        "base_width_ratio": 1.05,
    },
}

def to_cm(value, unit):
    if unit == "in":
        return value * 2.54
    return value

def compute_fit(data):
    unit = data.get("unit", "cm")

    measurements = {
        "length": to_cm(float(data["length"]), unit),
        "width": to_cm(float(data["width"]), unit),
        "ball_circ": to_cm(float(data["ball_circ"]), unit),
        "waist_circ": to_cm(float(data["waist_circ"]), unit),
        "instep_circ": to_cm(float(data["instep_circ"]), unit),
        "heel_circ": to_cm(float(data["heel_circ"]), unit),
        "ankle_circ": to_cm(float(data["ankle_circ"]), unit),
        "calf_circ": to_cm(float(data.get("calf_circ", 0)), unit),
    }

    shoe_type = SHOE_TYPES[data["shoe_type"]]

    # Compute shoe dimensions with fit allowances
    shoe_length = measurements["length"] * shoe_type["base_length_ratio"]
    shoe_width = measurements["width"] * shoe_type["base_width_ratio"]
    ball_width = (measurements["ball_circ"] / math.pi) * 1.05
    heel_width = (measurements["heel_circ"] / math.pi) * 1.04
    instep_height = (measurements["instep_circ"] / math.pi) * 1.04
    ankle_radius = (measurements["ankle_circ"] / (2 * math.pi)) * 1.05
    calf_radius = (measurements["calf_circ"] / (2 * math.pi)) * 1.05 if measurements["calf_circ"] > 0 else ankle_radius * 1.3

    shaft_height = shoe_type["shaft_height"]

    # Toe box shape ratio (wider = more square toe, narrower = more pointed)
    toe_taper = min(1.0, max(0.3, measurements["width"] / measurements["length"] * 2.5))

    return {
        "shoe_type": data["shoe_type"],
        "shoe_label": shoe_type["label"],
        "dimensions": {
            "length": round(shoe_length, 2),
            "width": round(shoe_width, 2),
            "ball_width": round(ball_width, 2),
            "heel_width": round(heel_width, 2),
            "instep_height": round(instep_height, 2),
            "ankle_radius": round(ankle_radius, 2),
            "calf_radius": round(calf_radius, 2),
            "shaft_height": shaft_height,
            "toe_taper": round(toe_taper, 3),
            "sole_thickness": 1.8,
            "heel_height": 2.5 if "boot" in data["shoe_type"] else 1.5,
        },
        "foot_measurements": {k: round(v, 2) for k, v in measurements.items()},
        "unit": "cm",
    }


@app.route("/")
def index():
    shoe_options = {k: v["label"] for k, v in SHOE_TYPES.items()}
    return render_template("index.html", shoe_options=shoe_options)


@app.route("/api/compute", methods=["POST"])
def compute():
    try:
        data = request.get_json()
        result = compute_fit(data)
        return jsonify({"success": True, "data": result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400


if __name__ == "__main__":
    app.run(debug=True, port=5000)
