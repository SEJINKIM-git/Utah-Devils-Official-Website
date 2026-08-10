import Image from "next/image";
import { getOpponentLogo, getTeamInitials } from "@/lib/opponentLogos";

type TeamAvatarProps = {
  teamName: string;
  variant?: "opponent" | "devils";
  size?: "default" | "compact";
  className?: string;
};

export default function TeamAvatar({
  teamName,
  variant = "opponent",
  size = "default",
  className = "",
}: TeamAvatarProps) {
  const src = variant === "devils" ? "/logos/emblem-64.png" : getOpponentLogo(teamName);
  const label = variant === "devils" ? "Utah Devils 엠블럼" : `${teamName} 로고`;

  if (!src && typeof window === "undefined") {
    console.warn(`[TeamAvatar] Opponent logo mapping not found: ${teamName}`);
  }

  return (
    <span
      className={`team-avatar team-avatar--${size}${src ? "" : " team-avatar--fallback"} ${className}`.trim()}
      aria-label={src ? label : `${teamName} 이니셜`}
      role="img"
    >
      {src ? (
        <span className="team-avatar__image">
          <Image src={src} alt="" fill sizes={size === "compact" ? "24px" : "48px"} />
        </span>
      ) : (
        getTeamInitials(teamName)
      )}
    </span>
  );
}
