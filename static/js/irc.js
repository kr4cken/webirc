// input field
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
var channel = "#general";

// channel
socket.emit("join", { "nickname": nickname, "new_channel": channel });

// just in case...
var new_nickname = "";
var new_color = "";
var last_message_sender = "";

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
            socket.emit("nickname", JSON.stringify({
                "nickname": new_nickname,
                "channel": channel
            }));
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

        // * laughs with an evil intent :) *
        else if (message[0] === "/me") {
            // if not logged in, return error
            if (nickname === "") {
                document.getElementById("chat").innerHTML += "<span class='text-danger'>Error: set a nickname first using /nick or login using /login</span><br>";
                input.value = "";
                input.focus();
                return;
            }

            socket.emit("me", {
                "nickname": nickname,
                "action": message.slice(1, message.length).join(" "),
                "channel": channel
            });
        }
        
        // private message command
        else if (message[0] === "/msg") {
            receiver = message[1];
            message = message.slice(2, message.length).join(" ");

            // if not logged in, return error
            if (nickname === "") {
                document.getElementById("chat").innerHTML += "<span class='text-danger'>Error: set a nickname first using /nick or login using /login</span><br>";
                input.value = "";
                input.focus();
                return;
            }

            socket.emit("msg", {
                "nickname": nickname,
                "receiver": receiver,
                "message": message
            });
            document.getElementById("chat").innerHTML += "<span class='text-secondary'>" + `[private] ${nickname}->${receiver}: ${message}`+ "</span><br>";
        }

        // reply command
        else if (message[0] === "/r") {
            // if not logged in, return error
            if (nickname === "") {
                document.getElementById("chat").innerHTML += "<span class='text-danger'>Error: set a nickname first using /nick or login using /login</span><br>";
                input.value = "";
                input.focus();
                return;
            }

            // if there's no message received
            if (last_message_sender === "") {
                document.getElementById("chat").innerHTML += "<span class='text-danger'>Error: nobody sent you a message to reply :(</span><br>";
            }

            message = message.slice(1, message.length).join(" ");
            socket.emit("msg", {
                "nickname": nickname,
                "receiver": last_message_sender,
                "message": message
            });
            document.getElementById("chat").innerHTML += "<span class='text-secondary'>" + `[private] ${nickname}->${last_message_sender}: ${message}`+ "</span><br>";
        }

        // join new channel
        else if (message[0] === "/join") {
            let new_channel = message[1];

            // if the channel name is not valid
            if (new_channel.charAt(0) !== "#") {
                document.getElementById("chat").innerHTML += "<span class='text-danger'>Error: illegal channel name</span><br>";
            }

            else {
                socket.emit("join", {
                    "nickname": nickname,
                    "old_channel": channel,
                    "new_channel": new_channel
                });

                document.getElementById("chat").innerHTML += "<span class='text-secondary'> Changed channel to " + new_channel + "</span><br>";
                document.getElementById("channel-name").innerText = new_channel;
                channel = new_channel;
            }
        }
        
        else if (message[0] === "/invite") {
            // if not logged in, return error
            if (nickname === "") {
                document.getElementById("chat").innerHTML += "<span class='text-danger'>Error: set a nickname first using /nick or login using /login</span><br>";
                input.value = "";
                input.focus();
                return;
            }

            let invitee = message[1], to = message[2];

            // check if the nickname is valid
            if (invitee.charAt(0) !== "@" || invitee.length > 20) {
                document.getElementById("chat").innerHTML += "<span class='text-danger'>Error: Illegal nickname. You should put a @ before the nickname and nicknames can't be longer than 20 characters</span><br>";
            }
            else {
                // if to is not given
                if (!to || to.length === 0 || /^\s*$/.test(to)) {
                    to = channel;
                }

                // finally send invite
                socket.emit("invite", {
                    "inviter": nickname,
                    "invitee": invitee.substring(1, invitee.length),
                    "to": to
                });
            }
        }

        // makarna
        else if (message[0] === "/help") {
            document.getElementById("chat").innerHTML += "List of commands<br>--------------------------------------<br>";
            document.getElementById("chat").innerHTML += "/help: Shows this message<br>";
            document.getElementById("chat").innerHTML += "/nick (nickname), /nickname (nickname): Change your nickname, but you can't get a registered nickname<br>";
            document.getElementById("chat").innerHTML += "/login: Go to login page<br>";
            document.getElementById("chat").innerHTML += "/me: Send an action message, <span class='text-secondary'>* laughs with an evil intent *</span><br>";
            document.getElementById("chat").innerHTML += "/color (hex): Change the color of your nickname<br>";
            document.getElementById("chat").innerHTML += "/msg (user) (message): Privately message to user<br>";
            document.getElementById("chat").innerHTML += "/r: Reply to last private message you received<br>";
            document.getElementById("chat").innerHTML += "/join (channel): Join channel<br>";
        }

        // invalid command
        else {
            document.getElementById("chat").innerHTML += "<span class='text-danger'>Error: Invalid command. Type /help to get a list of commands</span><br>";
        }

        // auto scroll
        scrollBottom(); 
    }

    // the message is just a message and not a command
    else {
        if (nickname !== "") {
            socket.emit("message", JSON.stringify({
                "nickname": nickname,
                "message": message,
                "color": color,
                "channel": channel
            }));
        }

        // if nickname is not set, return an error
        else {
            document.getElementById("chat").innerHTML += "<span class='text-danger'>Error: set a nickname first using /nick or login using /login</span><br>";
            scrollBottom(); // auto scroll
        }
    }

    // clear input
    input.value = "";
    input.focus();
}

// socket.io events

// when a message is received from the server
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

    else {
        document.getElementById("chat").innerHTML += "<span style='color: " + data.color + "'>&lt;" + data.nickname + "&gt;</span> " + data.message + "<br>";
    }

    // auto scroll
    scrollBottom()
});

//new user notification
socket.on("new_user", (data) => {
    document.getElementById("chat").innerHTML += "<span class='text-secondary'>[" + data.nickname + " joined]</span><br>";
    scrollBottom(); // auto scroll
});

// [user] left the channel
socket.on("left_channel", (data) => {
    document.getElementById("chat").innerHTML += "<span class='text-secondary'>[" + data.nickname + " left]</span><br>";
    scrollBottom();
});

// /me command
socket.on("new_me", (data) => {
    document.getElementById("chat").innerHTML += "<span class='text-secondary'>* " + data.nickname + " " + data.action + " *</span><br>";
    scrollBottom(); // auto scroll
});

// /msg command
socket.on("new_msg", (data) => {
    console.log("DEBUG");
    if (data === "NO") {
        document.getElementById("chat").innerHTML += "<span class='text-danger'>Private message couldn't sent: There is no one called ...</span><br>";
    }
    else {
        document.getElementById("chat").innerHTML += "<span class='text-secondary'>" + `[private] ${data.nickname}->${data.receiver}: ${data.message}`+ "</span><br>";
        last_message_sender = data.nickname;
    }
});

// /invite command
socket.on("new_invite", (data) => {
    if (data["inviter"] === nickname) {
        document.getElementById("chat").innerHTML += "<span class='text-secondary'>" + `* Invited ${data.invitee} to ${data.to}`+ "</span><br>";
    }
    else {
        document.getElementById("chat").innerHTML += "<span class='text-secondary'>" + `* @${data.inviter} invited you to ${data.to}`+ "</span><br>";
    } 
    scrollBottom(); // auto scroll
});

socket.on("invite_error", (data) => {
    document.getElementById("chat").innerHTML += `<span class='text-danger'>Error: Could not invite @${data.invitee}, perhaps there's no one called ${data.invitee}?</span><br>`;
})

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
