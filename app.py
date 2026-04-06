import os
from flask import Flask, render_template, request, jsonify, send_file
from werkzeug.utils import secure_filename
from core.crypto import encrypt_file, decrypt_file
from core.shredder import secure_shred
from core.audit import init_db, log_action, get_logs

app = Flask(__name__, static_url_path='/static', static_folder='static')
# Add route to serve images from assets folder
@app.route('/KeyNest2.png')
def serve_keynest_logo():
    return send_file('assets/KeyNest2.png', mimetype='image/png')
# 500 MB max to prevent memory issues, chunking helps memory, but Werkzeug saves to temp after threshold anyway
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  
app.config['UPLOAD_FOLDER'] = 'uploads'

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
init_db()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/logs')
def view_logs():
    return render_template('logs.html')

@app.route('/api/encrypt', methods=['POST'])
def api_encrypt():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    password = request.form.get('password')
    shred = request.form.get('shred', 'false').lower() == 'true'

    if not file or file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
        
    filename = secure_filename(file.filename)
    if not filename:
        filename = "unnamed_file"
        
    input_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    output_path = input_path + '.knest'
    
    file.save(input_path)
    
    try:
        encrypt_file(input_path, output_path, password)
        if shred:
            secure_shred(input_path)
            log_action('SHRED', filename, 'SUCCESS', 'File shredded securely')
        elif os.path.exists(input_path):
            os.remove(input_path)
            
        log_action('ENCRYPT', filename, 'SUCCESS', 'File encrypted successfully')
        
        return send_file(output_path, as_attachment=True, download_name=filename + '.knest')
    except Exception as e:
        if os.path.exists(input_path):
            os.remove(input_path)
        log_action('ENCRYPT', filename, 'FAILED', str(e))
        return jsonify({'error': str(e)}), 500

@app.route('/api/decrypt', methods=['POST'])
def api_decrypt():
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
    
    # Reconstruct original name
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
    return jsonify({'logs': get_logs()})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
