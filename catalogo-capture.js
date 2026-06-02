/**
 * CATALOGO CAPTURE - Modulo de Captacao de Fotos e Videos
 * 
 * Usa APIs nativas do browser:
 * - getUserMedia() para acessar camera
 * - Canvas API para captura de foto
 * - MediaRecorder API para gravacao de video
 * - ImageCapture API (Chrome) para foto em alta resolucao
 * 
 *用法:
 *   <script src="catalogo-capture.js"><\/script>
 *   <button onclick="CatalogoCapture.open()">Enviar foto/vídeo</button>
 */

(function() {
  'use strict';

  const CatalogoCapture = window.CatalogoCapture = {
    
    // Estado interno
    stream: null,
    mediaRecorder: null,
    recordedChunks: [],
    captureMode: null, // 'photo' | 'video'
    isCapturing: false,

    // Config
    config: {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'environment' // camera traseira优先
      },
      photo: {
        mimeType: 'image/jpeg',
        quality: 0.85
      },
      videoRecording: {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 2500000 // 2.5Mbps
      }
    },

    /**
     * Abre o modulo de captura
     */
    open: function(mode) {
      // mode: 'photo' | 'video' | undefined (mostra seletor)
      this._createUI(mode);
      this._requestCamera(mode || 'photo');
    },

    /**
     * Fecha e limpa tudo
     */
    close: function() {
      this._stopStream();
      this._removeUI();
      this.recordedChunks = [];
      this.captureMode = null;
    },

    /**
     * Pede acesso a camera
     */
    _requestCamera: async function(mode) {
      this.captureMode = mode;
      
      try {
        const constraints = {
          video: {
            facingMode: mode === 'video' ? 'environment' : 'environment',
            width: this.config.video.width,
            height: this.config.video.height
          },
          audio: mode === 'video'
        };
        
        this.stream = await navigator.mediaDevices.getUserMedia(constraints);
        this._attachStream(this.stream);
        this._updateStatus('Pronto. Use os botoes abaixo para capturar.');
        
      } catch (err) {
        console.error('Camera error:', err);
        this._updateStatus('Erro: ' + (err.message || 'Camera negada'));
        
        // Fallback: mostrar WhatsApp
        this._showWhatsAppFallback();
      }
    },

    /**
     * Anexa stream ao video element
     */
    _attachStream: function(stream) {
      const video = document.getElementById('catcap-video');
      if (video) {
        video.srcObject = stream;
        video.play().catch(() => {});
      }
    },

    /**
     * Para o stream da camera
     */
    _stopStream: function() {
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
    },

    /**
     * Captura foto
     */
    capturePhoto: function() {
      const video = document.getElementById('catcap-video');
      const canvas = document.getElementById('catcap-canvas');
      const preview = document.getElementById('catcap-preview');
      
      if (!video || !canvas) return;
      
      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          preview.src = url;
          preview.style.display = 'block';
          document.getElementById('catcap-video-wrap').style.display = 'none';
          document.getElementById('catcap-controls').dataset.state = 'preview';
          this._updateStatus('Foto pronta! Adicione uma legenda ou envie.');
          this._enableSend(blob, 'photo');
        }
      }, this.config.photo.mimeType, this.config.photo.quality);
    },

    /**
     * Inicia gravacao de video
     */
    startVideo: function() {
      if (!this.stream) return;
      
      this.recordedChunks = [];
      const options = {
        mimeType: this.config.videoRecording.mimeType
      };
      
      // Fallback se VP9 nao suportado
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/webm;codecs=vp8';
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options.mimeType = 'video/webm';
        }
      }
      options.videoBitsPerSecond = this.config.videoRecording.videoBitsPerSecond;
      
      try {
        this.mediaRecorder = new MediaRecorder(this.stream, options);
      } catch (e) {
        // Try sem bitsPerSecond
        delete options.videoBitsPerSecond;
        this.mediaRecorder = new MediaRecorder(this.stream, options);
      }
      
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };
      
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: this.mediaRecorder.mimeType });
        const url = URL.createObjectURL(blob);
        const preview = document.getElementById('catcap-preview');
        preview.src = url;
        preview.style.display = 'block';
        document.getElementById('catcap-video-wrap').style.display = 'none';
        document.getElementById('catcap-controls').dataset.state = 'preview';
        this._updateStatus('Video gravado! Envie ou grave outro.');
        this._enableSend(blob, 'video');
      };
      
      this.mediaRecorder.start(1000); // chunk de 1s
      this.isCapturing = true;
      document.getElementById('catcap-btn-capture').style.display = 'none';
      document.getElementById('catcap-btn-stop').style.display = 'inline-block';
      document.getElementById('catcap-btn-record').textContent = 'Gravando...';
      document.getElementById('catcap-btn-record').classList.add('recording');
      this._updateStatus('Gravando video... Clique em PARAR quando terminar.');
    },

    /**
     * Para a gravacao
     */
    stopVideo: function() {
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
      this.isCapturing = false;
      document.getElementById('catcap-btn-capture').style.display = 'inline-block';
      document.getElementById('catcap-btn-stop').style.display = 'none';
      document.getElementById('catcap-btn-record').textContent = 'Gravar video';
      document.getElementById('catcap-btn-record').classList.remove('recording');
    },

    /**
     * Envia a midia capturada
     */
    send: function() {
      const blob = this._currentBlob;
      const type = this._currentType;
      const caption = document.getElementById('catcap-caption');
      const legend = caption ? caption.value : '';
      
      if (!blob) return;
      
      // Opcao 1: WhatsApp (sempre funciona)
      const whatsappText = legend ? encodeURIComponent(legend) : '';
      const whatsappUrl = `https://wa.me/5568992269296?text=${whatsappText}`;
      
      // Opcao 2: Upload direto (se backend suportar)
      const uploadUrl = './api/upload'; // futuro
      
      // Por agora: WhatsApp
      this._updateStatus('Abrindo WhatsApp...');
      window.open(whatsappUrl, '_blank');
      
      // Limpa e fecha
      setTimeout(() => {
        alert('Obrigado! Sua ' + type + ' sera analisada pela nossa equipe editorial.');
        this.close();
      }, 1500);
    },

    /**
     * Habiiita botao de enviar
     */
    _enableSend: function(blob, type) {
      this._currentBlob = blob;
      this._currentType = type;
      const btn = document.getElementById('catcap-btn-send');
      if (btn) btn.disabled = false;
    },

    /**
     * Atualiza status text
     */
    _updateStatus: function(msg) {
      const el = document.getElementById('catcap-status');
      if (el) el.textContent = msg;
    },

    /**
     * Mostra fallback do WhatsApp
     */
    _showWhatsAppFallback: function() {
      const wrap = document.getElementById('catcap-video-wrap');
      if (wrap) {
        wrap.innerHTML = `
          <div style="text-align:center;padding:2rem;">
            <p style="color:#fff;margin-bottom:1rem;">Camera nao disponivel neste dispositivo.</p>
            <p style="color:#fff;margin-bottom:1.5rem;">Envie sua foto ou video diretamente pelo WhatsApp:</p>
            <a href="https://wa.me/5568992269296?text=Tenho%20uma%20foto%20ou%20video%20para%20o%20Catalogo"
               target="_blank"
               class="catcap-btn catcap-btn-whatsapp">
              Enviar por WhatsApp
            </a>
          </div>
        `;
      }
    },

    /**
     * Cria a UI do captura
     */
    _createUI: function(initialMode) {
      // Remove se ja existir
      this._removeUI();
      
      const html = `
      <div id="catcap-overlay">
        <div id="catcap-modal">
          <div id="catcap-header">
            <span id="catcap-title">Catalogo Capture</span>
            <button id="catcap-btn-close" onclick="CatalogoCapture.close()">&times;</button>
          </div>
          
          <div id="catcap-mode-select" ${initialMode ? 'style="display:none"' : ''}>
            <p>Escolha o tipo de captura:</p>
            <button class="catcap-mode-btn" onclick="CatalogoCapture.open('photo')">
              <span class="catcap-mode-icon">📷</span>
              Foto
            </button>
            <button class="catcap-mode-btn" onclick="CatalogoCapture.open('video')">
              <span class="catcap-mode-icon">🎥</span>
              Video
            </button>
          </div>
          
          <div id="catcap-video-wrap" style="display:none">
            <video id="catcap-video" autoplay playsinline muted></video>
          </div>
          
          <canvas id="catcap-canvas" style="display:none"></canvas>
          
          <img id="catcap-preview" style="display:none" alt="Preview" />
          
          <div id="catcap-controls" data-state="idle">
            <p id="catcap-status">Acessando camera...</p>
            <div id="catcap-btn-group">
              <button id="catcap-btn-capture" class="catcap-btn" onclick="CatalogoCapture.capturePhoto()" style="display:none">
                📷 Capturar Foto
              </button>
              <button id="catcap-btn-record" class="catcap-btn catcap-btn-record" onclick="CatalogoCapture.startVideo()" style="display:none">
                🔴 Gravar Video
              </button>
              <button id="catcap-btn-stop" class="catcap-btn catcap-btn-stop" onclick="CatalogoCapture.stopVideo()" style="display:none">
                ⏹ Parar
              </button>
            </div>
            <div id="catcap-preview-controls" style="display:none">
              <textarea id="catcap-caption" placeholder="Legenda (opcional)..." rows="2"></textarea>
              <div class="catcap-btn-row">
                <button class="catcap-btn catcap-btn-secondary" onclick="CatalogoCapture.retake()">
                  Refazer
                </button>
                <button id="catcap-btn-send" class="catcap-btn catcap-btn-primary" onclick="CatalogoCapture.send()" disabled>
                  Enviar
                </button>
              </div>
            </div>
          </div>
          
          <div id="catcap-footer">
            <small>Sua midia fica apenas entre nos. Never share without permission.</small>
          </div>
        </div>
      </div>
      
      <style>
      #catcap-overlay {
        position:fixed;top:0;left:0;right:0;bottom:0;
        background:rgba(0,0,0,0.92);
        z-index:999999;
        display:flex;align-items:center;justify-content:center;
        font-family:system-ui,-apple-system,sans-serif;
      }
      #catcap-modal {
        background:#1a1a1a;
        border-radius:16px;
        width:min(480px,95vw);
        max-height:95vh;
        overflow-y:auto;
        box-shadow:0 20px 60px rgba(0,0,0,0.5);
      }
      #catcap-header {
        display:flex;justify-content:space-between;align-items:center;
        padding:16px 20px;
        border-bottom:1px solid #333;
        color:#D4AF37;
        font-weight:700;
        font-size:1.1rem;
      }
      #catcap-btn-close {
        background:none;border:none;color:#fff;font-size:1.5rem;cursor:pointer;
        padding:4px 8px;border-radius:4px;
      }
      #catcap-btn-close:hover { background:#333; }
      #catcap-mode-select {
        padding:2rem;text-align:center;
      }
      #catcap-mode-select p { color:#ccc;margin-bottom:1.5rem;font-size:1.1rem; }
      .catcap-mode-btn {
        background:#2d2d2d;border:2px solid #D4AF37;
        color:#D4AF37;padding:1.5rem 2rem;margin:0.5rem;
        border-radius:12px;font-size:1.1rem;cursor:pointer;
        display:inline-flex;flex-direction:column;align-items:center;gap:0.5rem;
        min-width:140px;
      }
      .catcap-mode-btn:hover { background:#D4AF37;color:#1a1a1a; }
      .catcap-mode-icon { font-size:2rem; }
      #catcap-video-wrap {
        position:relative;
        background:#000;
      }
      #catcap-video {
        width:100%;display:block;
        border-radius:12px 12px 0 0;
      }
      #catcap-preview {
        width:100%;display:block;
        border-radius:12px 12px 0 0;
        object-fit:cover;
        max-height:60vh;
      }
      #catcap-controls {
        padding:1rem 1.5rem;
      }
      #catcap-status {
        color:#ccc;font-size:0.9rem;text-align:center;margin-bottom:1rem;min-height:1.4em;
      }
      #catcap-btn-group {
        display:flex;gap:0.75rem;justify-content:center;flex-wrap:wrap;
      }
      .catcap-btn {
        background:#2d2d2d;border:none;color:#fff;
        padding:0.75rem 1.5rem;border-radius:8px;
        font-size:1rem;cursor:pointer;font-weight:600;
        display:inline-flex;align-items:center;gap:0.5rem;
        transition:background 0.2s;
      }
      .catcap-btn:hover { background:#3d3d3d; }
      .catcap-btn:disabled { opacity:0.4;cursor:not-allowed; }
      .catcap-btn-primary { background:#D4AF37;color:#1a1a1a; }
      .catcap-btn-primary:hover { background:#c9a030; }
      .catcap-btn-primary:disabled { background:#555;color:#888; }
      .catcap-btn-secondary { background:#444;color:#ccc; }
      .catcap-btn-record { background:#c00;color:#fff; }
      .catcap-btn-record:hover { background:#a00; }
      .catcap-btn-record.recording { animation:pulse 1s infinite; }
      .catcap-btn-stop { background:#555;color:#fff; }
      .catcap-btn-whatsapp { background:#25D366;color:#fff;padding:1rem 2rem;font-size:1.1rem; }
      .catcap-btn-whatsapp:hover { background:#1fb855; }
      #catcap-btn-stop { display:none; }
      #catcap-preview-controls { display:none;margin-top:1rem; }
      #catcap-preview-controls.show { display:block; }
      #catcap-caption {
        width:100%;background:#2d2d2d;border:1px solid #444;
        color:#fff;padding:0.75rem;border-radius:8px;
        font-family:inherit;font-size:0.95rem;resize:none;
        box-sizing:border-box;
      }
      #catcap-caption:focus { outline:2px solid #D4AF37; }
      .catcap-btn-row { display:flex;gap:0.75rem;margin-top:0.75rem; }
      .catcap-btn-row .catcap-btn { flex:1;justify-content:center; }
      #catcap-footer {
        padding:0.75rem 1.5rem;
        border-top:1px solid #333;
        text-align:center;
      }
      #catcap-footer small { color:#666;font-size:0.8rem; }
      [data-state="preview"] #catcap-btn-group { display:none; }
      [data-state="preview"] #catcap-preview-controls { display:block; }
      @keyframes pulse {
        0%,100% { opacity:1; }
        50% { opacity:0.6; }
      }
      @media (max-width:480px) {
        .catcap-mode-btn { padding:1rem 1.5rem;font-size:1rem; }
        .catcap-mode-icon { font-size:1.5rem; }
      }
      </style>
      `;
      
      document.body.insertAdjacentHTML('beforeend', html);
      
      // Mostra botao correto baseado no modo
      if (initialMode === 'photo') {
        document.getElementById('catcap-btn-capture').style.display = 'inline-block';
        document.getElementById('catcap-btn-record').style.display = 'none';
      } else if (initialMode === 'video') {
        document.getElementById('catcap-btn-capture').style.display = 'none';
        document.getElementById('catcap-btn-record').style.display = 'inline-block';
      }
    },

    /**
     * Remove a UI
     */
    _removeUI: function() {
      const overlay = document.getElementById('catcap-overlay');
      if (overlay) overlay.remove();
    },

    /**
     * Refaz a captura
     */
    retake: function() {
      const preview = document.getElementById('catcap-preview');
      const videoWrap = document.getElementById('catcap-video-wrap');
      const controls = document.getElementById('catcap-controls');
      const previewControls = document.getElementById('catcap-preview-controls');
      
      preview.style.display = 'none';
      preview.src = '';
      videoWrap.style.display = 'block';
      controls.dataset.state = 'idle';
      
      const btn = document.getElementById('catcap-btn-send');
      if (btn) btn.disabled = true;
      
      this._currentBlob = null;
      this._currentType = null;
      
      this._updateStatus('Pronto. Capture novamente.');
    },

    _currentBlob: null,
    _currentType: null
  };

  // Auto-inicializa se detectar elemento com data-capture
  document.addEventListener('DOMContentLoaded', () => {
    const trigger = document.querySelector('[data-capture]');
    if (trigger) {
      trigger.addEventListener('click', () => CatalogoCapture.open());
    }
  });

})();
