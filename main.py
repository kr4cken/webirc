import flask
from flask_socketio import SocketIO 

app = flask.Flask(__name__)
app.config["SECRET_KEY"] = "skjdbvksld8123"
socketio = SocketIO(app)

@app.route("/")
def index():
    return "Hello world!"

if __name__ == "__main__":
    app.run()
    socketio.run(app)