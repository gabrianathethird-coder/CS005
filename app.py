import os
from flask import Flask, render_template, request, jsonify, send_file
from werkzeug.utils import secure_filename
from core.crypto import encrypt_file, decrypt_file
from core.shredder import secure_shred
from core.audit import init_db, log_action, get_logs

# Flask application factory, configured to serve local static assets.
app = Flask(__name__, static_url_path='/static', static_folder='static')

# Serve the local KeyNest logo directly from the assets folder.
@app.route('/KeyNest2.png')
def serve_keynest_logo():
    return send_file('assets/KeyNest2.png', mimetype='image/png')

# Limit uploads to 500 MB to avoid memory issues during processing.
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024
app.config['UPLOAD_FOLDER'] = 'uploads'

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
init_db()

@app.route('/')
def index():
    # Render the main landing page.
    return render_template('index.html')

@app.route('/logs')
def view_logs():
    # Render the audit logs page.
    return render_template('logs.html')

@app.route('/api/encrypt', methods=['POST'])
def api_encrypt():
    # Validate that an uploaded file exists.
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    password = request.form.get('password')
    shred = request.form.get('shred', 'false').lower() == 'true'

    if not file or file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    # Sanitize the filename to avoid unsafe characters.
    filename = secure_filename(file.filename)
    if not filename:
        filename = "unnamed_file"

    input_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    output_path = input_path + '.knest'

    # Temporarily persist the uploaded file before encryption.
    file.save(input_path)

    try:
        encrypt_file(input_path, output_path, password)

        # Optionally shred the source file after successful encryption.
        if shred:
            secure_shred(input_path)
            log_action('SHRED', filename, 'SUCCESS', 'File shredded securely')
        elif os.path.exists(input_path):
            os.remove(input_path)

        log_action('ENCRYPT', filename, 'SUCCESS', 'File encrypted successfully')

        # Return the encrypted .knest file as a browser download.
        return send_file(output_path, as_attachment=True, download_name=filename + '.knest')
    except Exception as e:
        # Clean up the uploaded file on failure.
        if os.path.exists(input_path):
            os.remove(input_path)
        log_action('ENCRYPT', filename, 'FAILED', str(e))
        return jsonify({'error': str(e)}), 500

@app.route('/api/decrypt', methods=['POST'])
def api_decrypt():
    # Validate that an uploaded file exists.
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    password = request.form.get('password')

    if not file or file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    filename = secure_filename(file.filename)
    if not filename:
        filename = "unnamed_file"

    input_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)

    # Attempt to restore the original filename when decrypting.
    if filename.endswith('.knest'):
        original_name = filename[:-6]
    else:
        original_name = 'decrypted_' + filename

    output_path = os.path.join(app.config['UPLOAD_FOLDER'], original_name)

    file.save(input_path)

    try:
        success = decrypt_file(input_path, output_path, password)
        if success:
            if os.path.exists(input_path):
                os.remove(input_path)
            log_action('DECRYPT', filename, 'SUCCESS', 'File decrypted successfully')
            return send_file(output_path, as_attachment=True, download_name=original_name)
        else:
            if os.path.exists(input_path):
                os.remove(input_path)
            log_action('DECRYPT', filename, 'FAILED', 'Invalid password or tampered file')
            return jsonify({'error': 'Invalid password or tampered file'}), 401
    except Exception as e:
        if os.path.exists(input_path):
            os.remove(input_path)
        log_action('DECRYPT', filename, 'FAILED', str(e))
        return jsonify({'error': str(e)}), 500

@app.route('/api/logs', methods=['GET'])
def api_logs():
    # Return the most recent audit log entries as JSON for the frontend.
    return jsonify({'logs': get_logs()})

if __name__ == '__main__':
    # Start the Flask server on localhost port 5000.
    app.run(debug=True, port=5000)
