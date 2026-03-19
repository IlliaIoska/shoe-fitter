/* app.js — UI controller */

document.addEventListener('DOMContentLoaded', () => {
  const viewer = new ShoeViewer('shoeCanvas');

  let selectedShoe = null;
  let selectedUnit = 'cm';
  let viewMode = 'exterior';

  // ── SHOE TYPE SELECTION ──
  document.querySelectorAll('.shoe-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.shoe-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedShoe = btn.dataset.type;
    });
  });

  // ── UNIT TOGGLE ──
  document.querySelectorAll('.unit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.unit-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedUnit = btn.dataset.unit;
      updatePlaceholders(selectedUnit);
    });
  });

  function updatePlaceholders(unit) {
    const defaults = unit === 'cm'
      ? { length: '25.0', width: '9.5', ball_circ: '23.0', waist_circ: '21.5', instep_circ: '24.0', heel_circ: '32.0', ankle_circ: '22.5', calf_circ: '36.0' }
      : { length: '9.8', width: '3.7', ball_circ: '9.1', waist_circ: '8.5', instep_circ: '9.4', heel_circ: '12.6', ankle_circ: '8.9', calf_circ: '14.2' };
    for (const [id, val] of Object.entries(defaults)) {
      const el = document.getElementById(id);
      if (el) el.placeholder = val;
    }
  }

  // ── VIEW TOGGLE ──
  document.getElementById('btnExterior').addEventListener('click', () => {
    viewMode = 'exterior';
    document.getElementById('btnExterior').classList.add('active');
    document.getElementById('btnInterior').classList.remove('active');
    if (viewer.shoeData) viewer.setMode('exterior');
  });

  document.getElementById('btnInterior').addEventListener('click', () => {
    viewMode = 'interior';
    document.getElementById('btnInterior').classList.add('active');
    document.getElementById('btnExterior').classList.remove('active');
    if (viewer.shoeData) viewer.setMode('interior');
  });

  // ── GENERATE ──
  document.getElementById('generateBtn').addEventListener('click', async () => {
    const errorMsg = document.getElementById('errorMsg');
    errorMsg.textContent = '';

    if (!selectedShoe) {
      errorMsg.textContent = 'Please select a footwear type.';
      return;
    }

    const fields = ['length', 'width', 'ball_circ', 'waist_circ', 'instep_circ', 'heel_circ', 'ankle_circ', 'calf_circ'];
    const payload = { shoe_type: selectedShoe, unit: selectedUnit };
    let missingFields = [];

    for (const f of fields) {
      const val = parseFloat(document.getElementById(f).value);
      if (isNaN(val) || val <= 0) {
        if (f !== 'calf_circ') missingFields.push(f);
        else payload[f] = 0;
      } else {
        payload[f] = val;
      }
    }

    if (missingFields.length > 0) {
      errorMsg.textContent = `Please fill in: ${missingFields.join(', ').replace(/_/g, ' ')}.`;
      return;
    }

    // Show loading
    const overlay = document.getElementById('loadingOverlay');
    const placeholder = document.getElementById('placeholderMsg');
    overlay.style.display = 'flex';
    placeholder.style.display = 'none';
    document.getElementById('statsBar').style.display = 'none';
    document.getElementById('viewerHint').textContent = 'Drag to rotate · Scroll to zoom';

    try {
      const resp = await fetch('/api/compute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await resp.json();

      if (!result.success) throw new Error(result.error || 'Unknown error');

      overlay.style.display = 'none';
      viewer.buildShoe(result.data, viewMode);

      // Update stats bar
      const d = result.data.dimensions;
      document.getElementById('statLength').textContent = d.length.toFixed(1) + ' cm';
      document.getElementById('statWidth').textContent = d.width.toFixed(1) + ' cm';
      document.getElementById('statShaft').textContent = d.shaft_height > 0 ? d.shaft_height.toFixed(1) + ' cm' : '—';
      document.getElementById('statType').textContent = result.data.shoe_label;
      document.getElementById('statsBar').style.display = 'flex';

    } catch (e) {
      overlay.style.display = 'none';
      placeholder.style.display = 'flex';
      errorMsg.textContent = 'Error: ' + e.message;
    }
  });
});
