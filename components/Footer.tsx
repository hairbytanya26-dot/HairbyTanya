import type { SocialLink, SiteSettings } from "@/lib/types";
import SocialIcon from "./SocialIcon";

export default function Footer({
  socialLinks,
  settings,
}: {
  socialLinks: SocialLink[];
  settings: SiteSettings | null;
}) {
  return (
    <footer className="border-t border-rose/60 bg-blush-light">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-10 text-center">
        {socialLinks.length > 0 && (
          <div className="flex items-center gap-4">
            {socialLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.platform}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-plum text-blush transition-transform hover:scale-105 hover:bg-glow"
              >
                <SocialIcon iconKey={link.icon_key} className="h-5 w-5" />
              </a>
            ))}
          </div>
        )}

        <div className="font-body text-sm text-plum/80">
          {settings?.contact_email && <p>{settings.contact_email}</p>}
          {settings?.contact_phone && <p>{settings.contact_phone}</p>}
          {settings?.address && <p>{settings.address}</p>}
        </div>

        <p className="font-body text-xs text-plum/60">
          © {new Date().getFullYear()} {settings?.business_name ?? "Hair by Tanya"}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
