const { useState, useEffect, useCallback } = React;

/* ════════════════════════════════════════════
   SUPABASE — conexión directa sin SDK
   Proyecto: szduhcxwmxuvkdjxjjkg
════════════════════════════════════════════ */
const SB_URL  = "https://szduhcxwmxuvkdjxjjkg.supabase.co";
const SB_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6ZHVoY3h3bXh1dmtkanhqamtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NDUxNTYsImV4cCI6MjA5MjUyMTE1Nn0.XXdFEeUi7wiJGB7YnphhBBI1YwT_4MiJVVxNgIJPxF0";

function hdr(token) {
  return {
    "Content-Type": "application/json",
    "apikey": SB_ANON,
    "Authorization": `Bearer ${token || SB_ANON}`,
  };
}

const sb = {
  async adminSignIn(email, password) {
    const r = await fetch(`${SB_URL}/auth/v1/token?grant_type=password`, {
      method: "POST", headers: hdr(),
      body: JSON.stringify({ email, password }),
    });
    return r.json();
  },
  async adminSignOut(token) {
    await fetch(`${SB_URL}/auth/v1/logout`, { method: "POST", headers: hdr(token) });
  },
  async checkEmail(email) {
    const r = await fetch(
      `${SB_URL}/rest/v1/allowed_emails?email=eq.${encodeURIComponent(email)}&select=email,name`,
      { headers: hdr() }
    );
    const d = await r.json();
    return Array.isArray(d) && d.length > 0 ? d[0] : null;
  },
  async getVideos() {
    const r = await fetch(
      `${SB_URL}/rest/v1/videos?is_published=eq.true&order=order_index.asc,created_at.asc`,
      { headers: hdr() }
    );
    return r.json();
  },
  async getAllVideos(token) {
    const r = await fetch(
      `${SB_URL}/rest/v1/videos?order=order_index.asc,created_at.asc`,
      { headers: hdr(token) }
    );
    return r.json();
  },
  async insertVideo(data, token) {
    const r = await fetch(`${SB_URL}/rest/v1/videos`, {
      method: "POST",
      headers: { ...hdr(token), "Prefer": "return=representation" },
      body: JSON.stringify(data),
    });
    return r.json();
  },
  async updateVideo(id, data, token) {
    const r = await fetch(`${SB_URL}/rest/v1/videos?id=eq.${id}`, {
      method: "PATCH",
      headers: { ...hdr(token), "Prefer": "return=representation" },
      body: JSON.stringify(data),
    });
    return r.json();
  },
  async deleteVideo(id, token) {
    await fetch(`${SB_URL}/rest/v1/videos?id=eq.${id}`, {
      method: "DELETE", headers: hdr(token),
    });
  },
  async recordView(videoId, email) {
    await fetch(`${SB_URL}/rest/v1/video_views`, {
      method: "POST", headers: hdr(),
      body: JSON.stringify({ video_id: videoId, email: email || null }),
    });
  },
  async getVideoStats(token) {
    const r = await fetch(`${SB_URL}/rest/v1/rpc/get_video_stats`, {
      method: "POST", headers: hdr(token), body: "{}",
    });
    return r.json();
  },
  async getAllowedEmails(token) {
    const r = await fetch(
      `${SB_URL}/rest/v1/allowed_emails?order=created_at.desc`,
      { headers: hdr(token) }
    );
    return r.json();
  },
  async insertAllowedEmail(email, name, token) {
    const r = await fetch(`${SB_URL}/rest/v1/allowed_emails`, {
      method: "POST",
      headers: { ...hdr(token), "Prefer": "return=representation" },
      body: JSON.stringify({ email: email.toLowerCase().trim(), name: name || null }),
    });
    return r.json();
  },
  async deleteAllowedEmail(email, token) {
    await fetch(`${SB_URL}/rest/v1/allowed_emails?email=eq.${encodeURIComponent(email)}`, {
      method: "DELETE", headers: hdr(token),
    });
  },
  async bulkInsertEmails(rows, token) {
    const r = await fetch(`${SB_URL}/rest/v1/allowed_emails`, {
      method: "POST",
      headers: { ...hdr(token), "Prefer": "resolution=ignore-duplicates,return=representation" },
      body: JSON.stringify(rows),
    });
    return r.json();
  },
};

/* ════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════ */
function extractYtId(url) {
  const ps = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of ps) { const m = url.match(p); if (m) return m[1]; }
  return null;
}

function useSaved(key, init) {
  const [v, setV] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : init; }
    catch { return init; }
  });
  const set = useCallback(val => {
    setV(val);
    if (val === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(val));
  }, [key]);
  return [v, set];
}

function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3200); return () => clearTimeout(t); }, []);
  return <div className={`toast ${type||""}`}>{msg}</div>;
}

function Nav({ userEmail, isAdmin, adminMode, onLogout, goAdmin, goVideos }) {
  return (
    <nav className="nav">
      <div className="nav-brand">
        <div className="nav-icon">🎓</div>
        <span className="nav-title">Programa Ejecutivo en Marketing y Gestión de un Club Internacional</span>
      </div>
      <div className="nav-right">
        {userEmail && <span className="nav-user">👤 {userEmail}</span>}
        {isAdmin && !adminMode && <button className="btn-nav ghost" onClick={goAdmin}>⚙ Admin</button>}
        {adminMode && <button className="btn-nav ghost" onClick={goVideos}>← Volver</button>}
        {userEmail && <button className="btn-nav" onClick={onLogout}>Salir</button>}
      </div>
    </nav>
  );
}

function AuthPage({ onUserAccess, onAdminAccess }) {
  const [tab, setTab] = useState("user");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function submitUser(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const found = await sb.checkEmail(email.toLowerCase().trim());
      if (!found) {
        setErr("Este email no está registrado en el programa. Contactá al administrador.");
        return;
      }
      onUserAccess({ email: email.toLowerCase().trim(), name: found.name });
    } finally {
      setLoading(false);
    }
  }

  async function submitAdmin(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const res = await sb.adminSignIn(email, pass);
      if (res.error) {
        setErr("Credenciales incorrectas.");
        return;
      }
      onAdminAccess(res);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">🎓</div>
        <h2>{tab === "user" ? "Acceder al programa" : "Acceso administradores"}</h2>
        <p>
          {tab === "user"
            ? "Ingresá tu email. Si estás registrado en el programa, accedés directo."
            : "Acceso exclusivo para administradores del programa."}
        </p>

        {tab === "user" ? (
          <form onSubmit={submitUser}>
            <div className="fg">
              <label>Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                autoFocus
              />
            </div>
            {err && <div className="form-err">⚠️ {err}</div>}
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Verificando…" : "Ingresar →"}
            </button>
          </form>
        ) : (
          <form onSubmit={submitAdmin}>
            <div className="fg">
              <label>Email de administrador</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@email.com" required autoFocus />
            </div>
            <div className="fg">
              <label>Contraseña</label>
              <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" required />
            </div>
            {err && <div className="form-err">⚠️ {err}</div>}
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Ingresando…" : "Ingresar como admin →"}
            </button>
          </form>
        )}

        <div className="auth-switch">
          {tab === "user"
            ? <button onClick={() => { setTab("admin"); setErr(""); setEmail(""); setPass(""); }}>Soy administrador</button>
            : <button onClick={() => { setTab("user"); setErr(""); setEmail(""); setPass(""); }}>← Volver al acceso de participantes</button>
          }
        </div>
      </div>
    </div>
  );
}

function VideoPlayer({ video, userEmail, onClose }) {
  const playerRef  = React.useRef(null);
  const iframeId   = "yt-iframe-" + video.id.replace(/-/g,"").slice(0,8);
  const tickRef    = React.useRef(null);
  const modalRef   = React.useRef(null);
  const chromeTimerRef = React.useRef(null);

  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [vol, setVol] = useState(80);
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPseudoFS, setIsPseudoFS] = useState(false);
  const [chromeVisible, setChromeVisible] = useState(true);

  const fullScreenActive = isFullscreen || isPseudoFS;

  function fmt(s) {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2,"0")}`;
  }

  async function lockLandscape() {
    try {
      if (window.matchMedia("(max-width: 900px)").matches && screen.orientation?.lock) {
        await screen.orientation.lock("landscape");
      }
    } catch (_) {}
  }

  function unlockOrientation() {
    try { screen.orientation?.unlock?.(); } catch (_) {}
  }

  function clearChromeTimer() {
    if (chromeTimerRef.current) {
      clearTimeout(chromeTimerRef.current);
      chromeTimerRef.current = null;
    }
  }

  function scheduleChromeHide() {
    clearChromeTimer();
    if (!fullScreenActive) return;
    chromeTimerRef.current = setTimeout(() => {
      setChromeVisible(false);
    }, 1800);
  }

  function showChromeTemporarily() {
    if (!fullScreenActive) return;
    setChromeVisible(true);
    scheduleChromeHide();
  }

  useEffect(() => {
    sb.recordView(video.id, userEmail);
    document.body.style.overflow = "hidden";

    const prevent = e => e.preventDefault();
    const syncFS = () => {
      const activeEl = document.fullscreenElement || document.webkitFullscreenElement || null;
      setIsFullscreen(activeEl === modalRef.current);
      if (!activeEl) unlockOrientation();
    };
    const esc = e => {
      if (e.key === "Escape") {
        const pseudoFsActive = modalRef.current?.classList.contains("player-modal-pseudo-fs");
        if (document.fullscreenElement || document.webkitFullscreenElement || pseudoFsActive) exitFS();
        else onClose();
      }
    };

    document.addEventListener("contextmenu", prevent);
    document.addEventListener("keydown", esc);
    document.addEventListener("fullscreenchange", syncFS);
    document.addEventListener("webkitfullscreenchange", syncFS);

    function initPlayer() {
      playerRef.current = new window.YT.Player(iframeId, {
        events: {
          onReady(e) {
            e.target.setVolume(vol);
            e.target.playVideo();
            setDuration(e.target.getDuration());
          },
          onStateChange(e) {
            const YT = window.YT.PlayerState;
            if (e.data === YT.PLAYING) {
              setPlaying(true);
              setDuration(playerRef.current.getDuration());
              clearInterval(tickRef.current);
              tickRef.current = setInterval(() => {
                const c = playerRef.current?.getCurrentTime() || 0;
                const d = playerRef.current?.getDuration() || 1;
                setCurrent(c);
                setProgress((c / d) * 100);
              }, 500);
            } else {
              setPlaying(false);
              clearInterval(tickRef.current);
            }
          },
        },
      });
    }

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      if (!existing) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      clearInterval(tickRef.current);
      document.removeEventListener("contextmenu", prevent);
      document.removeEventListener("keydown", esc);
      document.removeEventListener("fullscreenchange", syncFS);
      document.removeEventListener("webkitfullscreenchange", syncFS);
      document.body.style.overflow = "";
      unlockOrientation();
      try { playerRef.current?.destroy(); } catch(e) {}
    };
  }, [video.id, userEmail]);

  useEffect(() => {
    if (fullScreenActive) {
      setChromeVisible(true);
      scheduleChromeHide();
    } else {
      clearChromeTimer();
      setChromeVisible(true);
    }

    return () => clearChromeTimer();
  }, [fullScreenActive]);

  function togglePlay() {
    if (!playerRef.current) return;
    playing ? playerRef.current.pauseVideo() : playerRef.current.playVideo();
  }

  function seek(e) {
    if (!playerRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    playerRef.current.seekTo(pct * duration, true);
    setProgress(pct * 100);
  }

  function skip(secs) {
    if (!playerRef.current) return;
    playerRef.current.seekTo((playerRef.current.getCurrentTime() || 0) + secs, true);
  }

  function changeVol(e) {
    const v = parseInt(e.target.value, 10);
    setVol(v);
    setMuted(v === 0);
    playerRef.current?.setVolume(v);
    playerRef.current?.unMute();
  }

  function toggleMute() {
    if (!playerRef.current) return;
    if (muted) {
      playerRef.current.unMute();
      playerRef.current.setVolume(vol || 80);
      setMuted(false);
    } else {
      playerRef.current.mute();
      setMuted(true);
    }
  }

  async function enterFS() {
    const el = modalRef.current;
    if (!el) return;

    const requestFS = el.requestFullscreen || el.webkitRequestFullscreen;
    if (requestFS) {
      try {
        await requestFS.call(el);
        await lockLandscape();
        return;
      } catch (_) {}
    }

    setIsPseudoFS(true);
    await lockLandscape();
  }

  async function exitFS() {
    const activeEl = document.fullscreenElement || document.webkitFullscreenElement || null;
    const exit = document.exitFullscreen || document.webkitExitFullscreen;

    if (activeEl && exit) {
      try { await exit.call(document); } catch (_) {}
    }

    setIsPseudoFS(false);
    unlockOrientation();
  }

  function toggleFS() {
    fullScreenActive ? exitFS() : enterFS();
  }

  const chromeClass = !fullScreenActive || chromeVisible ? "" : " player-ui-hidden";

  const params = new URLSearchParams({
    enablejsapi: "1",
    autoplay: "1",
    controls: "0",
    modestbranding: "1",
    rel: "0",
    showinfo: "0",
    iv_load_policy: "3",
    disablekb: "1",
    playsinline: "1",
    color: "white",
    origin: window.location.origin,
  }).toString();
  const src = `https://www.youtube-nocookie.com/embed/${video.youtube_id}?${params}`;

  const IconPlay = () => (
    <svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>
  );
  const IconPause = () => (
    <svg viewBox="0 0 24 24"><rect x="5" y="3" width="4" height="18" rx="1"/><rect x="15" y="3" width="4" height="18" rx="1"/></svg>
  );
  const IconBack = () => (
    <svg viewBox="0 0 24 24"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/><text x="9" y="15" fontSize="6" fill="white" fontWeight="bold">10</text></svg>
  );
  const IconFwd = () => (
    <svg viewBox="0 0 24 24"><path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/><text x="9" y="15" fontSize="6" fill="white" fontWeight="bold">10</text></svg>
  );
  const IconVolOn = () => (
    <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
  );
  const IconVolOff = () => (
    <svg viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
  );
  const IconFS = () => (
    <svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
  );
  const IconExitFS = () => (
    <svg viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>
  );

  return (
    <div className="player-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div
        className={`player-modal ${isPseudoFS ? "player-modal-pseudo-fs" : ""}`}
        ref={modalRef}
        onContextMenu={e => e.preventDefault()}
        onMouseMove={showChromeTemporarily}
        onTouchStart={showChromeTemporarily}
        onClick={showChromeTemporarily}
      >
        <div className={`player-topbar${chromeClass}`}>
          <div className="player-topbar-left">
            <span className="player-module-badge">Módulo {video.order_index}</span>
            <span className="player-title">{video.title}</span>
          </div>
          <button className="player-close" onClick={onClose} title="Cerrar (Esc)">✕</button>
        </div>

        <div className="player-video-wrap" onContextMenu={e => e.preventDefault()}>
          <iframe
            id={iframeId}
            src={src}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            title={video.title}
          />
          <div className="yt-cover-top" />
          <div className="yt-cover-bottom" />
        </div>

        <div className={`player-controls${chromeClass}`}>
          <div className="progress-row">
            <span className="time-lbl">{fmt(current)}</span>
            <div className="progress-track" onClick={seek}>
              <div className="progress-fill" style={{ width: progress + "%" }} />
            </div>
            <span className="time-lbl">{fmt(duration)}</span>
          </div>

          <div className="btns-row">
            <button className="cbtn lg" onClick={togglePlay} title={playing ? "Pausar" : "Reproducir"}>
              {playing ? <IconPause /> : <IconPlay />}
            </button>
            <button className="cbtn" onClick={() => skip(-10)} title="Retroceder 10s"><IconBack /></button>
            <button className="cbtn" onClick={() => skip(10)} title="Adelantar 10s"><IconFwd /></button>

            <div className="vol-wrap" style={{marginLeft:4}}>
              <button className="cbtn" onClick={toggleMute} title={muted ? "Activar sonido" : "Silenciar"}>
                {muted ? <IconVolOff /> : <IconVolOn />}
              </button>
              <input className="vol-slider" type="range" min="0" max="100" value={muted ? 0 : vol} onChange={changeVol} />
            </div>

            <div className="spacer" />

            <button className="cbtn" onClick={toggleFS} title={fullScreenActive ? "Salir de pantalla completa" : "Pantalla completa"}>
              {fullScreenActive ? <IconExitFS /> : <IconFS />}
            </button>
          </div>
        </div>

        {video.description && (
          <div className={`player-desc${chromeClass}`}>📄 {video.description}</div>
        )}
      </div>
    </div>
  );
}

function VideosPage({ userEmail }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(null);

  useEffect(() => {
    sb.getVideos()
      .then(v => setVideos(Array.isArray(v) ? v : []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="hero">
        <div className="hero-inner">
          <div className="hero-badge">🎬 Clases disponibles · {videos.length}</div>
          <h1>Contenido del Programa</h1>
          <p>Accedé a todas las clases del Programa Ejecutivo Unidad Velezana.</p>
        </div>
      </div>
      <div className="main">
        {loading ? <div className="spinner" /> : videos.length === 0 ? (
          <div className="empty"><div className="icon">🎬</div><p>Aún no hay videos publicados. Volvé pronto.</p></div>
        ) : (
          <div className="videos-grid">
            {videos.map((v, i) => (
              <div key={v.id} className="video-card" onClick={() => setPlaying(v)}>
                <div className="video-thumb">
                  <img src={`https://img.youtube.com/vi/${v.youtube_id}/hqdefault.jpg`} alt={v.title} onError={e => { e.target.style.display = "none"; }} />
                  <div className="play-overlay">
                    <div className="play-circle">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#0D2F6E"><polygon points="5,3 19,12 5,21" /></svg>
                    </div>
                  </div>
                </div>
                <div className="video-info">
                  <div className="video-num">Módulo {v.order_index || i + 1}</div>
                  <div className="video-title">{v.title}</div>
                  {v.description && <div className="video-desc">{v.description}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {playing && <VideoPlayer video={playing} userEmail={userEmail} onClose={() => setPlaying(null)} />}
    </>
  );
}

function VideoForm({ initial, token, onSave, onCancel }) {
  const [form, setForm] = useState({
    title:        initial?.title        || "",
    description:  initial?.description  || "",
    youtube_url:  initial?.youtube_url  || "",
    order_index:  initial?.order_index  || 1,
    is_published: initial?.is_published ?? true,
  });
  const [ytId, setYtId] = useState(initial?.youtube_id || "");
  const [saving, setSaving] = useState(false);
  const [urlErr, setUrlErr] = useState("");

  function changeUrl(url) {
    setForm(f => ({ ...f, youtube_url: url }));
    const id = extractYtId(url.trim());
    setYtId(id || "");
    setUrlErr(url && !id ? "URL de YouTube no reconocida" : "");
  }

  async function submit(e) {
    e.preventDefault();
    if (!ytId) { setUrlErr("Pegá un link válido de YouTube"); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        youtube_url: form.youtube_url,
        youtube_id: ytId,
        order_index: parseInt(form.order_index, 10) || 1,
        is_published: form.is_published,
      };
      if (initial?.id) await sb.updateVideo(initial.id, payload, token);
      else await sb.insertVideo(payload, token);
      onSave();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="add-form">
      <h3>{initial ? "✏️ Editar video" : "➕ Agregar video"}</h3>
      <form onSubmit={submit}>
        <div className="fg">
          <label>Link de YouTube (privado / no listado)</label>
          <input type="text" value={form.youtube_url} onChange={e => changeUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=XXXXXXXXXXX" required />
          {ytId && <div className="url-hint ok">✅ Video detectado — los usuarios nunca verán este link</div>}
          {urlErr && <div className="url-hint bad">⚠️ {urlErr}</div>}
        </div>
        <div className="form-row">
          <div className="fg">
            <label>Título del módulo</label>
            <input value={form.title} onChange={e => setForm(f => ({...f, title:e.target.value}))} placeholder="Módulo 1 – Estrategia Deportiva" required />
          </div>
          <div className="fg">
            <label>Orden</label>
            <input type="number" min="1" value={form.order_index} onChange={e => setForm(f => ({...f, order_index:e.target.value}))} />
          </div>
        </div>
        <div className="fg">
          <label>Descripción</label>
          <textarea value={form.description} onChange={e => setForm(f => ({...f, description:e.target.value}))} placeholder="Descripción breve del módulo…" />
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
          <input type="checkbox" id="pub" checked={form.is_published} onChange={e => setForm(f => ({...f, is_published:e.target.checked}))} style={{width:"auto",accentColor:"var(--blue-dark)"}} />
          <label htmlFor="pub" style={{marginBottom:0,fontWeight:600,fontSize:14}}>Publicado (visible para participantes)</label>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Guardando…" : initial ? "Guardar cambios" : "Agregar video"}</button>
          {onCancel && <button type="button" className="btn-secondary" onClick={onCancel}>Cancelar</button>}
        </div>
      </form>
    </div>
  );
}

function EmailsTab({ token, toast }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [bulk, setBulk] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [delTarget, setDelTarget] = useState(null);
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    const d = await sb.getAllowedEmails(token);
    setEmails(Array.isArray(d) ? d : []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function addOne(e) {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await sb.insertAllowedEmail(newEmail, newName, token);
      if (res?.code === "23505" || (Array.isArray(res) && res[0]?.code === "23505")) {
        toast("Ese email ya existe", "error");
        return;
      }
      toast("Email agregado", "success");
      setNewEmail("");
      setNewName("");
      load();
    } finally {
      setAdding(false);
    }
  }

  async function addBulk() {
    if (!bulk.trim()) return;
    setBulkLoading(true);
    try {
      const lines = bulk.trim().split("\n").map(l => l.trim()).filter(Boolean);
      const rows = lines.map(line => {
        const parts = line.split(/[,\t]+/);
        const email = parts[0]?.trim().toLowerCase();
        const name  = parts[1]?.trim() || null;
        return email ? { email, name } : null;
      }).filter(Boolean);

      if (rows.length === 0) {
        toast("No se detectaron emails válidos", "error");
        return;
      }

      await sb.bulkInsertEmails(rows, token);
      toast(`${rows.length} emails agregados (duplicados ignorados)`, "success");
      setBulk("");
      load();
    } finally {
      setBulkLoading(false);
    }
  }

  async function doDelete(email) {
    await sb.deleteAllowedEmail(email, token);
    toast("Email eliminado", "success");
    setDelTarget(null);
    load();
  }

  const filtered = emails.filter(e =>
    e.email.includes(search.toLowerCase()) ||
    (e.name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="sec-title">Agregar email individual</div>
      <div className="add-form">
        <form onSubmit={addOne}>
          <div className="form-row">
            <div className="fg">
              <label>Email del participante</label>
              <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="socio@gmail.com" required />
            </div>
            <div className="fg">
              <label>Nombre (opcional)</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Juan Pérez" />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={adding}>{adding ? "Agregando…" : "Agregar email"}</button>
          </div>
        </form>
      </div>

      <div className="sec-title">Cargar lista masiva de emails</div>
      <div className="add-form">
        <textarea
          className="bulk-area"
          value={bulk}
          onChange={e => setBulk(e.target.value)}
          placeholder={`Pegá uno por línea. Formatos aceptados:\nsocio1@gmail.com\nsocio2@gmail.com, Juan Pérez\nsocio3@gmail.com`}
        />
        <p className="bulk-hint">Cada línea = un email. Podés incluir nombre separado por coma. Los duplicados se ignoran automáticamente.</p>
        <div className="form-actions" style={{marginTop:14}}>
          <button className="btn-primary" onClick={addBulk} disabled={bulkLoading || !bulk.trim()} style={{width:"auto",padding:"10px 26px"}}>
            {bulkLoading ? "Cargando…" : "Cargar lista"}
          </button>
        </div>
      </div>

      <div className="sec-hdr" style={{marginTop:28}}>
        <div className="sec-title" style={{margin:0}}>Emails habilitados ({emails.length})</div>
        <input
          style={{padding:"8px 14px",border:"2px solid var(--border)",borderRadius:10,fontSize:13,fontFamily:"inherit",outline:"none",width:"min(220px, 100%)"}}
          placeholder="Buscar…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? <div className="spinner" /> : filtered.length === 0 ? (
        <div className="empty"><div className="icon">📧</div><p>No hay emails registrados aún.</p></div>
      ) : (
        <div style={{overflowX:"auto"}}>
          <table className="data-table">
            <thead><tr><th>Email</th><th>Nombre</th><th>Agregado</th><th></th></tr></thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.email}>
                  <td>{e.email}</td>
                  <td>{e.name || <span style={{color:"var(--muted)"}}>—</span>}</td>
                  <td>{new Date(e.created_at).toLocaleDateString("es-AR")}</td>
                  <td><button className="btn-sm danger" onClick={() => setDelTarget(e.email)}>🗑 Eliminar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {delTarget && (
        <div className="confirm-backdrop">
          <div className="confirm-box">
            <h3>¿Eliminar email?</h3>
            <p><strong>{delTarget}</strong> ya no podrá acceder al programa.</p>
            <div className="confirm-actions">
              <button className="btn-secondary" onClick={() => setDelTarget(null)}>Cancelar</button>
              <button className="btn-danger" onClick={() => doDelete(delTarget)}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function AdminPanel({ token, adminEmail, toast }) {
  const [tab, setTab] = useState("videos");
  const [videos, setVideos] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [delVideo, setDelVideo] = useState(null);

  async function loadVideos() {
    setLoading(true);
    const [v, s] = await Promise.all([
      sb.getAllVideos(token),
      sb.getVideoStats(token),
    ]);
    setVideos(Array.isArray(v) ? v : []);
    setStats(Array.isArray(s) ? s : []);
    setLoading(false);
  }

  useEffect(() => {
    if (tab !== "emails") loadVideos();
    else setLoading(false);
  }, [tab]);

  async function doDeleteVideo(id) {
    await sb.deleteVideo(id, token);
    toast("Video eliminado", "success");
    setDelVideo(null);
    loadVideos();
  }

  const totalViews = stats.reduce((a, s) => a + Number(s.view_count || 0), 0);
  const publishedVids = videos.filter(v => v.is_published).length;

  return (
    <div className="main">
      <div className="sec-hdr">
        <h2>Panel de Administración</h2>
        <span style={{fontSize:13,color:"var(--muted)"}}>👋 {adminEmail}</span>
      </div>

      <div className="stats-row">
        <div className="stat-card"><div className="stat-num">{videos.length}</div><div className="stat-label">Videos</div></div>
        <div className="stat-card"><div className="stat-num">{publishedVids}</div><div className="stat-label">Publicados</div></div>
        <div className="stat-card"><div className="stat-num">{totalViews}</div><div className="stat-label">Reproducciones</div></div>
      </div>

      <div className="admin-tabs">
        {[["videos","🎬 Videos"],["stats","📊 Estadísticas"],["emails","📧 Emails habilitados"]].map(([t,l]) => (
          <button key={t} className={`admin-tab ${tab===t?"active":""}`} onClick={() => { setTab(t); setAdding(false); setEditing(null); }}>{l}</button>
        ))}
      </div>

      {tab === "videos" && (
        loading ? <div className="spinner" /> : <>
          {!adding && !editing && (
            <button className="btn-primary" style={{width:"auto",padding:"10px 24px",marginBottom:24}} onClick={() => setAdding(true)}>
              + Agregar video
            </button>
          )}
          {adding && <VideoForm token={token} onSave={() => { setAdding(false); loadVideos(); toast("Video guardado","success"); }} onCancel={() => setAdding(false)} />}
          {editing && <VideoForm token={token} initial={editing} onSave={() => { setEditing(null); loadVideos(); toast("Video actualizado","success"); }} onCancel={() => setEditing(null)} />}
          {!adding && !editing && (
            <div className="video-list">
              {videos.length === 0 && <div className="empty"><div className="icon">🎬</div><p>No hay videos. Agregá el primero.</p></div>}
              {videos.map(v => {
                const st = stats.find(s => s.video_id === v.id);
                return (
                  <div key={v.id} className="video-row">
                    <div className="vr-order">{v.order_index}</div>
                    <div className="vr-info">
                      <div className="vr-title">{v.title} {!v.is_published && <span className="vr-badge">No publicado</span>}</div>
                      <div className="vr-sub">ID: {v.youtube_id}</div>
                    </div>
                    <div className="vr-views">👁 {st?.view_count||0}</div>
                    <div className="vr-actions">
                      <button className="btn-sm" onClick={() => { setEditing(v); setAdding(false); }}>✏️ Editar</button>
                      <button className="btn-sm danger" onClick={() => setDelVideo(v)}>🗑 Borrar</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === "stats" && (
        loading ? <div className="spinner" /> : <>
          <div className="sec-title">Reproducciones por video</div>
          {stats.length === 0
            ? <div className="empty"><div className="icon">📊</div><p>Sin datos aún.</p></div>
            : <div style={{overflowX:"auto"}}>
                <table className="data-table">
                  <thead><tr><th>Video</th><th>Reproducciones</th><th>Espectadores únicos</th><th>Última vista</th></tr></thead>
                  <tbody>
                    {stats.map(s => (
                      <tr key={s.video_id}>
                        <td><strong>{s.title}</strong></td>
                        <td>{s.view_count}</td>
                        <td>{s.unique_viewers}</td>
                        <td>{s.last_viewed ? new Date(s.last_viewed).toLocaleDateString("es-AR") : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          }
        </>
      )}

      {tab === "emails" && <EmailsTab token={token} toast={toast} />}

      {delVideo && (
        <div className="confirm-backdrop">
          <div className="confirm-box">
            <h3>¿Eliminar video?</h3>
            <p>Se eliminará <strong>"{delVideo.title}"</strong> y todas sus estadísticas. Esta acción no se puede deshacer.</p>
            <div className="confirm-actions">
              <button className="btn-secondary" onClick={() => setDelVideo(null)}>Cancelar</button>
              <button className="btn-danger" onClick={() => doDeleteVideo(delVideo.id)}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  const [adminSession, setAdminSession] = useSaved("vz_admin", null);
  const [userSession, setUserSession] = useSaved("vz_user", null);
  const [view, setView] = useState("videos");
  const [toast, setToast] = useState(null);

  function showToast(msg, type="default") { setToast({ msg, type, k: Date.now() }); }

  const isAdmin = !!adminSession?.access_token;
  const isUser = !!userSession?.email;
  const loggedIn = isAdmin || isUser;
  const userEmail = isAdmin ? adminSession?.user?.email : userSession?.email;

  function onUserAccess(data) { setUserSession(data); }
  function onAdminAccess(res) { setAdminSession(res); }

  async function onLogout() {
    if (isAdmin && adminSession?.access_token) await sb.adminSignOut(adminSession.access_token);
    setAdminSession(null);
    setUserSession(null);
    setView("videos");
  }

  return (
    <>
      <Nav
        userEmail={userEmail}
        isAdmin={isAdmin}
        adminMode={view === "admin"}
        onLogout={onLogout}
        goAdmin={() => setView("admin")}
        goVideos={() => setView("videos")}
      />

      {!loggedIn && (
        <AuthPage onUserAccess={onUserAccess} onAdminAccess={onAdminAccess} />
      )}

      {loggedIn && view === "videos" && (
        <VideosPage userEmail={userEmail} />
      )}

      {loggedIn && view === "admin" && isAdmin && (
        <AdminPanel token={adminSession.access_token} adminEmail={userEmail} toast={showToast} />
      )}

      {loggedIn && view === "admin" && !isAdmin && (
        <div className="main">
          <div className="empty"><div className="icon">🔒</div><p>No tenés permisos de administrador.</p></div>
        </div>
      )}

      {toast && <Toast key={toast.k} msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
