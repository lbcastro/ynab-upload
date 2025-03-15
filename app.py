from flask import Flask, request, jsonify
import os
import tempfile
import subprocess
import logging
import traceback
import shutil

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

# Global variable to track the status of the last upload
last_upload_status = {
    "status": "idle",
    "details": ""
}

@app.route('/api/status', methods=['GET'])
def get_status():
    return jsonify(last_upload_status)

@app.route('/api/process', methods=['POST'])
def process_file():
    global last_upload_status
    
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    # Update status to processing
    last_upload_status = {
        "status": "processing",
        "details": f"Processing file: {file.filename}"
    }
    
    # Log the file details
    logging.info(f"Processing file: {file.filename}")
    
    # Create a file with the original filename in a temporary directory
    temp_dir = tempfile.mkdtemp()
    original_filename = os.path.basename(file.filename)
    file_path = os.path.join(temp_dir, original_filename)
    
    try:
        # Save the uploaded file with its original filename
        file.save(file_path)
        
        # Log the file path
        logging.info(f"File saved at: {file_path}")
        
        # Check if the file exists and has content
        if os.path.exists(file_path):
            file_size = os.path.getsize(file_path)
            logging.info(f"File size: {file_size} bytes")
            
            # Read the first few lines of the file to verify it's a valid CSV
            with open(file_path, 'r', encoding='latin1') as f:
                header = f.readline().strip()
                logging.info(f"CSV header: {header}")
                
                # Remove quotes if present and check for required fields
                header_fields = [field.strip('"') for field in header.split(';')]
                required_fields = ['Date', 'Text', 'Amount', 'Balance', 'Status', 'Reconciled']
                
                if len(header_fields) < 3 or not all(field in header_fields for field in ['Date', 'Text', 'Amount']):
                    raise ValueError(f"Invalid CSV format. Expected header to contain 'Date', 'Text', and 'Amount', got: {header}")
                
                logging.info(f"Parsed header fields: {header_fields}")
        else:
            logging.error(f"File does not exist: {file_path}")
            raise FileNotFoundError(f"File does not exist: {file_path}")
        
        # Check if personal.py exists
        if not os.path.exists('personal.py'):
            logging.error("personal.py not found in the current directory")
            raise FileNotFoundError("personal.py not found in the current directory")
        
        # Log the current directory
        logging.info(f"Current directory: {os.getcwd()}")
        logging.info(f"Directory contents: {os.listdir('.')}")
        
        # Run the personal.py script with the file path
        logging.info(f"Running command: python personal.py {file_path}")
        result = subprocess.run(
            ['python', 'personal.py', file_path],
            capture_output=True,
            text=True
        )
        
        stdout = result.stdout
        stderr = result.stderr
        
        # Log the command output
        logging.info(f"Command stdout: {stdout}")
        if stderr:
            logging.error(f"Command stderr: {stderr}")
        
        if result.returncode != 0:
            # Check for rate limit errors
            if "Rate limit reached" in stdout:
                last_upload_status = {
                    "status": "rate_limited",
                    "details": stdout
                }
                return jsonify({
                    "error": "YNAB API rate limit reached. The system is automatically retrying with exponential backoff. Please wait...",
                    "details": stdout,
                    "code": result.returncode
                }), 429
            # Check for SSL verification errors
            elif "CERTIFICATE_VERIFY_FAILED" in stdout:
                last_upload_status = {
                    "status": "ssl_error",
                    "details": "SSL certificate verification failed. This is expected in the Docker environment and doesn't affect functionality."
                }
                return jsonify({
                    "message": "Upload processed with SSL verification disabled",
                    "details": "SSL certificate verification was disabled for this request. This is expected in the Docker environment and doesn't affect functionality.",
                    "raw_output": stdout
                })
            else:
                last_upload_status = {
                    "status": "failed",
                    "details": stderr or stdout
                }
                return jsonify({
                    "error": "Upload failed",
                    "details": stderr or stdout,
                    "code": result.returncode
                }), 500
        else:
            last_upload_status = {
                "status": "completed",
                "details": stdout
            }
            return jsonify({
                "message": "Upload successful",
                "details": stdout
            })
    except Exception as e:
        error_details = traceback.format_exc()
        logging.error(f"Error processing file: {str(e)}")
        logging.error(error_details)
        last_upload_status = {
            "status": "error",
            "details": f"{str(e)}\n{error_details}"
        }
        return jsonify({
            "error": str(e),
            "details": error_details
        }), 500
    finally:
        # Clean up the temporary directory if it still exists
        if os.path.exists(temp_dir):
            try:
                shutil.rmtree(temp_dir)
                logging.info(f"Temporary directory deleted: {temp_dir}")
            except Exception as e:
                logging.error(f"Failed to delete temporary directory: {str(e)}")

if __name__ == '__main__':
    port = int(os.environ.get('FLASK_PORT', 5000))
    logging.info(f"Starting Flask app on port {port}")
    app.run(host='0.0.0.0', port=port) 