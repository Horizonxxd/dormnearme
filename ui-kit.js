// ui-kit.js — ใช้ร่วมกันทุกหน้า: Toast กลางจอ, ตรวจเบอร์ไทย, จัดรูปแบบสิ่งอำนวยความสะดวก
(function () {
  const css = `#uk-wrap{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(15,23,42,.35);z-index:9999;font-family:Kanit,sans-serif}
#uk-wrap.show{display:flex}.uk-box{background:#fff;border-radius:18px;padding:24px 28px;min-width:260px;max-width:340px;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,.25);animation:ukpop .18s ease-out}
.uk-ico{font-size:38px}.uk-msg{margin:8px 0 0;color:#334155;white-space:pre-line;font-size:15px}.uk-btns{display:flex;gap:10px;justify-content:center;margin-top:16px}
.uk-btn{border:0;border-radius:10px;padding:8px 18px;font-family:inherit;cursor:pointer;background:#7C3AED;color:#fff}.uk-btn.ghost{background:#e2e8f0;color:#475569}
@keyframes ukpop{from{transform:scale(.9);opacity:0}to{transform:scale(1);opacity:1}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const wrap = document.createElement('div'); wrap.id = 'uk-wrap';
  document.addEventListener('DOMContentLoaded', () => document.body.appendChild(wrap));
  const ICON = { success: '✅', error: '❌', info: 'ℹ️', warn: '⚠️' };
  function open(html) { if (!wrap.isConnected) document.body.appendChild(wrap); wrap.innerHTML = `<div class="uk-box">${html}</div>`; wrap.classList.add('show'); }
  const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  // Toast กลางจอ เด้งแล้วหายเอง (ms=0 คือให้กดปิดเอง)
  window.showToast = function (msg, type = 'info', ms = 1800) {
    open(`<div class="uk-ico">${ICON[type] || ''}</div><p class="uk-msg">${esc(msg)}</p>`);
    clearTimeout(window._ukT); if (ms) window._ukT = setTimeout(() => wrap.classList.remove('show'), ms);
    wrap.onclick = () => wrap.classList.remove('show');
  };
  // แทน confirm() — คืนค่า Promise<boolean>
  window.confirmBox = function (msg) {
    return new Promise(res => {
      open(`<div class="uk-ico">⚠️</div><p class="uk-msg">${esc(msg)}</p><div class="uk-btns"><button class="uk-btn ghost" id="uk-n">ยกเลิก</button><button class="uk-btn" id="uk-y">ยืนยัน</button></div>`);
      wrap.onclick = null;
      document.getElementById('uk-y').onclick = () => { wrap.classList.remove('show'); res(true); };
      document.getElementById('uk-n').onclick = () => { wrap.classList.remove('show'); res(false); };
    });
  };
  // ตรวจเบอร์โทรไทย: มือถือ 06/08/09 = 10 หลัก, เบอร์บ้าน/สำนักงาน 02,03x-07x = 9 หลัก
  window.validateThaiPhone = function (raw) {
    const p = String(raw || '').replace(/[\s-]/g, '');
    if (!/^\d+$/.test(p)) return { ok: false, msg: 'กรอกได้เฉพาะตัวเลข' };
    const mobile = /^0[689]\d{8}$/.test(p), landline = /^0[2-7]\d{7}$/.test(p);
    if (!mobile && !landline) return { ok: false, msg: 'เบอร์มือถือขึ้นต้น 06/08/09 (10 หลัก) หรือเบอร์บ้านขึ้นต้น 02-07 (9 หลัก)' };
    const body = p.slice(2);
    if (/^(\d)\1+$/.test(body) || /(\d)\1{5,}/.test(p)) return { ok: false, msg: 'เบอร์ซ้ำกันมากเกินไป ดูไม่ใช่เบอร์จริง' };
    if (/01234567|12345678|23456789|98765432|87654321|76543210/.test(p)) return { ok: false, msg: 'เบอร์เรียงเลขต่อเนื่อง ดูไม่ใช่เบอร์จริง' };
    return { ok: true, type: mobile ? 'mobile' : 'landline', value: p };
  };
  // สิ่งอำนวยความสะดวก: ทำให้ชื่อตรงกันทุกหน้า (เช่น "โต๊ะ" = "โต๊ะเขียนหนังสือ")
  const CANON = ['แอร์', 'พัดลม', 'ตู้เย็น', 'ไมโครเวฟ', 'เครื่องทำน้ำอุ่น', 'โต๊ะเขียนหนังสือ', 'ตู้เสื้อผ้า', 'ทีวี', 'ตู้กับข้าว'];
  const ALIAS = { 'เครื่องปรับอากาศ': 'แอร์', 'โทรทัศน์': 'ทีวี', 'TV': 'ทีวี' };
  // รวมชื่อที่พิมพ์ไม่ตรงกันให้เป็นชื่อมาตรฐาน เช่น "โต๊ะ", "โต๊ะเขียน", "โต๊ะเขียนหนังสือ" -> โต๊ะเขียนหนังสือ
  window.normAmen = a => {
    const t = String(a).replace(/\s+/g, '').trim();
    if (ALIAS[t]) return ALIAS[t];
    if (CANON.includes(t)) return t;
    if (t.length >= 3) { const m = CANON.filter(c => c.startsWith(t) || t.startsWith(c)); if (m.length === 1) return m[0]; }
    return t;
  };
  // คืนจำนวนที่ตรงกับที่เลือก
  window.countAmenMatch = (dormAmens, selected) => {
    const have = new Set((dormAmens || []).map(window.normAmen));
    return selected.filter(s => have.has(window.normAmen(s))).length;
  };
  window.fmtBaht = (n, unit = 'บาท/เดือน') => `${Number(n || 0).toLocaleString()} ${unit}`;
})();