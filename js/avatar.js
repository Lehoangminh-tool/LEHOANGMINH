// DÁN CHUỖI BASE64 CỦA BẠN VÀO ĐÂY
const AVATAR_BASE64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAASABIAAD/... (phần còn lại)";

window.addEventListener('load', () => {
    let saved = null;
    try { saved = localStorage.getItem('hk_avatar_v1'); } catch(e) {}
    const img = document.getElementById('loginAvatarImg');
    if (!img) return;
    if (saved) { img.src = saved; return; }
    if (!AVATAR_BASE64 || AVATAR_BASE64.trim().length < 50) return;
    const raw = AVATAR_BASE64.trim();
    let src = raw;
    if (!/^data:image\//i.test(raw)) {
        let mime = 'image/jpeg';
        if (raw.startsWith('iVBOR')) mime = 'image/png';
        else if (raw.startsWith('R0lGOD')) mime = 'image/gif';
        else if (raw.startsWith('UklGR')) mime = 'image/webp';
        src = `data:${mime};base64,${raw}`;
    }
    img.src = src;
    try { localStorage.setItem('hk_avatar_v1', src); } catch(e) {}
});
