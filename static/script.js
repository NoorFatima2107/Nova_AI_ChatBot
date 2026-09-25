// ============================================================
// NOVA AI - JAVASCRIPT
// ============================================================


// ============================================================
// ELEMENTS
// ============================================================

const chatBox =
    document.getElementById("chat-box");

const userInput =
    document.getElementById("user-input");

const sendBtn =
    document.getElementById("send-btn");

const newChatBtn =
    document.getElementById("new-chat-btn");

const clearBtn =
    document.getElementById("clear-btn");


// ============================================================
// SEND MESSAGE
// ============================================================

async function sendMessage() {

    const message =
        userInput.value.trim();


    if (message === "") {
        return;
    }


    // Remove welcome screen

    const welcome =
        document.getElementById("welcome");

    if (welcome) {
        welcome.remove();
    }


    // Display user message

    addMessage(
        message,
        "user"
    );


    // Clear input

    userInput.value = "";

    autoResize();


    // Disable input

    sendBtn.disabled = true;

    userInput.disabled = true;


    // Show typing

    const typingId =
        showTyping();


    try {

        const response =
            await fetch(
                "/chat",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        message: message
                    })
                }
            );


        let data;


        try {

            data =
                await response.json();

        }

        catch (error) {

            throw new Error(
                "Invalid server response."
            );

        }


        // Remove typing

        removeTyping(
            typingId
        );


        // Success

        if (
            response.ok &&
            data.success
        ) {

            addMessage(
                data.reply,
                "bot"
            );

        }

        else {

            addMessage(
                data.reply ||
                "Nova could not process your request.",
                "bot"
            );

        }

    }


    catch (error) {

        console.error(
            "Connection error:",
            error
        );


        removeTyping(
            typingId
        );


        addMessage(
            "I couldn't reach the Nova AI server. Please make sure the Flask application is running.",
            "bot"
        );

    }


    // Enable input again

    sendBtn.disabled = false;

    userInput.disabled = false;

    userInput.focus();

}


// ============================================================
// ADD MESSAGE
// ============================================================

function addMessage(
    text,
    sender
) {

    const messageDiv =
        document.createElement("div");


    messageDiv.className =
        "message " + sender;


    // Avatar

    const avatar =
        document.createElement("div");

    avatar.className =
        "avatar";

    avatar.textContent =
        sender === "bot"
            ? "✦"
            : "👤";


    // Content

    const content =
        document.createElement("div");

    content.className =
        "message-content";


    // Name

    const name =
        document.createElement("div");

    name.className =
        "message-name";

    name.textContent =
        sender === "bot"
            ? "Nova AI"
            : "You";


    // Text

    const textDiv =
        document.createElement("div");

    textDiv.className =
        "message-text";


    // textContent is safer than innerHTML

    textDiv.textContent =
        text;


    // Build

    content.appendChild(
        name
    );

    content.appendChild(
        textDiv
    );

    messageDiv.appendChild(
        avatar
    );

    messageDiv.appendChild(
        content
    );

    chatBox.appendChild(
        messageDiv
    );


    scrollToBottom();

}


// ============================================================
// TYPING INDICATOR
// ============================================================

function showTyping() {

    const id =
        "typing-" +
        Date.now();


    const messageDiv =
        document.createElement("div");

    messageDiv.className =
        "message bot";

    messageDiv.id =
        id;


    const avatar =
        document.createElement("div");

    avatar.className =
        "avatar";

    avatar.textContent =
        "✦";


    const content =
        document.createElement("div");

    content.className =
        "message-content";


    const name =
        document.createElement("div");

    name.className =
        "message-name";

    name.textContent =
        "Nova AI";


    const typing =
        document.createElement("div");

    typing.className =
        "typing";


    typing.innerHTML =
        "<span></span>" +
        "<span></span>" +
        "<span></span>";


    content.appendChild(
        name
    );

    content.appendChild(
        typing
    );

    messageDiv.appendChild(
        avatar
    );

    messageDiv.appendChild(
        content
    );

    chatBox.appendChild(
        messageDiv
    );


    scrollToBottom();


    return id;

}


// ============================================================
// REMOVE TYPING
// ============================================================

function removeTyping(id) {

    const element =
        document.getElementById(id);


    if (element) {

        element.remove();

    }

}


// ============================================================
// SCROLL
// ============================================================

function scrollToBottom() {

    chatBox.scrollTop =
        chatBox.scrollHeight;

}


// ============================================================
// ENTER TO SEND
// ============================================================

userInput.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendMessage();

        }

    }
);


// ============================================================
// AUTO RESIZE
// ============================================================

userInput.addEventListener(
    "input",
    autoResize
);


function autoResize() {

    userInput.style.height =
        "auto";


    userInput.style.height =
        Math.min(
            userInput.scrollHeight,
            120
        ) + "px";

}


// ============================================================
// SEND BUTTON
// ============================================================

sendBtn.addEventListener(
    "click",
    sendMessage
);


// ============================================================
// NEW CHAT
// ============================================================

newChatBtn.addEventListener(
    "click",
    async function() {

        try {

            await fetch(
                "/new-chat",
                {
                    method: "POST"
                }
            );

        }

        catch (error) {

            console.error(error);

        }


        resetChat();

    }
);


// ============================================================
// CLEAR CHAT
// ============================================================

clearBtn.addEventListener(
    "click",
    async function() {

        try {

            await fetch(
                "/clear-chat",
                {
                    method: "POST"
                }
            );

        }

        catch (error) {

            console.error(error);

        }


        resetChat();

    }
);


// ============================================================
// RESET CHAT
// ============================================================

function resetChat() {

    chatBox.innerHTML = `

        <div
            id="welcome"
            class="welcome"
        >

            <div class="welcome-icon">
                ✦
            </div>

            <h2>
                Hello, I'm Nova
            </h2>

            <p>
                Your AI assistant for learning,
                creating and exploring ideas.
            </p>

            <div class="suggestions">

                <button class="suggestion">

                    💻
                    Help me learn Python

                </button>

                <button class="suggestion">

                    🧠
                    Explain AI simply

                </button>

                <button class="suggestion">

                    💡
                    Give me a project idea

                </button>

            </div>

        </div>

    `;


    attachSuggestionEvents();


    userInput.value = "";

    autoResize();

    userInput.focus();

}


// ============================================================
// SUGGESTION BUTTONS
// ============================================================

function attachSuggestionEvents() {

    const suggestions =
        document.querySelectorAll(
            ".suggestion"
        );


    suggestions.forEach(
        function(button) {

            button.addEventListener(
                "click",
                function() {

                    const text =
                        button.textContent
                            .replace(
                                /\s+/g,
                                " "
                            )
                            .trim();


                    userInput.value =
                        text;

                    autoResize();

                    sendMessage();

                }
            );

        }
    );

}


// ============================================================
// INITIALIZE
// ============================================================

attachSuggestionEvents();

userInput.focus();
