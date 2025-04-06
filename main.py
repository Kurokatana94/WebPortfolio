from flask import Flask, render_template, redirect, url_for, request
from flask_bootstrap import Bootstrap5
import datetime as dt
import smtplib
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')
Bootstrap5(app)

portfolio_email = os.environ.get('PORT_EMAIL')
my_email = os.environ.get('MY_EMAIL')
email_password = os.environ.get('EMAIL_PASSWORD')

connection = smtplib.SMTP("smtp.gmail.com")
connection.starttls()
connection.login(user=portfolio_email, password=email_password)

@app.route('/')
def home():
    return render_template('index.html', year=dt.datetime.now().year)

@app.route('/contact-me', methods=['POST', 'GET'])
def contact():
    if request.method == 'POST':
        form = request.form
        if form.get('checkbox'):
            connection.sendmail(from_addr=portfolio_email,
                                to_addrs=my_email,
                                msg=f"Subject:Spam Detected\n\n"
                                    f"Email:\n{form['email']}")
        else:
            connection.sendmail(from_addr=portfolio_email,
                                to_addrs=my_email,
                                msg=f"Subject:{form['name']} is contacting you!\n\n"
                                    f"Email:\n{form['email']}\n\n"
                                    f"Subject:\n{form['subject']}\n\n"
                                    f"Name:\n{form['name']}\n\n"
                                    f"Message:\n{form['message']}")
        return redirect(url_for('home'))
    return render_template('contact-me.html', year=dt.datetime.now().year)

if __name__ == '__main__':
    app.run(debug=False)