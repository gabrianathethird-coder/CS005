document.addEventListener('DOMContentLoaded', () => {
    // Tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(`${btn.dataset.tab}-tab`).classList.add('active');
        });
    });

    // File Input UI Update
    const setupFileInput = (inputId, areaId) => {
        const input = document.getElementById(inputId);
        const area = document.getElementById(areaId);
        const msg = area.querySelector('.file-msg');

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            area.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            area.addEventListener(eventName, () => area.classList.add('dragover'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            area.addEventListener(eventName, () => area.classList.remove('dragover'), false);
        });

        area.addEventListener('drop', (e) => {
            let dt = e.dataTransfer;
            let files = dt.files;
            input.files = files;
            updateMsg(files[0].name);
        });

        input.addEventListener('change', function(e) {
            if(this.files && this.files[0]) {
                updateMsg(this.files[0].name);
            }
        });

        function updateMsg(name) {
            msg.innerHTML = `<span style="color: #fff;">Selected: </span>${name}`;
        }
    };

    if(document.getElementById('encrypt-file')) setupFileInput('encrypt-file', 'encrypt-drop-area');
    if(document.getElementById('decrypt-file')) setupFileInput('decrypt-file', 'decrypt-drop-area');

    // Forms
    const encryptForm = document.getElementById('encrypt-form');
    const decryptForm = document.getElementById('decrypt-form');
    const loader = document.getElementById('loader');
    const toast = document.getElementById('toast');

    let toastTimeout;
    function showToast(message, type = 'success') {
        clearTimeout(toastTimeout);
        toast.className = `toast show ${type}`;
        toast.textContent = message;
        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    if(encryptForm) {
        encryptForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const file = document.getElementById('encrypt-file').files[0];
            const pwd = document.getElementById('encrypt-password').value;
            const shred = document.getElementById('encrypt-shred').checked;

            if(!file || !pwd) return;

            const fd = new FormData();
            fd.append('file', file);
            fd.append('password', pwd);
            fd.append('shred', shred);

            loader.classList.remove('hidden');

            try {
                const res = await fetch('/api/encrypt', { method: 'POST', body: fd });
                if(res.ok) {
                    // Trigger download
                    const blob = await res.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = file.name + '.knest';
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);
                    
                    showToast('File encrypted successfully!');
                    encryptForm.reset();
                    document.querySelector('#encrypt-drop-area .file-msg').textContent = 'Drag & Drop or Click to Select File';
                } else {
                    const data = await res.json();
                    showToast(data.error || 'Encryption failed', 'error');
                }
            } catch (err) {
                showToast('Network error occurred.', 'error');
            } finally {
                loader.classList.add('hidden');
            }
        });
    }

    if(decryptForm) {
        decryptForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const file = document.getElementById('decrypt-file').files[0];
            const pwd = document.getElementById('decrypt-password').value;

            if(!file || !pwd) return;

            const fd = new FormData();
            fd.append('file', file);
            fd.append('password', pwd);

            loader.classList.remove('hidden');

            try {
                const res = await fetch('/api/decrypt', { method: 'POST', body: fd });
                if(res.ok) {
                    const contentDisp = res.headers.get('Content-Disposition');
                    let filename = "decrypted_file";
                    if (contentDisp && contentDisp.includes('filename=')) {
                        filename = contentDisp.split('filename=')[1].replace(/"/g, '');
                    }

                    const blob = await res.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);

                    showToast('File decrypted successfully!');
                    decryptForm.reset();
                    document.querySelector('#decrypt-drop-area .file-msg').textContent = 'Drag & Drop .knest File';
                } else {
                    const data = await res.json();
                    showToast(data.error || 'Decryption failed. Wrong password?', 'error');
                }
            } catch (err) {
                showToast('Network error occurred.', 'error');
            } finally {
                loader.classList.add('hidden');
            }
        });
    }
});
