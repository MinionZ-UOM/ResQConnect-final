import { cn } from "@/lib/utils";

const Logo = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    fill="none"
    className={cn("h-6 w-6", className)}
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    <path
      d="M12.5 12A11.5 11.5 0 0 1 24 6.5 11.5 11.5 0 0 1 35.5 12"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeOpacity={0.55}
    />
    <path
      d="M16.8 15.2A7.2 7.2 0 0 1 24 11.5a7.2 7.2 0 0 1 7.2 3.7"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeOpacity={0.85}
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M24 9c-6.627 0-12 5.373-12 12 0 9.88 12 24 12 24s12-14.12 12-24c0-6.627-5.373-12-12-12Zm0 20c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8Z"
      fill="currentColor"
    />
    <circle cx={24} cy={21} r={6} fill="#fff" fillOpacity={0.2} />
    <path
      d="M24 15.5a1.25 1.25 0 0 0-1.25 1.25V19h-2.25a1.25 1.25 0 1 0 0 2.5h2.25v2.25a1.25 1.25 0 1 0 2.5 0V21.5h2.25a1.25 1.25 0 1 0 0-2.5H25.25v-2.25A1.25 1.25 0 0 0 24 15.5Z"
      fill="#fff"
    />
  </svg>
);

export default Logo;
