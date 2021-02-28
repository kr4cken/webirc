import os
import re
import json
import flask
import pymongo
from flask_socketio import SocketIO, send, emit

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
    emit("new_message", json.dumps({"message": flask.request.sid}), broadcast=True)

@socketio.on("me")
def handleMeCommand(data):
    emit("new_me", data, broadcast=True)

@socketio.on("nickname")
def handleNickname(nickname):
    if re.search("[a-z0-9_-]{1,20}$", nickname):
        if nickname in nicknames:
            emit("new_nickname", "NO")
            return
        else:
            emit("new_nickname", "OK")
            nicknames.append(nickname)
            emit("new_user", json.dumps({"nickname": nickname}), broadcast=True)
            return
    else:
        emit("new_nickname", "BAD")
        return

if __name__ == "__main__":
    socketio.run(app, debug=True, port=5004)
