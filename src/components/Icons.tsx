export function CaratIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return <img src="/carrats.png" alt="💎" className={`inline-block align-middle ${className}`} style={{ verticalAlign: 'middle', marginTop: '-2px' }} />;
}
