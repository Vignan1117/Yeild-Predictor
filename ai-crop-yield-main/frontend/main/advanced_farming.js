document.addEventListener("DOMContentLoaded", () => {
  gsap.registerPlugin(ScrollTrigger);

  // ---------------- Elements ----------------
  const form = document.getElementById("yieldForm");
  const resultBox = document.getElementById("result");
  const loader = document.getElementById("loader");
  const gauge = document.getElementById("yieldGauge");
  const resetBtn = document.getElementById("resetBtn");

  const soilForm = document.getElementById("soilForm");
  const soilResult = document.getElementById("soilResult");

  const scheduleTable = document.getElementById("scheduleTable").querySelector("tbody");
  const downloadScheduleBtn = document.getElementById("downloadSchedule");

  const pestCrop = document.getElementById("pestCrop");
  const pestSoil = document.getElementById("pestSoil");
  const checkPestsBtn = document.getElementById("checkPests");
  const pestResult = document.getElementById("pestResult");

  let soilData = JSON.parse(localStorage.getItem("soilData") || "{}");

  // ---------------- Suggestions ----------------
  const suggestions = {
    High: {
      fertilizer: "Maintain current fertilization schedule",
      water: "Irrigate as usual",
      soil_tips: "Keep monitoring soil nutrients",
      weather_advice: "Optimal weather, no major action needed",
      pest_management: "Regularly check for pests, minimal action needed",
      next_crop: "Consider planting legumes next season"
    },
    Medium: {
      fertilizer: "Increase nitrogen and potassium slightly",
      water: "Ensure regular irrigation",
      soil_tips: "Test soil pH and add amendments if needed",
      weather_advice: "Watch for dry spells, provide extra irrigation",
      pest_management: "Monitor crops closely, treat early signs of pests",
      next_crop: "Plant leafy vegetables or pulses next season"
    },
    Low: {
      fertilizer: "Apply balanced fertilizers and consider compost",
      water: "Increase irrigation frequency",
      soil_tips: "Check for nutrient deficiencies and pest infestation",
      weather_advice: "Protect crops from extreme weather events",
      pest_management: "High risk of pests, apply preventive measures",
      next_crop: "Plant soil-enriching crops like legumes"
    }
  };

  // ---------------- Helpers ----------------
  function animateGauge(value, category) {
    gauge.innerHTML = "";
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.textContent = `${category} (${value} tons)`;
    bar.style.background = category === "High" ? "#2E7D32" : category === "Medium" ? "#FBC02D" : "#C62828";
    gauge.appendChild(bar);
    gsap.fromTo(bar, { width:"0%" }, { width:Math.min((value/10)*100,100)+"%", duration:1.5, ease:"power2.out" });
  }

  function displaySoilAdvice(data) {
    let advice = "";
    if (data.ph < 6) advice += "⚠️ Soil is acidic. Add lime.<br>";
    else if (data.ph > 7.5) advice += "⚠️ Soil is alkaline. Add sulfur.<br>";
    else advice += "✅ Soil pH is optimal.<br>";

    if (data.nitrogen < 1) advice += "💊 Low Nitrogen: Use nitrogen fertilizer.<br>";
    if (data.phosphorus < 0.5) advice += "💊 Low Phosphorus: Use phosphate fertilizer.<br>";
    if (data.potassium < 0.5) advice += "💊 Low Potassium: Use potash fertilizer.<br>";

    soilResult.innerHTML = advice;
  }

  function generateSchedule(yieldValue, soilData) {
    scheduleTable.innerHTML = "";

    if (!yieldValue || !soilData) return;

    const fertilizer = [];
    if (soilData.nitrogen < 1) fertilizer.push("Nitrogen-rich fertilizer");
    if (soilData.phosphorus < 0.5) fertilizer.push("Phosphate fertilizer");
    if (soilData.potassium < 0.5) fertilizer.push("Potash fertilizer");
    if (fertilizer.length === 0) fertilizer.push("Balanced NPK fertilizer");

    const irrigate = yieldValue > 7 ? "Daily irrigation" :
                     yieldValue > 3 ? "Every 2 days" : "Every 3 days";

    for (let i = 1; i <= 7; i++) {
      const tr = document.createElement("tr");
      const task = i % 2 === 0 ? "Irrigation" : "Fertilization";
      const notes = i % 2 === 0 ? irrigate : fertilizer.join(", ");
      tr.innerHTML = `<td>Day ${i}</td><td>${task}</td><td>${notes}</td>`;
      scheduleTable.appendChild(tr);
      gsap.from(tr, { opacity:0, y:20, duration:0.5, delay:i*0.1 });
    }
  }

  function downloadTable(table, filename = 'schedule.csv') {
    let csv = [];
    table.querySelectorAll("tr").forEach(row => {
      let rowData = [];
      row.querySelectorAll("th, td").forEach(cell => rowData.push(cell.textContent));
      csv.push(rowData.join(","));
    });
    const csvString = csv.join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  }

  function getPestAdvice(crop, soil) {
    if(!crop || !soil) return "Select both crop and soil to get advice.";

    const pests = {
      Wheat: "Watch for aphids and rust; use neem extract.",
      Rice: "Monitor for blast disease; keep fields dry after rain.",
      Corn: "Check for stem borers; apply bio-pesticides.",
      Soybean: "Beware of leaf miners; rotate crops.",
      Cotton: "Check for bollworm; maintain field hygiene."
    };
    return pests[crop] || "No data available for this crop.";
  }

  // ---------------- Event Listeners ----------------
  form.addEventListener("submit", e => {
    e.preventDefault();
    const crop = document.getElementById("crop").value;
    const soil = document.getElementById("soil").value;
    const area = parseFloat(document.getElementById("area").value);
    const rainfall = parseFloat(document.getElementById("rainfall").value);

    if (!crop || !soil || area<=0 || rainfall<0) {
      resultBox.textContent = "⚠️ Fill all fields correctly!";
      return;
    }

    loader.style.display = "block";
    resultBox.textContent = "";
    gauge.innerHTML = "";

    setTimeout(() => {
      loader.style.display = "none";

      // ---------------- Prediction Logic ----------------
      const baseYield = { Wheat: 3, Rice: 4, Corn: 5, Soybean: 2.5, Cotton: 3 };
      const soilFactor = { Loamy: 1.2, Clay: 0.9, Sandy: 0.8, Black: 1.1 };

      let nutrientFactor = 1;
      if (soilData.nitrogen) nutrientFactor += Math.min(soilData.nitrogen / 5, 0.3);
      if (soilData.phosphorus) nutrientFactor += Math.min(soilData.phosphorus / 5, 0.2);
      if (soilData.potassium) nutrientFactor += Math.min(soilData.potassium / 5, 0.2);

      let rainFactor = 1;
      if (rainfall < 50) rainFactor = 0.8;
      else if (rainfall > 200) rainFactor = 0.9;

      let predictedYield = baseYield[crop] * soilFactor[soil] * nutrientFactor * rainFactor * area;
      predictedYield = parseFloat(predictedYield.toFixed(2));
      const category = predictedYield > 7 ? "High" : predictedYield > 3 ? "Medium" : "Low";

      resultBox.innerHTML = `
        <strong>🌾 Crop:</strong> ${crop}<br>
        <strong>📊 Predicted Yield:</strong> ${predictedYield} tons (${category})<br>
        <strong>💡 Suggestions:</strong><br>
        - 💊 ${suggestions[category].fertilizer}<br>
        - 💧 ${suggestions[category].water}<br>
        - 🧪 ${suggestions[category].soil_tips}<br>
        - ☔ ${suggestions[category].weather_advice}<br>
        - 🐛 ${suggestions[category].pest_management}<br>
        - 🌱 ${suggestions[category].next_crop}
      `;

      animateGauge(predictedYield, category);
      generateSchedule(predictedYield, soilData);

    }, 500);
  });

  soilForm.addEventListener("submit", e => {
    e.preventDefault();
    const data = {
      ph: parseFloat(document.getElementById("ph").value),
      nitrogen: parseFloat(document.getElementById("nitrogen").value),
      phosphorus: parseFloat(document.getElementById("phosphorus").value),
      potassium: parseFloat(document.getElementById("potassium").value)
    };
    soilData = data;
    localStorage.setItem("soilData", JSON.stringify(data));
    displaySoilAdvice(data);
  });

  resetBtn.addEventListener("click", () => {
    resultBox.textContent = "";
    gauge.innerHTML = "";
    scheduleTable.innerHTML = "";
  });

  downloadScheduleBtn.addEventListener("click", () => downloadTable(document.getElementById("scheduleTable"), "fertilizer_schedule.csv"));

  checkPestsBtn.addEventListener("click", () => {
    const crop = pestCrop.value;
    const soil = pestSoil.value;
    pestResult.innerHTML = getPestAdvice(crop, soil);
  });

  // ---------------- Initial Load ----------------
  if(Object.keys(soilData).length) displaySoilAdvice(soilData);
});
