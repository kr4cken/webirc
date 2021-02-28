import os
import re
import json
import flask
import pymongo
from flask_socketio import SocketIO, send, emit

# bunu nereye koymalı bilemedim
users =	{}

# flask setup
app = flask.Flask(__name__, static_url_path="/static")
app.config["SECRET_KEY"] = "skjdbvksld8123"
socketio = SocketIO(app)
nicknames = []

# mongo setup
client = pymongo.MongoClient("mongodb+srv://emir:JVDzK7oYjzxtDrUE@cluster0.awjab.mongodb.net/myFirstDatabase?retryWrites=true&w=majority")
db = client.webirc

# webirc
@app.route("/")
def index():
    return flask.render_template("index.html")

# login
@app.route("/login", methods=["GET"])
def get_login():
    return flask.render_template("login.html")
@app.route("/login", methods=["POST"])
def post_login():
    pass

# favicon
@app.route("/favicon.ico")
def favicon():
    return flask.send_from_directory(os.path.join(app.root_path, "static"), "favicon.ico", mimetype="image/vnd.microsoft.icon")

# socket.io
@socketio.on("message")
def handleMessage(data):
    emit("new_message", data, broadcast=True)

@socketio.on("me")
def handleMeCommand(data):
    emit("new_me", data, broadcast=True)

@socketio.on("msg")
def handleMeCommand(data):
    receiver = json.loads(data)["receiver"]
    print("debug: ", users)
    if not users[receiver]:
        emit("new_msg", "NO")
    else:
        emit("new_msg", data, rooms=users[receiver])

@socketio.on("nickname")
def handleNickname(nickname):
    if re.search("[a-z0-9_-]{1,20}$", nickname) or re.search("[\u4E00-\u9FFF\u3400-\u4DBF\u20000-\u2A6DF\u2A700-\u2B73F\u2B740-\u2B81F\u2B820-\u2CEAF\u2CEB0-\u2EBEF\u30000-\u3134F\uF900-\uFAFF\u2E80-\u2EFF\u31C0-\u31EF\u3000-\u303F\u2FF0-\u2FFF\u3300-\u33FF\uFE30-\uFE4F\uF900-\uFAFF\u2F800-\u2FA1F\u3200-\u32FF\u1F200-\u1F2FF\u2F00-\u2FDF]{1,20}", nickname):
        if nickname in nicknames:
            emit("new_nickname", "NO")
            return
        else:
            emit("new_nickname", "OK")
            nicknames.append(nickname)
            users.update({"nickname": flask.request.sid})
            emit("new_user", json.dumps({"nickname": nickname}), broadcast=True)
            return
    else:
        emit("new_nickname", "BAD")
        return

if __name__ == "__main__":
    socketio.run(app, debug=True, port=5004)
