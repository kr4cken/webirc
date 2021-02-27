import flask
from flask_socketio import SocketIO, send, emit
import os

app = flask.Flask(__name__, static_url_path="/static")
app.config["SECRET_KEY"] = "skjdbvksld8123"
socketio = SocketIO(app)

@app.route("/")
def index():
    return flask.render_template("index.html")

@socketio.on("message")
def handleMessage(data):
    emit("new_message", data, broadcast=True)

if __name__ == "__main__":
    socketio.run(app, debug=True, port=5004)
