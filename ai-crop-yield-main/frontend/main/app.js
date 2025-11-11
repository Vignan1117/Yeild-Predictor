document.addEventListener("DOMContentLoaded", () => {
  gsap.registerPlugin(ScrollTrigger);

  // ---------------- Elements ----------------
  const form = document.getElementById("yieldForm");
  const resultBox = document.getElementById("result");
  const loader = document.getElementById("loader");
  const gauge = document.getElementById("yieldGauge");
  const resetBtn = document.getElementById("resetBtn");
  const clearHistoryBtn = document.getElementById("clearHistoryBtn");
  const themeToggle = document.getElementById("themeToggle");
  const historyTableBody = document.querySelector("#historyTable tbody");
  const historyFilterInput = document.getElementById("historyFilter");
  const yieldCtx = document.getElementById("yieldChart").getContext("2d");
  const pieCtx = document.getElementById("pieChart").getContext("2d");
  const downloadBarBtn = document.getElementById("downloadBarChart");
  const downloadPieBtn = document.getElementById("downloadPieChart");

  const soilForm = document.getElementById("soilForm");
  const soilResult = document.getElementById("soilResult");

  let historyData = JSON.parse(localStorage.getItem("yieldHistory") || "[]");
  let soilData = JSON.parse(localStorage.getItem("soilData") || "{}");

  // ---------------- Suggestions ----------------
  const suggestions = {
    High: {
      fertilizer: "Maintain current fertilization schedule",
      water: "Irrigate as usual",
      soil_tips: "Keep monitoring soil nutrients",
      weather_advice: "Optimal weather, no major action needed",
      pest_management: "Regularly check for pests, minimal action needed",
      next_crop: "Consider planting legumes next season for nitrogen fixation"
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
      next_crop: "Plant soil-enriching crops like legumes or green manure"
    }
  };

  // ---------------- Charts ----------------
  const yieldBarChart = new Chart(yieldCtx, {
    type: "bar",
    data: {
      labels: historyData.map(d => d.crop + "-" + d.soil),
      datasets: [{
        label: "Predicted Yield (tons)",
        data: historyData.map(d => d.yield),
        backgroundColor: historyData.map(d => d.category === "High" ? "#2E7D32" : d.category === "Medium" ? "#FBC02D" : "#C62828")
      }]
    },
    options: { responsive: true, plugins: { tooltip: { enabled: true } }, scales: { y: { beginAtZero: true } } }
  });

  const yieldPieChart = new Chart(pieCtx, {
    type: "pie",
    data: { labels: ["High","Medium","Low"], datasets: [{ label: "Yield Categories", data: [0,0,0], backgroundColor: ["#2E7D32","#FBC02D","#C62828"] }] },
    options: { responsive: true }
  });

  // ---------------- Helpers ----------------
  function updateHistoryTable(filter = "") {
    historyTableBody.innerHTML = "";
    historyData.filter(d => d.crop.toLowerCase().includes(filter.toLowerCase()) || d.soil.toLowerCase().includes(filter.toLowerCase()))
      .forEach(d => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${d.crop}</td><td>${d.soil}</td><td>${d.area}</td><td>${d.rainfall}</td><td>${d.yield}</td><td>${d.category}</td>`;
        historyTableBody.appendChild(row);
        gsap.from(row, { opacity:0, y:30, duration:0.6, scrollTrigger:{ trigger: row, start:"top 90%", toggleActions:"play none none none" } });
      });
  }

  function updateCharts() {
    yieldBarChart.data.labels = historyData.map(d => d.crop + "-" + d.soil);
    yieldBarChart.data.datasets[0].data = historyData.map(d => d.yield);
    yieldBarChart.data.datasets[0].backgroundColor = historyData.map(d => d.category === "High" ? "#2E7D32" : d.category === "Medium" ? "#FBC02D" : "#C62828");
    yieldBarChart.update();

    const counts = { High:0, Medium:0, Low:0 };
    historyData.forEach(d => counts[d.category]++);
    yieldPieChart.data.datasets[0].data = [counts.High, counts.Medium, counts.Low];
    yieldPieChart.update();
  }

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

  // ---------------- Initial Animations ----------------
  gsap.from("#yieldForm input, #yieldForm select, #yieldForm button", { opacity:0, y:30, stagger:0.15, duration:0.8, ease:"power2.out", scrollTrigger:{ trigger:"#yieldForm", start:"top 80%" } });
  gsap.from([resetBtn, clearHistoryBtn, themeToggle], { opacity:0, y:20, stagger:0.2, duration:0.8, ease:"power2.out", scrollTrigger:{ trigger:resetBtn, start:"top 90%" } });

  // ---------------- Load Initial ----------------
  updateHistoryTable();
  updateCharts();
  if (Object.keys(soilData).length) displaySoilAdvice(soilData);

  // ---------------- Yield Form Submit ----------------
  form.addEventListener("submit", e => {
    e.preventDefault();
    const crop = document.getElementById("crop").value;
    const soil = document.getElementById("soil").value;
    const area = parseFloat(document.getElementById("area").value || "0");
    const rainfall = parseFloat(document.getElementById("rainfall").value || "0");

    if (!crop || !soil || area <=0 || rainfall <0) {
      resultBox.textContent = "⚠️ Fill all fields correctly!";
      resultBox.className = "low";
      gsap.from(resultBox, { opacity:0, y:-20, duration:0.5 });
      return;
    }

    loader.style.display = "block";
    resultBox.textContent = "";
    gauge.innerHTML = "";

    setTimeout(() => {
      loader.style.display = "none";
      const mockYield = (Math.random()*10).toFixed(2);
      const category = mockYield >7 ? "High" : mockYield >3 ? "Medium" : "Low";
      const d = { crop, soil, area, rainfall, yield:mockYield, category, suggestions:suggestions[category] };

      resultBox.className = category.toLowerCase();
      resultBox.innerHTML = `
        <strong>🌾 Crop:</strong> ${d.crop}<br>
        <strong>📊 Predicted Yield:</strong> ${d.yield} tons (${d.category})<br>
        <strong>💡 Suggestions:</strong><br>
        - 💊 ${d.suggestions.fertilizer}<br>
        - 💧 ${d.suggestions.water}<br>
        - 🧪 ${d.suggestions.soil_tips}<br>
        - ☔ ${d.suggestions.weather_advice}<br>
        - 🐛 ${d.suggestions.pest_management}<br>
        - 🌱 ${d.suggestions.next_crop}
      `;
      animateGauge(Number(d.yield), d.category);

      historyData.push(d);
      localStorage.setItem("yieldHistory", JSON.stringify(historyData));
      updateHistoryTable(historyFilterInput.value || "");
      updateCharts();

      // ---------------- Update Fertilizer & Irrigation Schedule ----------------
      updateScheduler(d, soilData);

    }, 1000);
  });

  // ---------------- Reset & Clear ----------------
  clearHistoryBtn.addEventListener("click", () => {
    if (!confirm("Are you sure you want to clear all history?")) return;
    historyData = [];
    localStorage.removeItem("yieldHistory");
    updateHistoryTable();
    updateCharts();
    resultBox.textContent="";
    gauge.innerHTML="";
    document.querySelector("#scheduleTable tbody").innerHTML = "";
  });

  resetBtn.addEventListener("click", () => {
    form.reset();
    resultBox.textContent="";
    gauge.innerHTML="";
    document.querySelector("#scheduleTable tbody").innerHTML = "";
  });

  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-theme");
    themeToggle.textContent = document.body.classList.contains("dark-theme") ? "☀️" : "🌙";
    updateCharts();
  });

  historyFilterInput.addEventListener("input", e => updateHistoryTable(e.target.value));

  // ---------------- Download Charts ----------------
  downloadBarBtn.addEventListener("click", () => {
    const url = yieldBarChart.toBase64Image();
    const link = document.createElement("a");
    link.href = url;
    link.download="yield_bar_chart.png";
    link.click();
  });

  downloadPieBtn.addEventListener("click", () => {
    const url = yieldPieChart.toBase64Image();
    const link = document.createElement("a");
    link.href = url;
    link.download="yield_pie_chart.png";
    link.click();
  });

  // ---------------- Soil Form Submit ----------------
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

    // Update schedule if yield already exists
    if(historyData.length > 0) updateScheduler(historyData[historyData.length-1], soilData);
  });

  // ---------------- Fertilizer & Irrigation Scheduler ----------------
  function generateSchedule(yieldData, soilData) {
    const tbody = document.querySelector("#scheduleTable tbody");
    tbody.innerHTML = "";

    if (!yieldData || !soilData) return;

    const fertilizer = [];
    if (soilData.nitrogen < 1) fertilizer.push("Nitrogen-rich fertilizer");
    if (soilData.phosphorus < 0.5) fertilizer.push("Phosphate fertilizer");
    if (soilData.potassium < 0.5) fertilizer.push("Potash fertilizer");
    if (fertilizer.length === 0) fertilizer.push("Balanced NPK fertilizer");

    const irrigate = yieldData.yield > 7 ? "Daily irrigation" :
                     yieldData.yield > 3 ? "Every 2 days" : "Every 3 days";

    for (let i = 1; i <= 7; i++) {
      const tr = document.createElement("tr");
      const task = i % 2 === 0 ? "Irrigation" : "Fertilization";
      const notes = i % 2 === 0 ? irrigate : fertilizer.join(", ");
      tr.innerHTML = `<td>Day ${i}</td><td>${task}</td><td>${notes}</td>`;
      tbody.appendChild(tr);

      gsap.from(tr, { opacity: 0, y: 20, duration: 0.5, delay: i*0.05 });
    }
  }

  function updateScheduler(predictedData, soilData) {
    generateSchedule(predictedData, soilData);
  }
  // ---------------- Download Schedule ----------------
const downloadScheduleBtn = document.getElementById("downloadSchedule");

downloadScheduleBtn.addEventListener("click", () => {
  const table = document.getElementById("scheduleTable");
  let csv = [];

  // Get headers
  const headers = [];
  table.querySelectorAll("thead th").forEach(th => headers.push(th.innerText));
  csv.push(headers.join(","));

  // Get rows
  table.querySelectorAll("tbody tr").forEach(tr => {
    const row = [];
    tr.querySelectorAll("td").forEach(td => {
      // Escape quotes
      let cell = td.innerText.replace(/"/g, '""');
      row.push(`"${cell}"`);
    });
    csv.push(row.join(","));
  });

  // Create CSV file
  const csvFile = new Blob([csv.join("\n")], { type: "text/csv" });
  const downloadLink = document.createElement("a");
  downloadLink.download = "fertilizer_schedule.csv";
  downloadLink.href = URL.createObjectURL(csvFile);
  downloadLink.style.display = "none";
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
});
const pestCrop = document.getElementById("pestCrop");
const pestSoil = document.getElementById("pestSoil");
const checkPests = document.getElementById("checkPests");
const pestResult = document.getElementById("pestResult");

// Mock pest/disease data
const pestData = {
  Wheat: {
    Loamy: ["Aphids: Use neem oil", "Rust: Apply fungicide"],
    Clay: ["Powdery mildew: Proper spacing", "Armyworm: Manual removal"],
    Sandy: ["Aphids: Introduce ladybugs", "Leaf blight: Fungicide spray"],
    Black: ["Stem rust: Resistant varieties", "Cutworm: Soil treatment"]
  },
  Rice: {
    Loamy: ["Brown spot: Fungicide", "Stem borer: Light traps"],
    Clay: ["Leaf blast: Resistant varieties", "Gall midge: Water management"],
    Sandy: ["Sheath blight: Fungicide", "Brown planthopper: Insecticide"],
    Black: ["Stem rot: Drainage improvement", "Leaf folder: Biological control"]
  },
  Corn: {
    Loamy: ["Corn borer: Pheromone traps", "Aphids: Insecticidal soap"],
    Clay: ["Rootworm: Crop rotation", "Fungal leaf spot: Fungicide"],
    Sandy: ["Armyworm: Manual removal", "Corn smut: Remove affected parts"],
    Black: ["Stem fly: Soil treatment", "Rust: Resistant varieties"]
  },
  Soybean: {
    Loamy: ["Soybean aphid: Ladybugs", "Frogeye leaf spot: Fungicide"],
    Clay: ["Root rot: Well-drained soil", "Bean pod borer: Insecticide"],
    Sandy: ["White mold: Fungicide", "Aphids: Neem spray"],
    Black: ["Leaf blight: Resistant varieties", "Cutworm: Soil treatment"]
  },
  Cotton: {
    Loamy: ["Bollworm: Bt cotton", "Aphids: Neem oil"],
    Clay: ["Leafhopper: Insecticide", "Wilt: Resistant varieties"],
    Sandy: ["Whitefly: Yellow sticky traps", "Fusarium wilt: Crop rotation"],
    Black: ["Jassid: Natural predators", "Root rot: Soil treatment"]
  }
};

checkPests.addEventListener("click", () => {
  const crop = pestCrop.value;
  const soil = pestSoil.value;

  if (!crop || !soil) {
    pestResult.innerHTML = "⚠️ Select both crop and soil type!";
    return;
  }

  const advisories = pestData[crop][soil] || ["No data available"];
  pestResult.innerHTML = "<ul>" + advisories.map(a => `<li>${a}</li>`).join("") + "</ul>";
});


});
