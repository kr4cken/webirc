import os
import re
import json
import flask
import pymongo
from flask_socketio import SocketIO, send, emit, join_room, leave_room

# flask setup
app = flask.Flask(__name__, static_url_path="/static")
app.config["SECRET_KEY"] = "skjdbvksld8123"
socketio = SocketIO(app)
users =	{}

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
    return "hello world!"

# favicon
@app.route("/favicon.ico")
def favicon():
    return flask.send_from_directory(os.path.join(app.root_path, "static"), "favicon.ico", mimetype="image/vnd.microsoft.icon")

# socket.io
@socketio.on("message")
def handleMessage(data):
    # add sid to message data
    data = json.loads(data)
    data["sid"] = flask.request.sid
    channel = data["channel"]
    data = json.dumps(data)

    emit("new_message", data, room=channel)

@socketio.on("me")
def handleMeCommand(data):
    emit("new_me", data, room=data["channel"])

@socketio.on("msg")
def handleMsgCommand(data):
    receiver = data["receiver"]
    if not users[receiver]:
        emit("new_msg", "NO")
    else:
        emit("new_msg", data, room=users[receiver]["sid"])

@socketio.on("nickname")
def handleNickname(data):
    data = json.loads(data)
    nickname = data["nickname"]
    channel = data["channel"]

    if re.search("[a-z0-9_-]{1,20}$", nickname) or re.search("[\u4E00-\u9FFF\u3400-\u4DBF\u20000-\u2A6DF\u2A700-\u2B73F\u2B740-\u2B81F\u2B820-\u2CEAF\u2CEB0-\u2EBEF\u30000-\u3134F\uF900-\uFAFF\u2E80-\u2EFF\u31C0-\u31EF\u3000-\u303F\u2FF0-\u2FFF\u3300-\u33FF\uFE30-\uFE4F\uF900-\uFAFF\u2F800-\u2FA1F\u3200-\u32FF\u1F200-\u1F2FF\u2F00-\u2FDF]{1,20}", nickname):
        if nickname in users:
            emit("new_nickname", "NO")
            return
        else:
            emit("new_nickname", "OK")
            users[nickname] = {"sid": flask.request.sid}
            emit("new_user", {"nickname": nickname}, room=channel)
            return
    else:
        emit("new_nickname", "BAD")
        return

@socketio.on("join")
def on_join(data):
    if "old_channel" in data:
        old_channel = data["old_channel"]
        new_channel = data["new_channel"]
        nickname = data["nickname"]

        leave_room(old_channel)
        join_room(new_channel)

        emit("left_channel", {"nickname": nickname}, room=old_channel)
        emit("new_user", {"nickname": nickname}, room=new_channel)
    else:
        new_channel = data["new_channel"]
        join_room(new_channel)

@socketio.on("invite")
def on_invite(data):
    inviter = data["inviter"]
    invitee = data["invitee"]

    if not invitee in users:
        emit("invite_error", data, room=users[inviter]["sid"])
    else:
        emit("new_invite", data, room=users[inviter]["sid"])
        emit("new_invite", data, room=users[invitee]["sid"])

if __name__ == "__main__":
    socketio.run(app, debug=True, port=5004)
