function doLogin() {
    if (loginLocked) return;

    var keyEl   = document.getElementById('keyInput');
    var key     = keyEl.value.trim();
    var btn     = document.getElementById('btnLogin');
    var spinner = document.getElementById('loginSpinner');
    var btnText = document.getElementById('btnText');
    var errEl   = document.getElementById('loginError');

    errEl.textContent = '';

    if (!key) {
        errEl.textContent = '⚠️ Vui lòng nhập Key!';
        keyEl.classList.add('shake');
        setTimeout(function() { keyEl.classList.remove('shake'); }, 500);
        keyEl.focus();
        return;
    }

    spinner.style.display = 'inline-block';
    btnText.innerHTML = 'ĐANG KIỂM TRA...';
    btn.disabled = true;

    // 👇 GỌI API ĐỂ KIỂM TRA KEY THAY VÌ KIỂM TRA TRONG CODE
    fetch('https://ancient-poetry-7f56.lot896613.workers.dev/?mode=md5&key=' + encodeURIComponent(key))
        .then(response => {
            if (response.status === 403) {
                throw new Error('Sai Key');
            }
            return response.json();
        })
        .then(data => {
            // Key đúng, API trả về dữ liệu thành công
            btnText.innerHTML = '<i class="fa-solid fa-check"></i> THÀNH CÔNG';
            errEl.style.color = '#10b981';
            errEl.textContent = '✅ Đang vào Tool...';
            
            // Lưu session
            try { sessionStorage.setItem('hk_auth_v1', 'ok'); } catch(e) {}
            
            // Chuyển vào Tool
            setTimeout(function() { openTool(); }, 800);
        })
        .catch(error => {
            // Key sai hoặc lỗi mạng
            loginAttempts++;
            spinner.style.display = 'none';
            btnText.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> ĐĂNG NHẬP';
            btn.disabled = false;
            errEl.style.color = '#ef4444';
            errEl.textContent = '❌ Key không đúng! (Lần sai: ' + loginAttempts + ')';
            keyEl.classList.add('shake');
            setTimeout(function() { keyEl.classList.remove('shake'); }, 500);
            keyEl.select();

            if (loginAttempts >= 5) {
                loginLocked = true;
                errEl.textContent = '🚫 Sai quá nhiều! Thử lại sau 30 giây...';
                btn.disabled = true;
                var sec = 30;
                var iv = setInterval(function() {
                    sec--;
                    errEl.textContent = '🚫 Thử lại sau ' + sec + 's...';
                    if (sec <= 0) {
                        clearInterval(iv);
                        loginLocked = false;
                        loginAttempts = 0;
                        btn.disabled = false;
                        errEl.textContent = '';
                        btnText.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> ĐĂNG NHẬP';
                    }
                }, 1000);
            }
        });
}
