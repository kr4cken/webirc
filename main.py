import os
import json
import flask
from flask_socketio import SocketIO, send, emit

app = flask.Flask(__name__, static_url_path="/static")
app.config["SECRET_KEY"] = "skjdbvksld8123"
socketio = SocketIO(app)
nicknames = []

@app.route("/")
def index():
    return flask.render_template("index.html")

@app.route("/favicon.ico")
def favicon():
    return flask.send_from_directory(os.path.join(app.root_path, "static"), "favicon.ico", mimetype="image/vnd.microsoft.icon")

@socketio.on("message")
def handleMessage(data):
    emit("new_message", data, broadcast=True)

@socketio.on("nickname")
def handleNickname(nickname):
    if nickname in nicknames:
        emit("nickname", "NO")
        return
    else:
        emit("nickname", "OK")
        nicknames.append(nickname)
        emit("new_user", json.dumps({"nickname": nickname}), broadcast=True)
        return

if __name__ == "__main__":
    socketio.run(app, debug=True, port=5004)
