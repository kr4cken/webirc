import flask
from flask_socketio import SocketIO, send, emit
import os

app = flask.Flask(__name__, static_url_path="/static")
app.config["SECRET_KEY"] = "skjdbvksld8123"
socketio = SocketIO(app)

@app.route("/")
def index():
    return flask.render_template("index.html")

@app.route("/favicon.ico")
def favicon():
    return send_from_directory(os.path.join(app.root_path, "static"), "favicon.ico",mimetype="image/vnd.microsoft.icon")

@socketio.on("message")
def handleMessage(data):
    emit("new_message", data, broadcast=True)

if __name__ == "__main__":
    socketio.run(app, debug=True, port=5004)
