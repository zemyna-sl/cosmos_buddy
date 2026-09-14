const featureButtons = document.querySelectorAll(".feature-button");
const featurePanels = document.querySelectorAll(".feature-panel");

featureButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const panelId = button.getAttribute("aria-controls");
    const targetPanel = document.getElementById(panelId);

    const isAlreadyOpen = !targetPanel.hidden;

    featurePanels.forEach((panel) => {
      panel.hidden = true;
    });

    featureButtons.forEach((featureButton) => {
      featureButton.classList.remove("is-active");
      featureButton.setAttribute("aria-expanded", "false");
    });

    if (!isAlreadyOpen) {
      targetPanel.hidden = false;
      button.classList.add("is-active");
      button.setAttribute("aria-expanded", "true");

      if (panelId === "image-panel") {
        loadNasaImage();
      }

      if (panelId === "fact-panel") {
        loadRandomFact();
      }

      requestAnimationFrame(() => {
        targetPanel.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      });
    }
  });
});

const chatInput = document.querySelector("#chat-input");
const chatInputMirror = document.querySelector(".chat-input-mirror-text");
const chatForm = document.querySelector(".chat-form");
const chatMessages = document.querySelector(".chat-messages");
const nasaImageDisplay = document.querySelector("#nasa-image-display");
const nasaImageTitle = document.querySelector("#nasa-image-title");
const nasaImageExplanation = document.querySelector("#nasa-image-explanation");
const nasaImageButton = document.querySelector("#nasa-image-button");
const spaceFactText = document.querySelector("#space-fact-text");
const spaceFactSource = document.querySelector("#space-fact-source");
const spaceFactButton = document.querySelector("#space-fact-button");

const starTextColors = [
  "#e86b9b",
  "#f0c36c",
  "#aadf79",
  "#ff7ac8",
  "#ce9fac",
  "#df8279"
];

const chatSubmitButton = chatForm.querySelector(
  'button[type="submit"]'
);

const chatHistory = [];

function createColorfulText(text, container) {
  container.replaceChildren();

  [...text].forEach((character, index) => {
    const letter = document.createElement("span");

    letter.textContent = character;

    letter.style.color =
      starTextColors[index % starTextColors.length];

    container.appendChild(letter);
  });
}

function scrollToLatestMessage() {

  chatMessages.scrollTo({
    top: chatMessages.scrollHeight,
    behavior: "smooth"
  });

}

chatInput.addEventListener("input", () => {
  createColorfulText(
    chatInput.value,
    chatInputMirror
  );

  chatInput.style.height = "auto";
  chatInput.style.height = `${chatInput.scrollHeight}px`;
});

chatForm.addEventListener("submit", async (event) => {
  
  event.preventDefault();

  const messageText = chatInput.value.trim();

  if (!messageText) {
    return;
  }

  chatInput.disabled = true;

  chatSubmitButton.disabled = true;

  chatForm.setAttribute(
    "aria-busy",
    "true"
  );

  const message = document.createElement("div");

  message.classList.add("message", "user-message");

  const paragraph = document.createElement("p");

  createColorfulText(
    messageText,
    paragraph
  );

  message.appendChild(paragraph);
  chatMessages.appendChild(message);

  chatInput.value = "";
  chatInputMirror.replaceChildren();
  chatInput.style.height = "auto";

  const thinkingMessage = document.createElement("div");

  thinkingMessage.classList.add(
    "message",
    "buddy-message",
    "thinking-message"
  );

  thinkingMessage.setAttribute(
    "role",
    "status"
  );

  const thinkingText = document.createElement("span");

  thinkingText.classList.add("visually-hidden");

  thinkingText.textContent = "Cosmos is thinking";

  thinkingMessage.appendChild(thinkingText);

  for (let i = 0; i < 3; i++) {

    const dot = document.createElement("span");

    dot.classList.add("thinking-dot");

    dot.setAttribute("aria-hidden", "true");

    thinkingMessage.appendChild(dot);

  }

  chatMessages.appendChild(thinkingMessage);

  scrollToLatestMessage();

  try {

    const response = await fetch(
      "http://127.0.0.1:8000/api/chat",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          message: messageText,
          history: chatHistory.slice(-30)
        })
      }
    );

    if (response.status === 429) {
      throw new Error("CHAT_LIMIT_REACHED");
    }

    if (!response.ok) {
      throw new Error("Failed to get a response from Cosmos.");
    }

    const data = await response.json();

    chatHistory.push(
      {
        role: "user",
        text: messageText
      },
      {
        role: "model",
        text: data.reply
      }
    );

    thinkingMessage.remove();

    const buddyMessage = document.createElement("div");

    buddyMessage.classList.add(
      "message",
      "buddy-message"
    );

    const buddyParagraph = document.createElement("p");

    buddyParagraph.textContent = data.reply;

    buddyMessage.appendChild(buddyParagraph);

    chatMessages.appendChild(buddyMessage);

    scrollToLatestMessage();

    chatInput.disabled = false;

    chatSubmitButton.disabled = false;

    chatForm.setAttribute(
      "aria-busy",
      "false"
    );

    chatInput.focus();

  } catch (error) {

    thinkingMessage.remove();

    console.error(error);

    const errorMessage = document.createElement("div");

    errorMessage.classList.add(
      "message",
      "buddy-message"
    );

    const errorParagraph = document.createElement("p");

    errorParagraph.textContent =
      error.message === "CHAT_LIMIT_REACHED"
        ? "I've reached my chat limit for today. Come back tomorrow!"
        : "Oops, I lost contact. Try again in a moment.";

    errorMessage.appendChild(errorParagraph);

    chatMessages.appendChild(errorMessage);

    scrollToLatestMessage();

    chatInput.disabled = false;

    chatSubmitButton.disabled = false;

    chatForm.setAttribute(
      "aria-busy",
      "false"
    );

    chatInput.focus();

  }

});

chatInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();

    chatForm.requestSubmit();
  }
});

async function loadNasaImage() {
  nasaImageDisplay.innerHTML = `
    <span class="nasa-image-placeholder-text">
      Loading NASA image...
    </span>
  `;

  nasaImageTitle.textContent = "Loading title...";
  nasaImageExplanation.textContent = "Loading image information from NASA...";

  try {
    const response = await fetch("http://127.0.0.1:8000/api/nasa-image");

    if (!response.ok) {
      throw new Error("Failed to load NASA image.");
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    const image = document.createElement("img");
    image.src = data.image_url;
    image.alt = data.title;
    image.classList.add("nasa-image");

    nasaImageDisplay.replaceChildren(image);

    nasaImageTitle.textContent = data.title;
    nasaImageExplanation.textContent = data.explanation;

  } catch (error) {
    console.error(error);

    nasaImageDisplay.innerHTML = `
      <span class="nasa-image-placeholder-text">
        Sorry, NASA image could not be loaded.
      </span>
    `;

    nasaImageTitle.textContent = "Image unavailable";
    nasaImageExplanation.textContent =
      "Something went wrong while loading the NASA image.";
  }
}

nasaImageButton.addEventListener(
  "click", 
  loadNasaImage
);

async function loadRandomFact() {
  spaceFactText.textContent = "Loading a space fact...";

  try {
    const response = await fetch(
      "http://127.0.0.1:8000/api/random-fact"
    );

    if (!response.ok) {
      throw new Error("Failed to load space fact.");
    }

    const data = await response.json();

    spaceFactText.textContent = data.fact;

    spaceFactSource.textContent = "source";
    spaceFactSource.href = data.source_url;

  } catch (error) {
    console.error(error);

    spaceFactText.textContent =
      "Sorry, a space fact could not be loaded.";

    spaceFactSource.textContent = "source unavailable";
    spaceFactSource.removeAttribute("href");
  }
}

spaceFactButton.addEventListener(
  "click",
  loadRandomFact
);