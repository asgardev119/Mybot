const chatBox = document.getElementById('chat-box');
const messageInput = document.getElementById('message-input');
const fileInput = document.getElementById('file-input');
const sendButton = document.getElementById('send-button');
const uploadButton = document.getElementById('upload-button');
const clearChatButton = document.getElementById('clear-chat');
// const API_KEY = "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";
const API_KEY = "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";
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

let uploadedImage = null;

// Handle file input click (upload image)
uploadButton.addEventListener('click', () => {
  fileInput.click();
});

// Handle file upload
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = async (event) => {
      uploadedImage = event.target.result;
      sendMessage("You uploaded an image! Please click 'Send' to ask about it.", true);
    };
    reader.readAsDataURL(file);
  } else {
    alert("Please upload a valid image.");
  }
});

// Send message to chat box
function sendMessage(message, isUser = true) {
  const messageElement = document.createElement('div');
  messageElement.className = 'message ' + (isUser ? 'user-message' : 'bot-message');
  messageElement.innerText = formatMessage(message); // Format message to remove * and #
  chatBox.appendChild(messageElement);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Format message to remove * and #
function formatMessage(message) {
  return message.replace(/[*#]/g, ''); // Remove * and # marks
}

// Handle the loading animation
function showLoading() {
  const loadingElement = document.createElement('div');
  loadingElement.className = 'message bot-message';
  loadingElement.innerHTML = `<div class="loading-indicator">Typing...</div>`;
  chatBox.appendChild(loadingElement);
  chatBox.scrollTop = chatBox.scrollHeight;
  return loadingElement;
}

// API call to OpenRouter
async function handleImageUpload(imageUrl) {
  const loading = showLoading();
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "qwen/qwen2.5-vl-72b-instruct:free",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "What is in this image?" },
              { type: "image_url", image_url: { url: imageUrl } }
            ]
          }
        ]
      }),
    });
    const data = await response.json();
    const botMessage = data.choices[0]?.message?.content || "Sorry, I couldn't understand that image.";

    chatBox.removeChild(loading);
    sendMessage(botMessage, false);
  } catch (error) {
    console.error("Error:", error);
    chatBox.removeChild(loading);
    sendMessage("Sorry, something went wrong. Please try again later.", false);
  }
}

// Send message on Enter key or send button click
function handleSendMessage() {
  const userMessage = messageInput.value.trim();
  if (userMessage) {
    messageInput.value = '';
    sendMessage(userMessage);
    const loading = showLoading();

    // API call for text messages
    fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "qwen/qwen2.5-vl-72b-instruct:free",
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: userMessage }]
          }
        ]
      }),
    })
    .then(response => response.json())
    .then(data => {
      const botMessage = data.choices[0]?.message?.content || "Sorry, I couldn't understand that.";
      chatBox.removeChild(loading);
      sendMessage(botMessage, false);
    })
    .catch(error => {
      console.error("Error:", error);
      chatBox.removeChild(loading);
      sendMessage("Sorry, something went wrong. Please try again later.", false);
    });
  } else if (uploadedImage) {
    // If image is uploaded, send it after user clicks Send
    handleImageUpload(uploadedImage);
    uploadedImage = null; // Clear image after sending
  }
}

// Handle sending message via Enter key
messageInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    handleSendMessage();
  }
});

// Handle send button click
sendButton.addEventListener('click', handleSendMessage);

// Clear the chat when clicked
clearChatButton.addEventListener('click', () => {
  chatBox.innerHTML = ''; // Clear chat
});

// Function to handle API calls with a timeout
async function fetchWithTimeout(url, options, timeout = 30000) { // 30 seconds timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
  
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error("Request timed out. Please try again.");
      }
      throw error;
    }
  }
  
  // Modified API call function
  async function handleSendMessage() {
    const userMessage = messageInput.value.trim();
    if (userMessage) {
      messageInput.value = '';
      sendMessage(userMessage);
      const loading = showLoading();
  
      try {
        // API call for text messages
        const response = await fetchWithTimeout(API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo", // Use a faster model
            messages: [
              {
                role: "user",
                content: [{ type: "text", text: userMessage }]
              }
            ]
          }),
        });
  
        const data = await response.json();
        const botMessage = data.choices[0]?.message?.content || "Sorry, I couldn't understand that.";
        chatBox.removeChild(loading);
        sendMessage(botMessage, false);
      } catch (error) {
        console.error("Error:", error);
        chatBox.removeChild(loading);
        sendMessage(error.message || "Sorry, something went wrong. Please try again later.", false);
      }
    } else if (uploadedImage) {
      // If image is uploaded, send it after user clicks Send
      handleImageUpload(uploadedImage);
      uploadedImage = null; // Clear image after sending
    }
  }