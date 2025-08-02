from flask import Flask, render_template, redirect, url_for, request, jsonify
from flask_bootstrap import Bootstrap5
from space_flights_updates import SpaceFlightsUpdates
from zyphra import ZyphraClient
from sklearn.cluster import MiniBatchKMeans
from PIL import Image
import stripe
import numpy as np
import pymupdf # PyMuPDF
import flask
import datetime as dt
import logging
import requests
import io
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')
Bootstrap5(app)

ZYPHRA_KEY = os.environ.get('ZYPHRA_KEY')

stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')
app.config['STRIPE_PUBLISHABLE_KEY'] = os.environ.get('STRIPE_PUBLISHABLE_KEY')

PORTFOLIO_EMAIL = os.environ.get('PORT_EMAIL')
MY_EMAIL = os.environ.get('MY_EMAIL')

MAIN_DOMAIN = 'https://www.timotyravoni.com'

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

# ============================ DEMOs ============================

@app.route('/todo-notepad-demo')
def todo_notepad_demo():
    return render_template('todo-notepad-demo.html', year=dt.datetime.now().year)

@app.route('/type-before-its-gone-demo')
def type_before_its_gone_demo():
    return render_template('type-before-its-gone-demo.html', year=dt.datetime.now().year)

@app.route('/get-sentence')
def get_sentence():
    result = requests.get('https://thequoteshub.com/api/random-quote').json()
    text = result['text']
    author = result['author']
    return jsonify({'text': text, 'author': author})

@app.route('/pdf-to-speech-demo')
def pdf_to_speech_demo():
    return render_template('pdf-to-speech-demo.html', year=dt.datetime.now().year)

@app.route('/palette-hextractor-demo')
def palette_hextractor_demo():
    return render_template('palette-hextractor-demo.html', year=dt.datetime.now().year)

# ======== PDF TEXT EXTRACTION ========
def extract_pdf_text(file):
    doc = pymupdf.open(stream=file.read(), filetype='pdf')
    pdf_text = ''
    for page in doc:
        pdf_text += page.get_text()
    print(pdf_text)
    return pdf_text[:50] #add limit [:n] if there is one with the api ---> ADDED LIMIT FOR TESTING PURPOSES SO THAT I WON'T FINISH MY CREDITS IN FEW DAYS - MIGHT EVEN LEAVE IT AS SUCH FOR THE LIVE DEMO


# ======== AUDIO CONVERSION THRU API ========
@app.route('/upload-pdf', methods=['POST'])
def upload_pdf():
    pdf_file = request.files.get('pdf')

    if pdf_file:
        text = extract_pdf_text(pdf_file)
        with ZyphraClient(api_key=ZYPHRA_KEY) as client:
            mp3_data = client.audio.speech.create(
                text=text,
                speaking_rate=15,
                myme_type='audio/mp3',
            )

        mp3_io = io.BytesIO(mp3_data)
        mp3_io.seek(0)

        filename = f"audio_{dt.datetime.now().strftime('%Y%m%d_%H%M%S')}.mp3"

        return flask.send_file(mp3_io,
                         mimetype='audio/mpeg',
                         as_attachment=False,
                         download_name=filename)
    return None

# ======== PALETTE HEXCODES EXTRACTION ========
@app.route('/get-palette', methods=['POST'])
def get_palette():
    img = request.files.get('image')
    if not img:
        return jsonify({'error': 'No image provided'}), 400
    
    img = Image.open(img).convert('RGB')
    img.resize((100,100))
    img_array = np.array(img)
    img_array = img_array.reshape((-1,3))

    mbkmeans = MiniBatchKMeans(n_clusters=100, batch_size=1000)
    labels = mbkmeans.fit_predict(img_array)
    counts = np.bincount(labels)
    colors = mbkmeans.cluster_centers_.astype(int)

    total_count = counts.sum()
    palette = []

    for _ in range(10):
        top_index = list(counts).index(max(counts))
        colors = list(colors)
        counts = list(counts)
        # Get the most common color
        color = colors[top_index]
        count = counts[top_index]
        counts.pop(top_index)
        colors.pop(top_index)
        # Convert color to hex
        hex_color = '#{:02x}{:02x}{:02x}'.format(*color)
        percentage = round((count/total_count) * 100, 2)
        palette.append({
            'color': hex_color,
            'percentage': percentage
        })
    
    return jsonify(palette)

# ======== GIFT ME A COFFEE PAGE/REDIRECT ========
@app.route('/gift-me-a-coffee')
def gift_me_a_coffee():
    return render_template("gift-me-a-coffee.html", year=dt.datetime.now().year, stripe_pk=app.config['STRIPE_PUBLISHABLE_KEY'])

@app.route('/create-checkout-session', methods=['POST'])
def create_checkout_session():
    data = request.get_json()
    amount = data.get("amount", 0)

    if amount < 50:  # Stripe minimum in GBP
        return jsonify({"error": "Minimum donation is £0.50"}), 400
    try:
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'gbp',
                    'unit_amount': amount,
                    'product_data': {
                        'name': 'Gift me a coffee ☕',
                    },
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=MAIN_DOMAIN + '/checkout-successful',
            cancel_url=MAIN_DOMAIN + '/gift-me-a-coffee',
        )
        return jsonify({'url': checkout_session.url})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route("/checkout-successful")
def checkout_successful():
    return render_template("checkout-successful.html")

# ======== SPACE FLIGHTS UPDATES ========

GOOGLE_CREDENTIALS_JSON = os.environ.get("GOOGLE_CREDENTIALS_JSON")
space_updates = SpaceFlightsUpdates(GOOGLE_CREDENTIALS_JSON.replace(r'\\n', r'\n'))

@app.route("/space-flights-updates")
def space_flights_updates():
    space_updates.past_launches_db_update()
    space_updates.upcoming_launches_db_update()

    upcoming_launches = space_updates.upcoming_launches_sheet.get_all_records()
    records = space_updates.past_launches_sheet.get_all_records()

    # Organize data for chart (launches per year)
    past_year_data = {}

    for row in records:
        try:
            date_str = row["Date"]
            year = dt.datetime.fromisoformat(date_str).year
            status = row["Status"]

            if year not in past_year_data:
                past_year_data[year] = {"total": 0, "success": 0, "failure": 0, "partial": 0}

            past_year_data[year]["total"] += 1
            if "success" in status.lower():
                past_year_data[year]["success"] += 1
            elif "fail" in status.lower():
                past_year_data[year]["failure"] += 1
            elif "partial" in status.lower():
                past_year_data[year]["partial"] += 1
        except Exception as e:
            print("Skipping row due to:", e)
            continue  # Skip malformed rows

    years = sorted(past_year_data.keys())
    chart_data = {
        "years": years,
        "total": [past_year_data[y]["total"] for y in years],
        "success": [past_year_data[y]["success"] for y in years],
        "failure": [past_year_data[y]["failure"] for y in years],
        "partial": [past_year_data[y]["partial"] for y in years]
    }

    return render_template("space-flights-updates.html",
                           year=dt.datetime.now().year,
                           chart_data=chart_data,
                           raw_data=records,
                           upcoming_launches=upcoming_launches)

if __name__ == '__main__':
    app.run(debug=True)