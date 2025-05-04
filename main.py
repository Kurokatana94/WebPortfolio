from flask import Flask, render_template, redirect, url_for, request
from flask_bootstrap import Bootstrap5
import datetime as dt
import logging
import requests
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')
Bootstrap5(app)

PORTFOLIO_EMAIL = os.environ.get('PORT_EMAIL')
MY_EMAIL = os.environ.get('MY_EMAIL')

@app.route('/')
def home():
    return render_template('index.html', year=dt.datetime.now().year)

@app.route('/contact-me', methods=['POST', 'GET'])
def contact():
    if request.method == 'POST':
        form = request.form

        try:
            resp = requests.post(os.environ.get('EMAIL_API_URL'), auth=("api", os.environ.get("EMAIL_API_KEY")),
                                 data={"from": f"{form['name']} <{PORTFOLIO_EMAIL}>",
                                       "to": f"Timoty Ravoni <{MY_EMAIL}>", "subject": f"{form['subject']}",
                                       "text": form['message']})
            if resp.status_code == 200:  # success
                logging.info(f"Successfully sent an email to '{MY_EMAIL}' via Mailgun API.")
                return redirect(url_for('home'))
            else:  # error
                logging.error(f"Could not send the email, reason: {resp.text}")

        except Exception as ex:
            logging.exception(f"Mailgun error: {ex}")
    return render_template('contact-me.html', year=dt.datetime.now().year)

@app.route('/todo-notepad-demo')
def todo_notepad_demo():
    return render_template('todo-notepad-demo.html', year=dt.datetime.now().year)

if __name__ == '__main__':
    app.run(debug=False)