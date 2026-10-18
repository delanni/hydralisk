/**
 * qrOverlay.js — Pairing Modal & QR Code generator for Hydralisk Player
 *
 * Provides a projector-friendly pairing screen (Ctrl+Shift+R or UI button)
 * displaying a QR code that encodes https://hydralisk.sphynx.cloud/remote.html?room=XYZ&token=...
 * Auto-fades when a mobile controller successfully connects.
 */

// Minimal self-contained QR Code generator (Mode 8-bit Byte, Version auto 1-10, Low ECC)
// Based on standard ISO/IEC 18004 QR generation
function createQRCodeMatrix(text) {
  // Simple table-based QR generator or SVG fallback for canvas/vector rendering
  // We implement a robust mini QR generator supporting URLs up to 128 characters
  return generateQRMatrix(text);
}

// Compact QR Code Generator implementation
function generateQRMatrix(text) {
  // Use a reliable lightweight QR algorithm
  const qr = QRCode(0, 'M');
  qr.addData(text);
  qr.make();
  return qr;
}

// Embedded minimal QRCode library (Kazuhiko Arase QR Code Generator in Javascript)
function QRCode(typeNumber, errorCorrectionLevel) {
  const PAD0 = 0xEC;
  const PAD1 = 0x11;

  let _modules = null;
  let _moduleCount = 0;
  let _dataCache = null;
  const _dataList = [];

  function addData(data) {
    _dataList.push(new QR8bitByte(data));
    _dataCache = null;
  }

  function isDark(row, col) {
    if (row < 0 || _moduleCount <= row || col < 0 || _moduleCount <= col) {
      throw new Error(row + "," + col);
    }
    return _modules[row][col];
  }

  function getModuleCount() {
    return _moduleCount;
  }

  function make() {
    if (typeNumber < 1) {
      let type = 1;
      for (; type < 40; type++) {
        const rsBlocks = QRRSBlock.getRSBlocks(type, errorCorrectionLevel);
        const buffer = new QRBitBuffer();
        let totalDataCount = 0;
        for (let i = 0; i < rsBlocks.length; i++) {
          totalDataCount += rsBlocks[i].dataCount;
        }
        for (let i = 0; i < _dataList.length; i++) {
          const data = _dataList[i];
          buffer.put(data.mode, 4);
          buffer.put(data.getLength(), QRUtil.getLengthInBits(data.mode, type));
          data.write(buffer);
        }
        if (buffer.getLengthInBits() <= totalDataCount * 8) break;
      }
      typeNumber = type;
    }
    makeImpl(false, getBestMaskPattern());
  }

  function makeImpl(test, maskPattern) {
    _moduleCount = typeNumber * 4 + 17;
    _modules = new Array(_moduleCount);
    for (let row = 0; row < _moduleCount; row++) {
      _modules[row] = new Array(_moduleCount).fill(null);
    }
    setupPositionProbePattern(0, 0);
    setupPositionProbePattern(_moduleCount - 7, 0);
    setupPositionProbePattern(0, _moduleCount - 7);
    setupPositionAdjustPattern();
    setupTimingPattern();
    setupTypeInfo(test, maskPattern);
    if (typeNumber >= 7) {
      setupTypeNumber(test);
    }
    if (_dataCache == null) {
      _dataCache = createData(typeNumber, errorCorrectionLevel, _dataList);
    }
    mapData(_dataCache, maskPattern);
  }

  function setupPositionProbePattern(row, col) {
    for (let r = -1; r <= 7; r++) {
      if (row + r <= -1 || _moduleCount <= row + r) continue;
      for (let c = -1; c <= 7; c++) {
        if (col + c <= -1 || _moduleCount <= col + c) continue;
        if ((0 <= r && r <= 6 && (c == 0 || c == 6)) ||
            (0 <= c && c <= 6 && (r == 0 || r == 6)) ||
            (2 <= r && r <= 4 && 2 <= c && c <= 4)) {
          _modules[row + r][col + c] = true;
        } else {
          _modules[row + r][col + c] = false;
        }
      }
    }
  }

  function getBestMaskPattern() {
    let minLostPoint = 0;
    let pattern = 0;
    for (let i = 0; i < 8; i++) {
      makeImpl(true, i);
      const lostPoint = QRUtil.getLostPoint({ getModuleCount, isDark });
      if (i == 0 || minLostPoint > lostPoint) {
        minLostPoint = lostPoint;
        pattern = i;
      }
    }
    return pattern;
  }

  function setupTimingPattern() {
    for (let r = 8; r < _moduleCount - 8; r++) {
      if (_modules[r][6] != null) continue;
      _modules[r][6] = (r % 2 == 0);
    }
    for (let c = 8; c < _moduleCount - 8; c++) {
      if (_modules[6][c] != null) continue;
      _modules[6][c] = (c % 2 == 0);
    }
  }

  function setupPositionAdjustPattern() {
    const pos = QRUtil.getPatternPosition(typeNumber);
    for (let i = 0; i < pos.length; i++) {
      for (let j = 0; j < pos.length; j++) {
        const row = pos[i];
        const col = pos[j];
        if (_modules[row][col] != null) continue;
        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 2; c++) {
            if (Math.abs(r) == 2 || Math.abs(c) == 2 || (r == 0 && c == 0)) {
              _modules[row + r][col + c] = true;
            } else {
              _modules[row + r][col + c] = false;
            }
          }
        }
      }
    }
  }

  function setupTypeNumber(test) {
    const bits = QRUtil.getBCHTypeNumber(typeNumber);
    for (let i = 0; i < 18; i++) {
      const mod = (!test && ((bits >> i) & 1) == 1);
      _modules[Math.floor(i / 3)][i % 3 + _moduleCount - 8 - 3] = mod;
    }
    for (let i = 0; i < 18; i++) {
      const mod = (!test && ((bits >> i) & 1) == 1);
      _modules[i % 3 + _moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
    }
  }

  function setupTypeInfo(test, maskPattern) {
    const data = (QRUtil.getErrorCorrectionLevelBits(errorCorrectionLevel) << 3) | maskPattern;
    const bits = QRUtil.getBCHTypeInfo(data);
    for (let i = 0; i < 15; i++) {
      const mod = (!test && ((bits >> i) & 1) == 1);
      if (i < 6) {
        _modules[i][8] = mod;
      } else if (i < 8) {
        _modules[i + 1][8] = mod;
      } else {
        _modules[_moduleCount - 15 + i][8] = mod;
      }
    }
    for (let i = 0; i < 15; i++) {
      const mod = (!test && ((bits >> i) & 1) == 1);
      if (i < 8) {
        _modules[8][_moduleCount - i - 1] = mod;
      } else if (i == 8) {
        _modules[8][15 - i] = mod;
      } else {
        _modules[8][15 - i - 1] = mod;
      }
    }
    _modules[_moduleCount - 8][8] = (!test);
  }

  function mapData(data, maskPattern) {
    let inc = -1;
    let row = _moduleCount - 1;
    let bitIndex = 7;
    let byteIndex = 0;

    for (let col = _moduleCount - 1; col > 0; col -= 2) {
      if (col == 6) col--;
      while (true) {
        for (let c = 0; c < 2; c++) {
          if (_modules[row][col - c] == null) {
            let dark = false;
            if (byteIndex < data.length) {
              dark = (((data[byteIndex] >>> bitIndex) & 1) == 1);
            }
            const mask = QRUtil.getMask(maskPattern, row, col - c);
            if (mask) dark = !dark;
            _modules[row][col - c] = dark;
            bitIndex--;
            if (bitIndex == -1) {
              byteIndex++;
              bitIndex = 7;
            }
          }
        }
        row += inc;
        if (row < 0 || _moduleCount <= row) {
          row -= inc;
          inc = -inc;
          break;
        }
      }
    }
  }

  function createData(typeNumber, errorCorrectionLevel, dataList) {
    const rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectionLevel);
    const buffer = new QRBitBuffer();
    for (let i = 0; i < dataList.length; i++) {
      const data = dataList[i];
      buffer.put(data.mode, 4);
      buffer.put(data.getLength(), QRUtil.getLengthInBits(data.mode, typeNumber));
      data.write(buffer);
    }
    let totalDataCount = 0;
    for (let i = 0; i < rsBlocks.length; i++) {
      totalDataCount += rsBlocks[i].dataCount;
    }
    if (buffer.getLengthInBits() > totalDataCount * 8) {
      throw new Error("Code length overflow. (" + buffer.getLengthInBits() + ">" + totalDataCount * 8 + ")");
    }
    if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
      buffer.put(0, 4);
    }
    while (buffer.getLengthInBits() % 8 != 0) {
      buffer.putBit(false);
    }
    while (true) {
      if (buffer.getLengthInBits() >= totalDataCount * 8) break;
      buffer.put(PAD0, 8);
      if (buffer.getLengthInBits() >= totalDataCount * 8) break;
      buffer.put(PAD1, 8);
    }
    return createBytes(buffer, rsBlocks);
  }

  function createBytes(buffer, rsBlocks) {
    let offset = 0;
    let maxDcCount = 0;
    let maxEcCount = 0;
    const dcdata = new Array(rsBlocks.length);
    const ecdata = new Array(rsBlocks.length);

    for (let r = 0; r < rsBlocks.length; r++) {
      const dcCount = rsBlocks[r].dataCount;
      const ecCount = rsBlocks[r].totalCount - dcCount;
      maxDcCount = Math.max(maxDcCount, dcCount);
      maxEcCount = Math.max(maxEcCount, ecCount);
      dcdata[r] = new Array(dcCount);
      for (let i = 0; i < dcdata[r].length; i++) {
        dcdata[r][i] = 0xff & buffer.buffer[i + offset];
      }
      offset += dcCount;
      const rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
      const rawPoly = new QRPolynomial(dcdata[r], rsPoly.getLength() - 1);
      const modPoly = rawPoly.mod(rsPoly);
      ecdata[r] = new Array(rsPoly.getLength() - 1);
      for (let i = 0; i < ecdata[r].length; i++) {
        const modIndex = i + modPoly.getLength() - ecdata[r].length;
        ecdata[r][i] = (modIndex >= 0) ? modPoly.get(modIndex) : 0;
      }
    }

    let totalCodeCount = 0;
    for (let i = 0; i < rsBlocks.length; i++) {
      totalCodeCount += rsBlocks[i].totalCount;
    }
    const data = new Array(totalCodeCount);
    let index = 0;

    for (let i = 0; i < maxDcCount; i++) {
      for (let r = 0; r < rsBlocks.length; r++) {
        if (i < dcdata[r].length) {
          data[index++] = dcdata[r][i];
        }
      }
    }
    for (let i = 0; i < maxEcCount; i++) {
      for (let r = 0; r < rsBlocks.length; r++) {
        if (i < ecdata[r].length) {
          data[index++] = ecdata[r][i];
        }
      }
    }
    return data;
  }

  return { addData, make, isDark, getModuleCount };
}

function QR8bitByte(data) {
  this.mode = 4; // 8-bit byte mode
  this.data = data;
}
QR8bitByte.prototype = {
  getLength: function() { return encodeURI(this.data).replace(/%../g, "i").length; },
  write: function(buffer) {
    const utf8 = unescape(encodeURIComponent(this.data));
    for (let i = 0; i < utf8.length; i++) {
      buffer.put(utf8.charCodeAt(i), 8);
    }
  }
};

const QRUtil = {
  PATTERN_POSITION_TABLE: [
    [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
    [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50], [6, 30, 54]
  ],
  G15: (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0),
  G18: (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0),
  G15_MASK: (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1),

  getBCHTypeInfo: function(data) {
    let d = data << 10;
    while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15) >= 0) {
      d ^= (QRUtil.G15 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15)));
    }
    return ((data << 10) | d) ^ QRUtil.G15_MASK;
  },
  getBCHTypeNumber: function(data) {
    let d = data << 12;
    while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18) >= 0) {
      d ^= (QRUtil.G18 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18)));
    }
    return (data << 12) | d;
  },
  getBCHDigit: function(data) {
    let digit = 0;
    while (data != 0) { digit++; data >>>= 1; }
    return digit;
  },
  getPatternPosition: function(typeNumber) {
    return QRUtil.PATTERN_POSITION_TABLE[typeNumber - 1] || [];
  },
  getMask: function(maskPattern, i, j) {
    switch (maskPattern) {
      case 0: return (i + j) % 2 == 0;
      case 1: return i % 2 == 0;
      case 2: return j % 3 == 0;
      case 3: return (i + j) % 3 == 0;
      case 4: return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 == 0;
      case 5: return (i * j) % 2 + (i * j) % 3 == 0;
      case 6: return ((i * j) % 2 + (i * j) % 3) % 2 == 0;
      case 7: return ((i * j) % 3 + (i + j) % 2) % 2 == 0;
      default: throw new Error("bad maskPattern:" + maskPattern);
    }
  },
  getErrorCorrectPolynomial: function(errorCorrectLength) {
    let a = new QRPolynomial([1], 0);
    for (let i = 0; i < errorCorrectLength; i++) {
      a = a.multiply(new QRPolynomial([1, QRMath.gexp(i)], 0));
    }
    return a;
  },
  getLengthInBits: function(mode, type) {
    if (1 <= type && type < 10) return 8;
    return 16;
  },
  getErrorCorrectionLevelBits: function(level) {
    switch (level) {
      case 'L': return 1;
      case 'M': return 0;
      case 'Q': return 3;
      case 'H': return 2;
      default: return 0;
    }
  },
  getLostPoint: function(qrCode) {
    const moduleCount = qrCode.getModuleCount();
    let lostPoint = 0;
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        let sameCount = 0;
        const dark = qrCode.isDark(row, col);
        for (let r = -1; r <= 1; r++) {
          if (row + r < 0 || moduleCount <= row + r) continue;
          for (let c = -1; c <= 1; c++) {
            if (col + c < 0 || moduleCount <= col + c || (r == 0 && c == 0)) continue;
            if (dark == qrCode.isDark(row + r, col + c)) sameCount++;
          }
        }
        if (sameCount > 5) lostPoint += (3 + sameCount - 5);
      }
    }
    return lostPoint;
  }
};

const QRMath = {
  glog: function(n) {
    if (n < 1) throw new Error("glog(" + n + ")");
    return QRMath.LOG_TABLE[n];
  },
  gexp: function(n) {
    while (n < 0) n += 255;
    while (n >= 256) n -= 255;
    return QRMath.EXP_TABLE[n];
  },
  EXP_TABLE: new Array(256),
  LOG_TABLE: new Array(256)
};
for (let i = 0; i < 8; i++) QRMath.EXP_TABLE[i] = 1 << i;
for (let i = 8; i < 256; i++) {
  QRMath.EXP_TABLE[i] = QRMath.EXP_TABLE[i - 4] ^ QRMath.EXP_TABLE[i - 5] ^ QRMath.EXP_TABLE[i - 6] ^ QRMath.EXP_TABLE[i - 8];
}
for (let i = 0; i < 255; i++) QRMath.LOG_TABLE[QRMath.EXP_TABLE[i]] = i;

function QRPolynomial(num, shift) {
  let offset = 0;
  while (offset < num.length && num[offset] == 0) offset++;
  this.num = new Array(num.length - offset + shift);
  for (let i = 0; i < num.length - offset; i++) this.num[i] = num[i + offset];
}
QRPolynomial.prototype = {
  get: function(index) { return this.num[index]; },
  getLength: function() { return this.num.length; },
  multiply: function(e) {
    const num = new Array(this.getLength() + e.getLength() - 1).fill(0);
    for (let i = 0; i < this.getLength(); i++) {
      for (let j = 0; j < e.getLength(); j++) {
        num[i + j] ^= QRMath.gexp(QRMath.glog(this.get(i)) + QRMath.glog(e.get(j)));
      }
    }
    return new QRPolynomial(num, 0);
  },
  mod: function(e) {
    if (this.getLength() - e.getLength() < 0) return this;
    const ratio = QRMath.glog(this.get(0)) - QRMath.glog(e.get(0));
    const num = new Array(this.getLength());
    for (let i = 0; i < this.getLength(); i++) num[i] = this.get(i);
    for (let i = 0; i < e.getLength(); i++) {
      num[i] ^= QRMath.gexp(QRMath.glog(e.get(i)) + ratio);
    }
    return new QRPolynomial(num, 0).mod(e);
  }
};

const QRRSBlock = {
  RS_BLOCK_TABLE: [
    [1, 26, 16], [1, 44, 28], [1, 70, 44], [1, 100, 64], [1, 134, 86],
    [2, 86, 52], [2, 98, 54], [2, 121, 69], [2, 146, 80], [2, 86, 43, 2, 87, 44]
  ],
  getRSBlocks: function(typeNumber, errorCorrectionLevel) {
    const list = [];
    const table = QRRSBlock.RS_BLOCK_TABLE[typeNumber - 1] || [1, 26, 16];
    const length = table.length / 3;
    for (let i = 0; i < length; i++) {
      const count = table[i * 3 + 0];
      const totalCount = table[i * 3 + 1];
      const dataCount = table[i * 3 + 2];
      for (let j = 0; j < count; j++) {
        list.push({ totalCount, dataCount });
      }
    }
    return list;
  }
};

function QRBitBuffer() {
  this.buffer = [];
  this.length = 0;
}
QRBitBuffer.prototype = {
  get: function(index) {
    const bufIndex = Math.floor(index / 8);
    return ((this.buffer[bufIndex] >>> (7 - index % 8)) & 1) == 1;
  },
  put: function(num, length) {
    for (let i = 0; i < length; i++) {
      this.putBit(((num >>> (length - i - 1)) & 1) == 1);
    }
  },
  getLengthInBits: function() { return this.length; },
  putBit: function(bit) {
    const bufIndex = Math.floor(this.length / 8);
    if (this.buffer.length <= bufIndex) this.buffer.push(0);
    if (bit) this.buffer[bufIndex] |= (0x80 >>> (this.length % 8));
    this.length++;
  }
};

/**
 * Generate an inline SVG string for the given URL
 */
export function generateQRSvg(text, size = 260) {
  const qr = createQRCodeMatrix(text);
  const count = qr.getModuleCount();
  const cellSize = size / count;

  let rects = '';
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (qr.isDark(r, c)) {
        const x = (c * cellSize).toFixed(2);
        const y = (r * cellSize).toFixed(2);
        const w = (cellSize + 0.05).toFixed(2);
        rects += `<rect x="${x}" y="${y}" width="${w}" height="${w}" fill="#000"/>`;
      }
    }
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="background:#fff; border-radius:12px; padding:12px; box-sizing:content-box;">
      ${rects}
    </svg>
  `;
}

/**
 * Overlay UI Controller for Player
 */
export class QROverlay {
  constructor({ onToggle } = {}) {
    this.visible = false;
    this.overlayEl = null;
    this.onToggle = onToggle || (() => {});
    this.room = '';
    this.token = '';
    this.phoneConnected = false;

    this.setupGlobalShortcut();
  }

  setupGlobalShortcut() {
    window.addEventListener('keydown', (e) => {
      // Toggle on Ctrl+Shift+R or Cmd+Shift+R
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'R' || e.key === 'r')) {
        e.preventDefault();
        e.stopPropagation();
        this.toggle();
      }
      if (e.key === 'Escape' && this.visible) {
        this.hide();
      }
    });
  }

  update({ room, token, phoneConnected }) {
    if (room !== undefined) this.room = room;
    if (token !== undefined) this.token = token;
    if (phoneConnected !== undefined) {
      const wasConnected = this.phoneConnected;
      this.phoneConnected = phoneConnected;
      // Auto-fade when phone connects
      if (!wasConnected && phoneConnected && this.visible) {
        this.autoFadeOut();
      }
    }
    if (this.visible && this.overlayEl) {
      this.renderContent();
    }
  }

  autoFadeOut() {
    if (!this.overlayEl) return;
    this.overlayEl.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
    this.overlayEl.style.opacity = '0';
    this.overlayEl.style.transform = 'scale(0.95)';
    setTimeout(() => {
      this.hide();
      if (this.overlayEl) {
        this.overlayEl.style.opacity = '';
        this.overlayEl.style.transform = '';
      }
    }, 850);
  }

  toggle() {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  show() {
    this.visible = true;
    if (!this.overlayEl) {
      this.createDom();
    }
    this.renderContent();
    this.overlayEl.style.display = 'flex';
    requestAnimationFrame(() => {
      this.overlayEl.style.opacity = '1';
    });
    this.onToggle(true);
  }

  hide() {
    this.visible = false;
    if (this.overlayEl) {
      this.overlayEl.style.opacity = '0';
      setTimeout(() => {
        if (!this.visible && this.overlayEl) {
          this.overlayEl.style.display = 'none';
        }
      }, 300);
    }
    this.onToggle(false);
  }

  getRemoteUrl() {
    const loc = window.location;
    const base = `${loc.protocol}//${loc.host}/remote.html`;
    const url = new URL(base);
    if (this.room) url.searchParams.set('room', this.room);
    if (this.token) url.searchParams.set('token', this.token);
    return url.toString();
  }

  createDom() {
    this.overlayEl = document.createElement('div');
    this.overlayEl.id = 'hydralisk-remote-qr-modal';
    this.overlayEl.style.cssText = `
      position: fixed;
      top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(5, 5, 10, 0.88);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      z-index: 999999;
      display: none;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #fff;
      opacity: 0;
      transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    `;

    this.overlayEl.addEventListener('click', (e) => {
      if (e.target === this.overlayEl) this.hide();
    });

    document.body.appendChild(this.overlayEl);
  }

  renderContent() {
    if (!this.overlayEl) return;
    const remoteUrl = this.getRemoteUrl();
    const qrSvg = generateQRSvg(remoteUrl, 260);

    const statusBadge = this.phoneConnected
      ? `<span style="background:#10b981; color:#000; font-size:12px; font-weight:700; padding:4px 10px; border-radius:20px; display:inline-flex; align-items:center; gap:6px;">● CONTROLLER PAIRED</span>`
      : `<span style="background:rgba(255,255,255,0.12); color:#94a3b8; font-size:12px; font-weight:600; padding:4px 10px; border-radius:20px; display:inline-flex; align-items:center; gap:6px;"><span style="animation:pulse 1.5s infinite; color:#38bdf8;">●</span> WAITING FOR SCAN</span>`;

    this.overlayEl.innerHTML = `
      <style>
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      </style>
      <div style="background: #11131a; border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; padding: 36px 40px; max-width: 440px; width: 90%; text-align: center; box-shadow: 0 25px 60px rgba(0,0,0,0.6); position: relative;">
        <button id="qr-close-btn" style="position:absolute; top:18px; right:20px; background:transparent; border:none; color:#94a3b8; font-size:24px; cursor:pointer; line-height:1;">&times;</button>
        
        <div style="font-size: 13px; text-transform: uppercase; letter-spacing: 2px; color: #38bdf8; font-weight: 700; margin-bottom: 8px;">
          HYDRALISK REMOTE RELAY
        </div>
        <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700;">Scan to Control Visuals</h2>
        
        <div style="display:inline-block; margin: 10px 0 18px 0; border: 2px solid rgba(255,255,255,0.1); border-radius: 16px; overflow: hidden; box-shadow: 0 12px 30px rgba(0,0,0,0.4);">
          ${qrSvg}
        </div>

        <div style="margin-bottom: 16px;">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; margin-bottom: 4px;">Room Code</div>
          <div style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #f8fafc; font-family: monospace;">${this.room || '----'}</div>
        </div>

        <div style="margin-bottom: 20px;">
          ${statusBadge}
        </div>

        <div style="display: flex; gap: 8px; justify-content: center; align-items: center;">
          <input type="text" readonly value="${remoteUrl}" style="background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); color: #94a3b8; font-size: 12px; padding: 8px 12px; border-radius: 8px; width: 70%; font-family: monospace; outline: none;" id="qr-url-input" />
          <button id="qr-copy-btn" style="background: #3b82f6; border: none; color: #fff; font-size: 12px; font-weight: 600; padding: 8px 14px; border-radius: 8px; cursor: pointer;">Copy</button>
        </div>

        <div style="margin-top: 12px;">
          <a href="${remoteUrl}" target="_blank" rel="noopener noreferrer" style="color: #38bdf8; font-size: 13px; text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">Open Remote in New Tab ↗</a>
        </div>

        <div style="margin-top: 16px; font-size: 12px; color: #64748b;">
          Press <kbd style="background:rgba(255,255,255,0.1); padding:2px 6px; border-radius:4px; font-family:monospace;">Ctrl+Shift+R</kbd> or <kbd style="background:rgba(255,255,255,0.1); padding:2px 6px; border-radius:4px; font-family:monospace;">Esc</kbd> to toggle
        </div>
      </div>
    `;

    const closeBtn = this.overlayEl.querySelector('#qr-close-btn');
    if (closeBtn) closeBtn.onclick = () => this.hide();

    const copyBtn = this.overlayEl.querySelector('#qr-copy-btn');
    if (copyBtn) {
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(remoteUrl).then(() => {
          copyBtn.textContent = 'Copied!';
          setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
        });
      };
    }
  }
}
