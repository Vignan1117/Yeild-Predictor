document.addEventListener("DOMContentLoaded", () => {
  const chatIcon = document.getElementById("chatIcon");
  const chatWindow = document.getElementById("chatWindow");
  const closeChat = document.getElementById("closeChat");
  const chatBox = document.getElementById("chatBox");
  const chatMessage = document.getElementById("chatMessage");
  const sendBtn = document.getElementById("sendBtn");
  const micBtn = document.getElementById("micBtn");
  const chatLang = document.getElementById("chatLang");

  // ===== 1️⃣ Toggle Chat Window =====
  chatIcon?.addEventListener("click", () => {
    chatWindow.style.display = "flex";
    chatIcon.style.display = "none";
  });

  closeChat?.addEventListener("click", () => {
    chatWindow.style.display = "none";
    chatIcon.style.display = "block";
  });

  // ===== 2️⃣ Append Messages =====
  function appendMessage(sender, text) {
    const msg = document.createElement("div");
    msg.className = sender === "user" ? "user-msg" : "bot-msg";

    if (sender === "bot") {
      msg.innerHTML = `
        <span>${text}</span>
        <button class="replayBtn" title="Speak">🔊</button>
        <button class="translateBtn" title="Translate">🌐</button>
        <button class="copyBtn" title="Copy">📋</button>
      `;

      // Speak button
      msg.querySelector(".replayBtn").addEventListener("click", () =>
        speakText(text, chatLang?.value || "English")
      );

      // Translate button
      msg.querySelector(".translateBtn").addEventListener("click", async () => {
        const targetLang = chatLang?.value || "English";
        const translated = await mockTranslate(text, targetLang);
        alert(`Translation (${targetLang}):\n${translated}`);
      });

      // Copy button
      msg.querySelector(".copyBtn").addEventListener("click", () => {
        navigator.clipboard.writeText(text).then(() => {
          alert("Copied to clipboard!");
        });
      });

      // Auto-speak bot message
      speakText(text, chatLang?.value || "English");
    } else {
      msg.textContent = text;
    }

    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  // ===== 3️⃣ Speech Synthesis =====
  function speakText(text, lang) {
    if (!("speechSynthesis" in window)) return;

    const cleanText = text.replace(/[^\w\s.,!?'-]/g, "");
    if (!cleanText) return;

    const speech = new SpeechSynthesisUtterance(cleanText);

    // Language mapping
    speech.lang =
      lang === "Hindi" ? "hi-IN" :
      lang === "Telugu" ? "te-IN" :
      lang === "Tamil" ? "ta-IN" : "en-IN";

    speech.rate = 1;
    speech.pitch = 1;

    window.speechSynthesis.speak(speech);
  }

  // ===== 4️⃣ Mock Translate (You can replace with real API later) =====
  async function mockTranslate(text, lang) {
    return new Promise(resolve =>
      setTimeout(() => resolve(`[${lang}] ${text}`), 400)
    );
  }

  // ===== 5️⃣ Send Message =====
  async function sendMessage() {
    const userMsg = chatMessage.value.trim();
    if (!userMsg) return;

    appendMessage("user", userMsg);
    chatMessage.value = "";

    try {
      const res = await fetch("/api/chat-support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          lang: chatLang?.value || "English"
        })
      });

      const json = await res.json();

      if (!json.success) {
        appendMessage("bot", json.error || "Chat failed.");
        return;
      }

      appendMessage("bot", json.reply || "No response.");
    } catch (err) {
      appendMessage("bot", "❌ Chat failed. Server error.");
    }
  }

  sendBtn?.addEventListener("click", sendMessage);

  // ===== 6️⃣ Enter Key to Send =====
  chatMessage?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  // ===== 7️⃣ Voice Input =====
  let recognition;
  if ("webkitSpeechRecognition" in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-IN";

    recognition.onstart = () => micBtn?.classList.add("listening");
    recognition.onend = () => micBtn?.classList.remove("listening");

    recognition.onresult = (e) => {
      chatMessage.value = e.results[0][0].transcript;
      sendMessage();
    };
  } else if (micBtn) {
    micBtn.disabled = true;
  }

  // Change recognition language
  chatLang?.addEventListener("change", () => {
    if (!recognition) return;
    recognition.lang =
      chatLang.value === "Hindi" ? "hi-IN" :
      chatLang.value === "Telugu" ? "te-IN" :
      chatLang.value === "Tamil" ? "ta-IN" : "en-IN";
  });

  micBtn?.addEventListener("click", () => {
    if (recognition) recognition.start();
  });
});
