export const BrandLogo = ({ className = '' }: { className?: string }) => (
  <img
    src="/logo.svg"
    alt="Logo MMPI TNI AU"
    className={`shrink-0 ${className}`}
    width="64"
    height="64"
  />
);
