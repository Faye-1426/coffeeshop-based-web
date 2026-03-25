type MenuImageOptions = {
  label: string;
  bg: string; // CSS color
  fg?: string; // CSS color
  icon?: "coffee" | "milk" | "snack" | "meal";
};

function svgDataUri(svg: string): string {
  // Using utf8 + encodeURIComponent keeps it bundler-agnostic for Vite.
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function iconSvg(icon: MenuImageOptions["icon"], fg: string): string {
  const common = `fill="${fg}"`;
  switch (icon) {
    case "coffee":
      return `
        <path ${common} d="M64 44c0-8 6-14 14-14h44c8 0 14 6 14 14v12h2c10 0 18 8 18 18v10c0 10-8 18-18 18h-2c-1 21-19 38-40 38H78c-21 0-39-17-40-38h-2c-10 0-18-8-18-18V74c0-10 8-18 18-18h2V44z"/>
        <path ${common} d="M132 112c0-8-6-14-14-14h-10v16c0 4 3 7 7 7h13z" opacity="0.85"/>
        <path ${common} d="M76 142c6 10 18 16 32 16s26-6 32-16H76z" opacity="0.75"/>
      `;
    case "milk":
      return `
        <path ${common} d="M74 40c0-8 6-14 14-14h36c8 0 14 6 14 14v12c0 8-6 14-14 14h-36c-8 0-14-6-14-14V40z"/>
        <path ${common} d="M56 80c0-8 6-14 14-14h64c8 0 14 6 14 14v70c0 12-10 22-22 22H78c-12 0-22-10-22-22V80z"/>
        <path ${common} d="M92 94h20v20h-20z" opacity="0.8"/>
      `;
    case "snack":
      return `
        <path ${common} d="M70 74c0-18 14-32 32-32h96v64c0 42-34 76-76 76h-24c-18 0-28-16-28-34V74z"/>
        <path ${common} d="M196 42c14 6 22 20 22 36v10h-22V42z" opacity="0.8"/>
        <circle cx="102" cy="124" r="10" ${common} opacity="0.85"/>
        <circle cx="142" cy="112" r="8" ${common} opacity="0.75"/>
      `;
    case "meal":
      return `
        <path ${common} d="M70 58c0-18 14-32 32-32h96v40H70V58z"/>
        <path ${common} d="M64 82c0-10 8-18 18-18h100c10 0 18 8 18 18v84c0 12-10 22-22 22H86c-12 0-22-10-22-22V82z" opacity="0.95"/>
        <path ${common} d="M92 110h76v16H92z" opacity="0.8"/>
        <circle cx="108" cy="144" r="10" ${common} opacity="0.75"/>
        <circle cx="152" cy="146" r="8" ${common} opacity="0.7"/>
      `;
    default:
      return `
        <circle cx="128" cy="128" r="84" ${common} opacity="0.25"/>
        <path ${common} d="M104 88h48v80h-48z" opacity="0.8"/>
      `;
  }
}

export function menuImageDataUri(opts: MenuImageOptions): string {
  const fg = opts.fg ?? "#ffffff";
  const icon = iconSvg(opts.icon, fg);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${opts.bg}" stop-opacity="1"/>
          <stop offset="1" stop-color="${opts.bg}" stop-opacity="0.72"/>
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="300" height="200" rx="22" fill="url(#g)"/>
      <path d="M28 168c22-18 44-27 66-27 29 0 50 13 74 13 22 0 43-8 76-30v46H28v-2z" fill="#000000" opacity="0.16"/>

      <g transform="translate(0,0)">${icon}</g>

      <text x="150" y="180" text-anchor="middle" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial"
        font-size="16" fill="${fg}" opacity="0.95" font-weight="700">${escapeXml(opts.label)}</text>
    </svg>
  `;

  return svgDataUri(svg);
}

function escapeXml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

