function startApp() {
    if (window.appInitialized) return;
    window.appInitialized = true;

    function tachNhom(chuoi) {
        if (!chuoi.length) return [];
        const out = [];
        let d0 = chuoi[0], c0 = 1;
        for (let i = 1; i < chuoi.length; i++) {
            if (chuoi[i] === d0) c0++;
            else { out.push({ ketQua: d0, doDai: c0 }); d0 = chuoi[i]; c0 = 1; }
        }
        out.push({ ketQua: d0, doDai: c0 });
        return out;
    }

    class CauVisionPro {
        constructor() {
            this.chuoi = [];
            this.tongDiem = [];
            this.xucXac = [];
            this.cuaSoLichSu = 500;
            this.KToiDa = 6;
            this.nguongMauTheoK = { 1: 6, 2: 8, 3: 10, 4: 14, 5: 18, 6: 22 };
        }

        layXucXac(item) {
            const map = [
                ['dice1','dice2','dice3'],
                ['xucxac1','xucxac2','xucxac3'],
                ['d1','d2','d3'],
                ['x1','x2','x3'],
                ['dice_1','dice_2','dice_3'],
                ['xuc_xac_1','xuc_xac_2','xuc_xac_3'],
            ];
            for (const [a,b,c] of map) {
                if (item[a] != null && item[b] != null && item[c] != null) {
                    const arr = [Number(item[a]), Number(item[b]), Number(item[c])];
                    if (arr.every(n => n >= 1 && n <= 6)) return arr;
                }
            }
            for (const f of ['dice','dices','xucxac','xuc_xac','xuc_xac_arr']) {
                const val = item[f];
                if (Array.isArray(val) && val.length >= 3) {
                    const arr = val.slice(0,3).map(Number);
                    if (arr.every(n => n >= 1 && n <= 6)) return arr;
                }
            }
            return null;
        }

        nap(items) {
            this.chuoi = [];
            this.tongDiem = [];
            this.xucXac = [];
            for (const it of items) {
                const r = it.resultTruyenThong || it.result || it.ketQua;
                if (r !== 'TAI' && r !== 'XIU') continue;
                this.chuoi.push(r);
                const d = this.layXucXac(it);
                this.xucXac.push(d);
                this.tongDiem.push(d ? d[0]+d[1]+d[2] : null);
            }
            if (this.chuoi.length > this.cuaSoLichSu) {
                const c = -this.cuaSoLichSu;
                this.chuoi = this.chuoi.slice(c);
                this.tongDiem = this.tongDiem.slice(c);
                this.xucXac = this.xucXac.slice(c);
            }
        }

        nguongMau(k) { return this.nguongMauTheoK[k] || 22; }

        traCuuDauVanTay(doDaisCanTim, huongNhomCuoiCanKhop = null) {
            const chuoi = this.chuoi;
            const k = doDaisCanTim.length;
            if (k === 0) return { soTai: 0, soXiu: 0, tong: 0, viTri: [] };
            const tongDoDai = doDaisCanTim.reduce((a,b)=>a+b,0);
            let soTai = 0, soXiu = 0;
            const viTri = [];
            for (let start = 0; start < chuoi.length - tongDoDai; start++) {
                let pos = start, ok = true, huongTruoc = null, huongCuoi = null;
                for (const dd of doDaisCanTim) {
                    if (pos + dd > chuoi.length) { ok = false; break; }
                    const doan = chuoi.slice(pos, pos+dd);
                    if (new Set(doan).size !== 1) { ok = false; break; }
                    const h = doan[0];
                    if (huongTruoc !== null && h === huongTruoc) { ok = false; break; }
                    huongTruoc = h;
                    huongCuoi = h;
                    pos += dd;
                }
                if (!ok) continue;
                if (huongNhomCuoiCanKhop !== null && huongCuoi !== huongNhomCuoiCanKhop) continue;
                if (start > 0 && chuoi[start-1] === chuoi[start]) continue;
                if (pos >= chuoi.length) continue;
                if (chuoi[pos] === 'TAI') soTai++; else soXiu++;
                viTri.push(pos);
            }
            return { soTai, soXiu, tong: soTai + soXiu, viTri };
        }

        nhanDienDang() {
            const gan = this.chuoi.slice(-24);
            if (gan.length < 3) return null;
            const nhom = tachNhom(gan);
            if (!nhom.length) return null;
            const huongHienTai = nhom[nhom.length-1].ketQua;
            const doDaiNhomHienTai = nhom[nhom.length-1].doDai;
            const kMax = Math.min(this.KToiDa, nhom.length);
            for (let k = kMax; k >= 1; k--) {
                const doDais = nhom.slice(-k).map(n => n.doDai);
                const { tong } = this.traCuuDauVanTay(doDais, huongHienTai);
                if (tong >= this.nguongMau(k)) {
                    return { doDaisDauVanTay: doDais, huongHienTai, soNhomDung: k };
                }
            }
            return { doDaisDauVanTay: [doDaiNhomHienTai], huongHienTai, soNhomDung: 1 };
        }

        traCuuLichSu(dang) {
            if (!dang) return { tyLeTai: null, tyLeXiu: null, soMau: 0, viTri: [] };
            const { soTai, soXiu, tong, viTri } = this.traCuuDauVanTay(dang.doDaisDauVanTay, dang.huongHienTai);
            if (tong < this.nguongMau(dang.doDaisDauVanTay.length)) {
                return { tyLeTai: null, tyLeXiu: null, soMau: tong, viTri };
            }
            return { tyLeTai: soTai/tong*100, tyLeXiu: soXiu/tong*100, soMau: tong, viTri };
        }

        phanTichTong() {
            const arr = this.tongDiem.filter(x => x != null);
            if (arr.length < 8) return null;
            const gan20 = arr.slice(-20);
            const trungBinh = arr.reduce((a,b)=>a+b,0) / arr.length;
            const trungBinhGan = gan20.reduce((a,b)=>a+b,0) / gan20.length;
            const caoDiem = gan20.filter(s => s >= 11).length;
            const thapDiem = gan20.filter(s => s <= 10).length;
            const xuHuong = trungBinhGan - trungBinh;
            const tyLeTaiGan = caoDiem / gan20.length;
            return { trungBinh, trungBinhGan, xuHuong, tyLeTaiGan, caoDiem, thapDiem, soMau: arr.length };
        }

        phanTichMarkov() {
            const c = this.chuoi;
            if (c.length < 20) return null;
            let tt = 0, tx = 0, xt = 0, xx = 0;
            const win = c.slice(-80);
            for (let i = 1; i < win.length; i++) {
                const p = win[i-1], n = win[i];
                if (p === 'TAI' && n === 'TAI') tt++;
                else if (p === 'TAI' && n === 'XIU') tx++;
                else if (p === 'XIU' && n === 'TAI') xt++;
                else if (p === 'XIU' && n === 'XIU') xx++;
            }
            const last = c[c.length-1];
            const pTai = last === 'TAI'
                ? (tt+1) / (tt+tx+2)
                : (xt+1) / (xt+xx+2);
            return { pTai, pXiu: 1 - pTai, last };
        }

        phanTichMarkov2() {
            const c = this.chuoi;
            if (c.length < 30) return null;
            const last2 = c[c.length-2];
            const last1 = c[c.length-1];
            let soTai = 0, soXiu = 0;
            for (let i = 0; i < c.length - 2; i++) {
                if (c[i] === last2 && c[i+1] === last1) {
                    if (c[i+2] === 'TAI') soTai++;
                    else soXiu++;
                }
            }
            const tong = soTai + soXiu;
            if (tong < 3) return null;
            return { soTai, soXiu, tong, pTai: (soTai+1)/(tong+2) };
        }

        phanTichMarkov3() {
            const c = this.chuoi;
            if (c.length < 40) return null;
            const last3 = c.slice(-3).join('');
            let soTai = 0, soXiu = 0, wTai = 0, wXiu = 0;
            for (let i = 0; i < c.length - 3; i++) {
                if (c.slice(i, i+3).join('') === last3) {
                    const w = Math.pow(1.01, i);
                    if (c[i+3] === 'TAI') { soTai++; wTai += w; }
                    else { soXiu++; wXiu += w; }
                }
            }
            const tong = soTai + soXiu;
            if (tong < 3) return null;
            const wTong = wTai + wXiu;
            return {
                soTai, soXiu, tong,
                pTai: wTong > 0 ? wTai / wTong : 0.5,
                pTaiTho: soTai / tong
            };
        }

        doDaiBet() {
            const c = this.chuoi;
            if (c.length < 2) return 0;
            let bet = 1;
            for (let i = c.length-1; i > 0; i--) {
                if (c[i] === c[i-1]) bet++; else break;
            }
            return bet;
        }

        phanTichStreakBreak() {
            const c = this.chuoi;
            if (c.length < 30) return null;
            const nhom = tachNhom(c);
            if (nhom.length < 5) return null;
            const doDaiHienTai = nhom[nhom.length-1].doDai;
            const huongHienTai = nhom[nhom.length-1].ketQua;
            let tiepTucDung = 0, tongMau = 0;
            for (let L = doDaiHienTai; L < 20; L++) {
                for (let i = 0; i < c.length - L; i++) {
                    let allSame = true;
                    for (let j = 0; j < L; j++) {
                        if (c[i+j] !== c[i]) { allSame = false; break; }
                    }
                    if (!allSame) continue;
                    if (i > 0 && c[i-1] === c[i]) continue;
                    if (i + L >= c.length) continue;
                    tongMau++;
                    if (c[i+L] === c[i]) tiepTucDung++;
                }
            }
            if (tongMau < 3) return null;
            const pTiepTuc = tiepTucDung / tongMau;
            return {
                doDaiHienTai,
                huongHienTai,
                pTiepTuc,
                pPhaVo: 1 - pTiepTuc,
                tongMau,
                goiY: pTiepTuc > 0.5 ? huongHienTai : (huongHienTai === 'TAI' ? 'XIU' : 'TAI')
            };
        }

        phatHienChuKy() {
            const c = this.chuoi;
            if (c.length < 12) return null;
            for (let period = 2; period <= 8; period++) {
                if (c.length < period * 3) continue;
                let khop = 0, tong = 0;
                const soVong = Math.min(6, Math.floor(c.length / period));
                const start = c.length - soVong * period;
                for (let v = 1; v < soVong; v++) {
                    for (let i = 0; i < period; i++) {
                        const idx1 = start + (v-1) * period + i;
                        const idx2 = start + v * period + i;
                        if (idx1 < c.length && idx2 < c.length) {
                            tong++;
                            if (c[idx1] === c[idx2]) khop++;
                        }
                    }
                }
                if (tong === 0) continue;
                const tyLe = khop / tong;
                if (tyLe >= 0.8) {
                    const nextIdx = c.length % period;
                    const viTriTuongUng = start + nextIdx;
                    if (viTriTuongUng < c.length) {
                        return { period, doTinCay: tyLe, ketQuaDuDoan: c[viTriTuongUng] };
                    }
                }
            }
            return null;
        }

        phatHienDao() {
            const c = this.chuoi;
            if (c.length < 6) return null;
            let dao = 0;
            for (let i = c.length-1; i > c.length-6 && i > 0; i--) {
                if (c[i] !== c[i-1]) dao++; else break;
            }
            if (dao >= 4) {
                return { doDai: dao, ketQuaDuDoan: c[c.length-1] === 'TAI' ? 'XIU' : 'TAI' };
            }
            return null;
        }

        phanTichZigzag() {
            const c = this.chuoi;
            if (c.length < 10) return null;
            const nhom = tachNhom(c);
            if (nhom.length < 4) return null;
            const gan4 = nhom.slice(-4);
            const doDai4 = gan4.map(n => n.doDai);
            if (doDai4.every(d => d === 1)) {
                return { loai: 'zigzag-1', goiY: 'TIEU_TUC', doDai: 4, doTinCay: 0.7 };
            }
            if (doDai4.every(d => d === 2)) {
                return { loai: 'zigzag-2', goiY: 'DAO', doDai: 4, doTinCay: 0.75 };
            }
            const [d1,d2,d3,d4] = doDai4;
            if (d1 === d3 && d2 === d4 && d1 !== d2) {
                return { loai: 'chu-ky', goiY: 'DU_BAO', doDai: 4, doTinCay: 0.7, duDoan: d4 === 1 ? 2 : 1 };
            }
            return null;
        }

        phatHienFibonacci() {
            const c = this.chuoi;
            if (c.length < 20) return null;
            const fib = [1, 1, 2, 3, 5, 8, 13];
            const nhom = tachNhom(c);
            if (nhom.length < 5) return null;
            for (let len = 4; len <= 6; len++) {
                if (nhom.length < len) continue;
                const doDais = nhom.slice(-len).map(n => n.doDai);
                const fibSlice = fib.slice(0, len);
                let khop = 0;
                for (let i = 0; i < len; i++) {
                    if (Math.abs(doDais[i] - fibSlice[i]) <= 0) khop++;
                }
                if (khop === len) {
                    const doDaiTiep = fib[len];
                    const huongHienTai = nhom[nhom.length-1].ketQua;
                    return { doDaiTiep, doTinCay: 0.65 + len * 0.03, huongHienTai };
                }
            }
            return null;
        }

        phanTichNGram(n) {
            const c = this.chuoi;
            if (c.length < n + 5) return null;
            const mauHienTai = c.slice(-n).join(',');
            let soTai = 0, soXiu = 0;
            for (let i = 0; i <= c.length - n - 1; i++) {
                const mau = c.slice(i, i+n).join(',');
                if (mau === mauHienTai && i + n < c.length) {
                    if (c[i+n] === 'TAI') soTai++;
                    else soXiu++;
                }
            }
            const tong = soTai + soXiu;
            if (tong < 3) return null;
            return { n, soTai, soXiu, tong, tyLeTai: soTai / tong * 100 };
        }

        phanTichTuongDong() {
            const c = this.chuoi;
            const W = 5;
            if (c.length < W + 10) return null;
            const mauHienTai = c.slice(-W);
            const ketQua = [];
            for (let i = 0; i < c.length - W; i++) {
                let khop = 0;
                for (let j = 0; j < W; j++) {
                    if (c[i+j] === mauHienTai[j]) khop++;
                }
                if (khop >= W - 1 && i + W < c.length) {
                    ketQua.push({ doTuongDong: khop, ketQuaTiep: c[i+W] });
                }
            }
            if (ketQua.length < 3) return null;
            ketQua.sort((a,b) => b.doTuongDong - a.doTuongDong);
            const top = ketQua.slice(0, 10);
            let soTai = 0, soXiu = 0;
            for (const kq of top) {
                if (kq.ketQuaTiep === 'TAI') soTai++; else soXiu++;
            }
            return { soTai, soXiu, tong: top.length, tyLeTai: soTai / top.length * 100, soMau: ketQua.length };
        }

        phanTichXucXac() {
            const arr = this.xucXac.filter(x => x != null);
            if (arr.length < 10) return null;
            const gan20 = arr.slice(-20);
            const dem = {1:0,2:0,3:0,4:0,5:0,6:0};
            for (const d of gan20) {
                for (const v of d) dem[v]++;
            }
            const sapXep = Object.entries(dem).sort((a,b) => b[1] - a[1]);
            const matNong = Number(sapXep[0][0]);
            const matLanh = Number(sapXep[sapXep.length-1][0]);
            const tongGan = gan20.map(d => d[0]+d[1]+d[2]);
            const trungBinhGan = tongGan.reduce((a,b)=>a+b,0) / tongGan.length;
            return { matNong, matLanh, trungBinhGan, xuHuongTai: trungBinhGan > 10.5, soMau: arr.length };
        }

        phanTichDongThuan() {
            const c = this.chuoi;
            if (c.length < 30) return null;
            const k10 = c.slice(-10).filter(x => x === 'TAI').length;
            const k30 = c.slice(-30).filter(x => x === 'TAI').length;
            const k100 = c.slice(-100).filter(x => x === 'TAI').length;
            const ty10 = k10 / 10;
            const ty30 = k30 / 30;
            const ty100 = k100 / Math.min(100, c.length);
            const tatCaTai = ty10 > 0.55 && ty30 > 0.55 && ty100 > 0.52;
            const tatCaXiu = ty10 < 0.45 && ty30 < 0.45 && ty100 < 0.48;
            return { ty10: ty10*100, ty30: ty30*100, ty100: ty100*100, dongThuanTai: tatCaTai, dongThuanXiu: tatCaXiu };
        }

        tinhEntropy() {
            const c = this.chuoi;
            if (c.length < 20) return 1;
            const gan = c.slice(-30);
            const p = gan.filter(x => x === 'TAI').length / gan.length;
            if (p === 0 || p === 1) return 0;
            return -(p * Math.log2(p) + (1-p) * Math.log2(1-p));
        }

        xungLuongCoTrongSo() {
            const c = this.chuoi;
            if (c.length < 12) return null;
            let tongTai = 0, tongXiu = 0;
            const gan = c.slice(-12);
            for (let i = 0; i < gan.length; i++) {
                const w = Math.pow(1.15, i);
                if (gan[i] === 'TAI') tongTai += w; else tongXiu += w;
            }
            const tong = tongTai + tongXiu;
            return { tyTai: tongTai / tong * 100, tyXiu: tongXiu / tong * 100 };
        }

        tinhTrendStrength() {
            const c = this.chuoi;
            if (c.length < 20) return null;
            const gan = c.slice(-30).map(x => x === 'TAI' ? 1 : -1);
            const n = gan.length;
            let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
            for (let i = 0; i < n; i++) {
                sumX += i;
                sumY += gan[i];
                sumXY += i * gan[i];
                sumX2 += i * i;
            }
            const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
            const doManh = Math.min(1, Math.abs(slope) / 0.15);
            return { slope, doManh, huong: slope > 0 ? 'TAI' : 'XIU' };
        }

        tinhReversal() {
            const c = this.chuoi;
            if (c.length < 15) return null;
            const nhom = tachNhom(c);
            if (nhom.length < 5) return null;
            const doDaiNhomCuoi = nhom[nhom.length-1].doDai;
            let soLanTiepTuc = 0, soLanDaoChieu = 0;
            for (let i = 0; i < c.length - doDaiNhomCuoi - 1; i++) {
                let allSame = true;
                for (let j = 0; j < doDaiNhomCuoi; j++) {
                    if (c[i+j] !== c[i+doDaiNhomCuoi-1]) { allSame = false; break; }
                }
                if (!allSame) continue;
                if (i + doDaiNhomCuoi < c.length) {
                    if (c[i+doDaiNhomCuoi] === c[i+doDaiNhomCuoi-1]) soLanTiepTuc++;
                    else soLanDaoChieu++;
                }
            }
            const tong = soLanTiepTuc + soLanDaoChieu;
            if (tong < 3) return null;
            return { pDao: soLanDaoChieu / tong, pTiepTuc: soLanTiepTuc / tong, doDaiHienTai: doDaiNhomCuoi };
        }

        tinhVolatility() {
            const c = this.chuoi;
            if (c.length < 15) return null;
            const gan = c.slice(-25);
            let doiHuong = 0;
            for (let i = 1; i < gan.length; i++) {
                if (gan[i] !== gan[i-1]) doiHuong++;
            }
            const tyLe = doiHuong / (gan.length - 1);
            return { tyLeDoiHuong: tyLe, cao: tyLe > 0.65, thap: tyLe < 0.35, trungBinh: tyLe >= 0.35 && tyLe <= 0.65 };
        }

        phanTichSessionPattern() {
            const c = this.chuoi;
            if (c.length < 30) return null;
            const gan = c.slice(-30);
            const k1 = gan.slice(0, 10);
            const k2 = gan.slice(10, 20);
            const k3 = gan.slice(20, 30);
            const ty1 = k1.filter(x => x === 'TAI').length / 10;
            const ty2 = k2.filter(x => x === 'TAI').length / 10;
            const ty3 = k3.filter(x => x === 'TAI').length / 10;
            return { ty1, ty2, ty3 };
        }

        phanTichBayesian() {
            const c = this.chuoi;
            if (c.length < 15) return null;
            let alpha = 1, beta = 1;
            const gan = c.slice(-40);
            for (const x of gan) {
                if (x === 'TAI') alpha++;
                else beta++;
            }
            const pTai = alpha / (alpha + beta);
            const variance = (alpha * beta) / ((alpha+beta)*(alpha+beta)*(alpha+beta+1));
            return { pTai, pXiu: 1-pTai, alpha, beta, doTinCay: 1 - Math.sqrt(variance) * 4 };
        }

        tinhMomentumDecay() {
            const c = this.chuoi;
            if (c.length < 15) return null;
            let scoreTai = 0, scoreXiu = 0;
            const gan = c.slice(-15);
            for (let i = 0; i < gan.length; i++) {
                const w = Math.exp(-(gan.length - 1 - i) / 5);
                if (gan[i] === 'TAI') scoreTai += w;
                else scoreXiu += w;
            }
            const tong = scoreTai + scoreXiu;
            return {
                scoreTai: scoreTai / tong * 100,
                scoreXiu: scoreXiu / tong * 100,
                huong: scoreTai > scoreXiu ? 'TAI' : 'XIU',
                doManh: Math.abs(scoreTai - scoreXiu) / tong
            };
        }

        quanSat() {
            const dang = this.nhanDienDang();
            const lichSu = this.traCuuLichSu(dang);

            let tyLeTai = lichSu.tyLeTai;
            if (tyLeTai === null && this.chuoi.length >= 5) {
                const soTai = this.chuoi.filter(x => x === 'TAI').length;
                tyLeTai = soTai / this.chuoi.length * 100;
            }

            if (tyLeTai === null) {
                return { goiYHuong: null, tyLeTai: 50, tyLeXiu: 50, cacTinHieu: {}, soMau: 0 };
            }

            const tinHieu = {
                dang, lichSu,
                markov:  this.phanTichMarkov(),
                markov2: this.phanTichMarkov2(),
                markov3: this.phanTichMarkov3(),
                xucXac:  this.phanTichTong(),
                bet:     this.doDaiBet(),
                streakBreak: this.phanTichStreakBreak(),
                chuKy:   this.phatHienChuKy(),
                dao:     this.phatHienDao(),
                zigzag:  this.phanTichZigzag(),
                fib:     this.phatHienFibonacci(),
                ngram2:  this.phanTichNGram(2),
                ngram3:  this.phanTichNGram(3),
                ngram4:  this.phanTichNGram(4),
                ngram5:  this.phanTichNGram(5),
                knn:     this.phanTichTuongDong(),
                xucXacPP:this.phanTichXucXac(),
                dongThuan: this.phanTichDongThuan(),
                entropy: this.tinhEntropy(),
                xung:    this.xungLuongCoTrongSo(),
                trend:   this.tinhTrendStrength(),
                reversal:this.tinhReversal(),
                volatility: this.tinhVolatility(),
                session: this.phanTichSessionPattern(),
                bayesian: this.phanTichBayesian(),
                momentum: this.tinhMomentumDecay()
            };

            return {
                goiYHuong: tyLeTai >= 50 ? 'TAI' : 'XIU',
                tyLeTai,
                tyLeXiu: 100 - tyLeTai,
                soMau: lichSu.soMau || this.chuoi.length,
                cacTinHieu: tinHieu
            };
        }
    }

    class AIEngine {
        constructor() {
            this.trongSo = {
                mau:       0.08, lech:      0.07, bet:       0.05,
                markov:    0.06, markov2:   0.05, markov3:    0.05,
                xucxac:    0.05, chuKy:     0.09, dao:        0.07,
                zigzag:    0.04, fib:       0.03, streakBreak: 0.05,
                ngram:     0.08, knn:       0.07, xucXacPP:   0.04,
                dongThuan: 0.04, xung:      0.04, trend:      0.05,
                reversal:  0.04, volatility:0.03, session:    0.03,
                bayesian:  0.05, momentum:  0.04
            };
            this.hieuSuat = {};
            for (const k of Object.keys(this.trongSo)) {
                this.hieuSuat[k] = { dung: 0, tong: 0 };
            }
            this.duDoanTruoc = null;
        }

        capNhatHieuSuat(ketQuaThat) {
            if (!this.duDoanTruoc) return;
            for (const k of Object.keys(this.hieuSuat)) {
                const dk = this.duDoanTruoc.diemTung[k];
                if (dk == null) continue;
                this.hieuSuat[k].tong++;
                const tinHieuHuong = dk >= 0.5 ? this.duDoanTruoc.goiY : (this.duDoanTruoc.goiY === 'TAI' ? 'XIU' : 'TAI');
                if (tinHieuHuong === ketQuaThat) this.hieuSuat[k].dung++;
            }
            this.duDoanTruoc = null;
        }

        trongSoThichUng(key) {
            const hs = this.hieuSuat[key];
            const base = this.trongSo[key];
            if (!hs || hs.tong < 5) return base;
            const tyLeDung = hs.dung / hs.tong;
            const heSo = 0.5 + 1 / (1 + Math.exp(-(tyLeDung - 0.5) * 8)) * 1.2;
            return base * heSo;
        }

        phanTich(chuoi, goiY, soMau, tyLeTai, th) {
            if (!chuoi.length || !goiY) return 0;
            const diemTung = {};

            diemTung.mau = Math.min(1, Math.log10(soMau + 1) / Math.log10(41));
            const tyLeGoiY = goiY === 'TAI' ? tyLeTai : (100 - tyLeTai);
            diemTung.lech = Math.min(1, Math.max(0, (tyLeGoiY - 50) / 32));
            diemTung.bet = Math.min(1, (th.bet || 0) / 8);

            let dMarkov = 0;
            if (th.markov) {
                const p = goiY === 'TAI' ? th.markov.pTai : th.markov.pXiu;
                dMarkov = Math.min(1, Math.max(0, (p - 0.5) * 2));
            }
            diemTung.markov = dMarkov;

            let dMarkov2 = 0;
            if (th.markov2) {
                const p = goiY === 'TAI' ? th.markov2.pTai : 1 - th.markov2.pTai;
                dMarkov2 = Math.min(1, Math.max(0, (p - 0.5) * 2)) * Math.min(1, th.markov2.tong / 10);
            }
            diemTung.markov2 = dMarkov2;

            let dMarkov3 = 0;
            if (th.markov3) {
                const p = goiY === 'TAI' ? th.markov3.pTai : 1 - th.markov3.pTai;
                dMarkov3 = Math.min(1, Math.max(0, (p - 0.5) * 2)) * Math.min(1, th.markov3.tong / 8);
            }
            diemTung.markov3 = dMarkov3;

            let dXucXac = 0;
            if (th.xucXac) {
                const pTaiGan = th.xucXac.tyLeTaiGan;
                const pGoiY = goiY === 'TAI' ? pTaiGan : 1 - pTaiGan;
                dXucXac = Math.min(1, Math.max(0, (pGoiY - 0.5) * 2));
            }
            diemTung.xucxac = dXucXac;

            let dChuKy = 0;
            if (th.chuKy) {
                const khop = th.chuKy.ketQuaDuDoan === goiY;
                dChuKy = khop ? th.chuKy.doTinCay : 0;
            }
            diemTung.chuKy = dChuKy;

            let dDao = 0;
            if (th.dao) {
                const khop = th.dao.ketQuaDuDoan === goiY;
                dDao = khop ? Math.min(1, th.dao.doDai / 6) : 0;
            }
            diemTung.dao = dDao;

            let dZigzag = 0;
            if (th.zigzag) {
                const huongCuoi = chuoi[chuoi.length-1];
                const huongDao = huongCuoi === 'TAI' ? 'XIU' : 'TAI';
                if (th.zigzag.loai === 'zigzag-1' && goiY === huongDao) dZigzag = th.zigzag.doTinCay;
                else if (th.zigzag.loai === 'zigzag-2' && goiY === huongDao) dZigzag = th.zigzag.doTinCay;
            }
            diemTung.zigzag = dZigzag;

            let dFib = 0;
            if (th.fib) {
                const huongDao = th.fib.huongHienTai === 'TAI' ? 'XIU' : 'TAI';
                if (goiY === huongDao) dFib = th.fib.doTinCay;
            }
            diemTung.fib = dFib;

            let dStreak = 0;
            if (th.streakBreak) {
                const khop = th.streakBreak.goiY === goiY;
                dStreak = khop ? Math.abs(th.streakBreak.pTiepTuc - 0.5) * 2 * Math.min(1, th.streakBreak.tongMau / 15) : 0;
            }
            diemTung.streakBreak = dStreak;

            let dNgram = 0, demNgram = 0;
            for (const key of ['ngram2','ngram3','ngram4','ngram5']) {
                if (th[key]) {
                    const p = goiY === 'TAI' ? th[key].tyLeTai : 100 - th[key].tyLeTai;
                    const scale = Math.min(1, th[key].tong / 12);
                    dNgram += Math.min(1, Math.max(0, (p - 50) / 40)) * scale;
                    demNgram++;
                }
            }
            if (demNgram > 0) dNgram /= demNgram;
            diemTung.ngram = dNgram;

            let dKnn = 0;
            if (th.knn) {
                const p = goiY === 'TAI' ? th.knn.tyLeTai : 100 - th.knn.tyLeTai;
                const scale = Math.min(1, th.knn.tong / 8);
                dKnn = Math.min(1, Math.max(0, (p - 50) / 45)) * scale;
            }
            diemTung.knn = dKnn;

            let dXucXacPP = 0;
            if (th.xucXacPP) {
                const xuHuongTai = th.xucXacPP.xuHuongTai;
                const khop = (xuHuongTai && goiY === 'TAI') || (!xuHuongTai && goiY === 'XIU');
                dXucXacPP = khop ? Math.min(1, Math.abs(th.xucXacPP.trungBinhGan - 10.5) / 4) : 0;
            }
            diemTung.xucXacPP = dXucXacPP;

            let dDongThuan = 0;
            if (th.dongThuan) {
                if (goiY === 'TAI' && th.dongThuan.dongThuanTai) dDongThuan = 1;
                else if (goiY === 'XIU' && th.dongThuan.dongThuanXiu) dDongThuan = 1;
                else {
                    const p30 = th.dongThuan.ty30 / 100;
                    const pGoiY = goiY === 'TAI' ? p30 : 1 - p30;
                    dDongThuan = Math.min(1, Math.max(0, (pGoiY - 0.5) * 2)) * 0.6;
                }
            }
            diemTung.dongThuan = dDongThuan;

            let dXung = 0;
            if (th.xung) {
                const p = goiY === 'TAI' ? th.xung.tyTai : th.xung.tyXiu;
                dXung = Math.min(1, Math.max(0, (p - 50) / 40));
            }
            diemTung.xung = dXung;

            let dTrend = 0;
            if (th.trend) {
                dTrend = th.trend.huong === goiY ? th.trend.doManh : 0;
            }
            diemTung.trend = dTrend;

            let dReversal = 0;
            if (th.reversal) {
                const huongDao = chuoi[chuoi.length-1] === 'TAI' ? 'XIU' : 'TAI';
                const huongTiep = chuoi[chuoi.length-1];
                if (goiY === huongDao) dReversal = th.reversal.pDao;
                else if (goiY === huongTiep) dReversal = th.reversal.pTiepTuc;
            }
            diemTung.reversal = dReversal;

            let dVol = 0;
            if (th.volatility) {
                const huongCuoi = chuoi[chuoi.length-1];
                const huongDao = huongCuoi === 'TAI' ? 'XIU' : 'TAI';
                if (th.volatility.cao && goiY === huongDao) dVol = 0.7;
                else if (th.volatility.thap && goiY === huongCuoi) dVol = 0.7;
                else dVol = 0.3;
            }
            diemTung.volatility = dVol;

            let dSession = 0;
            if (th.session) {
                const pGan = goiY === 'TAI' ? th.session.ty3 : 1 - th.session.ty3;
                dSession = Math.min(1, Math.max(0, (pGan - 0.5) * 2));
            }
            diemTung.session = dSession;

            let dBayes = 0;
            if (th.bayesian) {
                const p = goiY === 'TAI' ? th.bayesian.pTai : th.bayesian.pXiu;
                dBayes = Math.min(1, Math.max(0, (p - 0.5) * 2)) * th.bayesian.doTinCay;
            }
            diemTung.bayesian = dBayes;

            let dMomentum = 0;
            if (th.momentum) {
                dMomentum = th.momentum.huong === goiY ? th.momentum.doManh : 0;
            }
            diemTung.momentum = dMomentum;

            let diem = 0;
            let tongTrongSo = 0;
            for (const key of Object.keys(diemTung)) {
                if (diemTung[key] == null) continue;
                const w = this.trongSoThichUng(key);
                diem += diemTung[key] * w;
                tongTrongSo += w;
            }
            if (tongTrongSo > 0) diem /= tongTrongSo;

            let soDongY = 0, soPhanDoi = 0;
            for (const key of Object.keys(diemTung)) {
                if (diemTung[key] == null) continue;
                if (diemTung[key] >= 0.7) soDongY++;
                else if (diemTung[key] <= 0.2 && key !== 'bet' && key !== 'dao' && key !== 'chuKy') soPhanDoi++;
            }
            const bonusDongThuan = Math.min(1, soDongY / 8) * 0.18;
            const phatPhanDoi = soPhanDoi >= 5 ? 0.1 : 0;
            diem = Math.min(1, Math.max(0, diem + bonusDongThuan - phatPhanDoi));

            if (th.entropy > 0.98) diem *= 0.85;
            else if (th.entropy > 0.92) diem *= 0.93;

            if (th.chuKy && th.chuKy.doTinCay >= 0.9 && th.chuKy.ketQuaDuDoan === goiY) {
                diem = Math.min(1, diem + 0.12);
            }
            if (th.dao && th.dao.doDai >= 5 && th.dao.ketQuaDuDoan === goiY) {
                diem = Math.min(1, diem + 0.08);
            }
            if (th.trend && th.trend.doManh >= 0.8 && th.trend.huong === goiY) {
                diem = Math.min(1, diem + 0.06);
            }
            if (th.fib && th.fib.doTinCay >= 0.7 && goiY === (th.fib.huongHienTai === 'TAI' ? 'XIU' : 'TAI')) {
                diem = Math.min(1, diem + 0.05);
            }
            if (th.zigzag && th.zigzag.doTinCay >= 0.7) {
                const huongCuoi = chuoi[chuoi.length-1];
                const huongDao = huongCuoi === 'TAI' ? 'XIU' : 'TAI';
                if (goiY === huongDao) diem = Math.min(1, diem + 0.05);
            }

            this.duDoanTruoc = { goiY, diemTung };
            return Math.round(diem * 100);
        }
    }

    class BangDuDoan {
        constructor(apiUrl, prefixId) {
            this.apiUrl = apiUrl;
            this.prefix = prefixId;
            this.engine = new CauVisionPro();
            this.ai = new AIEngine();
            this.lastSid = null;
            this.dangImLang = false;
            this.goiYCuoi = null;

            this.taiEl    = document.getElementById('tai-' + prefixId);
            this.xiuEl    = document.getElementById('xiu-' + prefixId);
            this.sidEl    = document.getElementById('sid-' + prefixId);
            this.statusEl = document.getElementById('status-' + prefixId);
            this.confEl   = document.getElementById('conf-' + prefixId);
            this.confLevel = this.confEl.querySelector('.conf-level');
            this.confNum   = this.confEl.querySelector('.conf-num');
        }

        capNhatVongTron(huong, dangNhay, tyLeTai, tyLeXiu) {
            this.taiEl.classList.remove('active', 'resting');
            this.xiuEl.classList.remove('active', 'resting');

            if (tyLeTai != null && tyLeXiu != null) {
                this.taiEl.textContent = Math.round(tyLeTai) + '%';
                this.xiuEl.textContent = Math.round(tyLeXiu) + '%';
            } else {
                this.taiEl.textContent = '--%';
                this.xiuEl.textContent = '--%';
            }

            if (!huong) return;
            const el = huong === 'TAI' ? this.taiEl : this.xiuEl;
            el.classList.add(dangNhay ? 'active' : 'resting');
        }

        capNhatConf(diem, dangNhay) {
            if (!dangNhay || diem < 50) {
                this.confEl.classList.remove('show', 'mid', 'ok', 'high');
                return;
            }
            let level = '', cls = '';
            if (diem >= 80)      { level = 'CAO';        cls = 'high'; }
            else if (diem >= 70) { level = 'ỔN';         cls = 'ok';   }
            else                 { level = 'TRUNG BÌNH'; cls = 'mid';  }

            this.confLevel.textContent = level;
            this.confNum.textContent = diem + '%';

            this.confEl.classList.add('show');
            this.confEl.classList.remove('mid', 'ok', 'high');
            this.confEl.classList.add(cls);
        }

        async tick() {
            try {
                const res = await fetch(this.apiUrl, { cache: 'no-store' });
                if (!res.ok) throw new Error('HTTP ' + res.status);
                const data = await res.json();

                const list = data.list || data.data || data.sessions || data.result;
                if (!Array.isArray(list) || !list.length) throw new Error('No data');

                const sortedAsc = [...list].sort((a, b) => (a.id||0) - (b.id||0));
                const newestId = list[0].id ?? sortedAsc[sortedAsc.length-1].id;

                if (this.lastSid !== null && newestId !== this.lastSid) {
                    const last = sortedAsc[sortedAsc.length-1];
                    const ketQuaThat = last.resultTruyenThong || last.result || last.ketQua;

                    if (this.goiYCuoi && ketQuaThat) {
                        this.ai.capNhatHieuSuat(ketQuaThat);
                    }

                    this.dangImLang = true;
                    this.capNhatVongTron(null, false, null, null);
                    this.capNhatConf(0, false);
                    this.sidEl.textContent = '#' + newestId;
                    this.statusEl.textContent = 'Đã ra kết quả';

                    setTimeout(() => {
                        this.dangImLang = false;
                        this.phanTich(sortedAsc, newestId);
                    }, 5000);

                    this.lastSid = newestId;
                    return;
                }

                this.lastSid = newestId;
                this.sidEl.textContent = '#' + (newestId + 1);

                if (!this.dangImLang) this.phanTich(sortedAsc, newestId);
            } catch (err) {
                this.statusEl.textContent = 'Đang kết nối...';
            }
        }

        phanTich(sortedAsc, newestId) {
            this.engine.nap(sortedAsc);
            const qs = this.engine.quanSat();
            this.sidEl.textContent = '#' + (newestId + 1);

            if (qs.goiYHuong) {
                const diem = this.ai.phanTich(
                    this.engine.chuoi,
                    qs.goiYHuong,
                    qs.soMau,
                    qs.tyLeTai,
                    qs.cacTinHieu
                );
                this.capNhatVongTron(qs.goiYHuong, true, qs.tyLeTai, qs.tyLeXiu);
                this.capNhatConf(diem, true);
                this.statusEl.textContent = 'Đang dự đoán...';
                this.goiYCuoi = qs.goiYHuong;
            } else {
                this.capNhatVongTron(null, false, null, null);
                this.capNhatConf(0, false);
                this.statusEl.textContent = 'Đang thu thập dữ liệu...';
                this.goiYCuoi = null;
            }
        }
    }

    const bangMD5 = new BangDuDoan('https://ancient-poetry-7f56.lot896613.workers.dev/?mode=md5', 'md5');
    const bangHu  = new BangDuDoan('https://wtx.tele68.com/v1/tx/sessions', 'hu');

    setInterval(() => { bangMD5.tick(); bangHu.tick(); }, 4000);
    bangMD5.tick();
    bangHu.tick();
}

/* THU GỌN / MỞ RỘNG */
document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const card = document.getElementById(btn.dataset.target);
        card.classList.toggle('collapsed');
        btn.textContent = card.classList.contains('collapsed') ? '+' : '−';
    });
});

/* KÉO THẢ */
function ganKeoTha(el) {
    let isDragging = false, startX, startY, initialX, initialY;
    el.addEventListener('pointerdown', (e) => {
        if (e.target.closest('.toggle-btn')) return;
        isDragging = true;
        startX = e.clientX; startY = e.clientY;
        initialX = el.offsetLeft; initialY = el.offsetTop;
        try { el.setPointerCapture(e.pointerId); } catch (_) {}
    });
    el.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX, dy = e.clientY - startY;
        requestAnimationFrame(() => {
            el.style.left = (initialX + dx) + 'px';
            el.style.top = (initialY + dy) + 'px';
            el.style.right = 'auto';
        });
    });
    const stop = () => { isDragging = false; };
    el.addEventListener('pointerup', stop);
    el.addEventListener('pointercancel', stop);
}
document.querySelectorAll('.drag-group').forEach(ganKeoTha);
