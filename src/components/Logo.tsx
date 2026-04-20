import vectorLogo from '../assets/logo/Logomark.svg';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  stacked?: boolean; // logo + text side-by-side (false) or stacked (true)
}

export default function Logo({ size = 'md', stacked = false }: LogoProps) {
  const iconSize = size === 'sm' ? 40 : size === 'md' ? 48 : 72;
  const textSize = size === 'sm' ? 'text-lg' : size === 'md' ? 'text-xl' : 'text-4xl';
  const subSize  = size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-lg';

  const icon = (
    <img
      src={vectorLogo}
      alt="AI Wealth Connections logo"
      style={{ width: iconSize, height: iconSize }}
      className="shrink-0 object-contain"
    />
  );

  if (stacked) {
    return (
      <div className="flex flex-col items-center gap-2">
        {icon}
        <div className="text-center">
          <p className={`${textSize} font-extrabold text-black leading-tight`}>AI Wealth</p>
          <p className={`${subSize} font-bold text-black leading-tight`}>Connections</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      {icon}
      <div>
        <p className={`${textSize} font-extrabold text-black leading-tight`}>AI Wealth</p>
        <p className={`${subSize} text-gray-900 leading-tight`}>Connections</p>
      </div>
    </div>
  );
}
