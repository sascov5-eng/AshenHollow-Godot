export type Sheet = { img: HTMLImageElement; cols: number; rows: number };

export type Art = {
  warden: Record<string, Sheet>;
  gloommite: Record<string, Sheet>;
  veilfly: Record<string, Sheet>;
  sentinel: Record<string, Sheet>;
  fx: Record<string, Sheet>;
  sky: HTMLImageElement;
  far: HTMLImageElement;
  mid: HTMLImageElement;
  near: HTMLImageElement;
  floor: HTMLImageElement;
  wall: HTMLImageElement;
  platform: HTMLImageElement;
  spikes: HTMLImageElement;
  bench: HTMLImageElement;
  door: HTMLImageElement;
  lantern: HTMLImageElement;
  moss: HTMLImageElement;
  crystal: HTMLImageElement;
  bones: HTMLImageElement;
  portrait: HTMLImageElement;
};

function assetUrl(path: string) {
  const clean = path.replace(/^\//, "");
  try {
    return new URL(clean, document.baseURI).href;
  } catch {
    const base = import.meta.env.BASE_URL || "/";
    return `${base.endsWith("/") ? base : `${base}/`}${clean}`;
  }
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    if (/^https?:/i.test(src)) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`asset ${src}`));
    img.src = src;
  });
}

function sheet(img: HTMLImageElement, cols: number, rows: number): Sheet {
  return { img, cols, rows };
}

export async function loadArt(onProgress: (n: number) => void): Promise<Art> {
  const jobs: Array<[string, string]> = [
    ["wi", "/sprites/warden-idle.png"],
    ["wr", "/sprites/warden-run.png"],
    ["wj", "/sprites/warden-jump.png"],
    ["wd", "/sprites/warden-dash.png"],
    ["wa", "/sprites/warden-attack.png"],
    ["wh", "/sprites/warden-heal.png"],
    ["ww", "/sprites/warden-wall.png"],
    ["wu", "/sprites/warden-hurt.png"],
    ["wp", "/sprites/warden-portrait.png"],
    ["gi", "/sprites/gloommite-idle.png"],
    ["gw", "/sprites/gloommite-walk.png"],
    ["ga", "/sprites/gloommite-attack.png"],
    ["vh", "/sprites/veilfly-hover.png"],
    ["va", "/sprites/veilfly-attack.png"],
    ["si", "/sprites/sentinel-idle.png"],
    ["sw", "/sprites/sentinel-walk.png"],
    ["sa", "/sprites/sentinel-attack.png"],
    ["fs", "/sprites/fx-slash.png"],
    ["fi", "/sprites/fx-impact.png"],
    ["fh", "/sprites/fx-heal.png"],
    ["sky", "/map/sky.jpg"],
    ["far", "/map/far.jpg"],
    ["mid", "/map/mid.jpg"],
    ["near", "/map/near.jpg"],
    ["floor", "/map/floor.jpg"],
    ["wall", "/map/wall.jpg"],
    ["plat", "/map/platform.png"],
    ["spk", "/props/spikes.png"],
    ["ben", "/props/bench.png"],
    ["dor", "/props/door.png"],
    ["lan", "/props/lantern.png"],
    ["mos", "/props/moss.png"],
    ["cry", "/props/crystal.png"],
    ["bon", "/props/bones.png"],
  ];
  const map = new Map<string, HTMLImageElement>();
  let done = 0;
  await Promise.all(
    jobs.map(async ([k, src]) => {
      const img = await loadImage(assetUrl(src));
      map.set(k, img);
      done += 1;
      onProgress(done / jobs.length);
    }),
  );
  const g = (k: string) => {
    const img = map.get(k);
    if (!img) throw new Error(`missing ${k}`);
    return img;
  };
  return {
    warden: {
      idle: sheet(g("wi"), 2, 2),
      run: sheet(g("wr"), 3, 2),
      jump: sheet(g("wj"), 2, 2),
      dash: sheet(g("wd"), 2, 2),
      attack: sheet(g("wa"), 2, 2),
      heal: sheet(g("wh"), 2, 2),
      wall: sheet(g("ww"), 2, 2),
      hurt: sheet(g("wu"), 2, 2),
    },
    gloommite: {
      idle: sheet(g("gi"), 2, 2),
      walk: sheet(g("gw"), 2, 2),
      attack: sheet(g("ga"), 2, 2),
    },
    veilfly: {
      hover: sheet(g("vh"), 2, 2),
      attack: sheet(g("va"), 2, 2),
    },
    sentinel: {
      idle: sheet(g("si"), 2, 2),
      walk: sheet(g("sw"), 2, 2),
      attack: sheet(g("sa"), 2, 2),
    },
    fx: {
      slash: sheet(g("fs"), 2, 2),
      impact: sheet(g("fi"), 2, 2),
      heal: sheet(g("fh"), 2, 2),
    },
    sky: g("sky"),
    far: g("far"),
    mid: g("mid"),
    near: g("near"),
    floor: g("floor"),
    wall: g("wall"),
    platform: g("plat"),
    spikes: g("spk"),
    bench: g("ben"),
    door: g("dor"),
    lantern: g("lan"),
    moss: g("mos"),
    crystal: g("cry"),
    bones: g("bon"),
    portrait: g("wp"),
  };
}

export function drawSheet(
  ctx: CanvasRenderingContext2D,
  sheet: Sheet,
  frame: number,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  flip: boolean,
  alpha = 1,
) {
  const cols = sheet.cols;
  const rows = sheet.rows;
  const n = cols * rows;
  const f = ((frame % n) + n) % n;
  const cw = sheet.img.width / cols;
  const ch = sheet.img.height / rows;
  const c = f % cols;
  const r = Math.floor(f / cols);
  ctx.save();
  ctx.globalAlpha = alpha;
  if (flip) {
    ctx.translate(dx + dw, dy);
    ctx.scale(-1, 1);
    ctx.drawImage(sheet.img, c * cw, r * ch, cw, ch, 0, 0, dw, dh);
  } else {
    ctx.drawImage(sheet.img, c * cw, r * ch, cw, ch, dx, dy, dw, dh);
  }
  ctx.restore();
}

export function animFrame(t: number, n: number, fps: number, ping = true) {
  if (n <= 1) return 0;
  if (!ping) return Math.floor(t * fps) % n;
  const cycle = Math.max(2, n * 2 - 2);
  const i = Math.floor(t * fps) % cycle;
  return i < n ? i : cycle - i;
}

