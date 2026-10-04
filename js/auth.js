var loginAttempts = 0;
var loginLocked = false;

function doLogin() {
    if (loginLocked) return;
    var keyEl = document.getElementById('keyInput');
    var key = keyEl.value.trim();
    var btn = document.getElementById('btnLogin');
    var spinner = document.getElementById('loginSpinner');
    var btnText = document.getElementById('btnText');
    var errEl = document.getElementById('loginError');

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

    // Tạm thời kiểm tra Key trực tiếp để web không bị lỗi API
    setTimeout(function() {
        // 👇 ĐỔI KEY THẬT CỦA BẠN Ở ĐÂY
        if (key === "lehoangminhzdh") { 
            btnText.innerHTML = '<i class="fa-solid fa-check"></i> THÀNH CÔNG';
            errEl.style.color = '#10b981';
            errEl.textContent = '✅ Đang vào Tool...';
            keyEl.value = '';
            try { sessionStorage.setItem('hk_auth_v1', 'ok'); } catch(e) {}
            setTimeout(function() { openTool(); }, 800);
        } else {
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
        }
    }, 600);
}

function openTool() {
    document.getElementById('login-screen').classList.add('hide');
    document.getElementById('tool-screen').style.display = 'block';
    document.getElementById('gameFrame').src = 'https://lc79b.bet/';
    setTimeout(function() { if (typeof startApp === 'function') startApp(); }, 200);
}

document.getElementById('keyInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') doLogin();
});

window.addEventListener('DOMContentLoaded', function() {
    try {
        if (sessionStorage.getItem('hk_auth_v1') === 'ok') {
            document.getElementById('login-screen').classList.add('hide');
            document.getElementById('tool-screen').style.display = 'block';
            document.getElementById('gameFrame').src = 'https://lc79b.bet/';
            setTimeout(function() { if (typeof startApp === 'function') startApp(); }, 200);
        }
    } catch(e) {}
});
