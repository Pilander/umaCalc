import caratImg from '../assets/carrats.png';

export function CaratIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return <img src={caratImg} alt="💎" className={`inline-block ${className}`} />;
}