var input = document.getElementById("chat-input");

// press send when pressed the key enter
input.addEventListener("keyup", function (event) {
    if (event.keyCode === 13) {
        event.preventDefault();
        document.getElementById("chat-send").click();
    }
});

// setup
var socket = io();
var nickname = sessionStorage["nickname"] ? sessionStorage.getItem("nickname") : "";
var color = sessionStorage["color"] ? sessionStorage.getItem("color") : "#FFFFFF";

// just in case...
var new_nickname = "";
var new_color = "";

// if new user
if (nickname === "") {
    document.getElementById("chat").innerHTML += "Welcome to WebIRC! You can set a nickname with /nick and start chatting right away<br>";
    document.getElementById("chat").innerHTML += "You can get a list of commands with /help<br>";
}

// waiting function, for redirect
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function scrollBottom() {
    // auto scroll
    document.getElementById("chat").scrollTop = document.getElementById("chat").scrollHeight;
}

function sendMessage() {
    let message = input.value;

    // if message is empty space
    if (!message || message.length === 0 || /^\s*$/.test(message)) {
        input.value = "";
        return;
    }

    // check if message is a command
    if (message.startsWith("/")) {
        message = message.split(" ");

        // set nickname
        if (message[0] === "/nick" || message[0] === "/nickname") {
            new_nickname = message[1];

            // servera nickname değişikliğiyle ilgili istek gönder
            socket.emit("nickname", new_nickname);
        }

        // redirect to login page
        else if (message[0] === "/login") {
            document.getElementById("chat").innerHTML += "Redirecting to login page...<br>";
            sleep(1500).then(() => {
                window.location = "/login"
            });
        }

        // set user color
        else if (message[0] === "/color") {
            // if not logged in, return error
            if (nickname === "") {
                document.getElementById("chat").innerHTML += "<span class='text-danger'>Error: set a nickname first using /nick or login using /login</span><br>";
                input.value = "";
                input.focus();
                return;
            }

            new_color = message[1];
            if (/^#[0-9A-F]{6}$/i.test(new_color)) {
                color = new_color;
                sessionStorage.setItem("color", color);
                document.getElementById("chat").innerHTML += "<span style='color:" + color + "'>Color set! Type something to test it</span><br>";
            } else {
                document.getElementById("chat").innerHTML += "<span class='text-danger'>Error: Not a valid HEX color</span><br>";
            }
        }

        else if (message[0] === "/me") {
            // if not logged in, return error
            if (nickname === "") {
                document.getElementById("chat").innerHTML += "<span class='text-danger'>Error: set a nickname first using /nick or login using /login</span><br>";
                input.value = "";
                input.focus();
                return;
            }

            socket.emit("me", JSON.stringify({
                "nickname": nickname,
                "action": message.slice(1, message.length).join(" ")
            }));
        }
        
        else if (message[0] === "/msg") {
            // if not logged in, return error
            if (nickname === "") {
                document.getElementById("chat").innerHTML += "<span class='text-danger'>Error: set a nickname first using /nick or login using /login</span><br>";
                input.value = "";
                input.focus();
                return;
            }
            
            receiver = message[1];
            private_message = message.slice(2, message.length).join(" ");
            socket.emit("msg", JSON.stringify({
                "nickname": nickname,
                "receiver": receiver,
                "message": private_message
            }));
        }
        
        else if (message[0] === "/help") {
            document.getElementById("chat").innerHTML += "List of commands<br>";
            document.getElementById("chat").innerHTML += "/help: Shows this message<br>";
            document.getElementById("chat").innerHTML += "/nick (nickname), /nickname (nickname): Change your nickname, but you can't get a registered nickname<br>";
            document.getElementById("chat").innerHTML += "/login: Go to login page<br>";
            document.getElementById("chat").innerHTML += "/me: Send an action message, <span class='text-secondary'>* laughs evilly *</span><br>";
            document.getElementById("chat").innerHTML += "/color (hex): Change the color of your nickname<br>";
        }

        else {
            document.getElementById("chat").innerHTML += "<span class='text-danger'>Error: Invalid command. Type /help to get a list of commands</span><br>";
        }

        // auto scroll
        scrollBottom(); 
    }

    // the message is just a message and not a command
    else {
        // if nickname is not set, return an error
        if (nickname !== "") {
            socket.emit("message", JSON.stringify({
                "nickname": nickname,
                "message": message,
                "color": color
            }));
        }
        else {
            document.getElementById("chat").innerHTML += "<span class='text-danger'>Error: set a nickname first using /nick or login using /login</span><br>";
            scrollBottom(); // auto scroll
        }
    }

    // clear input
    input.value = "";
    input.focus();
}

// when a message is broadcasted
socket.on("new_message", (data) => {
    data = JSON.parse(data);

    // if message mentions the client
    if (data.message.split(" ").includes("@" + nickname) && nickname !== "") {
        // if last character is whitespace, remove it
        // it looks annoying as fuck
        if (data.message.substring(data.message.length-1) == " ") {
            data.message = data.message.substring(0, data.message.length-1);
        }

        // send the message with black text on yellow background
        document.getElementById("chat").innerHTML += "<span style='color: " + data.color + "'>&lt;" + data.nickname + "&gt;</span> <span class='bg-warning text-dark'>" + data.message + "</span><br>";
    }

    // just... send.. the... message
    else {
        document.getElementById("chat").innerHTML += "<span style='color: " + data.color + "'>&lt;" + data.nickname + "&gt;</span> " + data.message + "<br>";
    }

    // auto scroll
    scrollBottom()
});

//new user notification
socket.on("new_user", (data) => {
    data = JSON.parse(data);
    document.getElementById("chat").innerHTML += "<span class='text-secondary'>[" + data.nickname + " joined us]</span><br>";
    scrollBottom(); // auto scroll
});

// /me command
socket.on("new_me", (data) => {
    data = JSON.parse(data);
    document.getElementById("chat").innerHTML += "<span class='text-secondary'>* " + data.nickname + " " + data.action + " *</span><br>";
    scrollBottom(); // auto scroll
});

// /msg command
socket.on("new_msg", (data) => {
    if (data === "NO") {
        document.getElementById("chat").innerHTML += "<span class='text-danger'>Private message couldn't sent: There is no one that nicknamed</span><br>";
    }
    else {
        data = JSON.parse(data);
        document.getElementById("chat").innerHTML += "<span>&lt;" + data.nickname + "&gt; [Private]</span> " + data.message + "<br>";
    }
});

// setting nickname
socket.on("new_nickname", (response) => {
    // valid nickname
    if (response === "OK") {
        nickname = new_nickname;
        sessionStorage.setItem("nickname", new_nickname);
    }
    
    // if the nickname is longer than 20 characters or includes a space
    else if (response === "BAD") {
        document.getElementById("chat").innerHTML += "<span class='text-danger'>Error: Nickname is not valid</span><br>";
    }
    
    // if nickname is taken
    else {
        document.getElementById("chat").innerHTML += "<span class='text-danger'>Error: Nickname is already taken. Choose another nickname.</span><br>"
    }

    scrollBottom(); // auto scroll
});