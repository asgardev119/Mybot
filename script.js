const chatBox = document.getElementById('chat-box');
const messageInput = document.getElementById('message-input');
const fileInput = document.getElementById('file-input');
const uploadButton = document.getElementById('upload-button');
const clearChatButton = document.getElementById('clear-chat');

const API_KEY = "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";
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

let uploadedImage = null;

uploadButton.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = async (event) => {
      uploadedImage = event.target.result;
      sendMessage("Image is being processed...", true);
      handleImageUpload(uploadedImage);
    };
    reader.readAsDataURL(file);
  } else {
    alert("Please upload a valid image.");
  }
});

function sendMessage(message, isUser = true) {
  const messageElement = document.createElement('div');
  messageElement.className = 'message ' + (isUser ? 'user-message' : 'bot-message');
  messageElement.innerText = message;
  chatBox.appendChild(messageElement);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function handleImageUpload(imageUrl) {
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
    sendMessage(botMessage, false);
  } catch (error) {
    console.error("Error:", error);
    sendMessage("Sorry, something went wrong while processing the image.", false);
  }
}

async function handleSendMessage() {
  const userMessage = messageInput.value.trim();
  if (userMessage) {
    messageInput.value = '';
    sendMessage(userMessage);
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
              content: [{ type: "text", text: userMessage }]
            }
          ]
        }),
      });
      const data = await response.json();
      const botMessage = data.choices[0]?.message?.content || "Sorry, I couldn't understand that.";
      sendMessage(botMessage, false);
    } catch (error) {
      console.error("Error:", error);
      sendMessage("Sorry, something went wrong. Please try again later.", false);
    }
  }
}

messageInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    handleSendMessage();
  }
});

clearChatButton.addEventListener('click', () => {
  chatBox.innerHTML = ''; // Clear chat
});
