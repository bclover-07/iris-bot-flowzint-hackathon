import { RiShieldCheckLine, RiShieldCrossLine, RiShieldKeyholeLine } from 'react-icons/ri';

export default function InjectionBadge({ status }) {
  if (!status || status === 'safe' || status === 'clean') return null;

  const config = {
    suspicious: {
      color: 'bg-sunny',
      icon: RiShieldKeyholeLine,
      label: 'Suspicious'
    },
    blocked: {
      color: 'bg-coral',
      icon: RiShieldCrossLine,
      label: 'Blocked'
    }
  };

  const { color, icon: Icon, label } = config[status] || config.suspicious;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 border-[3px] border-ink ${color} rounded-full shadow-[2px_2px_0_#1A1A2E]`}>
      <Icon className="w-4 h-4 text-ink" />
      <span className="font-black text-[10px] uppercase tracking-widest text-ink">
        {label}
      </span>
    </div>
  );
}
