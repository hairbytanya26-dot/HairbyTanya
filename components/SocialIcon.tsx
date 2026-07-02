import {
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Linkedin,
  Music2, // TikTok stand-in
  MessageCircle, // WhatsApp stand-in
  Mail,
  Globe,
  Link as LinkIcon,
} from "lucide-react";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  x: Twitter,
  youtube: Youtube,
  linkedin: Linkedin,
  tiktok: Music2,
  whatsapp: MessageCircle,
  email: Mail,
  website: Globe,
  link: LinkIcon,
};

export const ICON_OPTIONS = Object.keys(ICONS);

export default function SocialIcon({
  iconKey,
  className,
}: {
  iconKey: string;
  className?: string;
}) {
  const Icon = ICONS[iconKey] ?? LinkIcon;
  return <Icon className={className} />;
}
